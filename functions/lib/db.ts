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
  created_at: string
  updated_at: string
}

/**
 * 通过用户名查找用户
 */
export async function findUserByUsername(db: D1Database, username: string): Promise<DbUser | null> {
  const stmt = db.prepare('SELECT id, username, email, password_hash, avatar, created_at, updated_at FROM users WHERE username = ? COLLATE NOCASE')
  const result = await stmt.bind(username).first<DbUser>()
  return result ?? null
}

/**
 * 通过邮箱查找用户
 */
export async function findUserByEmail(db: D1Database, email: string): Promise<DbUser | null> {
  const stmt = db.prepare('SELECT id, username, email, password_hash, avatar, created_at, updated_at FROM users WHERE email = ? COLLATE NOCASE')
  const result = await stmt.bind(email).first<DbUser>()
  return result ?? null
}

/**
 * 通过 ID 查找用户
 */
export async function findUserById(db: D1Database, id: string): Promise<DbUser | null> {
  const stmt = db.prepare('SELECT id, username, email, password_hash, avatar, created_at, updated_at FROM users WHERE id = ?')
  const result = await stmt.bind(id).first<DbUser>()
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
    'INSERT INTO users (id, username, email, password_hash, avatar, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
  )
  await stmt.bind(
    user.id,
    user.username,
    user.email,
    user.password_hash,
    user.avatar ?? null,
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
 */
export async function updateUser(
  db: D1Database,
  id: string,
  updates: { username?: string; email?: string; avatar?: string }
): Promise<void> {
  const fields: string[] = []
  const values: (string | null)[] = []

  if (updates.username !== undefined) {
    fields.push('username = ?')
    values.push(updates.username)
  }
  if (updates.email !== undefined) {
    fields.push('email = ?')
    values.push(updates.email)
  }
  if (updates.avatar !== undefined) {
    fields.push('avatar = ?')
    values.push(updates.avatar)
  }

  if (fields.length === 0) return

  fields.push('updated_at = ?')
  values.push(new Date().toISOString())
  values.push(id)

  const stmt = db.prepare(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`)
  await stmt.bind(...values).run()
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
