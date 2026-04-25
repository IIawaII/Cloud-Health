import { jsonResponse, errorResponse } from '../../lib/response';
import { getStats, getDailyUserStats, getUsageStats } from '../../lib/db';
import { withAdmin } from '../../middleware/admin';
import type { AppContext } from '../../lib/handler';

export const onRequestGet = withAdmin(async (context: AppContext) => {
  try {
    const stats = await getStats(context.env.DB);
    const dailyUserStats = await getDailyUserStats(context.env.DB, 30);
    const usageStats = await getUsageStats(context.env.DB);

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
    console.error('Admin stats error:', error);
    return errorResponse('获取统计数据失败', 500);
  }
});
