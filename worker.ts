import { Hono } from 'hono'
import { FALLBACK_HTML } from './server/generated/spa-fallback-html'
import { api } from './server/routes'
import { getSystemConfig } from './server/dao/config.dao'
import { addSecurityHeaders } from './server/middleware/security'
import { getCorsOrigin, addCorsHeaders, createCorsPreflightResponse } from './server/middleware/cors'
import { applyCacheHeaders } from './server/middleware/cache'
import { injectClientConfig, renderSpaHtml } from './server/middleware/spa'
import { recordMetric } from './server/middleware/monitor'
import { getLogger } from './server/utils/logger'
import type { Env } from './server/utils/env'

const logger = getLogger('Worker')

type AppEnv = { Bindings: Env }

const app = new Hono<AppEnv>()
// 将模块化路由挂载到 /api 前缀下
app.route('/api', api)

/** 请求体大小限制：10MB */
const MAX_REQUEST_BODY_SIZE = 10 * 1024 * 1024 // 10MB

/** 维护模式缓存，避免每个 API 请求都查询 D1 */
let maintenanceCache: { value: boolean; expiry: number } | null = null
const MAINTENANCE_CACHE_TTL_MS = 30_000 // 30 秒

async function checkMaintenanceMode(db: D1Database): Promise<boolean> {
  const now = Date.now()
  if (maintenanceCache && maintenanceCache.expiry > now) {
    return maintenanceCache.value
  }
  const config = await getSystemConfig(db, 'maintenance_mode')
  const isMaintenance = config?.value === 'true'
  maintenanceCache = { value: isMaintenance, expiry: now + MAINTENANCE_CACHE_TTL_MS }
  return isMaintenance
}

function handleWorkerError(err: unknown, request: Request, env: Env): Response {
  logger.error('Unhandled worker error', { error: err instanceof Error ? err.message : String(err) })
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

/** 检查请求体大小是否超过限制 */
function isRequestBodyTooLarge(request: Request): boolean {
  const contentLength = request.headers.get('Content-Length')
  if (!contentLength) return false
  const size = parseInt(contentLength, 10)
  if (isNaN(size)) return false
  return size > MAX_REQUEST_BODY_SIZE
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    try {
      const url = new URL(request.url)
      const corsOrigin = getCorsOrigin(request, env)

      if (request.method === 'OPTIONS') {
        return createCorsPreflightResponse(corsOrigin)
      }

      // 请求体大小限制检查（仅对 API 请求）
      if (url.pathname.startsWith('/api/') && isRequestBodyTooLarge(request)) {
        logger.warn('Request body too large', {
          path: url.pathname,
          contentLength: request.headers.get('Content-Length'),
        })
        return addSecurityHeaders(
          addCorsHeaders(
            new Response(JSON.stringify({ error: '请求体过大，最大支持 10MB' }), {
              status: 413,
              headers: { 'Content-Type': 'application/json' },
            }),
            corsOrigin
          ),
          false
        )
      }

      if (url.pathname.startsWith('/api/')) {
        const apiStartTime = Date.now()
        const isMaintenance = await checkMaintenanceMode(env.DB)
        if (isMaintenance) {
          const isAllowed =
            url.pathname.startsWith('/api/admin/') ||
            url.pathname === '/api/auth/login' ||
            url.pathname === '/api/auth/verify' ||
            url.pathname === '/api/auth/refresh' ||
            url.pathname === '/api/auth/check' ||
            url.pathname === '/api/auth/logout' ||
            url.pathname === '/api/health'
          if (!isAllowed) {
            const statusCode = 503
            recordMetric(env, ctx, {
              path: url.pathname, method: request.method, statusCode,
              latencyMs: Date.now() - apiStartTime,
              ip: request.headers.get('CF-Connecting-IP') ?? undefined,
            })
            return addSecurityHeaders(
              addCorsHeaders(
                new Response(JSON.stringify({ error: '系统维护中，请稍后访问' }), {
                  status: statusCode,
                  headers: { 'Content-Type': 'application/json' },
                }),
                corsOrigin
              ),
              false
            )
          }
        }

        const response = await app.fetch(request, env, ctx)
        recordMetric(env, ctx, {
          path: url.pathname, method: request.method,
          statusCode: response.status,
          latencyMs: Date.now() - apiStartTime,
          ip: request.headers.get('CF-Connecting-IP') ?? undefined,
        })
        return addCorsHeaders(response, corsOrigin)
      }

      // SPA 路由回退：非 API 请求且非静态资源请求返回 index.html
      if (!url.pathname.startsWith('/api/') && !isStaticAsset(url.pathname)) {
        if (env.ASSETS) {
          const indexRequest = new Request(new URL('/index.html', request.url), request)
          const indexResponse = await env.ASSETS.fetch(indexRequest)
          if (indexResponse.ok) {
            return renderSpaHtml(indexResponse, env)
          }
        }
        const res = new Response(injectClientConfig(FALLBACK_HTML, env), {
          headers: { 'Content-Type': 'text/html', 'Cache-Control': 'no-cache, no-store, must-revalidate' },
        })
        return addSecurityHeaders(res, true)
      }

      // Static assets fallback
      if (env.ASSETS) {
        const assetResponse = await env.ASSETS.fetch(request)

        if (assetResponse.status === 404 && !url.pathname.startsWith('/api/')) {
          const indexRequest = new Request(new URL('/index.html', request.url), request)
          const indexResponse = await env.ASSETS.fetch(indexRequest)
          return renderSpaHtml(indexResponse, env)
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
