import { jsonResponse, errorResponse } from '../../lib/response';
import { checkRateLimit, buildRateLimitKey } from '../../lib/rateLimit';
import { usernameExists, emailExists } from '../../lib/db';
import type { Env } from '../../lib/env';

interface CheckRequest {
  username?: string;
  email?: string;
}

export const onRequestPost = async (context: EventContext<Env, string, Record<string, unknown>>) => {
  try {
    // 速率限制：每个 IP 每分钟最多 10 次可用性检查，防止用户名/邮箱枚举
    const rateLimit = await checkRateLimit({
      kv: context.env.AUTH_TOKENS,
      key: buildRateLimitKey(context, 'check'),
      limit: 10,
      windowSeconds: 60,
    });
    if (!rateLimit.allowed) {
      return errorResponse('检查过于频繁，请稍后再试', 429);
    }

    const body = await context.request.json<CheckRequest>();
    const { username, email } = body;

    if (username !== undefined) {
      const exists = await usernameExists(context.env.DB, username);
      return jsonResponse({ available: !exists, field: 'username' }, 200);
    }

    if (email !== undefined) {
      const exists = await emailExists(context.env.DB, email);
      return jsonResponse({ available: !exists, field: 'email' }, 200);
    }

    return errorResponse('请提供 username 或 email 参数', 400);
  } catch (error) {
    console.error('Check availability error:', error);
    return errorResponse('检查失败，请稍后重试', 500);
  }
};
