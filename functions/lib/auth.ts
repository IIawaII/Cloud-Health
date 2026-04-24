interface TokenData {
  userId: string
  username: string
  email: string
  createdAt: string
}

/**
 * 从请求头验证 Bearer Token
 */
export async function verifyToken(context: {
  request: Request
  env: { AUTH_TOKENS: KVNamespace }
}): Promise<TokenData | null> {
  const authHeader = context.request.headers.get('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null
  const token = authHeader.slice(7)
  const tokenDataStr = await context.env.AUTH_TOKENS.get(`token:${token}`)
  if (!tokenDataStr) return null
  return JSON.parse(tokenDataStr) as TokenData
}

/**
 * 保存认证令牌，同时创建 userId 索引以便批量管理
 */
export async function saveToken(
  authTokens: KVNamespace,
  token: string,
  data: TokenData,
  ttlSeconds: number
): Promise<void> {
  const tokenValue = JSON.stringify(data)
  await authTokens.put(`token:${token}`, tokenValue, {
    expirationTtl: ttlSeconds,
  })
  await authTokens.put(`user_tokens:${data.userId}:${token}`, '1', {
    expirationTtl: ttlSeconds,
  })
}

/**
 * 删除单个令牌及其索引
 */
export async function deleteToken(
  authTokens: KVNamespace,
  token: string,
  userId?: string
): Promise<void> {
  await authTokens.delete(`token:${token}`)
  if (userId) {
    await authTokens.delete(`user_tokens:${userId}:${token}`)
  } else {
    // 尝试从 token 数据中反查 userId 并删除索引
    const tokenDataStr = await authTokens.get(`token:${token}`)
    if (tokenDataStr) {
      try {
        const tokenData = JSON.parse(tokenDataStr) as TokenData
        await authTokens.delete(`user_tokens:${tokenData.userId}:${token}`)
      } catch {
        // ignore parse error
      }
    }
  }
}

/**
 * 撤销指定用户的所有令牌（用于修改密码后强制重新登录）
 */
export async function revokeAllUserTokens(
  authTokens: KVNamespace,
  userId: string
): Promise<void> {
  const list = await authTokens.list({ prefix: `user_tokens:${userId}:` })
  for (const key of list.keys) {
    const token = key.name.split(':').pop()
    if (token) {
      await authTokens.delete(`token:${token}`)
    }
    await authTokens.delete(key.name)
  }
}
