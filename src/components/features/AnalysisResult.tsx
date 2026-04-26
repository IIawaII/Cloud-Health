import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FiClipboard, FiCheck, FiClock, FiActivity } from 'react-icons/fi'
import MarkdownRenderer from '../chat/MarkdownRenderer'

interface AnalysisResultProps {
  result: string
}

export default function AnalysisResult({ result }: AnalysisResultProps) {
  const { t } = useTranslation()
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(result)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // 复制失败静默处理
    }
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-card dark:shadow-card-dark overflow-hidden animate-fade-in transition-colors">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-700/50">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-success" />
          <h3 className="text-sm font-semibold text-foreground dark:text-foreground-dark">
            {t('analysis.title')}
          </h3>
        </div>
        <button
          onClick={handleCopy}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
            copied
              ? 'text-success bg-success/10'
              : 'text-foreground-muted dark:text-foreground-dark-muted hover:text-primary hover:bg-primary-50 dark:hover:bg-primary-900/20'
          }`}
        >
          {copied ? (
            <>
              <FiCheck className="w-3.5 h-3.5" />
              {t('analysis.copied')}
            </>
          ) : (
            <>
              <FiClipboard className="w-3.5 h-3.5" />
              {t('analysis.copyButton')}
            </>
          )}
        </button>
      </div>
      <div className="p-6">
        <MarkdownRenderer content={result} />
      </div>
    </div>
  )
}

// 加载中状态组件
export function AnalysisResultSkeleton() {
  const { t } = useTranslation()

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-card dark:shadow-card-dark overflow-hidden transition-colors">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-700/50">
        <div className="flex items-center gap-2">
          <FiActivity className="w-4 h-4 text-primary animate-pulse" />
          <h3 className="text-sm font-semibold text-foreground dark:text-foreground-dark">
            {t('analysis.skeleton.title')}
          </h3>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-foreground-muted dark:text-foreground-dark-muted">
          <FiClock className="w-3.5 h-3.5" />
          {t('analysis.skeleton.estimatedTime')}
        </div>
      </div>
      <div className="p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground dark:text-foreground-dark">
              {t('analysis.skeleton.status')}
            </p>
            <p className="text-xs text-foreground-muted dark:text-foreground-dark-muted">
              {t('analysis.skeleton.statusDesc')}
            </p>
          </div>
        </div>
        <div className="space-y-2">
          <div className="h-3 bg-gray-100 dark:bg-slate-700 rounded animate-pulse w-3/4" />
          <div className="h-3 bg-gray-100 dark:bg-slate-700 rounded animate-pulse w-1/2" />
          <div className="h-3 bg-gray-100 dark:bg-slate-700 rounded animate-pulse w-5/6" />
          <div className="h-3 bg-gray-100 dark:bg-slate-700 rounded animate-pulse w-2/3" />
        </div>
      </div>
    </div>
  )
}
