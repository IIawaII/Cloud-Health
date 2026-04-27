import { Hono } from 'hono'
import * as authRegister from './api/auth/register'
import * as authLogin from './api/auth/login'
import * as authLogout from './api/auth/logout'
import * as authVerify from './api/auth/verify'
import * as authChangePassword from './api/auth/change_password'
import * as authUpdateProfile from './api/auth/update_profile'
import * as authCheck from './api/auth/check'
import * as authSendVerificationCode from './api/auth/send_verification_code'
import * as authRefresh from './api/auth/refresh'
import * as chatHandler from './api/ai/chat'
import * as analyzeHandler from './api/ai/analyze'
import * as planHandler from './api/ai/plan'
import * as quizHandler from './api/ai/quiz'
import * as adminStats from './api/admin/stats'
import * as adminUsers from './api/admin/users'
import * as adminLogs from './api/admin/logs'
import * as adminAudit from './api/admin/audit'
import * as adminConfig from './api/admin/config'
import * as adminMetrics from './api/admin/metrics'
import { openApiDocument } from './openapi'
import { requireCsrfProtection } from './middleware/csrf'
import type { Env } from './utils/env'

type AppEnv = { Bindings: Env }

const api = new Hono<AppEnv>()

// CSRF 防护：对所有 API 请求检查敏感操作
api.use('*', async (context, next) => {
  const csrfError = requireCsrfProtection(context)
  if (csrfError) return csrfError
  await next()
})

// Auth routes
api.post('/auth/register', authRegister.onRequestPost)
api.post('/auth/login', authLogin.onRequestPost)
api.post('/auth/logout', authLogout.onRequestPost)
api.get('/auth/verify', authVerify.onRequestGet)
api.post('/auth/change_password', authChangePassword.onRequestPost)
api.post('/auth/update_profile', authUpdateProfile.onRequestPost)
api.post('/auth/check', authCheck.onRequestPost)
api.post('/auth/send_verification_code', authSendVerificationCode.onRequestPost)
api.post('/auth/refresh', authRefresh.onRequestPost)

// AI feature routes
api.post('/chat', chatHandler.onRequestPost)
api.post('/analyze', analyzeHandler.onRequestPost)
api.post('/plan', planHandler.onRequestPost)
api.post('/quiz', quizHandler.onRequestPost)

// Admin routes
api.get('/admin/stats', adminStats.onRequestGet)
api.get('/admin/users', adminUsers.onRequestGet)
api.patch('/admin/users/:id', adminUsers.onRequestPatch)
api.delete('/admin/users/:id', adminUsers.onRequestDelete)
api.get('/admin/logs', adminLogs.onRequestGet)
api.get('/admin/audit', adminAudit.onRequestGet)
api.get('/admin/config', adminConfig.onRequestGet)
api.put('/admin/config', adminConfig.onRequestPut)

// Admin metrics routes (性能监控)
api.get('/admin/metrics/overview', adminMetrics.onRequestGetOverview)
api.get('/admin/metrics/trend', adminMetrics.onRequestGetTrend)
api.get('/admin/metrics/paths', adminMetrics.onRequestGetPaths)
api.get('/admin/metrics/status-codes', adminMetrics.onRequestGetStatusCodes)
api.get('/admin/metrics/errors', adminMetrics.onRequestGetErrors)

// Health check
api.get('/health', (context) => {
  return context.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// OpenAPI 文档端点
api.get('/docs/openapi.json', (context) => {
  return context.json(openApiDocument)
})

// Swagger UI 页面
api.get('/docs', (context) => {
  const html = `<!DOCTYPE html>
<html>
<head>
  <title>Cloud Health API Docs</title>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script>
    SwaggerUIBundle({
      url: '/api/docs/openapi.json',
      dom_id: '#swagger-ui',
      deepLinking: true,
      presets: [SwaggerUIBundle.presets.apis, SwaggerUIBundle.SwaggerUIStandalonePreset],
    })
  </script>
</body>
</html>`
  return context.html(html)
})

export { api }
