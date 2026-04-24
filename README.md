# Health Project - 智能健康诊断平台

🌐 **[English README](README_EN.md)**

## 📝 项目简介

基于大语言模型的智能健康管理平台，提供健康报告分析、个性化健康计划、AI 对话和健康问答等服务。

## ✨ 功能特性

- **用户认证系统** — 支持注册、登录、Token 自动续期、修改密码、更新个人资料与头像
- **健康报告分析** — 上传体检报告、化验单或健康检测图像，AI 智能分析各项指标并给出专业解读
- **健康计划生成** — 填写个人健康信息，AI 量身定制饮食、运动和作息管理方案
- **智能对话** — 与健康 AI 顾问实时多轮对话，获取专业健康指导
- **健康问答** — AI 智能出题，支持多类别与难度选择，即时判分解析
- **AI 自定义配置** — 支持用户自定义 AI API，配置仅保存在本地浏览器
- **人机验证** — 集成 Cloudflare Turnstile，防止恶意注册和登录
- **数据持久化** — 聊天记录、分析结果、计划结果自动保存到浏览器本地，刷新不丢失
- **SPA 路由** — 支持子页面直接刷新，不跳转回首页

## 🛠️ 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | React 18 + TypeScript + Vite + Tailwind CSS + React Router DOM |
| 后端 | Cloudflare Workers |
| 数据存储 | Cloudflare KV (USERS / AUTH_TOKENS) |
| AI 接口 | OpenAI API / 兼容 OpenAI 格式的大模型 API |
| 人机验证 | Cloudflare Turnstile |
| 部署 | Cloudflare Workers + Workers Static Assets + GitHub Actions |

## 📄 项目结构

```
health-project/
├── public/                  # 静态资源
│   ├── User/                # 用户头像 SVG
│   ├── Doctor.svg           # AI 头像
│   └── logo.svg             # 站点图标
├── src/
│   ├── pages/               # 页面组件
│   │   ├── Home.tsx         # 首页
│   │   ├── ReportAnalysis.tsx   # 健康报告分析
│   │   ├── PlanGenerator.tsx    # 健康计划生成
│   │   ├── SmartChat.tsx        # 智能对话
│   │   ├── HealthQuiz.tsx       # 健康问答
│   │   ├── Login.tsx            # 登录
│   │   └── Register.tsx         # 注册
│   ├── components/          # 公共组件
│   │   ├── Layout.tsx           # 页面布局
│   │   ├── ChatInterface.tsx    # 对话界面
│   │   ├── FileUploader.tsx     # 文件上传
│   │   ├── AnalysisResult.tsx   # 分析结果展示
│   │   ├── QuizPanel.tsx        # 问答面板
│   │   ├── PlanForm.tsx         # 计划表单
│   │   ├── SettingsModal.tsx    # 账号设置弹窗
│   │   ├── ApiSettings.tsx      # AI 配置弹窗
│   │   ├── TurnstileWidget.tsx  # 人机验证组件
│   │   └── ProtectedRoute.tsx   # 路由守卫
│   ├── context/             # React Context
│   │   ├── AuthContext.tsx      # 认证状态管理
│   │   └── ResultContext.tsx    # 结果状态管理
│   ├── hooks/               # 自定义 Hooks
│   │   └── useAI.ts             # AI 请求封装
│   ├── lib/                 # 工具库
│   │   ├── aiConfig.ts          # AI 配置本地存储
│   │   ├── avatar.ts            # 头像工具
│   │   ├── config.ts            # 前端运行时配置
│   │   ├── fetch.ts             # 请求封装
│   │   └── utils.ts             # 通用工具
│   ├── types/               # TypeScript 类型定义
│   ├── App.tsx              # 路由配置
│   └── main.tsx             # 应用入口
├── worker.ts                # Cloudflare Workers 入口
├── functions/api/           # API 业务逻辑处理器
│   ├── auth/
│   │   ├── register.ts          # 注册
│   │   ├── login.ts             # 登录
│   │   ├── logout.ts            # 登出
│   │   ├── verify.ts            # Token 验证
│   │   ├── change_password.ts   # 修改密码
│   │   └── update_profile.ts    # 更新资料
│   ├── chat.ts              # 智能对话
│   ├── analyze.ts           # 报告分析
│   ├── plan.ts              # 计划生成
│   └── quiz.ts              # 健康问答
├── scripts/
│   └── generate-spa-fallback.cjs  # 构建脚本：同步 dist/index.html 到 worker fallback
├── .github/workflows/
│   └── deploy.yml           # GitHub Actions 自动部署
├── index.html               # HTML 模板
├── vite.config.ts           # Vite 配置
├── tailwind.config.js       # Tailwind 配置
├── wrangler.toml            # Cloudflare 配置
├── .dev.vars                # 本地开发环境变量
├── .gitignore               # Git 忽略规则
└── package.json             # 依赖管理
```

---

## 🚀 部署说明

### 方式一：GitHub Actions 自动部署（推荐）

本项目已配置 GitHub Actions，push 到 `main` 分支时自动部署到 Cloudflare Workers。

#### 1. Fork 本项目到你的 GitHub 账号

#### 2. 在 GitHub 仓库中设置 Secrets

进入仓库 → Settings → Secrets and variables → Actions → New repository secret

| Secret 名称 | 说明 |
|---|---|
| `CLOUDFLARE_API_TOKEN` | Cloudflare API Token（Dashboard → My Profile → API Tokens 创建，权限选 `Cloudflare Workers:Edit`）|
| `KV_USERS_ID` | Cloudflare KV 命名空间 `USERS` 的 ID |
| `KV_AUTH_TOKENS_ID` | Cloudflare KV 命名空间 `AUTH_TOKENS` 的 ID |
| `TURNSTILE_SITE_KEY` | Cloudflare Turnstile 站点密钥（客户端公开）|
| `TURNSTILE_SECRET_KEY` | Cloudflare Turnstile 服务端密钥 |

> **获取 KV ID**：运行 `npx wrangler kv namespace list` 或在 Cloudflare Dashboard → Workers & Pages → KV 中查看。

#### 3. 在 Cloudflare Dashboard 设置变量和机密

进入 Workers & Pages → 你的 Worker → Settings → Variables and Secrets：

- **Secrets**：`TURNSTILE_SECRET_KEY`、`AI_API_KEY`、`AI_BASE_URL`、`AI_MODEL`
- **Variables**：`TURNSTILE_SITE_KEY`（也可通过 GitHub Actions 自动同步）

> 部署后首次运行 workflow 会自动同步 `TURNSTILE_SITE_KEY` 和 `TURNSTILE_SECRET_KEY`。

### 方式二：手动部署

```bash
npm run build
npm run deploy
```

### 方式三：本地开发部署

#### 1. 克隆项目

```bash
git clone https://github.com/YOUR_GITHUB_USERNAME/YOUR_REPO_NAME.git
cd health-project
```

#### 2. 安装依赖

```bash
npm install
```

#### 3. 配置本地环境变量

创建 `.dev.vars` 文件：

```bash
# Turnstile 密钥
TURNSTILE_SITE_KEY=1x00000000000000000000AA
TURNSTILE_SECRET_KEY=1x0000000000000000000000000000000AA

# 本地开发测试账号
DEV_USERNAME=admin
DEV_PASSWORD=123456

# AI 大模型配置
AI_BASE_URL=https://api.openai.com/v1
AI_API_KEY=your-api-key-here
AI_MODEL=gpt-4o
```

> **安全提示**：`.dev.vars` 已加入 `.gitignore`，请勿将其提交到仓库。

#### 4. 创建 KV 命名空间

```bash
npx wrangler kv namespace create USERS
npx wrangler kv namespace create AUTH_TOKENS
```

创建后，将返回的 ID 填入 `wrangler.toml` 中的 `KV_USERS_ID` 和 `KV_AUTH_TOKENS_ID` 占位符。

#### 5. 启动开发服务器

```bash
npm run dev
```

- 前端运行在 `http://localhost:5173`
- Workers 运行在 `http://localhost:8787`

## ⚙️ 环境变量说明

| 变量名 | 类型 | 说明 |
|--------|------|------|
| `TURNSTILE_SITE_KEY` | Variable | Cloudflare Turnstile 站点密钥 |
| `TURNSTILE_SECRET_KEY` | Secret | Cloudflare Turnstile 服务端密钥 |
| `AI_BASE_URL` | Secret | AI 大模型 API 基础地址 |
| `AI_API_KEY` | Secret | AI 大模型 API 密钥 |
| `AI_MODEL` | Secret | AI 模型名称，如 `gpt-4o` |
| `DEV_USERNAME` | Secret | 本地开发测试账号用户名 |
| `DEV_PASSWORD` | Secret | 本地开发测试账号密码 |

## 🔔 安全说明

- 所有敏感配置通过 Cloudflare Dashboard 或 `.dev.vars` 管理，不提交到仓库
- `wrangler.toml` 中的 KV namespace ID 使用占位符，通过 GitHub Actions 注入
- 用户自定义的 AI API Key 仅保存在浏览器本地，不会上传到服务器
- 密码采用哈希存储，登录状态使用 Bearer Token 认证
- 头像、用户名等用户信息缓存到 `localStorage`，刷新页面不闪烁

## ⚠️ 免责声明

本工具基于人工智能技术分析健康信息，结果仅供参考，**不能替代专业医生的诊断和治疗建议**。如有严重健康问题，请及时就医。

## 📄 开源协议

本项目采用 [ISC](LICENSE) 开源协议。
