import { useState, useCallback } from 'react'
import { useAIStream } from '../hooks/useAI'
import { useResult } from '../context/ResultContext'
import ChatInterface from '../components/ChatInterface'
import type { ChatMessage } from '../types'

export default function SmartChat() {
  const { chatMessages, setChatMessages } = useResult()
  const [messages, setMessages] = useState<ChatMessage[]>(chatMessages)

  const handleChunk = useCallback((chunk: string) => {
    setMessages((prev) => {
      const last = prev[prev.length - 1]
      let newMessages: ChatMessage[]
      if (last && last.role === 'assistant') {
        newMessages = [...prev.slice(0, -1), { ...last, content: last.content + chunk }]
      } else {
        newMessages = [...prev, { role: 'assistant', content: chunk }]
      }
      setChatMessages(newMessages)
      return newMessages
    })
  }, [setChatMessages])

  const { loading, error, execute } = useAIStream({
    endpoint: '/api/chat',
    onChunk: handleChunk,
    onDone: () => {},
  })

  const handleSend = useCallback(
    (content: string) => {
      const newMessages: ChatMessage[] = [...messages, { role: 'user', content }]
      setMessages(newMessages)
      setChatMessages(newMessages)
      execute({ messages: newMessages })
    },
    [messages, execute, setChatMessages]
  )

  const handleClear = () => {
    setMessages([])
    setChatMessages([])
  }

  return (
    <div className="max-w-3xl mx-auto animate-fade-in">
      <ChatInterface
        messages={messages}
        onSend={handleSend}
        loading={loading}
        error={error}
        onClear={handleClear}
      />
    </div>
  )
}
