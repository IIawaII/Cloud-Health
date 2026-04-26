import { z } from 'zod'

export const usernameSchema = z.string().regex(/^[a-zA-Z0-9_]{3,10}$/, '用户名只能包含字母、数字和下划线，长度3-10位')
export const emailSchema = z.string().email('请输入有效的邮箱地址')

/** 前后端共享的邮箱校验正则，确保登录与注册逻辑一致 */
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
export const passwordSchema = z
  .string()
  .min(8, '密码长度至少8位')
  .max(128, '密码长度不能超过128位')
  .regex(/(?=.*[A-Za-z])(?=.*\d)/, '密码必须同时包含字母和数字')
export const verificationCodeSchema = z.string().regex(/^\d{6}$/, '请输入6位数字验证码')

export const registerSchema = z.object({
  username: usernameSchema,
  email: emailSchema,
  password: passwordSchema,
  turnstileToken: z.string().min(1, '请完成人机验证'),
  verificationCode: verificationCodeSchema,
})

export const loginSchema = z.object({
  usernameOrEmail: z.string().min(1, '请填写用户名或邮箱').max(254, '输入过长'),
  password: z.string().min(1, '请填写密码').max(128, '密码长度不能超过128位'),
  turnstileToken: z.string().min(1, '请完成人机验证'),
})

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, '请填写当前密码').max(128, '密码长度不能超过128位'),
    newPassword: passwordSchema,
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: '新密码不能与当前密码相同',
    path: ['newPassword'],
  })
