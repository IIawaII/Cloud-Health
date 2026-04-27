/**
 * Cloudflare Analytics Engine 集成
 * 向 Analytics Engine 写入监控数据点，支持在 Cloudflare Dashboard 中查看
 *
 * 使用方式：
 * 1. 在 Cloudflare Dashboard 中创建 Analytics Engine binding
 * 2. 在 wrangler.toml 中添加 [[analytics_engine_datasets]] 配置
 * 3. 调用 trackApiCall / trackError / trackAuth 等函数
 */

import { getLogger } from './logger'

const logger = getLogger('Analytics')

export interface AnalyticsConfig {
  /** Analytics Engine Dataset binding name */
  binding?: string
}

/**
 * 向 Analytics Engine 写入数据点
 * 注意：需要先在 wrangler.toml 中配置 analytics_engine_datasets
 */
export function writeDataPoint(
  env: { ANALYTICS?: { writeDataPoint: (data: { blobs?: string[]; doubles?: number[]; indexes?: string[] }) => void } },
  data: { blobs?: string[]; doubles?: number[]; indexes?: string[] }
): void {
  try {
    if (env.ANALYTICS) {
      env.ANALYTICS.writeDataPoint(data)
    }
  } catch (err) {
    logger.warn('Failed to write analytics data point', {
      error: err instanceof Error ? err.message : String(err),
    })
  }
}

/** 记录 API 调用 */
export function trackApiCall(
  env: { ANALYTICS?: { writeDataPoint: (data: { blobs?: string[]; doubles?: number[]; indexes?: string[] }) => void } },
  path: string,
  method: string,
  statusCode: number,
  latencyMs: number
): void {
  writeDataPoint(env, {
    indexes: [path],
    blobs: [method, String(statusCode)],
    doubles: [latencyMs],
  })
}

/** 记录错误 */
export function trackError(
  env: { ANALYTICS?: { writeDataPoint: (data: { blobs?: string[]; doubles?: number[]; indexes?: string[] }) => void } },
  path: string,
  errorType: string,
  statusCode: number
): void {
  writeDataPoint(env, {
    indexes: [path, errorType],
    blobs: [String(statusCode)],
    doubles: [1],
  })
}

/** 记录认证事件 */
export function trackAuth(
  env: { ANALYTICS?: { writeDataPoint: (data: { blobs?: string[]; doubles?: number[]; indexes?: string[] }) => void } },
  action: 'login' | 'register' | 'logout' | 'refresh' | 'failed',
  userId?: string
): void {
  writeDataPoint(env, {
    indexes: [action],
    blobs: [userId || 'anonymous'],
    doubles: [1],
  })
}
