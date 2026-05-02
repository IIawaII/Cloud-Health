<div align="center">

<img src="./public/logo.svg" alt="Cloud Health"/>

# 基于 Cloudflare Workers 的智能健康管理平台

[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](LICENSE)
[![Node.js >=22](https://img.shields.io/badge/Node.js-%3E%3D22-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-F38020?logo=cloudflare&logoColor=white)](https://workers.cloudflare.com/)
[![React 18](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Hono](https://img.shields.io/badge/Hono-4.x-E36002)](https://hono.dev/)
[![Vite](https://img.shields.io/badge/Vite-5.x-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)

[中文文档](README.md) · [English](README_EN.md)

> ⚠️ 本项目基于 AI 技术提供健康分析参考，**不能替代专业医生的诊断和治疗建议**。如有健康问题，请及时就医。

</div>

---

## <a id="demo"></a>📸 演示

<img src="./picture/Screenshot_ZH.png" alt="Screenshot"/>

---

## <a id="table-of-contents"></a>📑 目录

- [🎯 项目简介](#project-intro)
- [✨ 功能特性](#features)
- [🛠️ 技术栈](#tech-stack)
- [🏗️ 项目架构](#project-structure)
- [🚀 快速开始](#quick-start)
- [📦 部署](#deployment)
- [⚙️ 环境变量](#environment-variables)
- [📡 API 文档](#api-docs)
- [🧪 测试](#testing)
- [🔧 开发命令](#dev-commands)
- [💾 数据库备份与恢复](#database-backup)
- [🔔 安全说明](#security)

---

## <a id="project-intro"></a>🎯 项目简介

Cloud Health 是一个部署在 Cloudflare Workers 边缘网络上的智能健康管理平台。无需自建服务器，利用 Cloudflare 的全球边缘节点实现低延迟访问，结合 AI 大模型为用户提供健康报告解读、个性化健康计划、智能问答等服务。

**核心优势**：
- 🚀 边缘部署，全球低延迟
- 💰 Cloudflare 免费计划即可运行，零服务器成本
- 🔒 安全优先，从认证到数据全链路加密
- 🧩 前后端共享 Schema，类型安全贯穿全栈

---

## <a id="features"></a>✨ 功能特性

### 🧑‍⚕️ 智能 AI 健康服务

| 功能 | 描述 |
|------|------|
| 🏥 **健康报告分析** | 上传体检报告、化验单或健康检测图像，AI 智能分析各项指标并给出专业解读 |
| 📋 **个性化健康计划** | 填写个人健康信息，AI 量身定制饮食、运动和作息管理方案 |
| 💬 **智能健康对话** | 与健康 AI 顾问实时多轮对话，获取专业健康指导，支持流式响应 |
| 🧠 **健康知识问答** | AI 智能出题，支持多类别与难度选择，即时判分解析 |

### 🔐 用户与安全

| 功能 | 描述 |
|------|------|
| 🔑 **完整认证体系** | 注册 / 登录 / 邮箱验证码 / Token 自动续期 / 修改密码 / 更新资料 |
| 🛡️ **人机验证** | 集成 Cloudflare Turnstile，防止恶意注册和登录 |
| 🔒 **安全防护** | CSRF 防护 · CSP 安全头 · SSRF URL 校验 · SQL 注入防护 · 分布式速率限制 |
| 🌐 **CORS 跨域控制** | 可配置允许的跨域来源（`ALLOWED_ORIGINS`） |
| 🔐 **数据加密** | 用户 AI 配置 AES-GCM 加密存储，密钥仅存于浏览器 sessionStorage |

### 👨‍💼 管理后台

| 功能 | 描述 |
|------|------|
| 📊 **数据看板** | 用户统计、使用趋势、系统概览 |
| 👥 **用户管理** | 查看 / 编辑 / 删除用户，角色管理 |
| ⚙️ **系统配置** | 维护模式开关、注册开关、运行时配置热更新 |
| 📝 **审计日志** | 管理员操作记录追踪 |
| 📈 **性能监控** | API 请求延迟、状态码分布、错误追踪 |
| 💾 **备份管理** | 备份任务创建、调度与记录管理 |

### 🎨 用户体验

| 功能 | 描述 |
|------|------|
| 🌓 **深色模式** | 支持亮色 / 暗色 / 跟随系统三种主题 |
| 🌍 **国际化 (i18n)** | 支持中文 (zh-CN) 和英文 (en-US)，自动检测语言 |
| 💾 **数据持久化** | 聊天记录、分析结果自动保存到浏览器本地，刷新不丢失 |
| 📱 **响应式设计** | 适配桌面端和移动端 |
| 🔧 **AI 自定义配置** | 支持用户自定义 AI API，配置加密存储于服务端，密钥仅存浏览器 |

---

## <a id="tech-stack"></a>🛠️ 技术栈

| 层级 | 技术 |
|------|------|
| **前端框架** | [React 18](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) |
| **构建工具** | [Vite 5](https://vitejs.dev/) |
| **样式方案** | [Tailwind CSS](https://tailwindcss.com/) + [tailwind-merge](https://github.com/dcastil/tailwind-merge) + [CVA](https://cva.style/) |
| **路由** | [React Router DOM 7](https://reactrouter.com/) |
| **状态管理** | React Context + Hooks |
| **国际化** | [i18next](https://www.i18next.com/) + [react-i18next](https://react.i18next.com/) |
| **后端框架** | [Hono 4](https://hono.dev/) (Cloudflare Workers) |
| **数据库** | [Cloudflare D1](https://developers.cloudflare.com/d1/) ([Drizzle ORM](https://orm.drizzle.team/)) |
| **缓存** | [Cloudflare KV](https://developers.cloudflare.com/kv/) |
| **速率限制** | [Upstash Redis](https://upstash.com/)（分布式） |
| **邮件队列** | [Cloudflare Queues](https://developers.cloudflare.com/queues/) |
| **人机验证** | [Cloudflare Turnstile](https://developers.cloudflare.com/turnstile/) |
| **AI 接口** | [OpenAI API](https://platform.openai.com/docs/api-reference) / 兼容 OpenAI 格式的大模型 API |
| **API 文档** | [Hono Zod OpenAPI](https://github.com/honojs/middleware/tree/main/packages/zod-openapi) + [Swagger UI](https://swagger.io/tools/swagger-ui/) |
| **数据校验** | [Zod](https://zod.dev/)（前后端共享 Schema） |
| **测试** | [Vitest](https://vitest.dev/)（单元/集成） + [Playwright](https://playwright.dev/)（E2E） |
| **代码规范** | [ESLint](https://eslint.org/) + [TypeScript ESLint](https://typescript-eslint.io/) |
| **CI/CD** | [GitHub Actions](https://docs.github.com/en/actions) |
| **部署** | [Cloudflare Workers](https://workers.cloudflare.com/) + [Workers Static Assets](https://developers.cloudflare.com/workers/static-assets/) |

---

## <a id="project-structure"></a>🏗️ 项目架构

<details>
<summary>📁 点击展开完整目录结构</summary>

```
cloud-health/
├── public/                          # 静态资源
│   ├── User/                        # 用户头像 SVG (1-51)
│   ├── Doctor.svg                   # AI 头像
│   ├── logo.svg                     # 站点图标
│   ├── icon.svg / icon-dark.svg     # PWA 图标（亮/暗色）
│   ├── avatar-sprite.svg            # 头像精灵图（构建生成）
│   ├── manifest.webmanifest         # PWA 清单
│   └── _headers                     # Cloudflare 静态资源安全头
├── server/                          # 后端 (Hono on Cloudflare Workers)
│   ├── api/                         # API 路由处理器
│   │   ├── auth/                    # 认证 (注册/登录/登出/验证/改密/资料/验证码/刷新/AI配置)
│   │   ├── ai/                      # AI 功能 (对话/分析/计划/问答/URL校验)
│   │   ├── admin/                   # 管理后台 (统计/用户/日志/审计/配置/指标/备份)
│   │   └── config/                  # 公共配置
│   ├── dao/                         # 数据访问层 (user/audit/config/log/metrics/verification/ai-config/backup)
│   ├── db/                          # Drizzle ORM Schema & 数据库连接
│   ├── middleware/                   # 中间件 (安全头/CORS/CSRF/缓存/监控/管理员鉴权/SPA)
│   ├── queues/                      # Cloudflare Queues (邮件发送)
│   ├── types/                       # 服务端类型声明 (swagger-ui 等)
│   ├── utils/                       # 工具函数 (adminInit/auth/cacheManager/configDefaults/cookie/crypto/
│   │                                #   env/errors/handler/llm/logger/maintenanceCache/prompts/
│   │                                #   rateLimit/response/smtp/turnstile/upstash)
│   ├── app.ts                       # Hono 应用 & 路由注册
│   └── openapi.ts                   # OpenAPI 3.0 规范定义
├── shared/                          # 前后端共享代码
│   ├── schemas.ts                   # Zod 校验 Schema (注册/登录/改密等)
│   ├── types.ts                     # 共享类型定义 (ChatMessage/QuizQuestion/QuizResult/ApiConfig)
│   └── i18n/                        # 共享国际化资源 (zh-CN / en-US + 服务端 i18n 入口)
├── src/                             # 前端 (React + Vite)
│   ├── pages/                       # 页面组件
│   │   ├── landing/                 # 落地页
│   │   ├── home/                    # 首页
│   │   ├── report/                  # 健康报告分析
│   │   ├── plan/                    # 健康计划生成
│   │   ├── chat/                    # 智能对话
│   │   ├── quiz/                    # 健康问答
│   │   ├── auth/                    # 登录 / 注册 / 注册关闭页
│   │   ├── settings/                # 账号设置
│   │   ├── admin/                   # 管理后台 (看板/用户/数据/配置/指标/备份)
│   │   └── maintenance/             # 维护模式页面
│   ├── components/                  # 组件
│   │   ├── auth/                    # 路由守卫 (ProtectedRoute / AdminProtectedRoute)
│   │   ├── chat/                    # 对话界面 (ChatInterface / MarkdownRenderer)
│   │   ├── common/                  # 通用组件 (Avatar/ConfirmDialog/FileUploader/LanguageSwitcher/
│   │   │                            #   LogoIcon/ResultCard/TurnstileWidget)
│   │   ├── features/               # 功能组件 (AnalysisResult/PlanForm/QuizPanel/ApiSettings/SettingsModal)
│   │   └── layout/                  # 布局 (Layout / AdminLayout / ErrorBoundary)
│   ├── contexts/                    # React Context (Auth / Result / Theme)
│   ├── hooks/                       # 自定义 Hooks (useAI/useAIBase/useAIStream/useAdmin/useAuthSync/
│   │                                #   useClientConfig/useLocalStorage/useResult/useTheme)
│   ├── config/                      # 前端配置 (AI / App / Theme)
│   ├── i18n/                        # 前端国际化
│   ├── types/                       # TypeScript 类型
│   ├── utils/                       # 工具函数 (anonymousId/api/avatar/css/date/file/html/
│   │                                #   storage/trimMessages/userCache)
│   ├── api/                         # API 客户端 (fetchWithTimeout + CSRF)
│   ├── App.tsx                      # 路由配置
│   └── main.tsx                     # 应用入口
├── migrations/                      # D1 数据库迁移 (8 个版本)
├── configs/                         # 配置文件 (Vite / ESLint / Tailwind / Vitest / Drizzle...)
├── scripts/                         # 构建脚本
│   ├── build-avatar-sprite.mjs      # 头像精灵图生成
│   ├── generate-spa-fallback.cjs    # SPA 回退 HTML 生成
│   ├── inject-wrangler-config.cjs   # Wrangler 配置注入 (CI 用)
│   └── hash-password.mjs           # 管理员密码 PBKDF2 哈希生成
├── tests/                           # 测试
│   ├── unit/                        # 单元测试 (hooks/utils/backup)
│   ├── integration/                 # 集成测试 (auth/admin/concurrency/crypto/db/llm/load/
│   │                                #   profile-aiconfig/rateLimit/response/turnstile)
│   └── e2e/                         # E2E 测试 (Playwright: basic/core-flows)
├── worker.ts                        # Cloudflare Workers 入口 (fetch/scheduled/queue)
├── wrangler.toml                    # Cloudflare Workers 生产配置
├── wrangler.dev.toml                # Cloudflare Workers 开发配置
├── .dev.vars.example                # 本地开发环境变量模板
└── .github/workflows/deploy.yml     # GitHub Actions 自动部署
```

</details>

---

## <a id="quick-start"></a>🚀 快速开始

### 前置要求

- [Node.js](https://nodejs.org/) >= 22.0.0
- [npm](https://www.npmjs.com/) (随 Node.js 安装)
- [Cloudflare 账号](https://dash.cloudflare.com/sign-up) (部署时需要)
- AI 大模型 API Key (OpenAI 或兼容接口)

### 本地开发

#### 1. 克隆项目

```bash
git clone https://github.com/IIawaII/cloud-health.git
cd cloud-health
```

#### 2. 安装依赖

```bash
npm install
```

#### 3. 配置环境变量

```bash
cp .dev.vars.example .dev.vars
```

编辑 `.dev.vars`，填入实际配置：

```bash
# Turnstile 人机验证（必填）
TURNSTILE_SITE_KEY=your-turnstile-site-key
TURNSTILE_SECRET_KEY=your-turnstile-secret-key

# Upstash Redis（必填，分布式速率限制）
UPSTASH_REST_URL=https://your-redis-instance.upstash.io
UPSTASH_REST_TOKEN=your-upstash-token

# SMTP 邮件服务（必填，发送验证码）
SMTP_HOST=smtp.your-smtp-host.com
SMTP_PORT=465
SMTP_USER=your-email@example.com
SMTP_PASS=your-smtp-password

# 管理员账户（必填，密码必须为 PBKDF2 哈希格式）
ADMIN_USERNAME=your-admin-username
ADMIN_PASSWORD=100000:salt:hash   # 使用 npm run password 生成

# AI 服务配置（可选，服务端兜底配置）
AI_API_KEY=your-ai-api-key
AI_BASE_URL=https://api.openai.com/v1
AI_MODEL=gpt-4o

# 允许的跨域来源（可选，默认为当前域名）
ALLOWED_ORIGINS=https://your-domain.com

# 路由配置（可选，本地开发不需要）
ROUTE_PATTERN=your-domain.com/*
ROUTE_ZONE_NAME=your-domain.com

# SMTP 超时时间（可选，默认 15000 毫秒）
SMTP_TIMEOUT_MS=15000

# 运行环境（可选，development | production）
ENVIRONMENT=development
```

> **安全提示**：`.dev.vars` 已加入 `.gitignore`，请勿将其提交到仓库。

#### 4. 生成管理员密码哈希

```bash
npm run password "你的强密码"
```

将输出的 `ADMIN_PASSWORD=...` 值填入 `.dev.vars`。

#### 5. 创建 Cloudflare 资源

```bash
# 创建 KV 命名空间
npx wrangler kv namespace create AUTH_TOKENS
npx wrangler kv namespace create VERIFICATION_CODES
npx wrangler kv namespace create SSRF_CACHE

# 创建 D1 数据库并执行迁移
npx wrangler d1 create cloud-health-db
npx wrangler d1 migrations apply cloud-health-db --local
```

将返回的 KV ID 和 D1 ID 填入 `wrangler.toml` 中的对应占位符。

#### 6. 启动开发服务器

```bash
npm run dev
```

访问 `http://localhost:8787` 即可使用。

---

## <a id="deployment"></a>📦 部署

### 方式一：GitHub Actions 自动部署（推荐）

项目已配置 GitHub Actions，push 到 `main` 分支时自动执行：Lint → 类型检查 → 迁移 → 密钥同步 → 部署。

#### 1. Fork 本项目

#### 2. 配置 GitHub Secrets

进入仓库 → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

| Secret 名称 | 说明 |
|---|---|
| `CLOUDFLARE_API_TOKEN` | Cloudflare API Token（Dashboard → My Profile → API Tokens，权限选 `Cloudflare Workers:Edit`） |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare 账户 ID |
| `D1_DATABASE_ID` | D1 数据库 ID |
| `KV_AUTH_TOKENS_ID` | KV 命名空间 `AUTH_TOKENS` 的 ID |
| `KV_VERIFICATION_CODES_ID` | KV 命名空间 `VERIFICATION_CODES` 的 ID |
| `KV_SSRF_CACHE_ID` | KV 命名空间 `SSRF_CACHE` 的 ID |
| `ROUTE_PATTERN` | Workers 路由匹配模式（如 `your-domain.com/*`） |
| `ROUTE_ZONE_NAME` | Cloudflare Zone 名称（如 `your-domain.com`） |
| `UPSTASH_REST_URL` | Upstash Redis REST URL |
| `UPSTASH_REST_TOKEN` | Upstash Redis REST Token |
| `TURNSTILE_SECRET_KEY` | Cloudflare Turnstile 服务端密钥 |
| `SMTP_USER` | SMTP 邮箱账号 |
| `SMTP_PASS` | SMTP 邮箱密码 |
| `ADMIN_USERNAME` | 管理员用户名 |
| `ADMIN_PASSWORD` | 管理员密码（PBKDF2 哈希格式，使用 `npm run password` 生成） |
| `ALLOWED_ORIGINS` | 允许的跨域来源（如 `https://your-domain.com`） |

#### 3. 配置 GitHub Variables

| Variable 名称 | 说明 |
|---|---|
| `TURNSTILE_SITE_KEY` | Cloudflare Turnstile 站点密钥 |
| `SMTP_HOST` | SMTP 服务器地址 |
| `SMTP_PORT` | SMTP 服务器端口 |
| `ENVIRONMENT` | 运行环境（`production` / `development`） |

> **获取 KV ID**：运行 `npx wrangler kv namespace list` 或在 Cloudflare Dashboard → Workers & Pages → KV 中查看。

### 方式二：手动部署

```bash
npm run build
npm run deploy
```

---

## <a id="environment-variables"></a>⚙️ 环境变量

### 变量 (Variables)

| 变量名 | 说明 | 必填 |
|--------|------|------|
| `TURNSTILE_SITE_KEY` | Cloudflare Turnstile 站点密钥 | ✅ |
| `SMTP_HOST` | SMTP 服务器地址 | ✅ |
| `SMTP_PORT` | SMTP 服务器端口 | ✅ |
| `ENVIRONMENT` | 运行环境（`production` / `development`） | ❌ |

### 密钥 (Secrets)

| 变量名 | 说明 | 必填 |
|--------|------|------|
| `TURNSTILE_SECRET_KEY` | Cloudflare Turnstile 服务端密钥 | ✅ |
| `UPSTASH_REST_URL` | Upstash Redis REST URL（分布式速率限制） | ✅ |
| `UPSTASH_REST_TOKEN` | Upstash Redis REST Token | ✅ |
| `SMTP_USER` | SMTP 邮箱账号 | ✅ |
| `SMTP_PASS` | SMTP 邮箱密码 | ✅ |
| `ADMIN_USERNAME` | 管理员用户名 | ✅ |
| `ADMIN_PASSWORD` | 管理员密码（PBKDF2 哈希格式） | ✅ |
| `ALLOWED_ORIGINS` | 允许的跨域来源 | ❌ |
| `AI_API_KEY` | AI 大模型 API 密钥（服务端兜底） | ❌ |
| `AI_BASE_URL` | AI 大模型 API 基础地址（服务端兜底） | ❌ |
| `AI_MODEL` | AI 模型名称，如 `gpt-4o`（服务端兜底） | ❌ |
| `SMTP_TIMEOUT_MS` | SMTP 超时时间（毫秒），默认 `15000` | ❌ |

> **管理员密码格式**：`ADMIN_PASSWORD` 必须为 PBKDF2 哈希格式（`iterations:salt:hash`），不能直接使用明文。使用 `npm run password "你的密码"` 生成。

---

## <a id="api-docs"></a>📡 API 文档

部署后，管理员登录后可访问 **Swagger UI** 在线 API 文档：

- Swagger UI：`https://your-domain.com/api/docs`
- OpenAPI JSON：`https://your-domain.com/api/docs/openapi.json`

### API 路由概览

| 分类 | 前缀 | 接口数 | 说明 |
|------|------|--------|------|
| **认证** | `/api/auth` | 11 | 注册、登录、登出、Token 管理、个人资料、AI 配置 |
| **AI 功能** | `/api` | 5 | 对话、报告分析、健康计划、问答、URL 校验 |
| **管理后台** | `/api/admin` | 17 | 统计、用户、日志、审计、配置、指标（含错误追踪）、备份 |
| **公共配置** | `/api/config` | 1 | 公共配置（维护模式、注册开关等） |
| **健康检查** | `/api/health` | 1 | 数据库 + Redis 连通性检查 |
| **客户端错误** | `/api/client-error` | 1 | 前端错误上报 |

> 📖 详细的请求/响应格式、参数和认证要求，请参阅 Swagger UI 在线文档。

---

## <a id="testing"></a>🧪 测试

```bash
# 运行所有测试（单元 + 集成 + E2E）
npm test

# 仅运行单元 & 集成测试
npm run test:unit

# 仅运行 E2E 测试
npm run test:e2e

# 监听模式运行单元测试
npm run test:watch
```

---

## <a id="dev-commands"></a>🔧 开发命令

```bash
# 启动开发服务器
npm run dev

# 代码检查
npm run lint

# 类型检查
npm run build:check

# 构建生产版本
npm run build

# 部署到 Cloudflare Workers
npm run deploy

# 数据库操作
npm run db:generate          # 生成迁移文件
npm run db:push              # 推送 Schema 到数据库
npm run db:studio            # 打开 Drizzle Studio
npm run db:migrate           # 应用迁移（本地）
npm run db:migrate:remote    # 应用迁移（远程）

# 生成管理员密码哈希
npm run password "你的密码"
```

---

## <a id="database-backup"></a>💾 数据库备份与恢复

### D1 Time Travel（时间点恢复）

D1 数据库默认启用 Time Travel，可恢复到过去 30 天内（Paid 计划）或 7 天内（Free 计划）的任意时间点：

```bash
# 查看当前数据库书签
npx wrangler d1 time-travel info cloud-health-db

# 恢复到指定时间点
npx wrangler d1 time-travel restore cloud-health-db --timestamp=1719500000

# 恢复到指定书签
npx wrangler d1 time-travel restore cloud-health-db --bookmark=00000085-0000024c-...
```

> 恢复操作可撤销，系统会返回上一个书签用于回退。

> **备份局限性**：当前备份数据存储在 D1 `backup_records` 表内（元数据），实际数据以加密 JSON 格式导出（AES-GCM 加密）。
> 备份下载使用一次性令牌（5 分钟有效期），恢复操作需二次确认。
> 如果 D1 完全不可用，备份数据也将无法访问。
> **建议**：生产环境可考虑将备份数据导出到 Cloudflare R2 对象存储，实现异地容灾。

### 管理后台备份

通过管理后台的备份管理功能，可以创建和管理备份任务，支持手动和定时备份（每日/每周/每月）。备份失败时系统会自动通过邮件通知管理员。

---

## <a id="security"></a>🔔 安全说明

- **敏感配置管理**：所有密钥通过 Cloudflare Dashboard 或 `.dev.vars` 管理，不提交到仓库
- **配置注入**：`wrangler.toml` 中的 KV/D1 ID 使用占位符，通过 GitHub Actions 构建时注入
- **用户 AI Key**：用户自定义的 AI API Key 加密存储于服务端（AES-GCM），解密密钥仅存浏览器
- **SSRF 防护**：用户自定义 AI API URL 经过服务端校验（DNS-over-HTTPS 解析 + 私有 IP 过滤 + 重定向跟踪），验证结果缓存在 KV（TTL 1 小时）
- **SQL 注入防护**：Drizzle ORM 参数化查询 + 数据导出表名白名单校验
- **密码安全**：密码采用 PBKDF2-SHA256 哈希存储（100,000 次迭代），登录状态使用 httpOnly Cookie + JWT
- **CSRF 防护**：Cookie + Header 双重验证（HTTPS 环境使用 `__Host-csrf-token`，HTTP 环境使用 `csrf-token` + `X-CSRF-Token`）
- **安全头**：CSP (动态 nonce) · HSTS (preload) · X-Frame-Options (DENY) · X-Content-Type-Options · Referrer-Policy · Permissions-Policy · Cross-Origin-Opener-Policy · Cross-Origin-Embedder-Policy · Cross-Origin-Resource-Policy
- **速率限制**：基于 Upstash Redis 的分布式滑动窗口速率限制，防止接口滥用
- **邮件队列**：邮件发送通过 Cloudflare Queues 异步处理，避免阻塞请求
- **CORS 控制**：通过 `ALLOWED_ORIGINS` 环境变量精确控制允许的跨域来源

---

## <a id="contributing"></a>🤝 贡献

欢迎贡献！请遵循以下步骤：

1. Fork 本仓库
2. 创建功能分支：`git checkout -b feature/your-feature`
3. 提交更改：`git commit -m 'Add some feature'`
4. 推送分支：`git push origin feature/your-feature`
5. 提交 Pull Request

提交前请确保：

- `npm run lint` 通过
- `npm run build:check` 类型检查通过
- `npm run test:unit` 测试通过

---

## <a id="disclaimer"></a>⚠️ 免责声明

本工具基于人工智能技术分析健康信息，结果仅供参考，**不能替代专业医生的诊断和治疗建议**。如有严重健康问题，请及时就医。

---

## <a id="license"></a>📄 开源协议

本项目采用 [ISC](LICENSE) 开源协议。

---

<div align="center">

**Made with ❤️ by <a href="https://github.com/IIawaII">IIawaII</a>**

</div>
