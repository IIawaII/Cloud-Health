import { verifyToken } from '../lib/auth';
import { errorResponse } from '../lib/response';
import type { Env } from '../lib/env';

/**
 * 管理员权限校验中间件
 * 验证请求中的 Bearer Token，并检查 role === 'admin'
 * 返回 null 表示通过，返回 Response 表示拒绝
 */
export async function requireAdmin(
  context: EventContext<Env, string, Record<string, unknown>>
): Promise<Response | null> {
  const tokenData = await verifyToken(context);
  if (!tokenData) {
    return errorResponse('未授权，请先登录', 401);
  }
  if (tokenData.role !== 'admin') {
    return errorResponse('权限不足，需要管理员权限', 403);
  }
  return null;
}

/**
 * 包装 admin API handler，自动执行权限校验
 */
export function withAdmin(handler: (context: EventContext<Env, string, Record<string, unknown>>) => Promise<Response>) {
  return async (context: EventContext<Env, string, Record<string, unknown>>): Promise<Response> => {
    const denied = await requireAdmin(context);
    if (denied) return denied;
    return handler(context);
  };
}
