import type { ChatMessage } from '../../shared/types'

export type {
  ChatMessage,
  QuizQuestion,
  QuizResult,
  ApiConfig,
} from '../../shared/types'

export interface ChatSession {
  id: string
  title: string
  messages: ChatMessage[]
  createdAt: number
  updatedAt: number
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

/** @deprecated 使用 HealthPlanFormData，保留别名以兼容旧代码 */
export type PlanFormData = HealthPlanFormData
