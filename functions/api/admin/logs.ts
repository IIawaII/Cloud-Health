import { z } from 'zod';
import { jsonResponse, errorResponse } from '../../lib/response';
import { getUsageLogs } from '../../lib/db';
import { withAdmin } from '../../middleware/admin';
import type { AppContext } from '../../lib/handler';

const querySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(20),
  action: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export const onRequestGet = withAdmin(async (context: AppContext) => {
  try {
    const url = new URL(context.req.url);
    const parseResult = querySchema.safeParse({
      page: url.searchParams.get('page') ?? '1',
      pageSize: url.searchParams.get('pageSize') ?? '20',
      action: url.searchParams.get('action') || undefined,
      startDate: url.searchParams.get('startDate') || undefined,
      endDate: url.searchParams.get('endDate') || undefined,
    });
    if (!parseResult.success) {
      return errorResponse(parseResult.error.errors[0]?.message || '参数错误', 400);
    }

    const { page, pageSize, action, startDate, endDate } = parseResult.data;
    const offset = (page - 1) * pageSize;

    const result = await getUsageLogs(context.env.DB, {
      limit: pageSize,
      offset,
      action,
      startDate,
      endDate,
    });

    return jsonResponse({
      success: true,
      data: {
        logs: result.logs,
        total: result.total,
        page,
        pageSize,
      },
    }, 200);
  } catch (error) {
    console.error('Admin logs error:', error);
    return errorResponse('获取日志失败', 500);
  }
});
