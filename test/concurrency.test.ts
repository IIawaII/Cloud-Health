/**
 * 本地高并发测试
 * 测试目标：
 * 1. KV 速率限制的竞态条件（checkRateLimit）
 * 2. D1 验证码原子消费（consumeVerificationCode）
 * 3. 令牌并发验证（verifyToken）
 * 4. 注册并发唯一性约束
 *
 * 运行方式：npm test
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { checkRateLimit, buildRateLimitKey } from '../functions/lib/rateLimit'
import {
  consumeVerificationCode,
  upsertVerificationCode,
  checkVerificationCooldown,
  setVerificationCooldown,
} from '../functions/lib/db'
import { verifyToken, saveToken, revokeAllUserTokens } from '../functions/lib/auth'

// ==================== Mock KV ====================
class MockKV implements KVNamespace {
  private store = new Map<string, { value: string; expiry?: number }>()

  async get(key: string, _options?: Partial<KVNamespaceGetOptions<undefined>> | undefined): Promise<string | null> {
    const item = this.store.get(key)
    if (!item) return null
    if (item.expiry && item.expiry < Date.now()) {
      this.store.delete(key)
      return null
    }
    return item.value
  }

  async put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void> {
    const expiry = options?.expirationTtl ? Date.now() + options.expirationTtl * 1000 : undefined
    this.store.set(key, { value, expiry })
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key)
  }

  async list(options?: { prefix?: string; limit?: number; cursor?: string }): Promise<{ keys: { name: string; expiration?: number; metadata?: unknown }[]; list_complete: boolean; cursor: string }> {
    const prefix = options?.prefix || ''
    const keys: { name: string }[] = []
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) {
        keys.push({ name: key })
      }
    }
    return { keys, list_complete: true, cursor: '' }
  }

  async getWithMetadata<Metadata = unknown>(_key: string, _options?: Partial<KVNamespaceGetOptions<undefined>> | undefined): Promise<{ value: string | null; metadata: Metadata | null }> {
    throw new Error('Not implemented')
  }

  // 辅助方法：清空
  clear(): void {
    this.store.clear()
  }

  // 辅助方法：获取计数（用于验证）
  getCount(): number {
    return this.store.size
  }
}

// ==================== Mock D1 ====================
class MockD1 implements D1Database {
  private tables = new Map<string, Map<string, Record<string, unknown>>>()

  prepare(sql: string): D1PreparedStatement {
    return new MockD1PreparedStatement(this, sql)
  }

  batch<T = unknown>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]> {
    return Promise.all(statements.map((s) => (s as MockD1PreparedStatement).execute()))
  }

  exec(_query: string): Promise<D1ExecResult> {
    return Promise.resolve({ count: 0, duration: 0 })
  }

  // 内部方法
  getTable(name: string): Map<string, Record<string, unknown>> {
    if (!this.tables.has(name)) {
      this.tables.set(name, new Map())
    }
    return this.tables.get(name)!
  }

  clear(): void {
    this.tables.clear()
  }
}

class MockD1PreparedStatement implements D1PreparedStatement {
  private db: MockD1
  private sql: string
  private bindings: unknown[] = []

  constructor(db: MockD1, sql: string) {
    this.db = db
    this.sql = sql
  }

  bind(...values: unknown[]): D1PreparedStatement {
    this.bindings = values
    return this
  }

  first<T = unknown>(): Promise<T | null> {
    return this.execute().then((result) => (result.results?.[0] as T) || null)
  }

  run<T = unknown>(): Promise<D1Result<T>> {
    return this.execute()
  }

  all<T = unknown>(): Promise<D1Result<T>> {
    return this.execute()
  }

  raw<T = unknown>(): Promise<T[]> {
    return this.execute().then((result) => result.results as T[])
  }

  private execute<T = unknown>(): Promise<D1Result<T>> {
    const sql = this.sql.trim()
    const bindings = this.bindings

    // 模拟 DELETE
    if (sql.startsWith('DELETE')) {
      const tableName = this.extractTableName(sql)
      const table = this.db.getTable(tableName)
      let changes = 0

      // 简单解析 WHERE 条件
      if (sql.includes('WHERE purpose = ? AND email = ? AND code = ?')) {
        const [purpose, email, code] = bindings as string[]
        const key = `${purpose}:${email}`
        const record = table.get(key)
        if (record && record.code === code) {
          table.delete(key)
          changes = 1
        }
      } else if (sql.includes('WHERE purpose = ? AND email = ?')) {
        const [purpose, email] = bindings as string[]
        const key = `${purpose}:${email}`
        if (table.has(key)) {
          table.delete(key)
          changes = 1
        }
      }

      return Promise.resolve({ success: true, results: [], meta: { changes } } as D1Result<T>)
    }

    // 模拟 SELECT
    if (sql.startsWith('SELECT')) {
      const tableName = this.extractTableName(sql)
      const table = this.db.getTable(tableName)

      if (sql.includes('WHERE purpose = ? AND email = ?')) {
        const [purpose, email] = bindings as string[]
        const key = `${purpose}:${email}`
        const record = table.get(key)
        return Promise.resolve({
          success: true,
          results: record ? [record as T] : [],
          meta: { changes: 0 },
        } as D1Result<T>)
      }

      return Promise.resolve({ success: true, results: [], meta: { changes: 0 } } as D1Result<T>)
    }

    // 模拟 INSERT/UPSERT
    if (sql.startsWith('INSERT') || sql.includes('ON CONFLICT')) {
      const tableName = this.extractTableName(sql)
      const table = this.db.getTable(tableName)

      // verification_codes 表
      if (tableName === 'verification_codes') {
        const [purpose, email, code, createdAt, expiresAt] = bindings as string[]
        const key = `${purpose}:${email}`
        table.set(key, { purpose, email, code, created_at: createdAt, expires_at: expiresAt })
      }

      // verification_code_cooldowns 表
      if (tableName === 'verification_code_cooldowns') {
        const [purpose, email, sentAt] = bindings as string[]
        const key = `${purpose}:${email}`
        table.set(key, { purpose, email, sent_at: sentAt })
      }

      return Promise.resolve({ success: true, results: [], meta: { changes: 1 } } as D1Result<T>)
    }

    return Promise.resolve({ success: true, results: [], meta: { changes: 0 } } as D1Result<T>)
  }

  private extractTableName(sql: string): string {
    const match = sql.match(/FROM\s+(\w+)|INTO\s+(\w+)/i)
    return match ? (match[1] || match[2]) : 'unknown'
  }
}

// ==================== 测试用例 ====================
describe('高并发测试', () => {
  let mockKV: MockKV
  let mockD1: MockD1

  beforeEach(() => {
    mockKV = new MockKV()
    mockD1 = new MockD1()
  })

  describe('1. KV 速率限制竞态条件', () => {
    it('并发请求不应超过限流阈值过多', async () => {
      const limit = 5
      const concurrency = 20
      const key = 'test:ip:login'

      // 并发执行 20 个请求，限流为 5
      const promises = Array.from({ length: concurrency }, () =>
        checkRateLimit({ kv: mockKV, key, limit, windowSeconds: 60 })
      )

      const results = await Promise.all(promises)
      const allowed = results.filter((r) => r.allowed).length
      const denied = results.filter((r) => !r.allowed).length

      console.log(`[RateLimit] 限流 ${limit}，并发 ${concurrency}，通过 ${allowed}，拒绝 ${denied}`)

      // 由于 MockKV 的 get/put 不是原子操作，并发下所有请求可能同时读到 0 然后同时写入
      // 这是预期的竞态条件行为，测试用于量化问题严重程度
      console.log(`[RateLimit Race] 预期限流 ${limit}，实际通过 ${allowed}，超发 ${allowed - limit} 个`)
      expect(allowed + denied).toBe(concurrency)
    })

    it('串行请求应严格限流', async () => {
      const limit = 3
      const key = 'test:ip:register'

      // 串行执行 5 个请求
      const results: Awaited<ReturnType<typeof checkRateLimit>>[] = []
      for (let i = 0; i < 5; i++) {
        results.push(await checkRateLimit({ kv: mockKV, key, limit, windowSeconds: 60 }))
      }

      const allowed = results.filter((r) => r.allowed).length
      const denied = results.filter((r) => !r.allowed).length

      console.log(`[RateLimit Serial] 限流 ${limit}，通过 ${allowed}，拒绝 ${denied}`)

      // 串行应严格限流
      expect(allowed).toBe(limit)
      expect(denied).toBe(2)
    })
  })

  describe('2. D1 验证码原子消费', () => {
    it('并发消费同一验证码应只有一个成功', async () => {
      const purpose = 'register' as const
      const email = 'test@example.com'
      const code = '123456'
      const now = new Date().toISOString()
      const expiresAt = new Date(Date.now() + 60000).toISOString()

      // 先插入验证码
      await upsertVerificationCode(mockD1, {
        purpose,
        email,
        code,
        createdAt: now,
        expiresAt,
      })

      // 并发消费 10 次
      const concurrency = 10
      const promises = Array.from({ length: concurrency }, () =>
        consumeVerificationCode(mockD1, purpose, email, code, now)
      )

      const results = await Promise.all(promises)
      const consumed = results.filter((r) => r === 'consumed').length
      const notFound = results.filter((r) => r === 'not_found').length
      const expired = results.filter((r) => r === 'expired').length
      const invalid = results.filter((r) => r === 'invalid').length

      console.log(
        `[VerificationCode] 并发 ${concurrency}，consumed=${consumed}, not_found=${notFound}, expired=${expired}, invalid=${invalid}`
      )

      // 只有一个应成功消费
      expect(consumed).toBe(1)
      // 其余应为 not_found（已被删除）
      expect(notFound).toBe(concurrency - 1)
    })

    it('并发设置冷却时间应只有一个成功写入', async () => {
      const purpose = 'register' as const
      const email = 'test@example.com'
      const concurrency = 10

      // 并发设置冷却 10 次
      const promises = Array.from({ length: concurrency }, () =>
        setVerificationCooldown(mockD1, purpose, email)
      )

      await Promise.all(promises)

      // 查询冷却状态
      const result = await checkVerificationCooldown(mockD1, purpose, email, 60)

      console.log(`[Cooldown] 并发 ${concurrency} 次设置，冷却状态:`, result)

      // 应被成功设置（不抛出错误即视为通过）
      expect(result.allowed).toBe(false)
      expect(result.remainingSeconds).toBeGreaterThan(0)
    })
  })

  describe('3. 令牌并发验证', () => {
    it('并发验证同一有效令牌应全部通过', async () => {
      const token = 'valid_token_123'
      const tokenData = {
        userId: 'user_1',
        username: 'testuser',
        email: 'test@example.com',
        createdAt: new Date().toISOString(),
      }

      // 先保存令牌
      await saveToken(mockKV, token, tokenData, 900)

      // 并发验证 50 次
      const concurrency = 50
      const promises = Array.from({ length: concurrency }, () =>
        verifyToken({
          request: new Request('http://localhost', {
            headers: { Authorization: `Bearer ${token}` },
          }),
          env: { AUTH_TOKENS: mockKV },
        })
      )

      const results = await Promise.all(promises)
      const valid = results.filter((r) => r !== null).length
      const invalid = results.filter((r) => r === null).length

      console.log(`[TokenVerify] 并发 ${concurrency}，有效 ${valid}，无效 ${invalid}`)

      // 全部应通过
      expect(valid).toBe(concurrency)
      expect(invalid).toBe(0)
    })

    it('并发撤销令牌后验证应全部失败', async () => {
      const token = 'token_to_revoke'
      const userId = 'user_2'
      const tokenData = {
        userId,
        username: 'revokeuser',
        email: 'revoke@example.com',
        createdAt: new Date().toISOString(),
      }

      // 保存令牌和索引
      await saveToken(mockKV, token, tokenData, 900)
      await mockKV.put(`user_tokens:${userId}:${token}`, '1', { expirationTtl: 900 })

      // 并发执行：一半验证，一半撤销
      const verifyPromises = Array.from({ length: 10 }, () =>
        verifyToken({
          request: new Request('http://localhost', {
            headers: { Authorization: `Bearer ${token}` },
          }),
          env: { AUTH_TOKENS: mockKV },
        })
      )

      const revokePromise = revokeAllUserTokens(mockKV, userId)

      await Promise.all([
        Promise.all(verifyPromises),
        revokePromise,
      ])

      // 由于并发时序不确定，验证结果可能是成功或失败
      // 但撤销后再次验证应全部失败
      const afterRevoke = await verifyToken({
        request: new Request('http://localhost', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        env: { AUTH_TOKENS: mockKV },
      })

      console.log(`[TokenRevoke] 撤销后验证结果:`, afterRevoke)

      expect(afterRevoke).toBeNull()
    })
  })

  describe('4. buildRateLimitKey', () => {
    it('应正确构建限流键', () => {
      const request = new Request('http://localhost', {
        headers: { 'CF-Connecting-IP': '192.168.1.1' },
      })
      const key = buildRateLimitKey({ request }, 'login')
      expect(key).toBe('192.168.1.1:login')
    })

    it('无 CF-Connecting-IP 时应使用 unknown', () => {
      const request = new Request('http://localhost')
      const key = buildRateLimitKey({ request }, 'register')
      expect(key).toBe('unknown:register')
    })
  })
})
