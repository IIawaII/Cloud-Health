import { generateToken } from '../../lib/crypto';
import { saveToken, saveRefreshToken, verifyRefreshToken, deleteRefreshToken } from '../../lib/auth';
import { jsonResponse, errorResponse } from '../../lib/response';
import { getCookie, serializeCookie, getSecureCookieOptions, getAccessTokenCookieMaxAge, getRefreshTokenCookieMaxAge } from '../../lib/cookie';
import type { AppContext } from '../../lib/handler';

export const onRequestPost = async (context: AppContext) => {
  try {
    // 优先从 Cookie 读取 refresh token，fallback 到 body（向后兼容）
    let refreshToken = getCookie(context.req.raw, 'auth_refresh_token');
    if (!refreshToken) {
    const body = await context.req.json<{ refreshToken?: string }>().catch(() => ({} as { refreshToken?: string }));
    refreshToken = body.refreshToken;
    }

    if (!refreshToken) {
      return errorResponse('未提供刷新令牌', 401);
    }

    // 验证 Refresh Token
    const refreshData = await verifyRefreshToken(context.env.AUTH_TOKENS, refreshToken);
    if (!refreshData) {
      return errorResponse('刷新令牌已过期或无效', 401);
    }

    // 生成新的 Access Token 和 Refresh Token（Token Rotation）
    const accessToken = generateToken();
    const newRefreshToken = generateToken();
    const now = new Date().toISOString();

    // 保存新的 Access Token
    await saveToken(context.env.AUTH_TOKENS, accessToken, {
      userId: refreshData.userId,
      username: refreshData.username,
      email: refreshData.email,
      role: refreshData.role ?? 'user',
      createdAt: now,
    });

    // 保存新的 Refresh Token
    await saveRefreshToken(context.env.AUTH_TOKENS, newRefreshToken, {
      userId: refreshData.userId,
      username: refreshData.username,
      email: refreshData.email,
      role: refreshData.role ?? 'user',
      createdAt: now,
    });

    // 使旧的 Refresh Token 失效
    await deleteRefreshToken(context.env.AUTH_TOKENS, refreshToken, refreshData.userId);

    const cookieOptions = getSecureCookieOptions(context.req.raw);
    return jsonResponse({
      success: true,
      message: '令牌刷新成功',
      user: {
        id: refreshData.userId,
        username: refreshData.username,
        email: refreshData.email,
        role: refreshData.role ?? 'user',
      },
    }, 200, {
      'Set-Cookie': [
        serializeCookie('auth_token', accessToken, { ...cookieOptions, maxAge: getAccessTokenCookieMaxAge() }),
        serializeCookie('auth_refresh_token', newRefreshToken, { ...cookieOptions, maxAge: getRefreshTokenCookieMaxAge() }),
      ].join(', '),
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    return errorResponse('刷新令牌失败，请稍后重试', 500);
  }
};
