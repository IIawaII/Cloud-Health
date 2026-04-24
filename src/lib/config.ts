/**
 * 前端运行时配置
 * 优先从 Worker 注入的 window.__ENV__ 读取，支持在 Cloudflare Dashboard 管理
 * 本地开发时可回退到 Vite 环境变量（需以 VITE_ 开头）
 */

const envFromWindow = (typeof window !== 'undefined' && (window as unknown as { __ENV__?: { TURNSTILE_SITE_KEY?: string } }).__ENV__) || undefined

export const TURNSTILE_SITE_KEY = envFromWindow?.TURNSTILE_SITE_KEY || (import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined)

if (!TURNSTILE_SITE_KEY) {
  console.error('[config] TURNSTILE_SITE_KEY 未设置，Turnstile 验证将无法正常工作')
}
