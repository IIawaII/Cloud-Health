<div align="center">

<img src="./public/logo.svg" alt="Cloud Health" />

# Intelligent Health Management Platform powered by Cloudflare Workers

[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](LICENSE)
[![Node.js >=22](https://img.shields.io/badge/Node.js-%3E%3D22-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-F38020?logo=cloudflare&logoColor=white)](https://workers.cloudflare.com/)
[![React 18](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Hono](https://img.shields.io/badge/Hono-4.x-E36002)](https://hono.dev/)
[![Vite](https://img.shields.io/badge/Vite-5.x-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)

[中文文档](README.md) · [English](README_EN.md)

> ⚠️ This project provides health analysis references based on AI technology. Results **cannot replace professional medical diagnosis and treatment advice**. If you have health concerns, please consult a doctor promptly.

</div>

---

## 📸 Demo

<img src="./picture/Screenshot_EN.png" alt="Screenshot"/>

---

## 📑 Table of Contents

- [🎯 Project Overview](#-project-overview)
- [✨ Features](#-features)
- [🛠️ Tech Stack](#-tech-stack)
- [🏗️ Project Architecture](#-project-architecture)
- [🚀 Quick Start](#-quick-start)
- [📦 Deployment](#-deployment)
- [⚙️ Environment Variables](#-environment-variables)
- [📡 API Documentation](#-api-documentation)
- [🧪 Testing](#-testing)
- [🔧 Development Commands](#-development-commands)
- [💾 Database Backup & Recovery](#-database-backup--recovery)
- [🔔 Security](#-security)

---

## 🎯 Project Overview

Cloud Health is an intelligent health management platform deployed on the Cloudflare Workers edge network. No self-hosted servers needed — leverage Cloudflare's global edge nodes for low-latency access, combined with AI large language models to provide users with health report interpretation, personalized health plans, smart Q&A, and more.

**Core Advantages**:
- 🚀 Edge deployment, global low latency
- 💰 Runs on Cloudflare's free plan, zero server cost
- 🔒 Security-first, end-to-end encryption from authentication to data
- 🧩 Shared schemas between frontend & backend, type safety across the full stack

---

## ✨ Features

### 🧑‍⚕️ AI-Powered Health Services

| Feature | Description |
|---------|-------------|
| 🏥 **Health Report Analysis** | Upload medical reports, lab results, or health test images for AI-powered analysis and professional interpretation |
| 📋 **Personalized Health Plans** | Fill in personal health information to receive AI-tailored diet, exercise, and lifestyle management plans |
| 💬 **Smart Health Chat** | Real-time multi-turn conversations with a health AI consultant, supporting streaming responses |
| 🧠 **Health Quiz** | AI-generated questions with multiple categories and difficulty levels, featuring instant scoring and analysis |

### 🔐 User & Security

| Feature | Description |
|---------|-------------|
| 🔑 **Complete Authentication** | Registration / Login / Email verification / Token auto-renewal / Password change / Profile updates |
| 🛡️ **Human Verification** | Integrated Cloudflare Turnstile to prevent malicious registration and login |
| 🔒 **Security Protection** | CSRF protection · CSP security headers · SSRF URL validation · SQL injection prevention · Distributed rate limiting |
| 🌐 **CORS Control** | Configurable allowed cross-origin sources (`ALLOWED_ORIGINS`) |
| 🔐 **Data Encryption** | User AI config encrypted with AES-GCM, keys stored only in browser sessionStorage |

### 👨‍💼 Admin Dashboard

| Feature | Description |
|---------|-------------|
| 📊 **Dashboard** | User statistics, usage trends, system overview |
| 👥 **User Management** | View / Edit / Delete users, role management |
| ⚙️ **System Config** | Maintenance mode toggle, registration toggle, runtime config hot-reload |
| 📝 **Audit Logs** | Admin operation tracking |
| 📈 **Performance Monitoring** | API request latency, status code distribution, error tracking |
| 💾 **Backup Management** | Create, schedule, and manage backup tasks |

### 🎨 User Experience

| Feature | Description |
|---------|-------------|
| 🌓 **Dark Mode** | Light / Dark / System theme support |
| 🌍 **Internationalization (i18n)** | Chinese (zh-CN) and English (en-US) with auto-detection |
| 💾 **Data Persistence** | Chat history and analysis results auto-saved to browser local storage |
| 📱 **Responsive Design** | Desktop and mobile adaptive layout |
| 🔧 **Custom AI Config** | Users can customize AI API; configs encrypted on server, keys stored only in browser |

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend Framework** | [React 18](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) |
| **Build Tool** | [Vite 5](https://vitejs.dev/) |
| **Styling** | [Tailwind CSS](https://tailwindcss.com/) + [tailwind-merge](https://github.com/dcastil/tailwind-merge) + [CVA](https://cva.style/) |
| **Routing** | [React Router DOM 7](https://reactrouter.com/) |
| **State Management** | React Context + Hooks |
| **Internationalization** | [i18next](https://www.i18next.com/) + [react-i18next](https://react.i18next.com/) |
| **Backend Framework** | [Hono 4](https://hono.dev/) (Cloudflare Workers) |
| **Database** | [Cloudflare D1](https://developers.cloudflare.com/d1/) ([Drizzle ORM](https://orm.drizzle.team/)) |
| **Cache** | [Cloudflare KV](https://developers.cloudflare.com/kv/) |
| **Rate Limiting** | [Upstash Redis](https://upstash.com/) (Distributed) |
| **Email Queue** | [Cloudflare Queues](https://developers.cloudflare.com/queues/) |
| **Human Verification** | [Cloudflare Turnstile](https://developers.cloudflare.com/turnstile/) |
| **AI Interface** | [OpenAI API](https://platform.openai.com/docs/api-reference) / OpenAI-compatible LLM API |
| **API Documentation** | [Hono Zod OpenAPI](https://github.com/honojs/middleware/tree/main/packages/zod-openapi) + [Swagger UI](https://swagger.io/tools/swagger-ui/) |
| **Validation** | [Zod](https://zod.dev/) (Shared schemas between frontend & backend) |
| **Testing** | [Vitest](https://vitest.dev/) (Unit/Integration) + [Playwright](https://playwright.dev/) (E2E) |
| **Code Quality** | [ESLint](https://eslint.org/) + [TypeScript ESLint](https://typescript-eslint.io/) |
| **CI/CD** | [GitHub Actions](https://docs.github.com/en/actions) |
| **Deployment** | [Cloudflare Workers](https://workers.cloudflare.com/) + [Workers Static Assets](https://developers.cloudflare.com/workers/static-assets/) |

---

## 🏗️ Project Architecture

<details>
<summary>📁 Click to expand full directory structure</summary>

```
cloud-health/
├── public/                          # Static assets
│   ├── User/                        # User avatar SVGs (1-51)
│   ├── Doctor.svg                   # AI avatar
│   ├── logo.svg                     # Site icon
│   ├── icon.svg / icon-dark.svg     # PWA icons (light/dark)
│   ├── avatar-sprite.svg            # Avatar sprite (build-generated)
│   ├── manifest.webmanifest         # PWA manifest
│   └── _headers                     # Cloudflare static asset security headers
├── server/                          # Backend (Hono on Cloudflare Workers)
│   ├── api/                         # API route handlers
│   │   ├── auth/                    # Auth (register/login/logout/verify/password/profile/code/refresh/ai-config)
│   │   ├── ai/                      # AI features (chat/analyze/plan/quiz/URL validation)
│   │   ├── admin/                   # Admin (stats/users/logs/audit/config/metrics/backup)
│   │   └── config/                  # Public config
│   ├── dao/                         # Data Access Layer (user/audit/config/log/metrics/verification/ai-config/backup)
│   ├── db/                          # Drizzle ORM Schema & database connection
│   ├── middleware/                   # Middleware (security/CORS/CSRF/cache/monitor/admin auth/SPA)
│   ├── queues/                      # Cloudflare Queues (email sending)
│   ├── types/                       # Server type declarations (swagger-ui etc.)
│   ├── utils/                       # Utilities (adminInit/auth/cacheManager/configDefaults/cookie/crypto/
│   │                                #   env/errors/handler/llm/logger/maintenanceCache/prompts/
│   │                                #   rateLimit/response/smtp/turnstile/upstash)
│   ├── app.ts                       # Hono app & route registration
│   └── openapi.ts                   # OpenAPI 3.0 specification
├── shared/                          # Shared code between frontend & backend
│   ├── schemas.ts                   # Zod validation schemas (register/login/password etc.)
│   ├── types.ts                     # Shared type definitions (ChatMessage/QuizQuestion/QuizResult/ApiConfig)
│   └── i18n/                        # Shared i18n resources (zh-CN / en-US + server i18n entry)
├── src/                             # Frontend (React + Vite)
│   ├── pages/                       # Page components
│   │   ├── landing/                 # Landing page
│   │   ├── home/                    # Home page
│   │   ├── report/                  # Health report analysis
│   │   ├── plan/                    # Health plan generator
│   │   ├── chat/                    # Smart chat
│   │   ├── quiz/                    # Health quiz
│   │   ├── auth/                    # Login / Register / Registration closed
│   │   ├── settings/                # Account settings
│   │   ├── admin/                   # Admin (dashboard/users/data/config/metrics/backup)
│   │   └── maintenance/             # Maintenance mode page
│   ├── components/                  # Components
│   │   ├── auth/                    # Route guards (ProtectedRoute / AdminProtectedRoute)
│   │   ├── chat/                    # Chat interface (ChatInterface / MarkdownRenderer)
│   │   ├── common/                  # Common (Avatar/ConfirmDialog/FileUploader/LanguageSwitcher/
│   │   │                            #   LogoIcon/ResultCard/TurnstileWidget)
│   │   ├── features/               # Features (AnalysisResult/PlanForm/QuizPanel/ApiSettings/SettingsModal)
│   │   └── layout/                  # Layout (Layout / AdminLayout / ErrorBoundary)
│   ├── contexts/                    # React Context (Auth / Result / Theme)
│   ├── hooks/                       # Custom Hooks (useAI/useAIBase/useAIStream/useAdmin/useAuthSync/
│   │                                #   useClientConfig/useLocalStorage/useResult/useTheme)
│   ├── config/                      # Frontend config (AI / App / Theme)
│   ├── i18n/                        # Frontend i18n
│   ├── types/                       # TypeScript types
│   ├── utils/                       # Utilities (anonymousId/api/avatar/css/date/file/html/
│   │                                #   storage/trimMessages/userCache)
│   ├── api/                         # API client (fetchWithTimeout + CSRF)
│   ├── App.tsx                      # Route configuration
│   └── main.tsx                     # App entry
├── migrations/                      # D1 database migrations (8 versions)
├── configs/                         # Config files (Vite / ESLint / Tailwind / Vitest / Drizzle...)
├── scripts/                         # Build scripts
│   ├── build-avatar-sprite.mjs      # Avatar sprite generation
│   ├── generate-spa-fallback.cjs    # SPA fallback HTML generation
│   ├── inject-wrangler-config.cjs   # Wrangler config injection (CI use)
│   └── hash-password.mjs           # Admin password PBKDF2 hash generation
├── tests/                           # Tests
│   ├── unit/                        # Unit tests (hooks/utils/backup)
│   ├── integration/                 # Integration tests (auth/admin/concurrency/crypto/db/llm/load/
│   │                                #   profile-aiconfig/rateLimit/response/turnstile)
│   └── e2e/                         # E2E tests (Playwright: basic/core-flows)
├── worker.ts                        # Cloudflare Workers entry (fetch/scheduled/queue)
├── wrangler.toml                    # Cloudflare Workers production config
├── wrangler.dev.toml                # Cloudflare Workers dev config
├── .dev.vars.example                # Local dev environment variables template
└── .github/workflows/deploy.yml     # GitHub Actions auto-deployment
```

</details>

---

## 🚀 Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) >= 22.0.0
- [npm](https://www.npmjs.com/) (installed with Node.js)
- [Cloudflare Account](https://dash.cloudflare.com/sign-up) (required for deployment)
- AI LLM API Key (OpenAI or compatible)

### Local Development

#### 1. Clone the repository

```bash
git clone https://github.com/IIawaII/cloud-health.git
cd cloud-health
```

#### 2. Install dependencies

```bash
npm install
```

#### 3. Configure environment variables

```bash
cp .dev.vars.example .dev.vars
```

Edit `.dev.vars` with your actual configuration:

```bash
# Turnstile human verification (required)
TURNSTILE_SITE_KEY=your-turnstile-site-key
TURNSTILE_SECRET_KEY=your-turnstile-secret-key

# Upstash Redis (required, distributed rate limiting)
UPSTASH_REST_URL=https://your-redis-instance.upstash.io
UPSTASH_REST_TOKEN=your-upstash-token

# SMTP email service (required, for verification codes)
SMTP_HOST=smtp.your-smtp-host.com
SMTP_PORT=465
SMTP_USER=your-email@example.com
SMTP_PASS=your-smtp-password

# Admin account (required, password must be PBKDF2 hash format)
ADMIN_USERNAME=your-admin-username
ADMIN_PASSWORD=100000:salt:hash   # Generate with npm run hash-password

# AI service config (optional, server-side fallback)
AI_API_KEY=your-ai-api-key
AI_BASE_URL=https://api.openai.com/v1
AI_MODEL=gpt-4o

# Allowed CORS origins (optional, defaults to current domain)
ALLOWED_ORIGINS=https://your-domain.com

# Route config (optional, not needed for local dev)
ROUTE_PATTERN=your-domain.com/*
ROUTE_ZONE_NAME=your-domain.com

# SMTP timeout (optional, default 15000ms)
SMTP_TIMEOUT_MS=15000

# Runtime environment (optional, development | production)
ENVIRONMENT=development
```

> **Security Note**: `.dev.vars` is included in `.gitignore`. Never commit it to the repository.

#### 4. Generate admin password hash

```bash
npm run password "your-strong-password"
```

Copy the output `ADMIN_PASSWORD=...` value into `.dev.vars`.

#### 5. Create Cloudflare resources

```bash
# Create KV namespaces
npx wrangler kv namespace create AUTH_TOKENS
npx wrangler kv namespace create VERIFICATION_CODES
npx wrangler kv namespace create SSRF_CACHE

# Create D1 database and apply migrations
npx wrangler d1 create cloud-health-db
npx wrangler d1 migrations apply cloud-health-db --local
```

Fill the returned KV IDs and D1 ID into the corresponding placeholders in `wrangler.toml`.

#### 6. Start the development server

```bash
npm run dev
```

Visit `http://localhost:8787` to use the application.

---

## 📦 Deployment

### Method 1: GitHub Actions Auto-Deployment (Recommended)

The project is configured with GitHub Actions to automatically run: Lint → Type Check → Migration → Secret Sync → Deploy on push to `main`.

#### 1. Fork this repository

#### 2. Configure GitHub Secrets

Go to Repository → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

| Secret Name | Description |
|---|---|
| `CLOUDFLARE_API_TOKEN` | Cloudflare API Token (Dashboard → My Profile → API Tokens, select `Cloudflare Workers:Edit`) |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare Account ID |
| `D1_DATABASE_ID` | D1 Database ID |
| `KV_AUTH_TOKENS_ID` | KV namespace `AUTH_TOKENS` ID |
| `KV_VERIFICATION_CODES_ID` | KV namespace `VERIFICATION_CODES` ID |
| `KV_SSRF_CACHE_ID` | KV namespace `SSRF_CACHE` ID |
| `ROUTE_PATTERN` | Workers route pattern (e.g., `your-domain.com/*`) |
| `ROUTE_ZONE_NAME` | Cloudflare Zone name (e.g., `your-domain.com`) |
| `UPSTASH_REST_URL` | Upstash Redis REST URL |
| `UPSTASH_REST_TOKEN` | Upstash Redis REST Token |
| `TURNSTILE_SECRET_KEY` | Cloudflare Turnstile server-side secret key |
| `SMTP_USER` | SMTP email account |
| `SMTP_PASS` | SMTP email password |
| `ADMIN_USERNAME` | Admin username |
| `ADMIN_PASSWORD` | Admin password (PBKDF2 hash format, generate with `npm run password`) |
| `ALLOWED_ORIGINS` | Allowed CORS origins (e.g., `https://your-domain.com`) |

#### 3. Configure GitHub Variables

| Variable Name | Description |
|---|---|
| `TURNSTILE_SITE_KEY` | Cloudflare Turnstile site key |
| `SMTP_HOST` | SMTP server address |
| `SMTP_PORT` | SMTP server port |
| `ENVIRONMENT` | Runtime environment (`production` / `development`) |

> **Get KV ID**: Run `npx wrangler kv namespace list` or check Cloudflare Dashboard → Workers & Pages → KV.

### Method 2: Manual Deploy

```bash
npm run build
npm run deploy
```

---

## ⚙️ Environment Variables

### Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `TURNSTILE_SITE_KEY` | Cloudflare Turnstile site key | ✅ |
| `SMTP_HOST` | SMTP server address | ✅ |
| `SMTP_PORT` | SMTP server port | ✅ |
| `ENVIRONMENT` | Runtime environment (`production` / `development`) | ❌ |

### Secrets

| Variable | Description | Required |
|----------|-------------|----------|
| `TURNSTILE_SECRET_KEY` | Cloudflare Turnstile server-side secret key | ✅ |
| `UPSTASH_REST_URL` | Upstash Redis REST URL (distributed rate limiting) | ✅ |
| `UPSTASH_REST_TOKEN` | Upstash Redis REST Token | ✅ |
| `SMTP_USER` | SMTP email account | ✅ |
| `SMTP_PASS` | SMTP email password | ✅ |
| `ADMIN_USERNAME` | Admin username | ✅ |
| `ADMIN_PASSWORD` | Admin password (PBKDF2 hash format) | ✅ |
| `ALLOWED_ORIGINS` | Allowed CORS origins | ❌ |
| `AI_API_KEY` | AI model API key (server-side fallback) | ❌ |
| `AI_BASE_URL` | AI model API base URL (server-side fallback) | ❌ |
| `AI_MODEL` | AI model name, e.g., `gpt-4o` (server-side fallback) | ❌ |
| `SMTP_TIMEOUT_MS` | SMTP timeout (milliseconds), default `15000` | ❌ |

> **Admin Password Format**: `ADMIN_PASSWORD` must be in PBKDF2 hash format (`iterations:salt:hash`). Plain text is not accepted. Generate with `npm run password "your-password"`.

---

## 📡 API Documentation

After deployment, admin users can access the **Swagger UI** online API documentation:

- Swagger UI: `https://your-domain.com/api/docs`
- OpenAPI JSON: `https://your-domain.com/api/docs/openapi.json`

### API Routes Overview

| Category | Prefix | Endpoints | Description |
|----------|--------|-----------|-------------|
| **Authentication** | `/api/auth` | 11 | Register, login, logout, token management, profile, AI config |
| **AI Features** | `/api` | 5 | Chat, report analysis, health plan, quiz, URL validation |
| **Admin** | `/api/admin` | 17 | Stats, users, logs, audit, config, metrics (incl. errors), backups |
| **Public** | `/api/config` | 1 | Public config (maintenance mode, registration toggle) |
| **Health** | `/api/health` | 1 | Database + Redis connectivity check |
| **Client Error** | `/api/client-error` | 1 | Frontend error reporting |

> 📖 For detailed request/response formats, parameters, and authentication requirements, please refer to the Swagger UI documentation.

---

## 🧪 Testing

```bash
# Run all tests (unit + integration + E2E)
npm test

# Run unit & integration tests only
npm run test:unit

# Run E2E tests only
npm run test:e2e

# Run unit tests in watch mode
npm run test:watch
```

---

## 🔧 Development Commands

```bash
# Start development server
npm run dev

# Lint check
npm run lint

# Type check
npm run build:check

# Build for production
npm run build

# Deploy to Cloudflare Workers
npm run deploy

# Database operations
npm run db:generate          # Generate migration files
npm run db:push              # Push schema to database
npm run db:studio            # Open Drizzle Studio
npm run db:migrate           # Apply migrations (local)
npm run db:migrate:remote    # Apply migrations (remote)

# Generate admin password hash
npm run password "your-password"
```

---

## 💾 Database Backup & Recovery

### D1 Time Travel (Point-in-Time Recovery)

D1 databases have Time Travel enabled by default, allowing recovery to any point within the last 30 days (Paid plan) or 7 days (Free plan):

```bash
# View current database bookmark
npx wrangler d1 time-travel info cloud-health-db

# Restore to a specific timestamp
npx wrangler d1 time-travel restore cloud-health-db --timestamp=1719500000

# Restore to a specific bookmark
npx wrangler d1 time-travel restore cloud-health-db --bookmark=00000085-0000024c-...
```

> Restore operations are reversible — the system returns the previous bookmark for rollback.

> **Backup Limitation**: Current backup data is stored within D1 (`backup_records` metadata) with actual data exported as encrypted JSON (AES-GCM encryption).
> Backup downloads use one-time tokens (5-minute validity), and restore operations require secondary confirmation.
> If D1 becomes completely unavailable, backup data will also be inaccessible.
> **Recommendation**: For production environments, consider exporting backup data to Cloudflare R2 object storage for disaster recovery.

### Admin Panel Backup

Through the admin panel's backup management feature, you can create and manage backup tasks, supporting both manual and scheduled backups (daily/weekly/monthly). When scheduled backups fail, the system automatically notifies the admin via email.

---

## 🔔 Security

- **Sensitive Config Management**: All secrets are managed via Cloudflare Dashboard or `.dev.vars`, never committed to the repository
- **Config Injection**: KV/D1 IDs in `wrangler.toml` use placeholders, injected during GitHub Actions build
- **User AI Keys**: User-defined AI API Keys are encrypted on the server (AES-GCM), decryption keys stored only in the browser
- **SSRF Protection**: User-defined AI API URLs are validated server-side (DNS-over-HTTPS resolution + private IP filtering + redirect tracking), results cached in KV (TTL 1 hour)
- **SQL Injection Prevention**: Drizzle ORM parameterized queries + table name whitelist validation for data export
- **Password Security**: Passwords stored using PBKDF2-SHA256 hashing (100,000 iterations), sessions use httpOnly Cookie + JWT
- **CSRF Protection**: Cookie + Header double verification (HTTPS: `__Host-csrf-token`, HTTP: `csrf-token` + `X-CSRF-Token`)
- **Security Headers**: CSP (dynamic nonce) · HSTS (preload) · X-Frame-Options (DENY) · X-Content-Type-Options · Referrer-Policy · Permissions-Policy · Cross-Origin-Opener-Policy · Cross-Origin-Embedder-Policy · Cross-Origin-Resource-Policy
- **Rate Limiting**: Distributed sliding window rate limiting via Upstash Redis to prevent API abuse
- **Email Queue**: Email sending is processed asynchronously via Cloudflare Queues to avoid blocking requests
- **CORS Control**: Precise control of allowed cross-origin sources via `ALLOWED_ORIGINS` environment variable

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork this repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m 'Add some feature'`
4. Push to the branch: `git push origin feature/your-feature`
5. Submit a Pull Request

Before submitting, please ensure:

- `npm run lint` passes
- `npm run build:check` type check passes
- `npm run test:unit` tests pass

---

## ⚠️ Disclaimer

This tool analyzes health information using artificial intelligence. Results are for reference only and **cannot replace professional medical diagnosis and treatment advice**. If you have serious health concerns, please seek medical attention promptly.

---

## 📄 License

This project is licensed under the [ISC](LICENSE) License.

---

<div align="center">

**Made with ❤️ by <a href="https://github.com/IIawaII">IIawaII</a>**

</div>
