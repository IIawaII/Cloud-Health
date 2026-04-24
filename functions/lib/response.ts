/**
 * 统一响应处理工具
 * 提供标准化的 JSON 响应和错误响应构建函数
 * CORS 头由 worker.ts 全局统一注入，handler 中无需重复设置
 */

export function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

export function errorResponse(error: string, status = 500): Response {
  return jsonResponse({ error }, status)
}
