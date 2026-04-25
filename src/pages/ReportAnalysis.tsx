import { useState, useCallback, useEffect } from 'react'
import { useAIStream } from '../hooks/useAI'
import { useResult } from '../context/ResultContext'
import FileUploader from '../components/FileUploader'
import { AnalysisResultSkeleton } from '../components/AnalysisResult'
import { FiLoader, FiAlertCircle, FiCheck, FiSearch, FiFileText } from 'react-icons/fi'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

export default function ReportAnalysis() {
  const [file, setFile] = useState<{ fileData: string; fileType: string; fileName: string } | null>(null)
  const { analysisResult, setAnalysisResult } = useResult()
  const [streamResult, setStreamResult] = useState(analysisResult)
  const [isStreaming, setIsStreaming] = useState(false)
  const [copied, setCopied] = useState(false)

  // 同步全局状态到本地
  useEffect(() => {
    setStreamResult(analysisResult)
  }, [analysisResult])

  const { loading, error, execute } = useAIStream({
    endpoint: '/api/analyze',
    onChunk: (chunk) => {
      setStreamResult((prev) => {
        const newResult = prev + chunk
        setAnalysisResult(newResult)
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

  const handleAnalyze = useCallback(() => {
    if (!file) return
    setStreamResult('')
    setAnalysisResult('')
    setIsStreaming(true)
    execute({
      fileData: file.fileData,
      fileType: file.fileType,
      fileName: file.fileName,
    })
  }, [file, execute, setAnalysisResult])

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-5">
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-card">
            <FileUploader
              onFileSelect={setFile}
              onClear={() => {
                setFile(null)
              }}
              selectedFile={file}
            />
          </div>

          <button
            onClick={handleAnalyze}
            disabled={!file || loading}
            className={`w-full py-3.5 rounded-xl text-sm font-semibold text-white transition-all flex items-center justify-center gap-2 ${
              !file || loading
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg hover:shadow-xl active:scale-[0.98]'
            }`}
          >
            {loading ? (
              <>
                <FiLoader className="w-4 h-4 animate-spin" />
                分析中...
              </>
            ) : (
              <>
                <FiSearch className="w-4 h-4" />
                开始分析
              </>
            )}
          </button>

          {error && (
            <div className="flex items-center gap-2 p-4 rounded-xl bg-danger/10 text-danger text-sm">
              <FiAlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}
        </div>

        <div>
          {loading && !streamResult ? (
            <AnalysisResultSkeleton />
          ) : streamResult ? (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-card overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                <div className="flex items-center gap-2">
                  {isStreaming ? (
                    <>
                      <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                      <h3 className="text-sm font-semibold text-foreground">正在生成...</h3>
                    </>
                  ) : (
                    <>
                      <div className="w-2 h-2 rounded-full bg-success" />
                      <h3 className="text-sm font-semibold text-foreground">分析结果</h3>
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
                        <FiFileText className="w-3.5 h-3.5" />
                        复制
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
          ) : (
            <div className="bg-white rounded-2xl border border-gray-200 border-dashed p-10 text-center h-full flex flex-col items-center justify-center min-h-[400px]">
              <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mb-4">
                <FiFileText className="w-8 h-8 text-gray-300" />
              </div>
              <p className="text-sm text-foreground-muted">
                分析结果将在此处显示
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
