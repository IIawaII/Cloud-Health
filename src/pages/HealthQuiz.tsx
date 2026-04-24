import { useState, useCallback } from 'react'
import { useAI } from '../hooks/useAI'
import QuizPanel from '../components/QuizPanel'
import { FiLoader, FiPlay, FiAlertCircle } from 'react-icons/fi'
import type { QuizQuestion, QuizResult } from '../types'

interface QuizGenerateResponse {
  questions: QuizQuestion[]
}

const categories = [
  '综合健康知识',
  '营养与饮食',
  '运动健身',
  '心理健康',
  '疾病预防',
  '急救常识',
]

const difficulties = ['简单', '中等', '困难']

export default function HealthQuiz() {
  const [category, setCategory] = useState('综合健康知识')
  const [difficulty, setDifficulty] = useState('中等')
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [result, setResult] = useState<QuizResult | null>(null)

  const {
    loading: generating,
    error: generateError,
    execute: generateExecute,
  } = useAI<QuizGenerateResponse>({
    endpoint: '/api/quiz',
    onSuccess: (data) => {
      setQuestions(data.questions || [])
      setResult(null)
    },
  })

  const {
    loading: grading,
    error: gradeError,
    execute: gradeExecute,
  } = useAI<QuizResult>({
    endpoint: '/api/quiz',
    onSuccess: (data) => {
      setResult(data)
    },
  })

  const handleGenerate = useCallback(() => {
    setQuestions([])
    setResult(null)
    generateExecute({ mode: 'generate', category, difficulty })
  }, [category, difficulty, generateExecute])

  const handleSubmit = useCallback(
    (answers: number[]) => {
      gradeExecute({
        mode: 'grade',
        questions,
        userAnswers: answers,
      })
    },
    [questions, gradeExecute]
  )

  const handleRegenerate = useCallback(() => {
    setQuestions([])
    setResult(null)
  }, [])

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      {/* Controls */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-card p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              题目类别
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all appearance-none"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              难度
            </label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all appearance-none"
            >
              {difficulties.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={handleGenerate}
          disabled={generating}
          className={`w-full py-3 rounded-xl text-sm font-semibold text-white transition-all flex items-center justify-center gap-2 ${
            generating
              ? 'bg-gray-300 cursor-not-allowed'
              : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 shadow-lg hover:shadow-xl active:scale-[0.98]'
          }`}
        >
          {generating ? (
            <>
              <FiLoader className="w-4 h-4 animate-spin" />
              正在生成题目...
            </>
          ) : (
            <>
              <FiPlay className="w-4 h-4" />
              生成题目
            </>
          )}
        </button>

        {(generateError || gradeError) && (
          <div className="mt-4 flex items-center gap-2 p-4 rounded-xl bg-danger/10 text-danger text-sm">
            <FiAlertCircle className="w-4 h-4 flex-shrink-0" />
            {generateError || gradeError}
          </div>
        )}
      </div>

      {/* Quiz Content */}
      {(questions.length > 0 || result) && (
        <QuizPanel
          questions={questions}
          onSubmit={handleSubmit}
          result={result}
          loading={grading}
          onRegenerate={handleRegenerate}
        />
      )}
    </div>
  )
}
