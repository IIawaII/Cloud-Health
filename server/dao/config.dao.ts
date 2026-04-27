/**
 * Config DAO - 系统配置 (Drizzle ORM)
 */

import { eq } from 'drizzle-orm'
import { getDb, systemConfigs, type DbClient } from '../db'
import { getLogger } from '../utils/logger'

const logger = getLogger('ConfigDAO')

export interface SystemConfig {
  key: string
  value: string
  updated_at: number
}

function db(d1: D1Database): DbClient {
  return getDb(d1)
}

export async function getSystemConfig(d1: D1Database, key: string): Promise<SystemConfig | null> {
  const result = await db(d1)
    .select()
    .from(systemConfigs)
    .where(eq(systemConfigs.key, key))
    .limit(1)
  return (result[0] as SystemConfig | undefined) ?? null
}

export async function getAllSystemConfigs(d1: D1Database): Promise<SystemConfig[]> {
  const result = await db(d1)
    .select()
    .from(systemConfigs)
    .orderBy(systemConfigs.key)
  return result as SystemConfig[]
}

export async function setSystemConfig(d1: D1Database, key: string, value: string): Promise<void> {
  logger.info('Setting config', { key })
  await db(d1)
    .insert(systemConfigs)
    .values({
      key,
      value,
      updated_at: Math.floor(Date.now() / 1000),
    })
    .onConflictDoUpdate({
      target: systemConfigs.key,
      set: { value, updated_at: Math.floor(Date.now() / 1000) },
    })
    .run()
}
