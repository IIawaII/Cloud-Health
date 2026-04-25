import { z } from 'zod';
import { verifyPassword, generateToken } from '../../lib/crypto';
import { saveToken, saveRefreshToken } from '../../lib/auth';
import { jsonResponse, errorResponse } from '../../lib/response';
import { validateTurnstile } from '../../lib/turnstile';
import { checkRateLimit } from '../../lib/rateLimit';
import { findUserByUsername, findUserByEmail } from '../../lib/db';
import { serializeCookie, getSecureCookieOptions, getAccessTokenCookieMaxAge, getRefreshTokenCookieMaxAge } from '../../lib/cookie';
import type { Env } from '../../lib/env';

const loginSchema = z.object({
  usernameOrEmail: z.string().min(1, '请填写用户名或邮箱').max(254, '输入过长'),
  password: z.string().min(1, '请填写密码').max(128, '密码长度不能超过128位'),
  turnstileToken: z.string().min(1, '请完成人机验证'),
});

export const onRequestPost = async (context: EventContext<Env, string, Record<string, unknown>>) => {
  try {
    const body = await context.request.json<unknown>();
    const parseResult = loginSchema.safeParse(body);
    if (!parseResult.success) {
      const firstError = parseResult.error.errors[0]?.message || '请求参数错误';
      return errorResponse(firstError, 400);
    }
    const { usernameOrEmail, password, turnstileToken } = parseResult.data;

    // 验证 Turnstile
    const turnstileError = await validateTurnstile(context, turnstileToken);
    if (turnstileError) return errorResponse(turnstileError, 400);

    // 速率限制：每个 IP 每分钟最多 10 次登录尝试
    const rateIP = context.request.headers.get('CF-Connecting-IP') || 'unknown';
    const rateLimit = await checkRateLimit({
      kv: context.env.AUTH_TOKENS,
      key: `${rateIP}:login`,
      limit: 10,
      windowSeconds: 60,
    });
    if (!rateLimit.allowed) {
      return errorResponse('登录尝试过于频繁，请稍后再试', 429);
    }

    // 优先检查环境变量中的管理员凭据
    const adminUsername = context.env.ADMIN_USERNAME;
    const adminPassword = context.env.ADMIN_PASSWORD;
    if (adminUsername && adminPassword && usernameOrEmail === adminUsername) {
      // 校验密码格式，防止误配明文密码导致验证始终失败
      if (!/^\d+:[a-f0-9]{32}:[a-f0-9]{64}$/i.test(adminPassword)) {
        console.error('[Admin Login] ADMIN_PASSWORD 格式不正确，必须为 PBKDF2 哈希格式（iterations:salt:hash）');
        return errorResponse('管理员账户配置异常，请联系运维人员', 500);
      }
      const isAdminPasswordValid = await verifyPassword(password, adminPassword);
      if (isAdminPasswordValid) {
        const accessToken = generateToken();
        const refreshToken = generateToken();
        const now = new Date().toISOString();

        await saveToken(context.env.AUTH_TOKENS, accessToken, {
          userId: 'system-admin',
          username: adminUsername,
          email: 'admin@system.local',
          role: 'admin',
          createdAt: now,
        }, 60 * 60);

        await saveRefreshToken(context.env.AUTH_TOKENS, refreshToken, {
          userId: 'system-admin',
          username: adminUsername,
          email: 'admin@system.local',
          role: 'admin',
          createdAt: now,
        }, 24 * 60 * 60);

    const cookieOptions = getSecureCookieOptions(context.request);
    return jsonResponse({
      success: true,
      message: '管理员登录成功',
      user: {
        id: 'system-admin',
        username: adminUsername,
        email: 'admin@system.local',
        role: 'admin',
      },
    }, 200, {
      'Set-Cookie': [
        serializeCookie('auth_token', accessToken, { ...cookieOptions, maxAge: getAccessTokenCookieMaxAge() }),
        serializeCookie('auth_refresh_token', refreshToken, { ...cookieOptions, maxAge: getRefreshTokenCookieMaxAge() }),
      ].join(', '),
    });
      }
      return errorResponse('用户名或密码错误', 401);
    }

    // 判断是用户名还是邮箱，直接从 D1 查询用户
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(usernameOrEmail);
    const user = isEmail
      ? await findUserByEmail(context.env.DB, usernameOrEmail)
      : await findUserByUsername(context.env.DB, usernameOrEmail);

    if (!user) {
      return errorResponse('用户名或密码错误', 401);
    }

    // 验证密码
    const isPasswordValid = await verifyPassword(password, user.password_hash);
    if (!isPasswordValid) {
      return errorResponse('用户名或密码错误', 401);
    }

    // 生成 Access Token 和 Refresh Token
    const accessToken = generateToken();
    const refreshToken = generateToken();
    const now = new Date().toISOString();

    // 保存 Access Token（15分钟有效期）
    await saveToken(context.env.AUTH_TOKENS, accessToken, {
      userId: user.id,
      username: user.username,
      email: user.email,
      role: (user.role as 'user' | 'admin') ?? 'user',
      createdAt: now,
    });

    // 保存 Refresh Token（30天有效期）
    await saveRefreshToken(context.env.AUTH_TOKENS, refreshToken, {
      userId: user.id,
      username: user.username,
      email: user.email,
      role: (user.role as 'user' | 'admin') ?? 'user',
      createdAt: now,
    });

    const cookieOptions = getSecureCookieOptions(context.request);
    return jsonResponse({
      success: true,
      message: '登录成功',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        avatar: user.avatar ?? undefined,
        role: user.role ?? 'user',
      },
    }, 200, {
      'Set-Cookie': [
        serializeCookie('auth_token', accessToken, { ...cookieOptions, maxAge: getAccessTokenCookieMaxAge() }),
        serializeCookie('auth_refresh_token', refreshToken, { ...cookieOptions, maxAge: getRefreshTokenCookieMaxAge() }),
      ].join(', '),
    });
  } catch (error) {
    console.error('Login error:', error);
    return errorResponse('登录失败，请稍后重试', 500);
  }
};
