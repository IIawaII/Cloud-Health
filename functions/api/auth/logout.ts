import { deleteToken } from '../../lib/auth';
import { jsonResponse, errorResponse } from '../../lib/response';
import { getCookie, serializeCookie, getSecureCookieOptions } from '../../lib/cookie';
import type { Env } from '../../lib/env';

export const onRequestPost = async (context: EventContext<Env, string, Record<string, unknown>>) => {
  try {
    // 优先从 Cookie 读取 token，fallback 到 Authorization header
    let token = getCookie(context.request, 'auth_token');
    if (!token) {
      const authHeader = context.request.headers.get('Authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    if (token) {
      // 删除令牌及其索引
      await deleteToken(context.env.AUTH_TOKENS, token);
    }

    const cookieOptions = getSecureCookieOptions(context.request);
    return jsonResponse({
      success: true,
      message: '登出成功',
    }, 200, {
      'Set-Cookie': [
        serializeCookie('auth_token', '', { ...cookieOptions, maxAge: 0 }),
        serializeCookie('auth_refresh_token', '', { ...cookieOptions, maxAge: 0 }),
      ].join(', '),
    });
  } catch (error) {
    console.error('Logout error:', error);
    return errorResponse('登出失败，请稍后重试', 500);
  }
};
