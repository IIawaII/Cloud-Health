import { useState, useCallback, useEffect } from 'react'
import { useAIStream } from '../hooks/useAI'
import { useResult } from '../context/ResultContext'
import PlanForm from '../components/PlanForm'
import type { PlanFormData } from '../components/PlanForm'
import { FiAlertCircle, FiCheck, FiClock, FiActivity, FiClipboard } from 'react-icons/fi'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'



// 加载中状态组件
function PlanResultSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-card overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
        <div className="flex items-center gap-2">
          <FiActivity className="w-4 h-4 text-primary animate-pulse" />
          <h3 className="text-sm font-semibold text-foreground">AI 生成计划中...</h3>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-foreground-muted">
          <FiClock className="w-3.5 h-3.5" />
          预计需要 15-30 秒
        </div>
      </div>
      <div className="p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">正在制定个性化方案...</p>
            <p className="text-xs text-foreground-muted">AI 正在分析您的健康数据</p>
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

export default function PlanGenerator() {
  const { planResult, setPlanResult } = useResult()
  const [streamResult, setStreamResult] = useState(planResult)
  const [isStreaming, setIsStreaming] = useState(false)
  const [copied, setCopied] = useState(false)

  // 同步全局状态到本地
  useEffect(() => {
    setStreamResult(planResult)
  }, [planResult])

  const { loading, error, execute } = useAIStream({
    endpoint: '/api/plan',
    onChunk: (chunk) => {
      setStreamResult((prev) => {
        const newResult = prev + chunk
        setPlanResult(newResult)
        return newResult
      })
    },
    onError: () => {
      setIsStreaming(false)
    },
    onDone: () => {
      setIsStreaming(false)
    },
  })

  const handleSubmit = useCallback(
    (formData: PlanFormData) => {
      setStreamResult('')
      setPlanResult('')
      setIsStreaming(true)
      execute({ formData })
    },
    [execute, setPlanResult]
  )

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <PlanForm onSubmit={handleSubmit} loading={loading} />

      {error && (
        <div className="flex items-center gap-2 p-4 rounded-xl bg-danger/10 text-danger text-sm">
          <FiAlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {loading && !streamResult ? (
        <PlanResultSkeleton />
      ) : streamResult ? (
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
                  <h3 className="text-sm font-semibold text-foreground">您的个性化健康计划</h3>
                </>
              )}
            </div>
            {!isStreaming && (
              <button
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(streamResult)
                    setCopied(true)
                    setTimeout(() => setCopied(false), 2000)
                  } catch {
                    // 复制失败静默处理
                  }
                }}
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
                    <FiClipboard className="w-3.5 h-3.5" />
                    复制结果
                  </>
                )}
              </button>
            )}
          </div>
          <div className="p-6">
            <div className="prose prose-sm max-w-none prose-headings:text-foreground prose-p:text-foreground-muted prose-strong:text-foreground prose-li:text-foreground-muted">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {streamResult}
              </ReactMarkdown>
              {isStreaming && (
                <span className="inline-block w-2 h-4 bg-primary ml-1 animate-pulse" />
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
