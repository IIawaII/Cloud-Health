import { verifyToken } from '../../lib/auth';
import { jsonResponse, errorResponse } from '../../lib/response';
import { findUserById, updateUser, usernameExists, emailExists } from '../../lib/db';
import type { Env } from '../../lib/env';

export const onRequestPost = async (context: EventContext<Env, string, Record<string, unknown>>) => {
  try {
    // 验证 token（复用 lib/auth 中的逻辑）
    const tokenData = await verifyToken(context);
    if (!tokenData) {
      return errorResponse('登录已过期', 401);
    }

    const userId = tokenData.userId;

    // 从 D1 获取用户数据
    const dbUser = await findUserById(context.env.DB, userId);

    if (!dbUser) {
      return errorResponse('用户不存在', 404);
    }

    const body = await context.request.json<{ username?: string; email?: string; avatar?: string; verificationCode?: string }>();

    const updates: { username?: string; email?: string; avatar?: string } = {};

    // 更新用户名
    if (body.username && body.username !== dbUser.username) {
      // 验证用户名格式
      if (!/^[a-zA-Z0-9_]{3,10}$/.test(body.username)) {
        return errorResponse('用户名只能包含字母、数字和下划线，长度3-10位', 400);
      }
      // 检查新用户名是否已被使用
      const exists = await usernameExists(context.env.DB, body.username, userId);
      if (exists) {
        return errorResponse('该用户名已被使用', 400);
      }
      updates.username = body.username;
    }

    // 更新邮箱
    if (body.email && body.email !== dbUser.email) {
      // 验证验证码
      if (!body.verificationCode) {
        return errorResponse('请输入验证码', 400);
      }
      const codeKey = `verify_code:update_email:${body.email}`;
      const storedCodeData = await context.env.VERIFICATION_CODES.get(codeKey);
      if (!storedCodeData) {
        return errorResponse('验证码已过期，请重新获取', 400);
      }
      const storedCode = JSON.parse(storedCodeData) as { code: string };
      if (storedCode.code !== body.verificationCode) {
        return errorResponse('验证码错误', 400);
      }
      // 验证成功后删除验证码
      await context.env.VERIFICATION_CODES.delete(codeKey);

      // 检查新邮箱是否已被使用
      const exists = await emailExists(context.env.DB, body.email, userId);
      if (exists) {
        return errorResponse('该邮箱已被使用', 400);
      }
      updates.email = body.email;
    }

    // 更新头像（独立于邮箱更新，避免同时更新时头像丢失）
    if (body.avatar !== undefined) {
      const MAX_AVATAR_SIZE = 100 * 1024 * 4 / 3; // base64 约 133KB 对应 100KB 原始数据
      if (body.avatar.length > MAX_AVATAR_SIZE) {
        return errorResponse('头像过大，请压缩后重试', 400);
      }
      updates.avatar = body.avatar;
    }

    // 执行更新
    if (Object.keys(updates).length > 0) {
      await updateUser(context.env.DB, userId, updates);
    }

    return jsonResponse({
      success: true,
      message: '更新成功',
      user: {
        id: userId,
        username: updates.username ?? dbUser.username,
        email: updates.email ?? dbUser.email,
        avatar: updates.avatar ?? (dbUser.avatar ?? undefined),
      },
    }, 200);
  } catch (error) {
    console.error('Update profile error:', error);
    return errorResponse('更新失败，请稍后重试', 500);
  }
};
