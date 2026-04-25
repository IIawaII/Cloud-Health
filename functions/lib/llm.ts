/**
 * 统一的大语言模型调用层
 * 封装与 OpenAI 兼容 API 的通信，支持流式和非流式请求
 */

import { parseLLMResult } from './response'

export interface CallLLMOptions {
  baseUrl: string
  apiKey: string
  model: string
  messages: Array<Record<string, unknown>>
  stream?: boolean
  temperature?: number
  max_tokens?: number
}

/**
 * 校验 AI Base URL 是否合法，防止 SSRF
 * - 仅允许 http/https 协议
 * - 禁止 localhost、回环地址、私有 IP 段
 * - 通过 Cloudflare DoH 解析域名并验证解析结果
 */
async function isValidLLMUrl(url: string): Promise<boolean> {
  try {
    const parsed = new URL(url)
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return false
    const hostname = parsed.hostname
    if (hostname === 'localhost' || hostname.endsWith('.local')) return false

    // IPv4 检查
    const ipMatch = hostname.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/)
    if (ipMatch) {
      const [a, b] = [parseInt(ipMatch[1], 10), parseInt(ipMatch[2], 10)]
      if (a === 127) return false
      if (a === 10) return false
      if (a === 172 && b >= 16 && b <= 31) return false
      if (a === 192 && b === 168) return false
      if (a === 169 && b === 254) return false
      if (a >= 224) return false
      return true
    }

    // IPv6 检查
    if (hostname.includes(':')) {
      const lower = hostname.toLowerCase()
      if (lower === '::1' || lower === '0:0:0:0:0:0:0:1') return false
      if (lower.startsWith('fe80:')) return false
      if (lower.startsWith('fc') || lower.startsWith('fd')) return false
      if (lower.startsWith('ff')) return false
      if (lower.includes('::ffff:127.') || lower.includes('::ffff:7f')) return false
      return true
    }

    // 域名：通过 Cloudflare DoH 解析并验证解析结果（同时查询 A 和 AAAA 记录）
    async function queryDNS(type: 'A' | 'AAAA'): Promise<Array<{ data: string }>> {
      const dohResponse = await fetch(
        `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(hostname)}&type=${type}`,
        {
          headers: { Accept: 'application/dns-json' },
        }
      )
      if (!dohResponse.ok) return []
      const dohData = (await dohResponse.json()) as { Answer?: Array<{ data: string }> }
      return dohData.Answer ?? []
    }

    const [aAnswers, aaaaAnswers] = await Promise.all([queryDNS('A'), queryDNS('AAAA')])
    const answers = [...aAnswers, ...aaaaAnswers]

    for (const answer of answers) {
      const ip = answer.data
      // IPv4
      const parts = ip.split('.').map((p) => parseInt(p, 10))
      if (parts.length === 4) {
        const [a, b] = parts
        if (a === 127) return false
        if (a === 10) return false
        if (a === 172 && b >= 16 && b <= 31) return false
        if (a === 192 && b === 168) return false
        if (a === 169 && b === 254) return false
        if (a >= 224) return false
      }
      // IPv6
      if (ip.includes(':')) {
        const lower = ip.toLowerCase()
        if (lower === '::1' || lower === '0:0:0:0:0:0:0:1') return false
        if (lower.startsWith('fe80:')) return false
        if (lower.startsWith('fc') || lower.startsWith('fd')) return false
        if (lower.startsWith('ff')) return false
        if (lower.includes('::ffff:127.') || lower.includes('::ffff:7f')) return false
      }
    }

    return true
  } catch {
    return false
  }
}

/**
 * 带 SSRF 防护的 fetch：禁止自动重定向，手动校验重定向目标
 */
async function fetchWithSSRFProtection(
  url: string,
  init: RequestInit,
  maxRedirects = 3
): Promise<Response> {
  let currentUrl = url
  let redirects = 0

  while (redirects <= maxRedirects) {
    const response = await fetch(currentUrl, {
      ...init,
      redirect: 'manual',
    })

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('Location')
      if (!location) {
        return new Response(JSON.stringify({ error: '重定向响应缺少 Location 头' }), { status: 502 })
      }

      const newUrl = new URL(location, currentUrl).href
      if (!(await isValidLLMUrl(newUrl))) {
        return new Response(JSON.stringify({ error: '重定向目标地址不合法' }), { status: 400 })
      }

      currentUrl = newUrl
      redirects++
      continue
    }

    return response
  }

  return new Response(JSON.stringify({ error: '重定向次数过多' }), { status: 502 })
}

/**
 * 统一调用 AI API，返回原始 Response（支持流式）
 */
export async function callLLM(options: CallLLMOptions): Promise<Response> {
  const { baseUrl, apiKey, model, messages, stream = false, temperature = 0.7, max_tokens = 3000 } = options

  if (!(await isValidLLMUrl(baseUrl))) {
    return new Response(JSON.stringify({ error: '非法的 AI API 地址' }), { status: 400 })
  }

  return await fetchWithSSRFProtection(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      max_tokens,
      stream,
    }),
  })
}

/**
 * 非流式调用，返回解析后的文本内容
 * 失败时抛出异常
 */
export async function callLLMText(options: CallLLMOptions): Promise<string> {
  const response = await callLLM({ ...options, stream: false })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`模型请求失败: ${err}`)
  }

  const data = await response.json()
  return parseLLMResult(data)
}

/**
 * 构建流式 SSE Response
 */
export function createStreamResponse(response: Response): Response {
  return new Response(response.body, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}
