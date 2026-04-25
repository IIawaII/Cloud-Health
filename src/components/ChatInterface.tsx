import { useState, useRef, useEffect } from 'react'
import { FiSend, FiLoader, FiAlertCircle, FiSmile, FiHelpCircle, FiTrash2, FiX, FiMessageSquare, FiRotateCcw, FiInfo } from 'react-icons/fi'
import { useAuth } from '../context/AuthContext'
import { getAvatarDisplayUrl } from '@/lib/avatar'
import type { ChatMessage } from '../types'
import MarkdownRenderer from './MarkdownRenderer'

interface ChatInterfaceProps {
  messages: ChatMessage[]
  onSend: (content: string) => void
  loading: boolean
  error: string | null
  onClear?: () => void
}

export default function ChatInterface({ messages, onSend, loading, error, onClear }: ChatInterfaceProps) {
  const { user } = useAuth()
  const [input, setInput] = useState('')
  const [showHelp, setShowHelp] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSubmit = () => {
    if (!input.trim() || loading) return
    onSend(input.trim())
    setInput('')
    if (inputRef.current) {
      inputRef.current.style.height = 'auto'
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const handleInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
    const target = e.currentTarget
    target.style.height = 'auto'
    target.style.height = `${Math.min(target.scrollHeight, 160)}px`
  }

  const handleClear = () => {
    setShowConfirm(true)
  }

  const confirmClear = () => {
    setShowConfirm(false)
    onClear?.()
  }

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] max-h-[800px] bg-white rounded-2xl border border-gray-200 shadow-card overflow-hidden relative">
      {/* Help Modal */}
      {showHelp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-md transition-opacity" onClick={() => setShowHelp(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-modal-pop border border-gray-100">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-primary-50 to-white">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary text-white flex items-center justify-center shadow-sm">
                  <FiHelpCircle className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-foreground leading-tight">使用帮助</h2>
                  <p className="text-xs text-foreground-subtle mt-0.5">快速上手智能对话</p>
                </div>
              </div>
              <button
                onClick={() => setShowHelp(false)}
                className="p-2 rounded-xl text-foreground-muted hover:bg-gray-100 hover:text-foreground transition-all"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-3">
              {[
                { icon: FiSend, text: '在下方输入框中输入您的健康问题，按 Enter 发送' },
                { icon: FiMessageSquare, text: '支持多轮对话，AI 会结合上下文回答您的问题' },
                { icon: FiRotateCcw, text: '点击"清空对话"可清除所有聊天记录' },
                { icon: FiInfo, text: 'AI 生成内容仅供参考，不能替代专业医疗建议' },
              ].map((item, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-background-secondary border border-gray-50 hover:border-primary/20 hover:bg-primary-50/30 transition-colors">
                  <div className="w-7 h-7 rounded-lg bg-white border border-gray-100 text-primary flex items-center justify-center flex-shrink-0 shadow-sm mt-0.5">
                    <item.icon className="w-3.5 h-3.5" />
                  </div>
                  <p className="text-sm text-foreground-muted leading-relaxed">{item.text}</p>
                </div>
              ))}
            </div>
            <div className="px-6 pb-6">
              <button
                onClick={() => setShowHelp(false)}
                className="w-full py-2.5 rounded-xl text-sm font-semibold text-white bg-primary hover:bg-primary-700 hover:shadow-lg hover:shadow-primary/20 active:scale-[0.97] transition-all"
              >
                知道了
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Clear Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-md transition-opacity" onClick={() => setShowConfirm(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-modal-pop border border-gray-100">
            <div className="pt-8 pb-4 px-6 text-center">
              <div className="w-14 h-14 rounded-2xl bg-red-50 text-danger flex items-center justify-center mx-auto mb-4 shadow-sm border border-red-100">
                <FiTrash2 className="w-7 h-7" />
              </div>
              <h2 className="text-lg font-semibold text-foreground">确认清空对话？</h2>
            </div>
            <div className="px-6 pb-2 text-center">
              <p className="text-sm text-foreground-muted leading-relaxed">
                确定要清空所有对话记录吗？<br />此操作不可恢复。
              </p>
            </div>
            <div className="px-6 py-6 flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-foreground-muted bg-gray-100 hover:bg-gray-200 active:scale-[0.97] transition-all"
              >
                取消
              </button>
              <button
                onClick={confirmClear}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-danger hover:bg-red-600 hover:shadow-lg hover:shadow-red-500/20 active:scale-[0.97] transition-all"
              >
                确认清空
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center px-8">
            <div className="w-16 h-16 rounded-2xl bg-primary-50 flex items-center justify-center mb-4">
              <FiSmile className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-base font-semibold text-foreground mb-2">智能健康顾问</h3>
            <p className="text-sm text-foreground-muted max-w-sm">
              我是您的 AI 健康顾问，可以回答健康相关问题、提供养生建议、解读医学知识。请问有什么可以帮您的？
            </p>
          </div>
        )}

        {messages.map((msg, idx) => (
          <div
            key={msg.id ?? idx}
            className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''} animate-fade-in`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden ${
                msg.role === 'user'
                  ? 'bg-gray-100'
                  : 'bg-gray-100 text-foreground-muted'
              }`}
            >
              {msg.role === 'user' ? (
                <img
                  src={getAvatarDisplayUrl(user?.avatar || localStorage.getItem('user_avatar') || undefined)}
                  alt="avatar"
                  className="w-full h-full"
                />
              ) : (
                <img
                  src="/Doctor.svg"
                  alt="AI"
                  className="w-full h-full"
                />
              )}
            </div>
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed break-words ${
                msg.role === 'user'
                  ? 'bg-primary text-white rounded-tr-sm'
                  : 'bg-gray-50 text-foreground-muted rounded-tl-sm border border-gray-100 prose prose-sm !max-w-[80%] prose-headings:text-foreground prose-p:text-foreground-muted prose-strong:text-foreground prose-li:text-foreground-muted'
              }`}
            >
              {msg.role === 'user' ? (
                msg.content.split('\n').map((line, i) => (
                  <p key={i} className={line.trim() === '' ? 'h-2' : ''}>
                    {line}
                  </p>
                ))
              ) : (
                <MarkdownRenderer content={msg.content} />
              )}
            </div>
          </div>
        ))}

        {loading && messages.length > 0 && messages[messages.length - 1].role === 'user' && (
          <div className="flex gap-3 animate-fade-in">
            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
              <img src="/Doctor.svg" alt="AI" className="w-full h-full" />
            </div>
            <div className="bg-gray-50 border border-gray-100 rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse-soft" />
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse-soft" style={{ animationDelay: '0.2s' }} />
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse-soft" style={{ animationDelay: '0.4s' }} />
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-danger/10 text-danger text-sm mx-4">
            <FiAlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-100 p-4 bg-white">
        <div className="flex items-center justify-start gap-2 mb-2">
          <button
            onClick={() => setShowHelp(true)}
            className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium text-foreground-muted hover:text-primary hover:bg-primary-50 transition-all"
            title="帮助"
          >
            <FiHelpCircle className="w-3.5 h-3.5" />
            帮助
          </button>
          <button
            onClick={handleClear}
            className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium text-foreground-muted hover:text-red-600 hover:bg-red-50 transition-all"
            title="清空对话"
          >
            <FiTrash2 className="w-3.5 h-3.5" />
            清空对话
          </button>
        </div>
        <div className="flex items-end gap-3">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onInput={handleInput}
            placeholder="输入您的问题，按 Enter 发送..."
            rows={1}
            className="flex-1 px-4 py-3 rounded-xl border border-gray-200 bg-background text-sm text-foreground placeholder:text-foreground-subtle focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none min-h-[44px] max-h-[160px] transition-all scrollbar-hide"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          />
          <button
            onClick={handleSubmit}
            disabled={!input.trim() || loading}
            className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all flex-shrink-0 ${
              !input.trim() || loading
                ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                : 'bg-primary text-white hover:bg-primary-700 shadow-md active:scale-95'
            }`}
          >
            {loading ? <FiLoader className="w-5 h-5 animate-spin" /> : <FiSend className="w-5 h-5" />}
          </button>
        </div>
        <p className="mt-2 text-xs text-center text-foreground-subtle">
          AI 生成内容仅供参考，不能替代专业医疗建议
        </p>
      </div>
    </div>
  )
}
