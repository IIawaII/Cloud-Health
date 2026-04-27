const DB_NAME = 'cloud-health-cache'
const DB_VERSION = 1
const STORE_NAME = 'cache-store'

interface CacheEntry<T> {
  key: string
  value: T
  timestamp: number
  ttl: number // TTL in milliseconds
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'key' })
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function setCache<T>(key: string, value: T, ttlMs: number = 3600_000): Promise<void> {
  try {
    const db = await openDB()
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const entry: CacheEntry<T> = {
      key,
      value,
      timestamp: Date.now(),
      ttl: ttlMs,
    }
    store.put(entry)
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  } catch {
    // IndexedDB 不可用时静默降级
  }
}

export async function getCache<T>(key: string): Promise<T | null> {
  try {
    const db = await openDB()
    const tx = db.transaction(STORE_NAME, 'readonly')
    const store = tx.objectStore(STORE_NAME)
    const request = store.get(key)
    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        const entry = request.result as CacheEntry<T> | undefined
        if (!entry) return resolve(null)
        // 检查是否过期
        if (Date.now() - entry.timestamp > entry.ttl) {
          // 异步删除过期条目
          deleteCache(key).catch(() => {})
          return resolve(null)
        }
        resolve(entry.value)
      }
      request.onerror = () => reject(request.error)
    })
  } catch {
    return null
  }
}

export async function deleteCache(key: string): Promise<void> {
  try {
    const db = await openDB()
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    store.delete(key)
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  } catch {
    // 静默降级
  }
}

export async function clearAllCache(): Promise<void> {
  try {
    const db = await openDB()
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    store.clear()
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  } catch {
    // 静默降级
  }
}

/** 获取缓存存储使用量估算 */
export async function getStorageUsage(): Promise<{ count: number; estimatedSize: number }> {
  try {
    const db = await openDB()
    const tx = db.transaction(STORE_NAME, 'readonly')
    const store = tx.objectStore(STORE_NAME)
    const countRequest = store.count()
    const allRequest = store.getAll()
    return new Promise((resolve, reject) => {
      allRequest.onsuccess = () => {
        const entries = allRequest.result as CacheEntry<unknown>[]
        const estimatedSize = entries.reduce((size, entry) => {
          return size + JSON.stringify(entry).length
        }, 0)
        resolve({ count: countRequest.result, estimatedSize })
      }
      allRequest.onerror = () => reject(allRequest.error)
    })
  } catch {
    return { count: 0, estimatedSize: 0 }
  }
}
