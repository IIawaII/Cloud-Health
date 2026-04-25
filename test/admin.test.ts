import { describe, it, expect, vi, beforeEach } from 'vitest'
import { saveToken } from '../functions/lib/auth'
import {
  requireAdmin,
  withAdmin,
} from '../functions/middleware/admin'
import {
  getUserList,
  findUserByIdPublic,
  updateUserRole,
  deleteUserById,
  getUsageLogs,
  getAuditLogs,
  getAllSystemConfigs,
  getSystemConfig,
  setSystemConfig,
  createUsageLog,
  createAuditLog,
  getStats,
  getDailyUserStats,
  getUsageStats,
} from '../functions/lib/db'
import {
  onRequestGet as apiGetUserList,
  onRequestPatch as apiUpdateUserRole,
  onRequestDelete as apiDeleteUserById,
} from '../functions/api/admin/users'
import { onRequestGet as statsHandler } from '../functions/api/admin/stats'
import { onRequestGet as logsHandler } from '../functions/api/admin/logs'
import { onRequestGet as configGetHandler } from '../functions/api/admin/config'
import { onRequestPut as configPutHandler } from '../functions/api/admin/config'

// ==================== Mock D1 ====================
class MockD1 {
  private tables = new Map<string, Map<string, Record<string, unknown>>>()

  prepare(sql: string): MockD1PreparedStatement {
    return new MockD1PreparedStatement(this, sql)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  batch(statements: MockD1PreparedStatement[]): Promise<any> {
    return Promise.all(statements.map((s) => s.execute()))
  }

  exec(): Promise<{ count: number; duration: number }> {
    return Promise.resolve({ count: 0, duration: 0 })
  }

  dump(): Promise<ArrayBuffer> {
    return Promise.resolve(new ArrayBuffer(0))
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  withSession(_session: unknown | null): any {
    return this
  }

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

class MockD1PreparedStatement {
  private db: MockD1
  private sql: string
  private bindings: unknown[] = []

  constructor(db: MockD1, sql: string) {
    this.db = db
    this.sql = sql
  }

  bind(...values: unknown[]): MockD1PreparedStatement {
    this.bindings = values
    return this
  }

  async first<T = unknown>(): Promise<T | null> {
    const result = await this.execute()
    return (result.results?.[0] as T) || null
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async run(): Promise<any> {
    return this.execute()
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async all(): Promise<any> {
    return this.execute()
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async raw(): Promise<any> {
    const result = (await this.execute()) as { results: unknown[] }
    return result.results
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async execute(): Promise<any> {
    const sql = this.sql.trim()
    const bindings = this.bindings

    // DELETE
    if (sql.startsWith('DELETE')) {
      const tableName = this.extractTableName(sql)
      const table = this.db.getTable(tableName)
      let changes = 0

      if (sql.includes('WHERE id = ?')) {
        const [id] = bindings as string[]
        if (table.has(id)) {
          table.delete(id)
          changes = 1
        }
      }

      return { success: true, results: [], meta: { changes } }
    }

    // UPDATE users
    if (sql.startsWith('UPDATE users')) {
      const table = this.db.getTable('users')
      const id = bindings[bindings.length - 1] as string
      const record = table.get(id)
      if (record) {
        const setMatch = sql.match(/SET\s+(.+?)\s+WHERE/i)
        if (setMatch) {
          const setParts = setMatch[1].split(',').map((f) => f.trim())
          const valueBindings = bindings.slice(0, setParts.length)
          setParts.forEach((field, idx) => {
            const fieldName = field.split('=')[0].trim()
            record[fieldName] = valueBindings[idx]
          })
        }
        return { success: true, results: [], meta: { changes: 1 } }
      }
      return { success: true, results: [], meta: { changes: 0 } }
    }

    // SELECT COUNT
    if (sql.includes('COUNT(*)')) {
      const tableName = this.extractTableName(sql)
      const table = this.db.getTable(tableName)
      return { success: true, results: [{ total: table.size }], meta: { changes: 0 } }
    }

    // SELECT with WHERE id = ?
    if (sql.includes('WHERE id = ?')) {
      const [id] = bindings as string[]
      const tableName = this.extractTableName(sql)
      const table = this.db.getTable(tableName)
      const record = table.get(id)
      if (record) {
        return { success: true, results: [record], meta: { changes: 0 } }
      }
      return { success: true, results: [], meta: { changes: 0 } }
    }

    // SELECT from users with username/email LIKE (OR 组合)
    if (sql.includes('username LIKE ?') || sql.includes('email LIKE ?')) {
      const table = this.db.getTable('users')
      const results: Record<string, unknown>[] = []

      for (const [, record] of table) {
        const usernameMatch = sql.includes('username LIKE ?') &&
          (record.username as string).toLowerCase().includes((bindings[0] as string).replace(/%/g, '').toLowerCase())
        const emailMatch = sql.includes('email LIKE ?') &&
          (record.email as string).toLowerCase().includes((bindings[1] as string).replace(/%/g, '').toLowerCase())

        if (usernameMatch || emailMatch) {
          results.push(record)
        }
      }

      // LIMIT/OFFSET: likesearch 查询 bindings = [searchPattern1, searchPattern2, limit, offset]
      const limitMatch = sql.match(/LIMIT\s+\?/i)
      const offsetMatch = sql.match(/OFFSET\s+\?/i)
      let limit = results.length
      let offset = 0
      if (limitMatch && offsetMatch) {
        limit = bindings[2] as number
        offset = bindings[3] as number
      } else if (limitMatch) {
        limit = bindings[2] as number
      }

      return { success: true, results: results.slice(offset, offset + limit), meta: { changes: 0 } }
    }

    // SELECT from users (list) — 必须在 WHERE id 之后，避免误匹配
    if (sql.startsWith('SELECT') && sql.includes('FROM users') && !sql.includes('WHERE id = ?')) {
      const table = this.db.getTable('users')
      let results = Array.from(table.values())

      // list 查询结构: `... FROM users ... LIMIT ? OFFSET ?`
      // bindings: [...other params, limit, offset]
      const limitMatch = sql.match(/LIMIT\s+\?/i)
      const offsetMatch = sql.match(/OFFSET\s+\?/i)
      if (limitMatch && offsetMatch) {
        const limit = bindings[bindings.length - 2] as number
        const offset = bindings[bindings.length - 1] as number
        results = results.slice(offset, offset + limit)
      } else if (limitMatch) {
        const limit = bindings[bindings.length - 1] as number
        results = results.slice(0, limit)
      }

      return { success: true, results, meta: { changes: 0 } }
    }

    // SELECT from usage_logs / audit_logs / system_configs
    if (sql.startsWith('SELECT') && (sql.includes('usage_logs') || sql.includes('audit_logs') || sql.includes('system_configs'))) {
      const tableName = this.extractTableName(sql)
      const table = this.db.getTable(tableName)
      let results = Array.from(table.values())

      const limitMatch = sql.match(/LIMIT\s+\?/i)
      const offsetMatch = sql.match(/OFFSET\s+\?/i)
      if (limitMatch && offsetMatch) {
        const limit = bindings[bindings.length - 2] as number
        const offset = bindings[bindings.length - 1] as number
        results = results.slice(offset, offset + limit)
      } else if (limitMatch) {
        const limit = bindings[bindings.length - 1] as number
        results = results.slice(0, limit)
      }

      return { success: true, results, meta: { changes: 0 } }
    }

    // SELECT with DATE aggregation
    if (sql.includes("DATE(created_at)")) {
      const table = this.db.getTable('users')
      const dateGroups = new Map<string, number>()

      for (const [, record] of table) {
        const date = new Date(record.created_at as string).toISOString().split('T')[0]
        dateGroups.set(date, (dateGroups.get(date) || 0) + 1)
      }

      const results = Array.from(dateGroups.entries()).map(([date, count]) => ({ date, count }))
      return { success: true, results, meta: { changes: 0 } }
    }

    // SELECT with action GROUP BY
    if (sql.includes('GROUP BY action')) {
      const table = this.db.getTable('usage_logs')
      const actionGroups = new Map<string, number>()

      for (const [, record] of table) {
        const action = record.action as string
        actionGroups.set(action, (actionGroups.get(action) || 0) + 1)
      }

      const results = Array.from(actionGroups.entries()).map(([action, count]) => ({ action, count }))
      return { success: true, results, meta: { changes: 0 } }
    }

    // SELECT with DATE = 'now'
    if (sql.includes("= DATE('now')") || sql.includes("= DATE('now'")) {
      const tableName = this.extractTableName(sql)
      const table = this.db.getTable(tableName)
      const today = new Date().toISOString().split('T')[0]
      let count = 0

      for (const [, record] of table) {
        const createdDate = new Date(record.created_at as string).toISOString().split('T')[0]
        if (createdDate === today) {
          count++
        }
      }

      return { success: true, results: [{ count }], meta: { changes: 0 } }
    }

    // INSERT / ON CONFLICT (upsert)
    if (sql.startsWith('INSERT') || sql.includes('ON CONFLICT')) {
      const tableName = this.extractTableName(sql)
      const table = this.db.getTable(tableName)

      if (tableName === 'usage_logs') {
        const [id, user_id, action, metadata, created_at] = bindings as string[]
        table.set(id, { id, user_id, action, metadata, created_at })
      } else if (tableName === 'audit_logs') {
        const [id, admin_id, action, target_type, target_id, details, created_at] = bindings as (string | null)[]
        table.set(id, { id, admin_id, action, target_type, target_id, details, created_at })
      } else if (tableName === 'system_configs') {
        const [key, value, updated_at] = bindings as string[]
        table.set(key, { key, value, updated_at })
      }

      return { success: true, results: [], meta: { changes: 1 } }
    }

    return { success: true, results: [], meta: { changes: 0 } }
  }

  private extractTableName(sql: string): string {
    const fromMatch = sql.match(/FROM\s+(\w+)/i)
    const intoMatch = sql.match(/INTO\s+(\w+)/i)
    const updateMatch = sql.match(/UPDATE\s+(\w+)/i)
    return fromMatch?.[1] || intoMatch?.[1] || updateMatch?.[1] || 'unknown'
  }
}

// ==================== Mock KV ====================
function createMockKV(): KVNamespace {
  const store = new Map<string, { value: string; ttl?: number }>()
  return {
    get: vi.fn(async (key: string) => store.get(key)?.value ?? null),
    put: vi.fn(async (key: string, value: string, options?: { expirationTtl?: number }) => {
      store.set(key, { value, ttl: options?.expirationTtl })
    }),
    delete: vi.fn(async (key: string) => {
      store.delete(key)
    }),
    list: vi.fn(async ({ prefix }: { prefix: string }) => {
      const keys = Array.from(store.keys())
        .filter((k) => k.startsWith(prefix))
        .map((name) => ({ name }))
      return { keys, list_complete: true, cursor: '' }
    }),
  } as unknown as KVNamespace
}

// ==================== 辅助函数 ====================
function createMockContext(
  kv: KVNamespace,
  db: MockD1,
  adminToken?: string,
  userToken?: string
) {
  const token = adminToken || userToken || ''
  const headers: Record<string, string> = {}
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  const request = new Request('http://localhost', {
    method: 'GET',
    headers,
  })

  return {
    request,
    env: {
      DB: db,
      AUTH_TOKENS: kv,
    },
    params: {},
  }
}

// ==================== 测试：requireAdmin 中间件 ====================
describe('requireAdmin 中间件', () => {
  let kv: KVNamespace

  beforeEach(() => {
    kv = createMockKV()
  })

  it('有效 admin token 应通过校验', async () => {
    await saveToken(kv, 'admin-token', {
      userId: 'admin-1',
      username: 'admin',
      email: 'admin@test.com',
      role: 'admin',
      createdAt: new Date().toISOString(),
    })
    const context = createMockContext(kv, new MockD1(), 'admin-token')
    const result = await requireAdmin(context)
    expect(result).toBeNull()
  })

  it('无 token 应返回 401', async () => {
    const context = createMockContext(kv, new MockD1())
    const result = await requireAdmin(context)
    expect(result).not.toBeNull()
    expect(result!.status).toBe(401)
  })

  it('普通用户 token 应返回 403', async () => {
    await saveToken(kv, 'user-token', {
      userId: 'user-1',
      username: 'user',
      email: 'user@test.com',
      role: 'user',
      createdAt: new Date().toISOString(),
    })
    const context = createMockContext(kv, new MockD1(), 'user-token')
    const result = await requireAdmin(context)
    expect(result).not.toBeNull()
    expect(result!.status).toBe(403)
  })

  it('无效 token 应返回 401', async () => {
    const context = createMockContext(kv, new MockD1(), 'invalid-token')
    const result = await requireAdmin(context)
    expect(result).not.toBeNull()
    expect(result!.status).toBe(401)
  })
})

// ==================== 测试：withAdmin 包装器 ====================
describe('withAdmin 包装器', () => {
  let kv: KVNamespace

  beforeEach(() => {
    kv = createMockKV()
  })

  it('admin 请求应调用 handler 并返回结果', async () => {
    await saveToken(kv, 'admin-token', {
      userId: 'admin-1',
      username: 'admin',
      email: 'admin@test.com',
      role: 'admin',
      createdAt: new Date().toISOString(),
    })

    const handler = vi.fn(async (_ctx: unknown) => {
      return new Response(JSON.stringify({ success: true }), {
        headers: { 'Content-Type': 'application/json' },
      })
    })

    const wrapped = withAdmin(handler as never)
    const context = createMockContext(kv, new MockD1(), 'admin-token')
    await wrapped(context)

    expect(handler).toHaveBeenCalled()
  })

  it('普通用户请求应直接返回 403，不调用 handler', async () => {
    await saveToken(kv, 'user-token', {
      userId: 'user-1',
      username: 'user',
      email: 'user@test.com',
      role: 'user',
      createdAt: new Date().toISOString(),
    })

    const handler = vi.fn(async (_ctx: unknown) => {
      return new Response(JSON.stringify({ success: true }))
    })

    const wrapped = withAdmin(handler as never)
    const context = createMockContext(kv, new MockD1(), 'user-token')
    const response = await wrapped(context)

    expect(handler).not.toHaveBeenCalled()
    expect(response.status).toBe(403)
  })
})

// ==================== 测试：db 管理函数 ====================
describe('db 管理函数', () => {
  let db: MockD1

  beforeEach(() => {
    db = new MockD1()
    const usersTable = db.getTable('users')
    usersTable.set('user-1', {
      id: 'user-1',
      username: 'alice',
      email: 'alice@example.com',
      password_hash: 'hash1',
      avatar: null,
      role: 'user',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    })
    usersTable.set('user-2', {
      id: 'user-2',
      username: 'bob',
      email: 'bob@example.com',
      password_hash: 'hash2',
      avatar: null,
      role: 'admin',
      created_at: '2024-01-02T00:00:00Z',
      updated_at: '2024-01-02T00:00:00Z',
    })
  })

  describe('getUserList', () => {
    it('应返回用户列表', async () => {
      const result = await getUserList(db, { limit: 20, offset: 0 })
      expect(result.total).toBeGreaterThanOrEqual(2)
      expect(result.users.length).toBeGreaterThanOrEqual(2)
    })

    it('应支持搜索过滤', async () => {
      const result = await getUserList(db, { limit: 20, offset: 0, search: 'alice' })
      expect(result.users.some((u) => u.username === 'alice')).toBe(true)
    })

    it('应支持分页', async () => {
      const result = await getUserList(db, { limit: 1, offset: 0 })
      expect(result.users.length).toBeLessThanOrEqual(1)
    })
  })

  describe('findUserByIdPublic', () => {
    it('应返回用户公开信息', async () => {
      const user = await findUserByIdPublic(db, 'user-1')
      expect(user).not.toBeNull()
      expect(user?.username).toBe('alice')
      expect(user?.email).toBe('alice@example.com')
      expect(user).toHaveProperty('role')
    })

    it('不存在的用户返回 null', async () => {
      const user = await findUserByIdPublic(db, 'nonexistent')
      expect(user).toBeNull()
    })
  })

  describe('updateUserRole', () => {
    it('应更新用户角色', async () => {
      await updateUserRole(db, 'user-1', 'admin')
      const user = await findUserByIdPublic(db, 'user-1')
      expect(user?.role).toBe('admin')
    })
  })

  describe('deleteUserById', () => {
    it('应删除用户', async () => {
      await deleteUserById(db, 'user-1')
      const user = await findUserByIdPublic(db, 'user-1')
      expect(user).toBeNull()
    })
  })

  describe('createUsageLog', () => {
    it('应创建使用日志', async () => {
      await createUsageLog(db, {
        id: 'log-1',
        user_id: 'user-1',
        action: 'chat',
        metadata: '{"msg":"hello"}',
      })
      const result = await getUsageLogs(db, { limit: 10, offset: 0 })
      expect(result.logs.length).toBeGreaterThan(0)
    })
  })

  describe('getUsageLogs', () => {
    it('应返回使用日志列表', async () => {
      const result = await getUsageLogs(db, { limit: 20, offset: 0 })
      expect(result).toHaveProperty('logs')
      expect(result).toHaveProperty('total')
    })
  })

  describe('createAuditLog', () => {
    it('应创建审计日志', async () => {
      await createAuditLog(db, {
        id: 'audit-1',
        admin_id: 'admin-1',
        action: 'UPDATE_USER_ROLE',
        target_type: 'user',
        target_id: 'user-1',
        details: '{"newRole":"admin"}',
      })
      const result = await getAuditLogs(db, { limit: 10, offset: 0 })
      expect(result.logs.length).toBeGreaterThan(0)
    })
  })

  describe('getAuditLogs', () => {
    it('应返回审计日志列表', async () => {
      const result = await getAuditLogs(db, { limit: 20, offset: 0 })
      expect(result).toHaveProperty('logs')
      expect(result).toHaveProperty('total')
    })
  })

  describe('系统配置', () => {
    it('应设置和获取配置', async () => {
      await setSystemConfig(db, 'site_name', 'Health Project')
      const config = await getSystemConfig(db, 'site_name')
      expect(config).not.toBeNull()
      expect(config?.value).toBe('Health Project')
    })

    it('应获取所有配置', async () => {
      await setSystemConfig(db, 'key1', 'value1')
      await setSystemConfig(db, 'key2', 'value2')
      const configs = await getAllSystemConfigs(db)
      expect(configs.length).toBeGreaterThanOrEqual(2)
    })
  })

  describe('getStats', () => {
    it('应返回统计数据', async () => {
      const stats = await getStats(db)
      expect(stats).toHaveProperty('totalUsers')
      expect(stats).toHaveProperty('todayNewUsers')
      expect(stats).toHaveProperty('totalLogs')
      expect(stats).toHaveProperty('todayLogs')
    })
  })

  describe('getDailyUserStats', () => {
    it('应返回每日用户注册统计', async () => {
      const stats = await getDailyUserStats(db, 30)
      expect(Array.isArray(stats)).toBe(true)
    })
  })

  describe('getUsageStats', () => {
    it('应返回功能使用统计', async () => {
      const stats = await getUsageStats(db)
      expect(Array.isArray(stats)).toBe(true)
    })
  })
})

// ==================== 测试：admin API handlers ====================
describe('admin API handlers', () => {
  let kv: KVNamespace
  let db: MockD1

  beforeEach(() => {
    kv = createMockKV()
    db = new MockD1()
  })

  async function setupAdminToken() {
    await saveToken(kv, 'admin-token', {
      userId: 'admin-1',
      username: 'admin',
      email: 'admin@test.com',
      role: 'admin',
      createdAt: new Date().toISOString(),
    })
  }

  async function setupUserToken() {
    await saveToken(kv, 'user-token', {
      userId: 'user-1',
      username: 'user',
      email: 'user@test.com',
      role: 'user',
      createdAt: new Date().toISOString(),
    })
  }

  describe('GET /api/admin/stats', () => {
    it('admin 应能获取统计数据', async () => {
      await setupAdminToken()
      const context = createMockContext(kv, db, 'admin-token')
      const response = await statsHandler(context as never)
      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body.success).toBe(true)
      expect(body.data).toHaveProperty('totalUsers')
    })

    it('普通用户应被拒绝访问', async () => {
      await setupUserToken()
      const context = createMockContext(kv, db, 'user-token')
      const response = await statsHandler(context as never)
      expect(response.status).toBe(403)
    })
  })

  describe('GET /api/admin/users', () => {
    it('admin 应能获取用户列表', async () => {
      await setupAdminToken()
      const context = createMockContext(kv, db, 'admin-token')
      const response = await apiGetUserList(context as never)
      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body.success).toBe(true)
      expect(body.data).toHaveProperty('users')
      expect(body.data).toHaveProperty('total')
    })

    it('普通用户应被拒绝访问', async () => {
      await setupUserToken()
      const context = createMockContext(kv, db, 'user-token')
      const response = await apiGetUserList(context as never)
      expect(response.status).toBe(403)
    })
  })

  describe('PATCH /api/admin/users/:id', () => {
    it('admin 应能更新用户角色', async () => {
      await setupAdminToken()
      db.getTable('users').set('user-1', {
        id: 'user-1',
        username: 'alice',
        email: 'alice@example.com',
        password_hash: 'hash1',
        avatar: null,
        role: 'user',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      })

      const request = new Request('http://localhost/api/admin/users/user-1', {
        method: 'PATCH',
        headers: { Authorization: 'Bearer admin-token', 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'admin' }),
      })

      const context = {
        request,
        env: { DB: db, AUTH_TOKENS: kv },
        params: { id: 'user-1' },
      }
      const response = await apiUpdateUserRole(context as never)
      expect(response.status).toBe(200)
    })

    it('缺少用户 ID 应返回 400', async () => {
      await setupAdminToken()
      const request = new Request('http://localhost/api/admin/users/', {
        method: 'PATCH',
        headers: { Authorization: 'Bearer admin-token', 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'admin' }),
      })
      const context = {
        request,
        env: { DB: db, AUTH_TOKENS: kv },
        params: {},
      }
      const response = await apiUpdateUserRole(context as never)
      expect(response.status).toBe(400)
    })

    it('普通用户应被拒绝访问', async () => {
      await setupUserToken()
      const request = new Request('http://localhost/api/admin/users/user-1', {
        method: 'PATCH',
        headers: { Authorization: 'Bearer user-token', 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'admin' }),
      })
      const context = {
        request,
        env: { DB: db, AUTH_TOKENS: kv },
        params: { id: 'user-1' },
      }
      const response = await apiUpdateUserRole(context as never)
      expect(response.status).toBe(403)
    })
  })

  describe('DELETE /api/admin/users/:id', () => {
    it('admin 应能删除用户', async () => {
      await setupAdminToken()
      db.getTable('users').set('user-1', {
        id: 'user-1',
        username: 'alice',
        email: 'alice@example.com',
        password_hash: 'hash1',
        avatar: null,
        role: 'user',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      })

      const request = new Request('http://localhost/api/admin/users/user-1', {
        method: 'DELETE',
        headers: { Authorization: 'Bearer admin-token' },
      })
      const context = {
        request,
        env: { DB: db, AUTH_TOKENS: kv },
        params: { id: 'user-1' },
      }
      const response = await apiDeleteUserById(context as never)
      expect(response.status).toBe(200)
    })
  })

  describe('GET /api/admin/logs', () => {
    it('admin 应能获取日志', async () => {
      await setupAdminToken()
      const context = createMockContext(kv, db, 'admin-token')
      const response = await logsHandler(context as never)
      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body.success).toBe(true)
    })

    it('普通用户应被拒绝访问', async () => {
      await setupUserToken()
      const context = createMockContext(kv, db, 'user-token')
      const response = await logsHandler(context as never)
      expect(response.status).toBe(403)
    })
  })

  describe('GET /api/admin/config', () => {
    it('admin 应能获取配置', async () => {
      await setupAdminToken()
      const context = createMockContext(kv, db, 'admin-token')
      const response = await configGetHandler(context as never)
      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body.success).toBe(true)
    })
  })

  describe('PUT /api/admin/config', () => {
    it('admin 应能更新配置', async () => {
      await setupAdminToken()
      const request = new Request('http://localhost/api/admin/config', {
        method: 'PUT',
        headers: { Authorization: 'Bearer admin-token', 'Content-Type': 'application/json' },
        body: JSON.stringify({ site_name: 'New Health Project' }),
      })
      const context = {
        request,
        env: { DB: db, AUTH_TOKENS: kv },
        params: {},
      }
      const response = await configPutHandler(context as never)
      expect(response.status).toBe(200)
    })
  })
})
