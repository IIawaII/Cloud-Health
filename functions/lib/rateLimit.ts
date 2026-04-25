/**
 * API 速率限制工具
 * 基于 Cloudflare KV 实现简易令牌桶算法
 */

interface RateLimitOptions {
  kv: KVNamespace
  key: string
  limit: number      // 时间窗口内允许的最大请求数
  windowSeconds: number  // 时间窗口（秒）
}

interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: number
}

export async function checkRateLimit(options: RateLimitOptions): Promise<RateLimitResult> {
  const { kv, key, limit, windowSeconds } = options
  const now = Math.floor(Date.now() / 1000)
  const windowStart = Math.floor(now / windowSeconds) * windowSeconds
  const bucketKey = `rate_limit:${key}:${windowStart}`

  const current = await kv.get(bucketKey)
  const count = current ? parseInt(current, 10) : 0

  if (count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: windowStart + windowSeconds,
    }
  }

  await kv.put(bucketKey, String(count + 1), {
    expirationTtl: windowSeconds,
  })

  return {
    allowed: true,
    remaining: limit - count - 1,
    resetAt: windowStart + windowSeconds,
  }
}

/**
 * 构建速率限制键
 */
export function buildRateLimitKey(context: { request: Request }, suffix: string): string {
  const clientIP = context.request.headers.get('CF-Connecting-IP') || 'unknown'
  return `${clientIP}:${suffix}`
}
