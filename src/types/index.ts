export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface QuizQuestion {
  question: string
  options: string[]
  correctAnswer: number
  explanation: string
}

export interface QuizResult {
  score: number
  correctCount: number
  total: number
  comment: string
  results: Array<{
    question: string
    userAnswer: number
    correctAnswer: number
    isCorrect: boolean
    explanation: string
  }>
}

export interface HealthPlanFormData {
  name: string
  age: string
  gender: string
  height: string
  weight: string
  goal: string
  dietaryPreference: string
  exerciseHabit: string
  sleepQuality: string
  targetDate: string
  medicalConditions: string
  allergies: string
}

export interface ApiConfig {
  baseUrl: string
  apiKey: string
  model: string
}
