// API handlers
import { Hono } from 'hono'
import { FALLBACK_HTML } from './src/spa-fallback-html'
import * as authRegister from './functions/api/auth/register'
import * as authLogin from './functions/api/auth/login'
import * as authLogout from './functions/api/auth/logout'
import * as authVerify from './functions/api/auth/verify'
import * as authChangePassword from './functions/api/auth/change_password'
import * as authUpdateProfile from './functions/api/auth/update_profile'
import * as authCheck from './functions/api/auth/check'
import * as authSendVerificationCode from './functions/api/auth/send_verification_code'
import * as authRefresh from './functions/api/auth/refresh'
import * as chatHandler from './functions/api/chat'
import * as analyzeHandler from './functions/api/analyze'
import * as planHandler from './functions/api/plan'
import * as quizHandler from './functions/api/quiz'
import * as adminStats from './functions/api/admin/stats'
import * as adminUsers from './functions/api/admin/users'
import * as adminLogs from './functions/api/admin/logs'
import * as adminAudit from './functions/api/admin/audit'
import * as adminConfig from './functions/api/admin/config'

import { getSystemConfig } from './functions/lib/db'
import { generateNonce, addSecurityHeaders } from './functions/middleware/security'
import { getCorsOrigin, addCorsHeaders, createCorsPreflightResponse } from './functions/middleware/cors'
import { applyCacheHeaders } from './functions/middleware/cache'
import { injectClientConfig, renderSpaHtml } from './functions/middleware/spa'
import type { Env } from './functions/lib/env'

type AppEnv = { Bindings: Env }

const api = new Hono<AppEnv>()

api.post('/api/auth/register', authRegister.onRequestPost)
api.post('/api/auth/login', authLogin.onRequestPost)
api.post('/api/auth/logout', authLogout.onRequestPost)
api.get('/api/auth/verify', authVerify.onRequestGet)
api.post('/api/auth/change_password', authChangePassword.onRequestPost)
api.post('/api/auth/update_profile', authUpdateProfile.onRequestPost)
api.post('/api/auth/check', authCheck.onRequestPost)
api.post('/api/auth/send_verification_code', authSendVerificationCode.onRequestPost)
api.post('/api/auth/refresh', authRefresh.onRequestPost)
api.post('/api/chat', chatHandler.onRequestPost)
api.post('/api/analyze', analyzeHandler.onRequestPost)
api.post('/api/plan', planHandler.onRequestPost)
api.post('/api/quiz', quizHandler.onRequestPost)

// Admin API routes
api.get('/api/admin/stats', adminStats.onRequestGet)
api.get('/api/admin/users', adminUsers.onRequestGet)
api.patch('/api/admin/users/:id', adminUsers.onRequestPatch)
api.delete('/api/admin/users/:id', adminUsers.onRequestDelete)
api.get('/api/admin/logs', adminLogs.onRequestGet)
api.get('/api/admin/audit', adminAudit.onRequestGet)
api.get('/api/admin/config', adminConfig.onRequestGet)
api.put('/api/admin/config', adminConfig.onRequestPut)

api.get('/api/health', (context) => {
  return context.json({ status: 'ok', timestamp: new Date().toISOString() })
})

function handleWorkerError(err: unknown, request: Request, env: Env): Response {
  console.error('[Worker Error]', err)
  const errorCorsOrigin = getCorsOrigin(request, env)
  return addSecurityHeaders(
    addCorsHeaders(
      new Response(JSON.stringify({ error: '服务器内部错误，请稍后重试' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }),
      errorCorsOrigin
    ),
    false
  )
}

const STATIC_EXTENSIONS = new Set([
  '.js', '.css', '.svg', '.png', '.jpg', '.jpeg', '.webp',
  '.ico', '.json', '.txt', '.xml', '.webmanifest', '.woff', '.woff2',
])

function isStaticAsset(pathname: string): boolean {
  if (pathname.startsWith('/assets/')) return true
  const lastDot = pathname.lastIndexOf('.')
  if (lastDot === -1) return false
  return STATIC_EXTENSIONS.has(pathname.slice(lastDot))
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    try {
      const url = new URL(request.url)
      const corsOrigin = getCorsOrigin(request, env)

      if (request.method === 'OPTIONS') {
        return createCorsPreflightResponse(corsOrigin)
      }

      if (url.pathname.startsWith('/api/')) {
        const maintenanceConfig = await getSystemConfig(env.DB, 'maintenance_mode')
        const isMaintenance = maintenanceConfig?.value === 'true'
        if (isMaintenance) {
          const isAllowed =
            url.pathname.startsWith('/api/admin/') ||
            url.pathname === '/api/auth/login' ||
            url.pathname === '/api/auth/refresh' ||
            url.pathname === '/api/auth/check' ||
            url.pathname === '/api/auth/logout' ||
            url.pathname === '/api/health'
          if (!isAllowed) {
            return addSecurityHeaders(
              addCorsHeaders(
                new Response(JSON.stringify({ error: '系统维护中，请稍后访问' }), {
                  status: 503,
                  headers: { 'Content-Type': 'application/json' },
                }),
                corsOrigin
              ),
              false
            )
          }
        }

        const response = await api.fetch(request, env, ctx)
        return addCorsHeaders(response, corsOrigin)
      }

      // SPA 路由回退：非 API 请求且非静态资源请求返回 index.html
      if (!url.pathname.startsWith('/api/') && !isStaticAsset(url.pathname)) {
        const nonce = generateNonce()
        if (env.ASSETS) {
          const indexRequest = new Request(new URL('/index.html', request.url), request)
          const indexResponse = await env.ASSETS.fetch(indexRequest)
          if (indexResponse.ok) {
            return renderSpaHtml(indexResponse, env, nonce)
          }
        }
        const res = new Response(injectClientConfig(FALLBACK_HTML, env, nonce), {
          headers: { 'Content-Type': 'text/html', 'Cache-Control': 'no-cache, no-store, must-revalidate' },
        })
        return addSecurityHeaders(res, true, nonce)
      }

      // Static assets fallback
      if (env.ASSETS) {
        const assetResponse = await env.ASSETS.fetch(request)

        if (assetResponse.status === 404 && !url.pathname.startsWith('/api/')) {
          const nonce = generateNonce()
          const indexRequest = new Request(new URL('/index.html', request.url), request)
          const indexResponse = await env.ASSETS.fetch(indexRequest)
          return renderSpaHtml(indexResponse, env, nonce)
        }

        return applyCacheHeaders(assetResponse, url.pathname)
      }

      // ASSETS 不可用时返回 404
      return addSecurityHeaders(new Response('Not Found', { status: 404 }), false)
    } catch (err) {
      return handleWorkerError(err, request, env)
    }
  },
}
