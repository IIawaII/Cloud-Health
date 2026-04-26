import { useState, useCallback, useEffect } from 'react'
import { useAIStream } from '../hooks/useAI'
import { useResult } from '../context/ResultContext'
import PlanForm from '../components/PlanForm'
import type { PlanFormData } from '../types'
import ResultCard from '../components/ResultCard'
import { FiAlertCircle } from 'react-icons/fi'

export default function PlanGenerator() {
  const { planResult, setPlanResult } = useResult()
  const [streamResult, setStreamResult] = useState(planResult)
  const [isStreaming, setIsStreaming] = useState(false)

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
        <ResultCard
          title="您的个性化健康计划"
          content=""
          loading
          loadingText="AI 生成计划中..."
          estimatedTime="预计需要 15-30 秒"
        />
      ) : streamResult ? (
        <ResultCard
          title="您的个性化健康计划"
          content={streamResult}
          isStreaming={isStreaming}
        />
      ) : null}
    </div>
  )
}
