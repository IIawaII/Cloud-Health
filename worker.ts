// API handlers
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

import { generateNonce, addSecurityHeaders } from './functions/middleware/security'
import { getCorsOrigin, addCorsHeaders, createCorsPreflightResponse } from './functions/middleware/cors'
import { applyCacheHeaders } from './functions/middleware/cache'
import { injectClientConfig, renderSpaHtml } from './functions/middleware/spa'
import { createContext } from './functions/middleware/context'
import type { Env } from './functions/lib/env'

type Handler = (context: EventContext<Env, string, Record<string, unknown>>) => Promise<Response>

const routes: Array<{
  method: string
  path: string
  handler: Handler
}> = [
  { method: 'POST', path: '/api/auth/register', handler: authRegister.onRequestPost as Handler },
  { method: 'POST', path: '/api/auth/login', handler: authLogin.onRequestPost as Handler },
  { method: 'POST', path: '/api/auth/logout', handler: authLogout.onRequestPost as Handler },
  { method: 'GET', path: '/api/auth/verify', handler: authVerify.onRequestGet as Handler },
  { method: 'POST', path: '/api/auth/change_password', handler: authChangePassword.onRequestPost as Handler },
  { method: 'POST', path: '/api/auth/update_profile', handler: authUpdateProfile.onRequestPost as Handler },
  { method: 'POST', path: '/api/auth/check', handler: authCheck.onRequestPost as Handler },
  { method: 'POST', path: '/api/auth/send_verification_code', handler: authSendVerificationCode.onRequestPost as Handler },
  { method: 'POST', path: '/api/auth/refresh', handler: authRefresh.onRequestPost as Handler },
  { method: 'POST', path: '/api/chat', handler: chatHandler.onRequestPost as Handler },
  { method: 'POST', path: '/api/analyze', handler: analyzeHandler.onRequestPost as Handler },
  { method: 'POST', path: '/api/plan', handler: planHandler.onRequestPost as Handler },
  { method: 'POST', path: '/api/quiz', handler: quizHandler.onRequestPost as Handler },
]

function isStaticAsset(pathname: string): boolean {
  return (
    pathname.startsWith('/assets/') ||
    pathname.endsWith('.js') ||
    pathname.endsWith('.css') ||
    pathname.endsWith('.svg') ||
    pathname.endsWith('.png') ||
    pathname.endsWith('.jpg') ||
    pathname.endsWith('.jpeg') ||
    pathname.endsWith('.webp') ||
    pathname.endsWith('.woff') ||
    pathname.endsWith('.woff2')
  )
}

export default {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async fetch(request: Request, env: Env, _ctx: ExecutionContext): Promise<Response> {
    try {
      const url = new URL(request.url)
      const corsOrigin = getCorsOrigin(request, env)

      // CORS preflight
      if (request.method === 'OPTIONS') {
        return createCorsPreflightResponse(corsOrigin)
      }

      // Health check endpoint
      if (request.method === 'GET' && url.pathname === '/api/health') {
        return addCorsHeaders(
          new Response(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }),
          corsOrigin
        )
      }

      // API routes
      const route = routes.find((r) => r.method === request.method && r.path === url.pathname)

      if (route) {
        const response = await route.handler(createContext(request, env))
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
  },
}
