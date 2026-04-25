import { useState, useCallback, useRef, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { getStoredApiConfig } from '../lib/aiConfig'
import { getApiError, parseStreamChunk, resolveErrorMessage } from '../lib/utils'

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

function buildHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  const cfg = getStoredApiConfig()
  if (cfg?.baseUrl) headers['X-AI-Base-URL'] = cfg.baseUrl
  if (cfg?.apiKey) headers['X-AI-API-Key'] = cfg.apiKey
  if (cfg?.model) headers['X-AI-Model'] = cfg.model
  return headers
}

export function useAI<T = unknown>(options: UseAIOptions<T>): UseAIReturn<T> {
  const { isAuthenticated } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<T | null>(null)

  // 使用 ref 保存 options 引用，避免 options 对象变化导致 execute 频繁重建
  const optionsRef = useRef(options)
  optionsRef.current = options

  const execute = useCallback(
    async (payload: Record<string, unknown>) => {
      if (!isAuthenticated) {
        setLoading(false)
        setResult(null)
        setError('请先登录')
        return
      }

      setLoading(true)
      setError(null)
      setResult(null)

      const currentOptions = optionsRef.current

      try {
        const response = await fetch(currentOptions.endpoint, {
          method: 'POST',
          headers: buildHeaders(),
          body: JSON.stringify(payload),
        })

        // 优先尝试直接解析 JSON，避免先转 text 再 parse 的内存开销
        let data: unknown
        const contentType = response.headers.get('content-type') || ''
        if (contentType.includes('application/json')) {
          data = await response.json()
        } else {
          const text = await response.text()
          try {
            data = JSON.parse(text)
          } catch {
            data = { error: text || `请求失败: ${response.status}` }
          }
        }

        if (!response.ok || getApiError(data)) {
          const errMsg = getApiError(data) || `请求失败: ${response.status}`
          // 502/504 通常表示后端超时或资源超限，给出更友好的提示
          if (response.status === 502 || response.status === 504) {
            throw new Error('服务器处理超时，请尝试上传较小的文件或稍后重试')
          }
          throw new Error(errMsg)
        }

        const result = data as T
        setResult(result)
        currentOptions.onSuccess?.(result)
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        setError(msg)
        currentOptions.onError?.(msg)
      } finally {
        setLoading(false)
      }
    },
    [isAuthenticated]
  )

  return { loading, error, result, execute }
}

const STREAM_TIMEOUT_MS = 120_000 // 流式请求最长 2 分钟

export function useAIStream(options: {
  endpoint: string
  onChunk: (chunk: string) => void
  onError?: (error: string) => void
  onDone?: () => void
}) {
  const { isAuthenticated, refreshSession } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort()
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  const abort = useCallback(() => {
    abortControllerRef.current?.abort()
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }, [])

  // 使用 ref 保存 options 引用，避免 options 对象变化导致 execute 频繁重建
  const optionsRef = useRef(options)
  optionsRef.current = options

  const execute = useCallback(
    async (payload: Record<string, unknown>) => {
      if (!isAuthenticated) {
        setLoading(false)
        setError('请先登录')
        return
      }

      // 取消上一个未完成的请求
      abortControllerRef.current?.abort()
      if (timeoutRef.current) clearTimeout(timeoutRef.current)

      const controller = new AbortController()
      abortControllerRef.current = controller
      timeoutRef.current = setTimeout(() => {
        controller.abort()
      }, STREAM_TIMEOUT_MS)

      setLoading(true)
      setError(null)

      const currentOptions = optionsRef.current

      async function doFetch() {
        return fetch(currentOptions.endpoint, {
          method: 'POST',
          headers: buildHeaders(),
          body: JSON.stringify({ ...payload, stream: true }),
          signal: controller.signal,
        })
      }

      try {
        let response = await doFetch()

        // 401 时尝试自动刷新会话并重试一次
        if (response.status === 401) {
          const refreshed = await refreshSession()
          if (refreshed) {
            response = await doFetch()
          } else {
            throw new Error('登录已过期，请重新登录')
          }
        }

        if (!response.ok) {
          const text = await response.text()
          throw new Error(resolveErrorMessage(response.status, text))
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
                const json: unknown = JSON.parse(trimmed.slice(6))
                const content = parseStreamChunk(json)
                if (content) {
                  currentOptions.onChunk(content)
                }
              } catch {
                // ignore malformed JSON
              }
            }
          }
        }

        currentOptions.onDone?.()
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') {
          return
        }
        const msg = err instanceof Error ? err.message : String(err)
        setError(msg)
        currentOptions.onError?.(msg)
      } finally {
        setLoading(false)
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
          timeoutRef.current = null
        }
        if (abortControllerRef.current === controller) {
          abortControllerRef.current = null
        }
      }
    },
    [isAuthenticated, refreshSession]
  )

  return { loading, error, execute, abort }
}
