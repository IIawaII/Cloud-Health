import { useState } from 'react'
import { FiCheck, FiX, FiHelpCircle, FiArrowRight, FiRotateCcw, FiAward } from 'react-icons/fi'
import type { QuizQuestion, QuizResult } from '../types'

interface QuizPanelProps {
  questions: QuizQuestion[]
  onSubmit: (answers: number[]) => void
  result: QuizResult | null
  loading: boolean
  onRegenerate: () => void
}

export default function QuizPanel({ questions, onSubmit, result, loading, onRegenerate }: QuizPanelProps) {
  const [answers, setAnswers] = useState<number[]>([])
  const [submitted, setSubmitted] = useState(false)

  const handleSelect = (questionIdx: number, optionIdx: number) => {
    if (submitted || result) return
    setAnswers((prev) => {
      const next = [...prev]
      next[questionIdx] = optionIdx
      return next
    })
  }

  const handleSubmit = () => {
    if (answers.length < questions.length) return
    setSubmitted(true)
    onSubmit(answers)
  }

  const handleRetry = () => {
    setAnswers([])
    setSubmitted(false)
    onRegenerate()
  }

  if (result) {
    return (
      <div className="space-y-6 animate-fade-in">
        {/* Score Card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-card p-8 text-center">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center mx-auto mb-4 shadow-lg">
            <FiAward className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-foreground mb-1">{result.score} 分</h2>
          <p className="text-sm text-foreground-muted mb-4">
            答对 {result.correctCount} / {result.total} 题
          </p>
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-primary-50 text-primary-600 text-sm font-medium">
            {result.comment}
          </div>
        </div>

        {/* Results Detail */}
        <div className="space-y-4">
          {result.results.map((res, idx) => (
            <div
              key={idx}
              className={`bg-white rounded-2xl border shadow-card overflow-hidden ${
                res.isCorrect ? 'border-success/30' : 'border-danger/30'
              }`}
            >
              <div
                className={`flex items-center gap-3 px-5 py-3 ${
                  res.isCorrect ? 'bg-success/5' : 'bg-danger/5'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center ${
                    res.isCorrect ? 'bg-success text-white' : 'bg-danger text-white'
                  }`}
                >
                  {res.isCorrect ? <FiCheck className="w-4 h-4" /> : <FiX className="w-4 h-4" />}
                </div>
                <span className="text-sm font-medium text-foreground">
                  第 {idx + 1} 题
                </span>
                <span className="text-xs text-foreground-subtle ml-auto">
                  您的答案：{String.fromCharCode(65 + res.userAnswer)} | 正确答案：
                  {String.fromCharCode(65 + res.correctAnswer)}
                </span>
              </div>
              <div className="px-5 py-4">
                <p className="text-sm text-foreground mb-2">{res.question}</p>
                <div className="p-3 rounded-xl bg-gray-50 text-sm text-foreground-muted">
                  <span className="font-medium text-primary">解析：</span>
                  {res.explanation}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center">
          <button
            onClick={handleRetry}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium text-white bg-primary hover:bg-primary-700 shadow-lg active:scale-95 transition-all"
          >
            <FiRotateCcw className="w-4 h-4" />
            再试一次
          </button>
        </div>
      </div>
    )
  }

  if (questions.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-4">
          <FiHelpCircle className="w-8 h-8 text-gray-300" />
        </div>
        <p className="text-sm text-foreground-muted">点击上方按钮生成题目</p>
      </div>
    )
  }

  const allAnswered = answers.length === questions.length

  return (
    <div className="space-y-6">
      {questions.map((q, qIdx) => (
        <div
          key={qIdx}
          className="bg-white rounded-2xl border border-gray-200 shadow-card p-6 animate-fade-in"
          style={{ animationDelay: `${qIdx * 0.05}s` }}
        >
          <div className="flex items-start gap-3 mb-4">
            <span className="w-7 h-7 rounded-full bg-primary-50 text-primary-600 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
              {qIdx + 1}
            </span>
            <h3 className="text-sm font-medium text-foreground leading-relaxed">
              {q.question}
            </h3>
          </div>

          <div className="space-y-2 ml-10">
            {q.options.map((opt, oIdx) => {
              const isSelected = answers[qIdx] === oIdx
              return (
                <button
                  key={oIdx}
                  onClick={() => handleSelect(qIdx, oIdx)}
                  disabled={submitted}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-left transition-all ${
                    isSelected
                      ? 'bg-primary-50 border-2 border-primary text-primary'
                      : 'bg-gray-50 border-2 border-transparent text-foreground-muted hover:bg-gray-100'
                  }`}
                >
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 ${
                      isSelected
                        ? 'bg-primary text-white'
                        : 'bg-white border border-gray-200 text-foreground-subtle'
                    }`}
                  >
                    {String.fromCharCode(65 + oIdx)}
                  </span>
                  {opt}
                </button>
              )
            })}
          </div>
        </div>
      ))}

      <div className="flex items-center justify-between">
        <p className="text-sm text-foreground-muted">
          已答 {answers.length} / {questions.length} 题
        </p>
        <button
          onClick={handleSubmit}
          disabled={!allAnswered || loading || submitted}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium text-white transition-all ${
            !allAnswered || loading || submitted
              ? 'bg-gray-300 cursor-not-allowed'
              : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 shadow-lg active:scale-95'
          }`}
        >
          {loading ? '提交中...' : '提交答案'}
          <FiArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
