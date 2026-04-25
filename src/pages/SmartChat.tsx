import { useCallback } from 'react'
import { useAIStream } from '../hooks/useAI'
import { useResult } from '../context/ResultContext'
import ChatInterface from '../components/ChatInterface'
import type { ChatMessage } from '../types'
import { createChatMessage } from '../../shared/types'

export default function SmartChat() {
  const { chatMessages, setChatMessages } = useResult()

  const handleChunk = useCallback((chunk: string) => {
    setChatMessages((prev) => {
      const last = prev[prev.length - 1]
      if (last && last.role === 'assistant') {
        return [...prev.slice(0, -1), { ...last, content: last.content + chunk }]
      }
      return [...prev, createChatMessage('assistant', chunk)]
    })
  }, [setChatMessages])

  const { loading, error, execute } = useAIStream({
    endpoint: '/api/chat',
    onChunk: handleChunk,
    onDone: () => {},
  })

  const handleSend = useCallback(
    (content: string) => {
      const newMessages: ChatMessage[] = [...chatMessages, createChatMessage('user', content)]
      setChatMessages(newMessages)
      execute({ messages: newMessages })
    },
    [chatMessages, execute, setChatMessages]
  )

  const handleClear = () => {
    setChatMessages([])
  }

  return (
    <div className="max-w-3xl mx-auto animate-fade-in">
      <ChatInterface
        messages={chatMessages}
        onSend={handleSend}
        loading={loading}
        error={error}
        onClear={handleClear}
      />
    </div>
  )
}
