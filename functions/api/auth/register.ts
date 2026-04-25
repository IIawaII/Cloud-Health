import { hashPassword, generateToken } from '../../lib/crypto';
import { saveToken } from '../../lib/auth';
import { jsonResponse, errorResponse } from '../../lib/response';
import { verifyTurnstile } from '../../lib/turnstile';
import { checkRateLimit, buildRateLimitKey } from '../../lib/rateLimit';
import type { Env } from '../../lib/env';

interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  turnstileToken: string;
  verificationCode: string;
}

interface User {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  createdAt: string;
  updatedAt: string;
}

export const onRequestPost = async (context: EventContext<Env, string, Record<string, unknown>>) => {
  try {
    // 速率限制：每个 IP 每分钟最多 5 次注册尝试
    const rateLimit = await checkRateLimit({
      kv: context.env.AUTH_TOKENS,
      key: buildRateLimitKey(context, 'register'),
      limit: 5,
      windowSeconds: 60,
    });
    if (!rateLimit.allowed) {
      return errorResponse('注册尝试过于频繁，请稍后再试', 429);
    }

    const body = await context.request.json<RegisterRequest>();
    const { username, email, password, turnstileToken, verificationCode } = body;

    // 验证输入
    if (!username || !email || !password || !turnstileToken || !verificationCode) {
      return errorResponse('请填写所有必填字段', 400);
    }

    // 验证用户名格式
    if (!/^[a-zA-Z0-9_]{3,10}$/.test(username)) {
      return errorResponse('用户名只能包含字母、数字和下划线，长度3-10位', 400);
    }

    // 验证邮箱格式
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return errorResponse('请输入有效的邮箱地址', 400);
    }

    // 验证密码强度（至少8位，包含字母和数字）
    if (password.length < 8) {
      return errorResponse('密码长度至少8位', 400);
    }
    if (!/(?=.*[A-Za-z])(?=.*\d)/.test(password)) {
      return errorResponse('密码必须同时包含字母和数字', 400);
    }

    // 验证 Turnstile
    const clientIP = context.request.headers.get('CF-Connecting-IP') || undefined;
    const isValid = await verifyTurnstile(
      turnstileToken,
      context.env.TURNSTILE_SECRET_KEY,
      clientIP || undefined
    );

    if (!isValid) {
      return errorResponse('人机验证失败，请重试', 400);
    }

    // 验证邮箱验证码
    const codeKey = `verify_code:register:${email}`;
    const storedCodeData = await context.env.VERIFICATION_CODES.get(codeKey);
    if (!storedCodeData) {
      return errorResponse('验证码已过期，请重新获取', 400);
    }
    const storedCode = JSON.parse(storedCodeData) as { code: string };
    if (storedCode.code !== verificationCode) {
      return errorResponse('验证码错误', 400);
    }
    // 验证成功后删除验证码
    await context.env.VERIFICATION_CODES.delete(codeKey);

    // 检查用户名是否已存在
    const existingUserByUsername = await context.env.USERS.get(`username:${username}`);
    if (existingUserByUsername) {
      return errorResponse('用户名已被注册', 409);
    }

    // 检查邮箱是否已存在
    const existingUserByEmail = await context.env.USERS.get(`email:${email}`);
    if (existingUserByEmail) {
      return errorResponse('邮箱已被注册', 409);
    }

    // 创建用户
    const userId = crypto.randomUUID();
    const passwordHash = await hashPassword(password);
    const now = new Date().toISOString();

    const user: User = {
      id: userId,
      username,
      email,
      passwordHash,
      createdAt: now,
      updatedAt: now,
    };

    // 保存用户信息（带容错清理）
    const userKey = `user:${userId}`;
    const usernameKey = `username:${username}`;
    const emailKey = `email:${email}`;

    try {
      await context.env.USERS.put(userKey, JSON.stringify(user));
      await context.env.USERS.put(usernameKey, userId);
      await context.env.USERS.put(emailKey, userId);
    } catch (kvError) {
      // 如果任一写入失败，尝试清理已写入的数据
      console.error('Registration KV write failed, attempting cleanup:', kvError);
      await Promise.allSettled([
        context.env.USERS.delete(userKey),
        context.env.USERS.delete(usernameKey),
        context.env.USERS.delete(emailKey),
      ]);
      return errorResponse('注册失败，数据写入异常，请稍后重试', 500);
    }

    // 生成登录令牌
    const token = generateToken();

    // 保存令牌（7天有效期）并建立用户索引
    await saveToken(context.env.AUTH_TOKENS, token, {
      userId,
      username,
      email,
      createdAt: now,
    }, 7 * 24 * 60 * 60);

    return jsonResponse({
      success: true,
      message: '注册成功',
      token,
      user: {
        id: userId,
        username,
        email,
      },
    }, 201);
  } catch (error) {
    console.error('Registration error:', error);
    return errorResponse('注册失败，请稍后重试', 500);
  }
};
