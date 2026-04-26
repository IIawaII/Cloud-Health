/**
 * D1 Database helper for user operations
 * Provides typed wrappers around D1 SQL queries
 */

export interface DbUser {
  id: string
  username: string
  email: string
  password_hash: string
  avatar: string | null
  role: string
  data_key: string | null
  created_at: string
  updated_at: string
}

/** 不含敏感字段的用户信息 */
export type DbUserPublic = Omit<DbUser, 'password_hash' | 'data_key'>

export interface UsageLog {
  id: string
  user_id: string | null
  action: string
  metadata: string | null
  created_at: string
}

export interface SystemConfig {
  key: string
  value: string
  updated_at: string
}

export interface AuditLog {
  id: string
  admin_id: string
  action: string
  target_type: string | null
  target_id: string | null
  details: string | null
  created_at: string
}

export type VerificationCodePurpose = 'register' | 'update_email'

export interface VerificationCodeRecord {
  purpose: VerificationCodePurpose
  email: string
  code: string
  createdAt: string
  expiresAt: string
}

/**
 * 通过用户名查找用户
 */
export async function findUserByUsername(db: D1Database, username: string): Promise<DbUser | null> {
  const stmt = db.prepare('SELECT id, username, email, password_hash, avatar, role, data_key, created_at, updated_at FROM users WHERE username = ? COLLATE NOCASE')
  const result = await stmt.bind(username).first<DbUser>()
  return result ?? null
}

/**
 * 通过邮箱查找用户
 */
export async function findUserByEmail(db: D1Database, email: string): Promise<DbUser | null> {
  const stmt = db.prepare('SELECT id, username, email, password_hash, avatar, role, data_key, created_at, updated_at FROM users WHERE email = ? COLLATE NOCASE')
  const result = await stmt.bind(email).first<DbUser>()
  return result ?? null
}

/**
 * 通过 ID 查找用户（含密码哈希，仅用于认证相关场景）
 */
export async function findUserById(db: D1Database, id: string): Promise<DbUser | null> {
  const stmt = db.prepare('SELECT id, username, email, password_hash, avatar, role, data_key, created_at, updated_at FROM users WHERE id = ?')
  const result = await stmt.bind(id).first<DbUser>()
  return result ?? null
}

/**
 * 通过 ID 查找用户（不含密码哈希，用于普通查询场景）
 */
export async function findUserByIdPublic(db: D1Database, id: string): Promise<DbUserPublic | null> {
  const stmt = db.prepare('SELECT id, username, email, avatar, role, created_at, updated_at FROM users WHERE id = ?')
  const result = await stmt.bind(id).first<DbUserPublic>()
  return result ?? null
}

/**
 * 创建新用户
 */
export async function createUser(
  db: D1Database,
  user: Omit<DbUser, 'avatar'> & { avatar?: string | null }
): Promise<void> {
  const stmt = db.prepare(
    'INSERT INTO users (id, username, email, password_hash, avatar, data_key, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  )
  await stmt.bind(
    user.id,
    user.username,
    user.email,
    user.password_hash,
    user.avatar ?? null,
    user.data_key ?? null,
    user.created_at,
    user.updated_at
  ).run()
}

/**
 * 更新用户密码
 */
export async function updateUserPassword(db: D1Database, id: string, passwordHash: string): Promise<void> {
  const stmt = db.prepare('UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?')
  await stmt.bind(passwordHash, new Date().toISOString(), id).run()
}

/**
 * 更新用户信息（用户名、邮箱、头像）
 *
 * 安全说明：setClause 由内部字段白名单映射构建，用户输入仅通过参数化绑定传入，
 * 不会直接进入 SQL 语句。
 */
export async function updateUser(
  db: D1Database,
  id: string,
  updates: { username?: string; email?: string; avatar?: string }
): Promise<void> {
  const fieldMap: { column: string; value: string | null }[] = []

  if (updates.username !== undefined) {
    fieldMap.push({ column: 'username', value: updates.username })
  }
  if (updates.email !== undefined) {
    fieldMap.push({ column: 'email', value: updates.email })
  }
  if (updates.avatar !== undefined) {
    fieldMap.push({ column: 'avatar', value: updates.avatar })
  }

  if (fieldMap.length === 0) return

  const setClause = fieldMap.map((f) => `${f.column} = ?`).join(', ')
  const values = [...fieldMap.map((f) => f.value), new Date().toISOString(), id]

  const stmt = db.prepare(`UPDATE users SET ${setClause}, updated_at = ? WHERE id = ?`)
  await stmt.bind(...values).run()
}

/**
 * 创建使用日志
 */
export async function createUsageLog(
  db: D1Database,
  log: Omit<UsageLog, 'created_at'>
): Promise<void> {
  const stmt = db.prepare(
    'INSERT INTO usage_logs (id, user_id, action, metadata, created_at) VALUES (?, ?, ?, ?, ?)'
  )
  await stmt.bind(log.id, log.user_id ?? null, log.action, log.metadata ?? null, new Date().toISOString()).run()
}

/**
 * 获取使用日志列表（支持分页）
 * 使用 D1 batch 原子执行 COUNT 与 SELECT，避免并发下总数与列表不一致
 */
export async function getUsageLogs(
  db: D1Database,
  options: { limit?: number; offset?: number; action?: string; startDate?: string; endDate?: string } = {}
): Promise<{ logs: UsageLog[]; total: number }> {
  const conditions: string[] = []
  const values: (string | number)[] = []

  if (options.action) {
    conditions.push('action = ?')
    values.push(options.action)
  }
  if (options.startDate) {
    conditions.push('created_at >= ?')
    values.push(options.startDate)
  }
  if (options.endDate) {
    conditions.push('created_at <= ?')
    values.push(options.endDate)
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

  const limit = options.limit ?? 20
  const offset = options.offset ?? 0

  const [countResult, logsResult] = await db.batch([
    db.prepare(`SELECT COUNT(*) as total FROM usage_logs ${whereClause}`).bind(...values),
    db.prepare(
      `SELECT l.id, l.user_id, u.username, l.action, l.metadata, l.created_at FROM usage_logs l LEFT JOIN users u ON l.user_id = u.id ${whereClause} ORDER BY l.created_at DESC LIMIT ? OFFSET ?`
    ).bind(...values, limit, offset),
  ])

  return {
    logs: (logsResult as D1Result<UsageLog & { username: string | null }>).results ?? [],
    total: (countResult as D1Result<{ total: number }>).results?.[0]?.total ?? 0,
  }
}

/**
 * 获取使用统计（按 action 分组）
 */
export async function getUsageStats(db: D1Database, startDate?: string, endDate?: string): Promise<{ action: string; count: number }[]> {
  const conditions: string[] = []
  const values: string[] = []

  if (startDate) {
    conditions.push('created_at >= ?')
    values.push(startDate)
  }
  if (endDate) {
    conditions.push('created_at <= ?')
    values.push(endDate)
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
  const stmt = db.prepare(`SELECT action, COUNT(*) as count FROM usage_logs ${whereClause} GROUP BY action ORDER BY count DESC`)
  const result = await stmt.bind(...values).all<{ action: string; count: number }>()
  return result.results ?? []
}

/**
 * 获取每日用户注册统计
 */
export async function getDailyUserStats(db: D1Database, days: number = 30): Promise<{ date: string; count: number }[]> {
  const stmt = db.prepare(
    `SELECT DATE(created_at) as date, COUNT(*) as count FROM users WHERE created_at >= date('now', ?) GROUP BY DATE(created_at) ORDER BY date ASC`
  )
  const result = await stmt.bind(`-${days} days`).all<{ date: string; count: number }>()
  return result.results ?? []
}

/**
 * 获取系统配置
 */
export async function getSystemConfig(db: D1Database, key: string): Promise<SystemConfig | null> {
  const stmt = db.prepare('SELECT key, value, updated_at FROM system_configs WHERE key = ?')
  const result = await stmt.bind(key).first<SystemConfig>()
  return result ?? null
}

/**
 * 获取所有系统配置
 */
export async function getAllSystemConfigs(db: D1Database): Promise<SystemConfig[]> {
  const stmt = db.prepare('SELECT key, value, updated_at FROM system_configs ORDER BY key ASC')
  const result = await stmt.all<SystemConfig>()
  return result.results ?? []
}

/**
 * 设置系统配置
 */
export async function setSystemConfig(db: D1Database, key: string, value: string): Promise<void> {
  const stmt = db.prepare(
    `INSERT INTO system_configs (key, value, updated_at) VALUES (?, ?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`
  )
  await stmt.bind(key, value, new Date().toISOString()).run()
}

/**
 * 获取用户当日使用次数
 */
export async function getUserDailyUsageCount(
  db: D1Database,
  userId: string,
  action?: string
): Promise<number> {
  let sql = "SELECT COUNT(*) as count FROM usage_logs WHERE user_id = ? AND DATE(created_at) = DATE('now')"
  const params: (string | number)[] = [userId]
  if (action) {
    sql += ' AND action = ?'
    params.push(action)
  }
  const stmt = db.prepare(sql)
  const result = await stmt.bind(...params).first<{ count: number }>()
  return result?.count ?? 0
}

/**
 * 创建审计日志
 */
export async function createAuditLog(
  db: D1Database,
  log: Omit<AuditLog, 'created_at'>
): Promise<void> {
  const stmt = db.prepare(
    'INSERT INTO audit_logs (id, admin_id, action, target_type, target_id, details, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
  )
  await stmt.bind(
    log.id, log.admin_id, log.action,
    log.target_type ?? null, log.target_id ?? null, log.details ?? null,
    new Date().toISOString()
  ).run()
}

/**
 * 获取审计日志列表
 * 使用 D1 batch 原子执行 COUNT 与 SELECT
 */
export async function getAuditLogs(
  db: D1Database,
  options: { limit?: number; offset?: number } = {}
): Promise<{ logs: AuditLog[]; total: number }> {
  const limit = options.limit ?? 20
  const offset = options.offset ?? 0

  const [countResult, logsResult] = await db.batch([
    db.prepare('SELECT COUNT(*) as total FROM audit_logs'),
    db.prepare(
      'SELECT id, admin_id, action, target_type, target_id, details, created_at FROM audit_logs ORDER BY created_at DESC LIMIT ? OFFSET ?'
    ).bind(limit, offset),
  ])

  return {
    logs: (logsResult as D1Result<AuditLog>).results ?? [],
    total: (countResult as D1Result<{ total: number }>).results?.[0]?.total ?? 0,
  }
}

/**
 * 获取用户列表（支持分页和搜索）
 * 使用 D1 batch 原子执行 COUNT 与 SELECT，避免并发下总数与列表不一致
 */
export async function getUserList(
  db: D1Database,
  options: { limit?: number; offset?: number; search?: string } = {}
): Promise<{ users: DbUserPublic[]; total: number }> {
  const conditions: string[] = []
  const values: (string | number)[] = []

  if (options.search) {
    // 限制搜索长度，避免超长输入导致 SQL 语句过大
    const searchTerm = options.search.slice(0, 100)
    // 转义 LIKE 特殊字符 % 和 _，防止意外匹配
    const escaped = searchTerm.replace(/[%_]/g, '\\$&')
    conditions.push(`(username LIKE ? ESCAPE '\\' OR email LIKE ? ESCAPE '\\')`)
    values.push(`%${escaped}%`, `%${escaped}%`)
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

  const limit = options.limit ?? 20
  const offset = options.offset ?? 0

  const [countResult, usersResult] = await db.batch([
    db.prepare(`SELECT COUNT(*) as total FROM users ${whereClause}`).bind(...values),
    db.prepare(
      `SELECT id, username, email, avatar, role, created_at, updated_at FROM users ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`
    ).bind(...values, limit, offset),
  ])

  return {
    users: (usersResult as D1Result<DbUserPublic>).results ?? [],
    total: (countResult as D1Result<{ total: number }>).results?.[0]?.total ?? 0,
  }
}

/**
 * 更新用户数据密钥（data_key）
 */
export async function updateUserDataKey(db: D1Database, id: string, dataKey: string): Promise<void> {
  const stmt = db.prepare('UPDATE users SET data_key = ?, updated_at = ? WHERE id = ?')
  await stmt.bind(dataKey, new Date().toISOString(), id).run()
}

/**
 * 更新用户角色和状态
 */
export async function updateUserRole(db: D1Database, id: string, role: string): Promise<void> {
  const stmt = db.prepare('UPDATE users SET role = ?, updated_at = ? WHERE id = ?')
  await stmt.bind(role, new Date().toISOString(), id).run()
}

/**
 * 删除用户
 */
export async function deleteUserById(db: D1Database, id: string): Promise<void> {
  const stmt = db.prepare('DELETE FROM users WHERE id = ?')
  await stmt.bind(id).run()
}

/**
 * 获取统计数字
 */
export async function getStats(db: D1Database): Promise<{
  totalUsers: number
  todayNewUsers: number
  totalLogs: number
  todayLogs: number
}> {
  const totalUsersStmt = db.prepare('SELECT COUNT(*) as count FROM users')
  const totalUsersResult = await totalUsersStmt.first<{ count: number }>()

  const todayNewUsersStmt = db.prepare("SELECT COUNT(*) as count FROM users WHERE DATE(created_at) = DATE('now')")
  const todayNewUsersResult = await todayNewUsersStmt.first<{ count: number }>()

  const totalLogsStmt = db.prepare('SELECT COUNT(*) as count FROM usage_logs')
  const totalLogsResult = await totalLogsStmt.first<{ count: number }>()

  const todayLogsStmt = db.prepare("SELECT COUNT(*) as count FROM usage_logs WHERE DATE(created_at) = DATE('now')")
  const todayLogsResult = await todayLogsStmt.first<{ count: number }>()

  return {
    totalUsers: totalUsersResult?.count ?? 0,
    todayNewUsers: todayNewUsersResult?.count ?? 0,
    totalLogs: totalLogsResult?.count ?? 0,
    todayLogs: todayLogsResult?.count ?? 0,
  }
}

/**
 * 检查用户名是否已存在
 */
export async function usernameExists(db: D1Database, username: string, excludeId?: string): Promise<boolean> {
  if (excludeId) {
    const stmt = db.prepare('SELECT 1 as found FROM users WHERE username = ? COLLATE NOCASE AND id != ?')
    const result = await stmt.bind(username, excludeId).first<{ found: number }>()
    return !!result
  }
  const stmt = db.prepare('SELECT 1 as found FROM users WHERE username = ? COLLATE NOCASE')
  const result = await stmt.bind(username).first<{ found: number }>()
  return !!result
}

/**
 * 检查邮箱是否已存在
 */
export async function emailExists(db: D1Database, email: string, excludeId?: string): Promise<boolean> {
  if (excludeId) {
    const stmt = db.prepare('SELECT 1 as found FROM users WHERE email = ? COLLATE NOCASE AND id != ?')
    const result = await stmt.bind(email, excludeId).first<{ found: number }>()
    return !!result
  }
  const stmt = db.prepare('SELECT 1 as found FROM users WHERE email = ? COLLATE NOCASE')
  const result = await stmt.bind(email).first<{ found: number }>()
  return !!result
}

/**
 * 保存或覆盖验证码
 */
export async function upsertVerificationCode(db: D1Database, record: VerificationCodeRecord): Promise<void> {
  const stmt = db.prepare(
    `INSERT INTO verification_codes (purpose, email, code, created_at, expires_at)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(purpose, email) DO UPDATE SET
       code = excluded.code,
       created_at = excluded.created_at,
       expires_at = excluded.expires_at`
  )

  await stmt.bind(record.purpose, record.email, record.code, record.createdAt, record.expiresAt).run()
}

/**
 * 删除指定验证码
 */
export async function deleteVerificationCode(
  db: D1Database,
  purpose: VerificationCodePurpose,
  email: string
): Promise<void> {
  const stmt = db.prepare('DELETE FROM verification_codes WHERE purpose = ? AND email = ?')
  await stmt.bind(purpose, email).run()
}

/**
 * 检查验证码发送冷却时间（从 D1 查询，替代 KV 实现）
 */
export async function checkVerificationCooldown(
  db: D1Database,
  purpose: VerificationCodePurpose,
  email: string,
  cooldownSeconds: number
): Promise<{ allowed: boolean; remainingSeconds: number }> {
  const stmt = db.prepare('SELECT sent_at FROM verification_code_cooldowns WHERE purpose = ? AND email = ?')
  const record = await stmt.bind(purpose, email).first<{ sent_at: string }>()

  if (!record) {
    return { allowed: true, remainingSeconds: 0 }
  }

  const sentAt = new Date(record.sent_at).getTime()
  const now = Date.now()
  const elapsedSeconds = Math.floor((now - sentAt) / 1000)

  if (elapsedSeconds >= cooldownSeconds) {
    return { allowed: true, remainingSeconds: 0 }
  }

  return { allowed: false, remainingSeconds: cooldownSeconds - elapsedSeconds }
}

/**
 * 设置验证码发送冷却时间（写入 D1，替代 KV 实现）
 */
export async function setVerificationCooldown(
  db: D1Database,
  purpose: VerificationCodePurpose,
  email: string
): Promise<void> {
  const stmt = db.prepare(
    `INSERT INTO verification_code_cooldowns (purpose, email, sent_at)
     VALUES (?, ?, ?)
     ON CONFLICT(purpose, email) DO UPDATE SET
       sent_at = excluded.sent_at`
  )
  await stmt.bind(purpose, email, new Date().toISOString()).run()
}

/**
 * 删除验证码发送冷却记录
 */
export async function deleteVerificationCooldown(
  db: D1Database,
  purpose: VerificationCodePurpose,
  email: string
): Promise<void> {
  const stmt = db.prepare('DELETE FROM verification_code_cooldowns WHERE purpose = ? AND email = ?')
  await stmt.bind(purpose, email).run()
}

/**
 * 原子消费验证码，成功时直接删除，避免并发重复使用
 */
export async function consumeVerificationCode(
  db: D1Database,
  purpose: VerificationCodePurpose,
  email: string,
  code: string,
  now: string = new Date().toISOString()
): Promise<'consumed' | 'not_found' | 'expired' | 'invalid'> {
  const deleteStmt = db.prepare(
    'DELETE FROM verification_codes WHERE purpose = ? AND email = ? AND code = ? AND expires_at > ?'
  )
  const deleteResult = await deleteStmt.bind(purpose, email, code, now).run()

  if (deleteResult.meta.changes > 0) {
    return 'consumed'
  }

  const lookupStmt = db.prepare('SELECT code, expires_at FROM verification_codes WHERE purpose = ? AND email = ?')
  const record = await lookupStmt.bind(purpose, email).first<{ code: string; expires_at: string }>()

  if (!record) {
    return 'not_found'
  }

  if (record.expires_at <= now) {
    await deleteVerificationCode(db, purpose, email)
    return 'expired'
  }

  // 执行到此处说明记录存在且未过期，但 DELETE 未成功，唯一原因是 code 不匹配
  return 'invalid'
}
