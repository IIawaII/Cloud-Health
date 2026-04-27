import { jsonResponse, errorResponse } from '../../utils/response';
import { getStats, getUsageStats } from '../../dao/log.dao';
import { getDailyUserStats } from '../../dao/user.dao';
import { withAdmin } from '../../middleware/admin';
import { getLogger } from '../../utils/logger';
import type { AdminContext } from '../../middleware/admin';

const logger = getLogger('AdminStats')

export const onRequestGet = withAdmin(async (context: AdminContext) => {
  try {
    const [stats, dailyUserStats, usageStats] = await Promise.all([
      getStats(context.env.DB),
      getDailyUserStats(context.env.DB, 30),
      getUsageStats(context.env.DB),
    ]);

    return jsonResponse({
      success: true,
      data: {
        totalUsers: stats.totalUsers,
        todayNewUsers: stats.todayNewUsers,
        totalLogs: stats.totalLogs,
        todayLogs: stats.todayLogs,
        dailyUserStats,
        usageStats,
      },
    }, 200);
  } catch (error) {
    logger.error('Failed to get stats', { error: error instanceof Error ? error.message : String(error) });
    return errorResponse('获取统计数据失败', 500);
  }
});
