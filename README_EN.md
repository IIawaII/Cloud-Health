# Health Project - Intelligent Health Diagnosis Platform

🌐 **[中文 README](README.md)**

## 📝 Project Introduction

An intelligent health management platform based on large language models, providing health report analysis, personalized health plans, AI chat, and health quizzes.

## ✨ Features

- **User Authentication System** — Supports registration, login, token auto-renewal, password change, and profile/avatar updates
- **Health Report Analysis** — Upload medical reports, lab results, or health test images for AI-powered analysis and professional interpretation
- **Health Plan Generation** — Fill in personal health information to receive AI-tailored diet, exercise, and lifestyle management plans
- **Smart Chat** — Real-time multi-turn conversations with a health AI consultant for professional guidance
- **Health Quiz** — AI-generated questions with multiple categories and difficulty levels, featuring instant scoring and analysis
- **AI Custom Configuration** — Users can customize the AI API; configurations are stored locally in the browser only
- **Human Verification** — Integrated Cloudflare Turnstile to prevent malicious registration and login attempts
- **Data Persistence** — Chat history, analysis results, and plan results are automatically saved to browser local storage and persist across refreshes
- **SPA Routing** — Supports direct refresh on sub-pages without redirecting to the home page

## 🛠️ Tech Stack

| Layer | Technology |
|------|------|
| Frontend | React 18 + TypeScript + Vite + Tailwind CSS + React Router DOM |
| Backend | Cloudflare Workers |
| Data Storage | Cloudflare KV (USERS / AUTH_TOKENS) |
| AI Interface | OpenAI API / OpenAI-compatible LLM API |
| Human Verification | Cloudflare Turnstile |
| Deployment | Cloudflare Workers + Workers Static Assets + GitHub Actions |

## 📄 Project Structure

```
cloud-health/
├── public/                  # Static assets
│   ├── User/                # User avatar SVGs
│   ├── Doctor.svg           # AI avatar
│   └── logo.svg             # Site icon
├── src/
│   ├── pages/               # Page components
│   │   ├── Home.tsx         # Home page
│   │   ├── ReportAnalysis.tsx   # Health report analysis
│   │   ├── PlanGenerator.tsx    # Health plan generation
│   │   ├── SmartChat.tsx        # Smart chat
│   │   ├── HealthQuiz.tsx       # Health quiz
│   │   ├── Login.tsx            # Login
│   │   └── Register.tsx         # Register
│   ├── components/          # Shared components
│   │   ├── Layout.tsx           # Page layout
│   │   ├── ChatInterface.tsx    # Chat interface
│   │   ├── FileUploader.tsx     # File upload
│   │   ├── AnalysisResult.tsx   # Analysis result display
│   │   ├── QuizPanel.tsx        # Quiz panel
│   │   ├── PlanForm.tsx         # Plan form
│   │   ├── SettingsModal.tsx    # Account settings modal
│   │   ├── ApiSettings.tsx      # AI configuration modal
│   │   ├── TurnstileWidget.tsx  # Human verification component
│   │   └── ProtectedRoute.tsx   # Route guard
│   ├── context/             # React Context
│   │   ├── AuthContext.tsx      # Authentication state management
│   │   └── ResultContext.tsx    # Result state management
│   ├── hooks/               # Custom Hooks
│   │   └── useAI.ts             # AI request wrapper
│   ├── lib/                 # Utility libraries
│   │   ├── aiConfig.ts          # AI configuration local storage
│   │   ├── avatar.ts            # Avatar utilities
│   │   ├── config.ts            # Frontend runtime config
│   │   ├── fetch.ts             # Request wrapper
│   │   └── utils.ts             # General utilities
│   ├── types/               # TypeScript type definitions
│   ├── App.tsx              # Route configuration
│   └── main.tsx             # Application entry
├── worker.ts                # Cloudflare Workers entry
├── functions/api/           # API business logic handlers
│   ├── auth/
│   │   ├── register.ts          # Registration
│   │   ├── login.ts             # Login
│   │   ├── logout.ts            # Logout
│   │   ├── verify.ts            # Token verification
│   │   ├── change_password.ts   # Change password
│   │   └── update_profile.ts    # Update profile
│   ├── chat.ts              # Smart chat
│   ├── analyze.ts           # Report analysis
│   ├── plan.ts              # Plan generation
│   └── quiz.ts              # Health quiz
├── scripts/
│   └── generate-spa-fallback.cjs  # Build script: sync dist/index.html to worker fallback
├── .github/workflows/
│   └── deploy.yml           # GitHub Actions auto-deployment
├── index.html               # HTML template
├── vite.config.ts           # Vite configuration
├── tailwind.config.js       # Tailwind configuration
├── wrangler.toml            # Cloudflare configuration
├── .dev.vars                # Local development environment variables
├── .gitignore               # Git ignore rules
└── package.json             # Dependency management
```

---

## 🚀 Deployment

### Method 1: GitHub Actions Auto-Deployment (Recommended)

This project is configured with GitHub Actions to automatically deploy to Cloudflare Workers on push to `main`.

#### 1. Fork this repository to your own GitHub account

#### 2. Set Secrets in your GitHub repository

Go to Repository → Settings → Secrets and variables → Actions → New repository secret

| Secret Name | Description |
|---|---|
| `CLOUDFLARE_API_TOKEN` | Cloudflare API Token (create at Dashboard → My Profile → API Tokens, select `Cloudflare Workers:Edit`) |
| `KV_USERS_ID` | Cloudflare KV namespace `USERS` ID |
| `KV_AUTH_TOKENS_ID` | Cloudflare KV namespace `AUTH_TOKENS` ID |
| `TURNSTILE_SITE_KEY` | Cloudflare Turnstile site key (public, client-side) |
| `TURNSTILE_SECRET_KEY` | Cloudflare Turnstile server-side secret key |

> **Get KV ID**: Run `npx wrangler kv namespace list` or check Cloudflare Dashboard → Workers & Pages → KV.

#### 3. Set Variables and Secrets in Cloudflare Dashboard

Go to Workers & Pages → Your Worker → Settings → Variables and Secrets:

- **Secrets**: `TURNSTILE_SECRET_KEY`, `AI_API_KEY`, `AI_BASE_URL`, `AI_MODEL`
- **Variables**: `TURNSTILE_SITE_KEY`

> The first workflow run after deployment will automatically sync `TURNSTILE_SITE_KEY` and `TURNSTILE_SECRET_KEY`.

### Method 2: Manual Deploy

```bash
npm run build
npm run deploy
```

### Method 3: Local Development

#### 1. Clone the project

```bash
git clone https://github.com/YOUR_GITHUB_USERNAME/YOUR_REPO_NAME.git
cd cloud-health
```

#### 2. Install dependencies

```bash
npm install
```

#### 3. Configure local environment variables

Create a `.dev.vars` file:

```bash
# Turnstile keys
TURNSTILE_SITE_KEY=1x00000000000000000000AA
TURNSTILE_SECRET_KEY=1x0000000000000000000000000000000AA

# Local development test account
DEV_USERNAME=admin
DEV_PASSWORD=123456

# AI model configuration
AI_BASE_URL=https://api.openai.com/v1
AI_API_KEY=your-api-key-here
AI_MODEL=gpt-4o
```

> **Security Tip**: `.dev.vars` is already included in `.gitignore`. Please do not commit it to the repository.

#### 4. Create KV namespaces

```bash
npx wrangler kv namespace create USERS
npx wrangler kv namespace create AUTH_TOKENS
```

After creation, fill the returned IDs into the `KV_USERS_ID` and `KV_AUTH_TOKENS_ID` placeholders in `wrangler.toml`.

#### 5. Start the development server

```bash
npm run dev
```

- Frontend runs at `http://localhost:5173`
- Workers runs at `http://localhost:8787`

## ⚙️ Environment Variables

| Variable Name | Type | Description |
|--------|------|------|
| `TURNSTILE_SITE_KEY` | Variable | Cloudflare Turnstile site key |
| `TURNSTILE_SECRET_KEY` | Secret | Cloudflare Turnstile server-side secret key |
| `AI_BASE_URL` | Secret | AI model API base URL |
| `AI_API_KEY` | Secret | AI model API key |
| `AI_MODEL` | Secret | AI model name, e.g., `gpt-4o` |
| `DEV_USERNAME` | Secret | Local development test account username |
| `DEV_PASSWORD` | Secret | Local development test account password |

## 🔔 Security Notes

- All sensitive configurations are managed via Cloudflare Dashboard or `.dev.vars`, never committed to the repository
- KV namespace IDs in `wrangler.toml` use placeholders and are injected by GitHub Actions
- User-defined AI API Keys are stored locally in the browser only and never uploaded to the server
- Passwords are hashed for storage, and login sessions use Bearer Token authentication
- User info (avatar, username) is cached to `localStorage` to prevent flicker on page refresh

## ⚠️ Disclaimer

This tool analyzes health information using artificial intelligence. Results are for reference only and **cannot replace professional medical diagnosis and treatment advice**. If you have serious health concerns, please seek medical attention promptly.

## 📄 License

This project is licensed under the [ISC](LICENSE) License.
