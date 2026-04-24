import type { PagesFunction } from '@cloudflare/workers-types';

interface CheckRequest {
  username?: string;
  email?: string;
}

export const onRequestPost = async (context: EventContext<{ USERS: KVNamespace }, string, Record<string, unknown>>) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json',
  };

  try {
    const body = await context.request.json() as CheckRequest;
    const { username, email } = body;

    if (username !== undefined) {
      const existing = await context.env.USERS.get(`username:${username}`);
      return new Response(
        JSON.stringify({ available: !existing, field: 'username' }),
        { status: 200, headers: corsHeaders }
      );
    }

    if (email !== undefined) {
      const existing = await context.env.USERS.get(`email:${email}`);
      return new Response(
        JSON.stringify({ available: !existing, field: 'email' }),
        { status: 200, headers: corsHeaders }
      );
    }

    return new Response(
      JSON.stringify({ error: '请提供 username 或 email 参数' }),
      { status: 400, headers: corsHeaders }
    );
  } catch (error) {
    console.error('Check availability error:', error);
    return new Response(
      JSON.stringify({ error: '检查失败，请稍后重试' }),
      { status: 500, headers: corsHeaders }
    );
  }
};

export const onRequestOptions = async () => {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
};
