import type { PagesFunction } from '@cloudflare/workers-types';
import { deleteToken } from '../../lib/auth';

export const onRequestPost = async (context: EventContext<{ AUTH_TOKENS: KVNamespace }, string, Record<string, unknown>>) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
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

    // 删除令牌及其索引
    await deleteToken(context.env.AUTH_TOKENS, token);

    return new Response(
      JSON.stringify({
        success: true,
        message: '登出成功',
      }),
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    console.error('Logout error:', error);
    return new Response(
      JSON.stringify({ error: '登出失败，请稍后重试' }),
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
