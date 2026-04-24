import { useState, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { getStoredApiConfig } from '../lib/aiConfig'

interface UseAIOptions<T> {
  endpoint: string
  onSuccess?: (data: T) => void
  onError?: (error: string) => void
}

interface UseAIReturn<T> {
  loading: boolean
  error: string | null
  result: T | null
  execute: (payload: Record<string, unknown>) => Promise<void>
}

function buildHeaders(token: string): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  }
  const cfg = getStoredApiConfig()
  if (cfg?.baseUrl) headers['X-AI-Base-URL'] = cfg.baseUrl
  if (cfg?.apiKey) headers['X-AI-API-Key'] = cfg.apiKey
  if (cfg?.model) headers['X-AI-Model'] = cfg.model
  return headers
}

export function useAI<T = unknown>(options: UseAIOptions<T>): UseAIReturn<T> {
  const { token } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<T | null>(null)

  const execute = useCallback(
    async (payload: Record<string, unknown>) => {
      if (!token) {
        setError('请先登录')
        return
      }

      setLoading(true)
      setError(null)
      setResult(null)

      try {
        const response = await fetch(options.endpoint, {
          method: 'POST',
          headers: buildHeaders(token),
          body: JSON.stringify(payload),
        })

        const data = (await response.json()) as { error?: string } & T

        if (!response.ok || data.error) {
          throw new Error(data.error || `请求失败: ${response.status}`)
        }

        setResult(data as T)
        options.onSuccess?.(data as T)
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        setError(msg)
        options.onError?.(msg)
      } finally {
        setLoading(false)
      }
    },
    [token, options]
  )

  return { loading, error, result, execute }
}

export function useAIStream(options: {
  endpoint: string
  onChunk: (chunk: string) => void
  onError?: (error: string) => void
  onDone?: () => void
}) {
  const { token } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const execute = useCallback(
    async (payload: Record<string, unknown>) => {
      if (!token) {
        setError('请先登录')
        return
      }

      setLoading(true)
      setError(null)

      try {
        const response = await fetch(options.endpoint, {
          method: 'POST',
          headers: buildHeaders(token),
          body: JSON.stringify({ ...payload, stream: true }),
        })

        if (!response.ok) {
          const data = (await response.json()) as { error?: string }
          throw new Error(data.error || `请求失败: ${response.status}`)
        }

        const reader = response.body?.getReader()
        const decoder = new TextDecoder()

        if (!reader) {
          throw new Error('无法读取响应流')
        }

        let buffer = ''
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() || ''

          for (const line of lines) {
            const trimmed = line.trim()
            if (!trimmed || trimmed === 'data: [DONE]') continue
            if (trimmed.startsWith('data: ')) {
              try {
                const json = JSON.parse(trimmed.slice(6)) as {
                  choices?: Array<{ delta?: { content?: string } }>
                }
                const content = json.choices?.[0]?.delta?.content
                if (content) {
                  options.onChunk(content)
                }
              } catch {
                // ignore malformed JSON
              }
            }
          }
        }

        options.onDone?.()
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        setError(msg)
        options.onError?.(msg)
      } finally {
        setLoading(false)
      }
    },
    [token, options]
  )

  return { loading, error, execute }
}
