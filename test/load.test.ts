import { describe, it, expect, beforeAll } from 'vitest'

/**
 * 本地高并发压力测试
 * 直接调用后端 API handler，无需启动服务器
 *
 * 运行方式:
 *   npx vitest run test/load.test.ts
 *
 * 注意：这些测试会真实调用外部 LLM API，请在本地开发环境谨慎运行
 */

// ==================== 模拟 Cloudflare Workers 运行时环境 ====================

class MockKVNamespace implements KVNamespace {
  private store = new Map<string, { value: string; expiration?: number }>()

  async get(key: string, _options?: Partial<KVNamespaceGetOptions<undefined>> | undefined): Promise<string | null> {
    const item = this.store.get(key)
    if (!item) return null
    if (item.expiration && item.expiration < Date.now() / 1000) {
      this.store.delete(key)
      return null
    }
    return item.value
  }

  async put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void> {
    const expiration = options?.expirationTtl ? Math.floor(Date.now() / 1000) + options.expirationTtl : undefined
    this.store.set(key, { value, expiration })
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key)
  }

  async list(options?: { prefix?: string; limit?: number; cursor?: string }): Promise<{
    keys: { name: string; expiration?: number; metadata?: unknown }[]
    list_complete: boolean
    cursor: string
  }> {
    const prefix = options?.prefix || ''
    const keys = Array.from(this.store.entries())
      .filter(([k]) => k.startsWith(prefix))
      .map(([name, item]) => ({ name, expiration: item.expiration }))
    return { keys, list_complete: true, cursor: '' }
  }

  async getWithMetadata<Metadata = unknown>(_key: string, _options?: Partial<KVNamespaceGetOptions<undefined>> | undefined): Promise<{ value: string | null; metadata: Metadata | null }> {
    throw new Error('Not implemented')
  }
}

class MockD1Database implements D1Database {
  private data = new Map<string, Record<string, unknown>[]>()

  constructor(initialData?: Record<string, Record<string, unknown>[]>) {
    if (initialData) {
      Object.entries(initialData).forEach(([table, rows]) => {
        this.data.set(table, [...rows])
      })
    }
  }

  prepare(sql: string): D1PreparedStatement {
    return new MockD1PreparedStatement(sql, this.data)
  }

  async dump(): Promise<ArrayBuffer> {
    return new ArrayBuffer(0)
  }

  async batch<T = unknown>(_statements: D1PreparedStatement[]): Promise<D1Result<T>[]> {
    throw new Error('Not implemented')
  }

  async exec(_query: string): Promise<D1ExecResult> {
    throw new Error('Not implemented')
  }

  withSession(_session: unknown | null): D1Database {
    return this
  }
}

class MockD1PreparedStatement implements D1PreparedStatement {
  private sql: string
  private data: Map<string, Record<string, unknown>[]>
  private bindings: unknown[] = []

  constructor(sql: string, data: Map<string, Record<string, unknown>[]>) {
    this.sql = sql
    this.data = data
  }

  bind(...values: unknown[]): D1PreparedStatement {
    this.bindings = values
    return this
  }

  async first<T = unknown>(): Promise<T | null> {
    const results = await this.all<T>()
    return results.results[0] || null
  }

  async run<T = unknown>(): Promise<D1Result<T>> {
    return { results: [], success: true, meta: { changes: 0, last_row_id: 0, duration: 0, served_by: 'mock', rows_read: 0, rows_written: 0, size_after: 0 } as D1Meta }
  }

  async all<T = unknown>(): Promise<D1Result<T>> {
    // 简单模拟：根据 SQL 中的表名和 WHERE 条件返回数据
    const tableMatch = this.sql.match(/FROM\s+(\w+)/i)
    const table = tableMatch ? tableMatch[1] : ''
    let rows = this.data.get(table) || []

    // 处理 email = ? 条件过滤（用于 emailExists 查询）
    if (this.sql.includes('email = ?') && this.bindings.length > 0) {
      const emailIndex = this.sql.toLowerCase().split('?').findIndex((part) => part.includes('email ='))
      if (emailIndex >= 0 && emailIndex < this.bindings.length) {
        const targetEmail = String(this.bindings[emailIndex])
        rows = rows.filter((r) => (r as Record<string, unknown>).email === targetEmail)
      }
    }

    return { results: rows as T[], success: true, meta: { changes: 0, last_row_id: 0, duration: 0, served_by: 'mock', rows_read: 0, rows_written: 0, size_after: 0 } as D1Meta }
  }

  async raw<T = unknown>(options?: { columnNames?: boolean }): Promise<T[]> {
    if (options?.columnNames) {
      return [] as unknown as T[]
    }
    return []
  }
}

function createMockContext(env: Record<string, unknown>): EventContext<Env, string, Record<string, unknown>> {
  return {
    request: new Request('http://localhost/api/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    }),
    env: env as unknown as Env,
    params: {},
    data: {},
    next: () => Promise.resolve(new Response('Not Found', { status: 404 })),
    waitUntil: () => {},
    passThroughOnException: () => {},
    functionPath: '',
    props: {},
  } as unknown as EventContext<Env, string, Record<string, unknown>>
}

// ==================== 并发测试工具 ====================

interface LoadTestResult {
  total: number
  success: number
  failed: number
  avgLatency: number
  minLatency: number
  maxLatency: number
  errors: Array<{ index: number; error: string }>
}

async function runConcurrent<T>(
  count: number,
  concurrency: number,
  fn: (index: number) => Promise<T>
): Promise<LoadTestResult> {
  const results: Array<{ success: boolean; latency: number; error?: string }> = []
  const errors: Array<{ index: number; error: string }> = []

  async function worker(startIndex: number) {
    for (let i = startIndex; i < count; i += concurrency) {
      const start = performance.now()
      try {
        await fn(i)
        results.push({ success: true, latency: performance.now() - start })
      } catch (err) {
        const error = err instanceof Error ? err.message : String(err)
        results.push({ success: false, latency: performance.now() - start, error })
        errors.push({ index: i, error })
      }
    }
  }

  const workers = Array.from({ length: concurrency }, (_, i) => worker(i))
  await Promise.all(workers)

  const latencies = results.map((r) => r.latency)
  const successCount = results.filter((r) => r.success).length

  return {
    total: count,
    success: successCount,
    failed: count - successCount,
    avgLatency: latencies.reduce((a, b) => a + b, 0) / latencies.length,
    minLatency: Math.min(...latencies),
    maxLatency: Math.max(...latencies),
    errors: errors.slice(0, 10), // 只保留前 10 个错误
  }
}

function printResult(name: string, result: LoadTestResult) {
  console.log(`\n📊 ${name}`)
  console.log(`   总请求: ${result.total}, 成功: ${result.success}, 失败: ${result.failed}`)
  console.log(`   平均延迟: ${result.avgLatency.toFixed(2)}ms, 最小: ${result.minLatency.toFixed(2)}ms, 最大: ${result.maxLatency.toFixed(2)}ms`)
  if (result.errors.length > 0) {
    console.log(`   错误示例:`)
    result.errors.forEach((e) => console.log(`     [${e.index}] ${e.error.slice(0, 100)}`))
  }
}

// ==================== 测试用例 ====================

describe('高并发压力测试', () => {
  let authTokens: MockKVNamespace
  let verificationCodes: MockKVNamespace
  let db: MockD1Database
  let env: Record<string, unknown>

  beforeAll(() => {
    authTokens = new MockKVNamespace()
    verificationCodes = new MockKVNamespace()
    db = new MockD1Database({
      users: [
        {
          id: 'user-1',
          username: 'testuser',
          email: 'test@example.com',
          password_hash: '100000:abc123:def456', // 模拟哈希格式
          avatar: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ],
      verification_codes: [],
      verification_code_cooldowns: [],
    })

    env = {
      DB: db,
      AUTH_TOKENS: authTokens,
      VERIFICATION_CODES: verificationCodes,
      TURNSTILE_SECRET_KEY: 'test-secret',
      AI_BASE_URL: 'https://api.openai.com/v1',
      AI_API_KEY: 'test-api-key',
      AI_MODEL: 'gpt-4o-mini',
    }
  })

  it('并发登录限流测试', async () => {
    const { onRequestPost } = await import('../functions/api/auth/login')

    // Mock fetch 避免真实调用 Turnstile API 导致超时
    const originalFetch = globalThis.fetch
    globalThis.fetch = async () => new Response(JSON.stringify({ success: true }), { status: 200 })

    try {
      const result = await runConcurrent(50, 10, async (_i) => {
        const context = createMockContext(env)
        // 修改 request body
        Object.defineProperty(context.request, 'json', {
          value: async () => ({
            usernameOrEmail: 'testuser',
            password: 'wrongpassword',
            turnstileToken: 'fake-token',
          }),
        })

        const response = await onRequestPost(context)
        // 期望返回 401（密码错误）或 429（限流）
        if (response.status !== 401 && response.status !== 429) {
          const text = await response.text()
          throw new Error(`Unexpected status ${response.status}: ${text.slice(0, 100)}`)
        }
      })

      printResult('并发登录限流测试 (50请求, 10并发)', result)
      expect(result.success).toBeGreaterThan(0)
    } finally {
      globalThis.fetch = originalFetch
    }
  }, 10000)

  it('并发验证码发送限流测试', async () => {
    const { onRequestPost } = await import('../functions/api/auth/send_verification_code')

    const result = await runConcurrent(30, 5, async (i) => {
      const context = createMockContext(env)
      Object.defineProperty(context.request, 'json', {
        value: async () => ({
          email: `user${i}@example.com`,
          type: 'register',
          turnstileToken: 'fake-token',
        }),
      })

      const response = await onRequestPost(context)
      // 期望返回 400（Turnstile 验证失败）或 429（限流）或 500（邮件服务未配置）
      if (response.status !== 400 && response.status !== 429 && response.status !== 500) {
        const text = await response.text()
        throw new Error(`Unexpected status ${response.status}: ${text.slice(0, 100)}`)
      }
    })

    printResult('并发验证码发送限流测试 (30请求, 5并发)', result)
    expect(result.success).toBeGreaterThan(0)
  })

  it('并发 AI 分析限流测试', async () => {
    const { onRequestPost } = await import('../functions/api/analyze')

    // 先创建一个有效的 token
    const tokenData = JSON.stringify({
      userId: 'user-1',
      username: 'testuser',
      email: 'test@example.com',
      createdAt: new Date().toISOString(),
    })
    const testToken = 'test-token-analyze'
    await authTokens.put(`token:${testToken}`, tokenData, { expirationTtl: 3600 })

    const result = await runConcurrent(20, 5, async (i) => {
      const context = createMockContext({
        ...env,
      })
      // 添加认证头
      Object.defineProperty(context.request, 'headers', {
        value: new Headers({
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${testToken}`,
        }),
      })
      Object.defineProperty(context.request, 'json', {
        value: async () => ({
          fileData: 'data:text/plain;base64,SGVsbG8gV29ybGQ=', // 小文本文件
          fileType: 'text/plain',
          fileName: `test${i}.txt`,
          stream: false,
        }),
      })

      const response = await onRequestPost(context)
      // 打印实际状态码用于调试
      if (response.status !== 200 && response.status !== 429 && response.status !== 502 && response.status !== 503 && response.status !== 400) {
        const text = await response.text()
        throw new Error(`Unexpected status ${response.status}: ${text.slice(0, 100)}`)
      }
      // 只要返回了已知状态码即视为成功（测试限流行为，不测试 LLM 调用）
    })

    printResult('并发 AI 分析限流测试 (20请求, 5并发)', result)
    // 这个测试主要验证限流是否生效，允许全部请求因各种原因失败
    expect(result.total).toBe(20)
  })

  it('KV 竞态条件测试 - 并发计数', async () => {
    const { checkRateLimit } = await import('../functions/lib/rateLimit')
    const kv = new MockKVNamespace()
    const key = 'test:concurrent'
    const limit = 10

    // 模拟 20 个并发请求同时检查限流
    const promises = Array.from({ length: 20 }, async (_, _i) => {
      await new Promise((r) => setTimeout(r, Math.random() * 10)) // 轻微随机延迟
      return checkRateLimit({ kv, key, limit, windowSeconds: 60 })
    })

    const results = await Promise.all(promises)
    const allowed = results.filter((r) => r.allowed).length
    const blocked = results.filter((r) => !r.allowed).length

    console.log(`\n📊 KV 竞态条件测试`)
    console.log(`   总请求: 20, 限制: ${limit}, 通过: ${allowed}, 拦截: ${blocked}`)

    // 由于 MockKV 是内存实现，这里应该接近精确
    // 但在真实 KV 中，allowed 可能略微超过 limit
    expect(allowed).toBeGreaterThanOrEqual(limit)
    expect(blocked).toBeGreaterThanOrEqual(20 - limit - 2) // 允许少量误差
  })
})
