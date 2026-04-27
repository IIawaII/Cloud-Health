/**
 * 请求性能监控中间件
 * 记录每个 API 请求的路径、方法、状态码、延迟、用户 IP
 * 数据写入 D1 request_metrics 表，管理员可通过后台查看图表
 */

import { getDb, requestMetrics } from '../db'
import { getLogger } from '../utils/logger'
import type { Env } from '../utils/env'

const logger = getLogger('Monitor')

/** 监控采样率（0-1），1 表示全量记录 */
const SAMPLE_RATE = 0.1

export interface MetricRecord {
  path: string
  method: string
  statusCode: number
  latencyMs: number
  userId?: string
  ip?: string
}

/**
 * 异步记录请求指标到 D1
 * 使用 waitUntil 确保不阻塞响应
 * 在 worker.ts 的 fetch handler 中调用
 */
export function recordMetric(
  env: Env,
  ctx: ExecutionContext,
  record: MetricRecord
): void {
  // 采样控制：仅记录 10% 请求以减少 D1 写入量
  if (Math.random() > SAMPLE_RATE) return

  const db = getDb(env.DB)
  const promise = db
    .insert(requestMetrics)
    .values({
      id: crypto.randomUUID(),
      path: record.path.slice(0, 255),
      method: record.method,
      status_code: record.statusCode,
      latency_ms: Math.round(record.latencyMs),
      user_id: record.userId ?? null,
      ip: record.ip ?? null,
      created_at: Math.floor(Date.now() / 1000),
    })
    .run()
    .catch((err) => {
      logger.warn('Failed to record metric', { error: err instanceof Error ? err.message : String(err) })
    })

  ctx.waitUntil(promise)
}
