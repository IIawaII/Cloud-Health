/**
 * Drizzle Kit 配置文件
 * 用于生成和管理 D1 数据库迁移
 *
 * 使用方式:
 *   npx drizzle-kit generate   - 生成迁移 SQL
 *   npx drizzle-kit push       - 直接推送 schema 到 D1
 *   npx drizzle-kit studio     - 启动 Drizzle Studio 管理界面
 */

import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  dialect: 'sqlite',
  schema: '../server/db/schema.ts',
  out: '../drizzle',
  driver: 'd1-http',
  dbCredentials: {
    accountId: process.env.CLOUDFLARE_ACCOUNT_ID!,
    databaseId: process.env.CLOUDFLARE_DATABASE_ID!,
    token: process.env.CLOUDFLARE_API_TOKEN!,
  },
})
