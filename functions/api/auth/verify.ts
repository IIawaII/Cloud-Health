import type { PagesFunction } from '@cloudflare/workers-types';

interface TokenData {
  userId: string;
  username: string;
  email: string;
  createdAt: string;
}

export const onRequestGet = async (context: EventContext<{ AUTH_TOKENS: KVNamespace; USERS: KVNamespace }, string, Record<string, unknown>>) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json',
  };

  try {
    // 从请求头获取令牌
    const authHeader = context.request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: '未提供有效的认证令牌' }),
        { status: 401, headers: corsHeaders }
      );
    }

    const token = authHeader.substring(7);

    // 验证令牌
    const tokenDataStr = await context.env.AUTH_TOKENS.get(`token:${token}`);
    if (!tokenDataStr) {
      return new Response(
        JSON.stringify({ error: '令牌已过期或无效' }),
        { status: 401, headers: corsHeaders }
      );
    }

    const tokenData: TokenData = JSON.parse(tokenDataStr);

    // 从 USERS KV 获取完整用户信息（包括头像和邮箱）
    const userKey = `user:${tokenData.userId}`;
    const userDataStr = await context.env.USERS.get(userKey);

    let avatar: string | undefined;
    let email = tokenData.email;
    if (userDataStr) {
      const userData = JSON.parse(userDataStr);
      avatar = userData.avatar;
      if (userData.email) {
        email = userData.email;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: tokenData.userId,
          username: tokenData.username,
          email,
          avatar,
        },
      }),
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    console.error('Token verification error:', error);
    return new Response(
      JSON.stringify({ error: '验证失败，请稍后重试' }),
      { status: 500, headers: corsHeaders }
    );
  }
};

export const onRequestOptions = async () => {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
};
