/**
 * 结构化日志模块
 * 统一日志格式：[模块名] 级别 消息 { 上下文 }
 * 生产环境通过 Cloudflare tail 消费日志
 */

type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR'

interface LogEntry {
  timestamp: string
  module: string
  level: LogLevel
  message: string
  context?: Record<string, unknown>
}

function formatLog(entry: LogEntry): string {
  const ctx = entry.context ? ` ${JSON.stringify(entry.context)}` : ''
  return `[${entry.module}] ${entry.level} ${entry.message}${ctx}`
}

function createLogger(module: string) {
  function log(level: LogLevel, message: string, context?: Record<string, unknown>) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      module,
      level,
      message,
      context,
    }
    const formatted = formatLog(entry)

    switch (level) {
      case 'ERROR':
        console.error(formatted)
        break
      case 'WARN':
        console.warn(formatted)
        break
      default:
        console.log(formatted)
    }
  }

  return {
    debug: (msg: string, ctx?: Record<string, unknown>) => log('DEBUG', msg, ctx),
    info: (msg: string, ctx?: Record<string, unknown>) => log('INFO', msg, ctx),
    warn: (msg: string, ctx?: Record<string, unknown>) => log('WARN', msg, ctx),
    error: (msg: string, ctx?: Record<string, unknown>) => log('ERROR', msg, ctx),
  }
}

export type Logger = ReturnType<typeof createLogger>

/** 按模块创建日志实例 */
export function getLogger(module: string): Logger {
  return createLogger(module)
}
