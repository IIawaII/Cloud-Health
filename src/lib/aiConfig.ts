import type { ApiConfig } from '@/types'

const STORAGE_KEY = 'health_ai_config'

function encode(str: string): string {
  try {
    return btoa(encodeURIComponent(str))
  } catch {
    return str
  }
}

function decode(str: string): string {
  try {
    return decodeURIComponent(atob(str))
  } catch {
    return str
  }
}

export function getStoredApiConfig(): ApiConfig | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Record<string, string>
    return {
      baseUrl: parsed.baseUrl ? decode(parsed.baseUrl) : '',
      apiKey: parsed.apiKey ? decode(parsed.apiKey) : '',
      model: parsed.model ? decode(parsed.model) : '',
    }
  } catch {
    return null
  }
}

export function saveApiConfig(config: ApiConfig): void {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      baseUrl: encode(config.baseUrl),
      apiKey: encode(config.apiKey),
      model: encode(config.model),
    })
  )
}

export function clearApiConfig(): void {
  localStorage.removeItem(STORAGE_KEY)
}

export function hasStoredApiConfig(): boolean {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return false
    const parsed = JSON.parse(raw) as Record<string, string>
    return !!parsed.baseUrl && !!parsed.apiKey && !!parsed.model
  } catch {
    return false
  }
}
