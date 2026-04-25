import { generateToken } from '../../lib/crypto';
import { saveToken, saveRefreshToken, verifyRefreshToken, deleteRefreshToken } from '../../lib/auth';
import { jsonResponse, errorResponse } from '../../lib/response';
import type { Env } from '../../lib/env';

export const onRequestPost = async (context: EventContext<Env, string, Record<string, unknown>>) => {
  try {
    const body = await context.request.json<{ refreshToken?: string }>();
    const { refreshToken } = body;

    if (!refreshToken) {
      return errorResponse('未提供刷新令牌', 401);
    }

    // 验证 Refresh Token
    const refreshData = await verifyRefreshToken(context.env.AUTH_TOKENS, refreshToken);
    if (!refreshData) {
      return errorResponse('刷新令牌已过期或无效', 401);
    }

    // 生成新的 Access Token 和 Refresh Token（Token Rotation）
    const accessToken = generateToken();
    const newRefreshToken = generateToken();
    const now = new Date().toISOString();

    // 保存新的 Access Token
    await saveToken(context.env.AUTH_TOKENS, accessToken, {
      userId: refreshData.userId,
      username: refreshData.username,
      email: refreshData.email,
      createdAt: now,
    });

    // 保存新的 Refresh Token
    await saveRefreshToken(context.env.AUTH_TOKENS, newRefreshToken, {
      userId: refreshData.userId,
      username: refreshData.username,
      email: refreshData.email,
      createdAt: now,
    });

    // 使旧的 Refresh Token 失效
    await deleteRefreshToken(context.env.AUTH_TOKENS, refreshToken, refreshData.userId);

    return jsonResponse({
      success: true,
      message: '令牌刷新成功',
      token: accessToken,
      refreshToken: newRefreshToken,
      user: {
        id: refreshData.userId,
        username: refreshData.username,
        email: refreshData.email,
      },
    }, 200);
  } catch (error) {
    console.error('Refresh token error:', error);
    return errorResponse('刷新令牌失败，请稍后重试', 500);
  }
};
