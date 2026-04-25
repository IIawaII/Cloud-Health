import { z } from 'zod';
import { jsonResponse, errorResponse } from '../../lib/response';
import { getAllSystemConfigs, getSystemConfig, setSystemConfig } from '../../lib/db';
import { createAuditLog } from '../../lib/db';
import { verifyToken } from '../../lib/auth';
import { withAdmin } from '../../middleware/admin';
import type { Env } from '../../lib/env';

export const onRequestGet = withAdmin(async (context: EventContext<Env, string, Record<string, unknown>>) => {
  try {
    const url = new URL(context.request.url);
    const key = url.searchParams.get('key');

    if (key) {
      const config = await getSystemConfig(context.env.DB, key);
      return jsonResponse({ success: true, data: config }, 200);
    }

    const configs = await getAllSystemConfigs(context.env.DB);
    return jsonResponse({ success: true, data: configs }, 200);
  } catch (error) {
    console.error('Admin config get error:', error);
    return errorResponse('获取配置失败', 500);
  }
});

const updateSchema = z.record(z.string().min(1).max(2000));

export const onRequestPut = withAdmin(async (context: EventContext<Env, string, Record<string, unknown>>) => {
  try {
    const body = await context.request.json<unknown>();
    const parseResult = updateSchema.safeParse(body);
    if (!parseResult.success) {
      return errorResponse(parseResult.error.errors[0]?.message || '参数错误', 400);
    }

    const updates = parseResult.data;
    for (const [key, value] of Object.entries(updates)) {
      await setSystemConfig(context.env.DB, key, value);
    }

    const tokenData = await verifyToken(context);
    await createAuditLog(context.env.DB, {
      id: crypto.randomUUID(),
      admin_id: tokenData?.userId ?? 'unknown',
      action: 'UPDATE_SYSTEM_CONFIG',
      target_type: 'config',
      target_id: null,
      details: JSON.stringify({ keys: Object.keys(updates) }),
    });

    return jsonResponse({ success: true, message: '配置更新成功' }, 200);
  } catch (error) {
    console.error('Admin config update error:', error);
    return errorResponse('更新配置失败', 500);
  }
});
