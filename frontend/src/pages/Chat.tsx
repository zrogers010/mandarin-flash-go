import { useState, useRef, useEffect, useCallback } from 'react'
import { Send, MessageCircle, Plus, Loader2, AlertCircle, Bot, User } from 'lucide-react'
import { chatApi } from '@/lib/api'

interface LocalMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
  isLoading?: boolean
}

export function Chat() {
  const [messages, setMessages] = useState<LocalMessage[]>([])
  const [input, setInput] = useState('')
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleNewConversation = useCallback(() => {
    setMessages([])
    setConversationId(null)
    setError(null)
    inputRef.current?.focus()
  }, [])

  const handleSend = useCallback(async () => {
    const text = input.trim()
    if (!text || isLoading) return

    setInput('')
    setError(null)

    // Add user message immediately
    const userMsg: LocalMessage = {
      id: `temp-user-${Date.now()}`,
      role: 'user',
      content: text,
      created_at: new Date().toISOString(),
    }

    // Add loading placeholder for assistant
    const loadingMsg: LocalMessage = {
      id: `temp-loading-${Date.now()}`,
      role: 'assistant',
      content: '',
      created_at: new Date().toISOString(),
      isLoading: true,
    }

    setMessages(prev => [...prev, userMsg, loadingMsg])
    setIsLoading(true)

    try {
      const response = await chatApi.sendMessage(text, conversationId || undefined)

      // Update conversation ID if this was a new conversation
      if (!conversationId) {
        setConversationId(response.conversation_id)
      }

      // Replace loading message with actual response
      setMessages(prev =>
        prev.map(msg =>
          msg.isLoading
            ? {
                id: response.message_id,
                role: 'assistant' as const,
                content: response.message,
                created_at: new Date().toISOString(),
              }
            : msg
        )
      )
    } catch (err: any) {
      // Remove loading message and show error
      setMessages(prev => prev.filter(msg => !msg.isLoading))

      if (err.response?.status === 503) {
        setError('AI chat is not currently available. The AI service needs to be configured by the administrator.')
      } else if (err.response?.status === 401) {
        setError('Please log in to use the chat feature.')
      } else {
        setError('Failed to get a response. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }, [input, isLoading, conversationId])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        handleSend()
      }
    },
    [handleSend]
  )

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Bot className="w-7 h-7 text-primary-600" />
            AI Chinese Tutor
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Practice Chinese conversation and get help with vocabulary, grammar, and more.
          </p>
        </div>
        <button
          onClick={handleNewConversation}
          className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-primary-700 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Chat
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto py-6 space-y-6">
        {messages.length === 0 ? (
          <EmptyState onSuggestionClick={(text) => { setInput(text) }} />
        ) : (
          messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Error Banner */}
      {error && (
        <div className="flex items-center gap-2 px-4 py-3 mb-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            className="ml-auto text-red-500 hover:text-red-700 font-medium"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Input Area */}
      <div className="border-t border-gray-200 pt-4 pb-2">
        <div className="flex items-end gap-3">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message... (try &quot;Teach me how to say hello&quot; or &quot;你好&quot;)"
              rows={1}
              className="w-full resize-none rounded-xl border border-gray-300 bg-white px-4 py-3 pr-12 text-gray-900 placeholder-gray-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-colors"
              style={{ minHeight: '48px', maxHeight: '120px' }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement
                target.style.height = 'auto'
                target.style.height = Math.min(target.scrollHeight, 120) + 'px'
              }}
            />
          </div>
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-2 text-center">
          Shift+Enter for new line · AI responses may not always be accurate
        </p>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// Sub-components
// ═══════════════════════════════════════════════════════════════════

function EmptyState({ onSuggestionClick }: { onSuggestionClick: (text: string) => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-4">
      <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center mb-4">
        <MessageCircle className="w-8 h-8 text-primary-600" />
      </div>
      <h2 className="text-xl font-semibold text-gray-900 mb-2">Start a Conversation</h2>
      <p className="text-gray-500 max-w-md mb-8">
        Ask me anything about Chinese! I can help with vocabulary, grammar, pronunciation, and more.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg w-full">
        {[
          { emoji: '👋', text: 'Teach me basic greetings in Chinese' },
          { emoji: '📖', text: 'Explain the difference between 的, 地, and 得' },
          { emoji: '🗣️', text: 'How do tones work in Mandarin?' },
          { emoji: '✍️', text: 'Help me practice HSK 2 vocabulary' },
        ].map((suggestion) => (
          <button
            key={suggestion.text}
            onClick={() => onSuggestionClick(suggestion.text)}
            className="flex items-center gap-2 px-4 py-3 text-left text-sm text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-xl border border-gray-200 transition-colors"
          >
            <span className="text-lg">{suggestion.emoji}</span>
            <span>{suggestion.text}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

function MessageBubble({ message }: { message: LocalMessage }) {
  const isUser = message.role === 'user'

  if (message.isLoading) {
    return (
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
          <Bot className="w-4 h-4 text-primary-600" />
        </div>
        <div className="bg-gray-100 rounded-2xl rounded-tl-md px-4 py-3">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
          isUser ? 'bg-blue-100' : 'bg-primary-100'
        }`}
      >
        {isUser ? (
          <User className="w-4 h-4 text-blue-600" />
        ) : (
          <Bot className="w-4 h-4 text-primary-600" />
        )}
      </div>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
          isUser
            ? 'bg-blue-600 text-white rounded-tr-md'
            : 'bg-gray-100 text-gray-900 rounded-tl-md'
        }`}
      >
        <div className="whitespace-pre-wrap text-sm leading-relaxed break-words">
          <FormattedContent content={message.content} isUser={isUser} />
        </div>
      </div>
    </div>
  )
}

function FormattedContent({ content, isUser }: { content: string; isUser: boolean }) {
  // Simple formatting: detect Chinese characters and style them
  // Also handle basic markdown-like formatting
  const parts = content.split(/(\n)/g)

  return (
    <>
      {parts.map((part, i) => {
        if (part === '\n') return <br key={i} />

        // Detect if the line contains Chinese characters
        const hasChinese = /[\u4e00-\u9fff]/.test(part)

        if (hasChinese && !isUser) {
          return (
            <span key={i} className="chinese-text">
              {part}
            </span>
          )
        }

        return <span key={i}>{part}</span>
      })}
    </>
  )
}
