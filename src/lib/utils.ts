import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function isFutureDate(dateStr: string): boolean {
  if (!dateStr) return false
  const inputDate = new Date(dateStr)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return inputDate >= today
}

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      resolve(result)
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export function readTextFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsText(file)
  })
}

export function validateFile(
  file: File,
  allowedTypes: string[],
  maxSizeMB: number
): { valid: boolean; error?: string } {
  const maxSizeBytes = maxSizeMB * 1024 * 1024
  if (file.size > maxSizeBytes) {
    return { valid: false, error: `文件大小不能超过 ${maxSizeMB}MB` }
  }

  const isAllowed = allowedTypes.some((type) => {
    if (type.endsWith('/*')) {
      return file.type.startsWith(type.replace('/*', ''))
    }
    return file.type === type
  })

  if (!isAllowed) {
    return { valid: false, error: `不支持的文件类型: ${file.type}` }
  }

  return { valid: true }
}

export function isApiError(data: unknown): data is { error: string } {
  return (
    typeof data === 'object' &&
    data !== null &&
    'error' in data &&
    typeof (data as Record<string, unknown>).error === 'string'
  )
}

export function getApiError(data: unknown): string | undefined {
  return isApiError(data) ? data.error : undefined
}

export function getStringField(data: unknown, field: string): string | undefined {
  if (typeof data !== 'object' || data === null) return undefined
  const value = (data as Record<string, unknown>)[field]
  return typeof value === 'string' ? value : undefined
}

export function getObjectField(data: unknown, field: string): Record<string, unknown> | undefined {
  if (typeof data !== 'object' || data === null) return undefined
  const value = (data as Record<string, unknown>)[field]
  return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : undefined
}

export function parseStreamChunk(data: unknown): string | undefined {
  if (typeof data !== 'object' || data === null) return undefined
  const choices = (data as Record<string, unknown>).choices
  if (!Array.isArray(choices)) return undefined
  const first = choices[0] as Record<string, unknown> | undefined
  if (!first) return undefined
  const delta = first.delta as Record<string, unknown> | undefined
  if (!delta) return undefined
  return typeof delta.content === 'string' ? delta.content : undefined
}

export function resolveErrorMessage(status: number, serverText: string): string {
  if (status === 503) {
    return 'AI 服务未配置，请在设置中填写 API 信息或联系管理员'
  }
  if (status === 502 || status === 504) {
    return '服务器处理超时，请尝试上传较小的文件或稍后重试'
  }
  try {
    const data = JSON.parse(serverText)
    return isApiError(data) ? data.error : `请求失败: ${status}`
  } catch {
    return serverText || `请求失败: ${status}`
  }
}
