import { hashPassword, verifyPassword } from '../../lib/crypto';
import { verifyToken, revokeAllUserTokens } from '../../lib/auth';

interface Env {
  USERS: KVNamespace;
  AUTH_TOKENS: KVNamespace;
}

export const onRequestPost = async (context: EventContext<Env, string, Record<string, unknown>>) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json',
  };

  try {
    // 验证 token（复用 lib/auth 中的逻辑）
    const tokenData = await verifyToken(context);
    if (!tokenData) {
      return new Response(JSON.stringify({ error: '登录已过期' }), {
        status: 401,
        headers: corsHeaders,
      });
    }

    const userId = tokenData.userId;
    const userData = await context.env.USERS.get(`user:${userId}`);

    if (!userData) {
      return new Response(JSON.stringify({ error: '用户不存在' }), {
        status: 404,
        headers: corsHeaders,
      });
    }

    const user = JSON.parse(userData);
    const body = await context.request.json() as { currentPassword: string; newPassword: string };

    if (!body.currentPassword || !body.newPassword) {
      return new Response(JSON.stringify({ error: '请填写完整信息' }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    if (body.newPassword.length < 6) {
      return new Response(JSON.stringify({ error: '新密码至少6位' }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    // 验证当前密码
    const isPasswordValid = await verifyPassword(body.currentPassword, user.passwordHash);

    if (!isPasswordValid) {
      return new Response(JSON.stringify({ error: '当前密码不正确' }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    // 哈希新密码并更新
    user.passwordHash = await hashPassword(body.newPassword);
    user.updatedAt = new Date().toISOString();
    await context.env.USERS.put(`user:${userId}`, JSON.stringify(user));

    // 修改密码后使该用户的所有 token 失效（强制重新登录）
    await revokeAllUserTokens(context.env.AUTH_TOKENS, userId);

    return new Response(JSON.stringify({
      success: true,
      message: '密码修改成功，请使用新密码重新登录',
    }), {
      status: 200,
      headers: corsHeaders,
    });
  } catch (error) {
    console.error('Change password error:', error);
    return new Response(JSON.stringify({ error: '修改失败，请稍后重试' }), {
      status: 500,
      headers: corsHeaders,
    });
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
