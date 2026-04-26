import { useState } from 'react'
import { FiCheck, FiFileText, FiActivity, FiClock } from 'react-icons/fi'
import MarkdownRenderer from './MarkdownRenderer'

interface ResultCardProps {
  title: string
  content: string
  isStreaming?: boolean
  loading?: boolean
  loadingText?: string
  estimatedTime?: string
}

export function ResultCardSkeleton({ loadingText, estimatedTime }: {
  title: string
  loadingText?: string
  estimatedTime?: string
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-card overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
        <div className="flex items-center gap-2">
          <FiActivity className="w-4 h-4 text-primary animate-pulse" />
          <h3 className="text-sm font-semibold text-foreground">{loadingText || 'AI 生成中...'}</h3>
        </div>
        {estimatedTime && (
          <div className="flex items-center gap-1.5 text-xs text-foreground-muted">
            <FiClock className="w-3.5 h-3.5" />
            {estimatedTime}
          </div>
        )}
      </div>
      <div className="p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">正在处理...</p>
            <p className="text-xs text-foreground-muted">AI 正在分析数据</p>
          </div>
        </div>
        <div className="space-y-3">
          <div className="h-4 bg-gray-100 rounded animate-pulse w-1/3" />
          <div className="h-3 bg-gray-100 rounded animate-pulse w-full" />
          <div className="h-3 bg-gray-100 rounded animate-pulse w-5/6" />
          <div className="h-3 bg-gray-100 rounded animate-pulse w-4/5" />
          <div className="h-4 bg-gray-100 rounded animate-pulse w-1/4 mt-4" />
          <div className="h-3 bg-gray-100 rounded animate-pulse w-full" />
          <div className="h-3 bg-gray-100 rounded animate-pulse w-3/4" />
        </div>
      </div>
    </div>
  )
}

export default function ResultCard({ title, content, isStreaming, loading }: ResultCardProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // 复制失败静默处理
    }
  }

  if (loading) {
    return <ResultCardSkeleton title={title} />
  }

  if (!content) return null

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-card overflow-hidden animate-fade-in">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
        <div className="flex items-center gap-2">
          {isStreaming ? (
            <>
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <h3 className="text-sm font-semibold text-foreground">正在生成...</h3>
            </>
          ) : (
            <>
              <FiCheck className="w-5 h-5 text-success" />
              <h3 className="text-sm font-semibold text-foreground">{title}</h3>
            </>
          )}
        </div>
        {!isStreaming && (
          <button
            onClick={handleCopy}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
              copied
                ? 'text-success bg-success/10'
                : 'text-foreground-muted hover:text-primary hover:bg-primary-50'
            }`}
          >
            {copied ? (
              <>
                <FiCheck className="w-3.5 h-3.5" />
                已复制
              </>
            ) : (
              <>
                <FiFileText className="w-3.5 h-3.5" />
                复制
              </>
            )}
          </button>
        )}
      </div>
      <div className="p-6">
        <MarkdownRenderer content={content} />
        {isStreaming && (
          <span className="inline-block w-2 h-4 bg-primary ml-1 animate-pulse" />
        )}
      </div>
    </div>
  )
}
