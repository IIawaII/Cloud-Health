/**
 * Drizzle ORM 数据库客户端（单例模式）
 * 封装 D1 数据库连接，每次请求复用同一个 Drizzle 实例
 */

import { drizzle } from 'drizzle-orm/d1'
import * as schema from './schema'
import { getLogger } from '../utils/logger'

const logger = getLogger('DB')

/** Drizzle 数据库实例类型 */
export type DbClient = ReturnType<typeof createDb>

/**
 * 从 D1Database 实例创建 Drizzle ORM 客户端
 */
function createDb(d1: D1Database) {
  return drizzle(d1, { schema })
}

/**
 * 模块级 D1 实例缓存
 * Cloudflare Workers 中模块在 isolate 内复用，跨请求共享
 */
let cachedD1: D1Database | null = null
let cachedDb: DbClient | null = null

/**
 * 获取或创建 Drizzle 数据库客户端（单例）
 * 首次调用时创建实例，后续调用返回缓存实例
 *
 * @example
 * import { getDb } from '../db'
 * const db = getDb(env.DB)
 * const user = await db.query.users.findFirst({ where: eq(users.id, id) })
 */
export function getDb(d1: D1Database): DbClient {
  if (cachedD1 === d1 && cachedDb) {
    return cachedDb
  }
  logger.info('Creating new Drizzle instance')
  cachedD1 = d1
  cachedDb = createDb(d1)
  return cachedDb
}

/** 导出所有 schema 表定义 */
export * from './schema'
