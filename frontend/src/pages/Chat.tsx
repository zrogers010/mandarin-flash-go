import { useState, useRef, useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Bot, Send, Sparkles, LogIn, MailCheck, User as UserIcon, RotateCcw } from 'lucide-react'
import { chatApi } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import { SEO } from '@/components/SEO'

interface Bubble {
	role: 'user' | 'assistant'
	content: string
}

const STARTERS = [
	'How do I use 了 correctly?',
	'What\'s the difference between 会, 能 and 可以?',
	'Give me a simple HSK 2 conversation to practice',
	'Explain measure words with examples',
]

export function Chat() {
	const { isAuthenticated, user, resendVerification } = useAuth()
	const queryClient = useQueryClient()
	const [messages, setMessages] = useState<Bubble[]>([])
	const [input, setInput] = useState('')
	const [conversationId, setConversationId] = useState<string | undefined>()
	const [errorText, setErrorText] = useState<string | null>(null)
	const [resent, setResent] = useState(false)
	const bottomRef = useRef<HTMLDivElement>(null)

	const verified = isAuthenticated && user?.is_verified

	const { data: usage } = useQuery({
		queryKey: ['chat-usage'],
		queryFn: () => chatApi.getUsage(),
		enabled: !!verified,
		staleTime: 30 * 1000,
		retry: false,
	})

	const sendMutation = useMutation({
		mutationFn: ({ message, convId }: { message: string; convId?: string }) =>
			chatApi.sendMessage(message, convId),
		onSuccess: (data) => {
			setMessages((m) => [...m, { role: 'assistant', content: data.message }])
			setConversationId(data.conversation_id)
			queryClient.invalidateQueries({ queryKey: ['chat-usage'] })
		},
		onError: (err: any) => {
			const status = err?.response?.status
			const serverMsg = err?.response?.data?.error
			if (status === 429) {
				setErrorText(serverMsg || 'You\'ve used all your free tutor messages for today. Come back tomorrow!')
				queryClient.invalidateQueries({ queryKey: ['chat-usage'] })
			} else if (status === 503) {
				setErrorText('The AI tutor is temporarily unavailable. Please try again later.')
			} else {
				setErrorText(serverMsg || 'Something went wrong. Please try again.')
			}
		},
	})

	useEffect(() => {
		bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
	}, [messages, sendMutation.isPending])

	const remaining =
		usage && usage.quota_limit > 0 ? Math.max(0, usage.quota_limit - usage.quota_used) : null
	const quotaExhausted = remaining !== null && remaining <= 0

	const send = (text: string) => {
		const trimmed = text.trim()
		if (!trimmed || sendMutation.isPending || quotaExhausted) return
		setErrorText(null)
		setMessages((m) => [...m, { role: 'user', content: trimmed }])
		setInput('')
		sendMutation.mutate({ message: trimmed, convId: conversationId })
	}

	const startNewConversation = () => {
		setMessages([])
		setConversationId(undefined)
		setErrorText(null)
	}

	// ---------- Signed out: explain + gate ----------
	if (!isAuthenticated) {
		return (
			<div className="max-w-2xl mx-auto text-center py-16 px-4">
				<SEO
					title="AI Chinese Tutor"
					description="Chat with a free AI Mandarin tutor. Ask about grammar, vocabulary, and practice real conversations with pinyin and translations."
				/>
				<div className="w-20 h-20 rounded-full bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center mx-auto mb-6">
					<Bot className="w-10 h-10 text-primary-600 dark:text-primary-300" />
				</div>
				<h1 className="text-3xl font-bold text-gray-900 mb-3">AI Chinese Tutor</h1>
				<p className="text-gray-600 text-lg mb-2 max-w-md mx-auto">
					Ask grammar questions, practice conversations, and get instant explanations with
					pinyin and translations.
				</p>
				<p className="text-sm text-gray-500 mb-8">
					Free with an account — sign in to start chatting.
				</p>
				<div className="flex justify-center gap-4">
					<Link to="/login" className="btn-primary inline-flex items-center">
						<LogIn className="w-4 h-4 mr-2" />
						Sign In
					</Link>
					<Link to="/signup" className="btn-outline">Create Free Account</Link>
				</div>
			</div>
		)
	}

	// ---------- Signed in but email not verified ----------
	if (!verified) {
		return (
			<div className="max-w-2xl mx-auto text-center py-16 px-4">
				<SEO title="AI Chinese Tutor" />
				<div className="w-20 h-20 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center mx-auto mb-6">
					<MailCheck className="w-10 h-10 text-amber-600 dark:text-amber-400" />
				</div>
				<h1 className="text-2xl font-bold text-gray-900 mb-3">Verify your email to use the tutor</h1>
				<p className="text-gray-600 mb-8 max-w-md mx-auto">
					We sent a verification link to <span className="font-medium">{user?.email}</span>.
					Click it to unlock the AI tutor and spaced-repetition reviews.
				</p>
				<button
					onClick={async () => {
						try {
							await resendVerification()
							setResent(true)
						} catch {
							/* rate-limited or already verified */
						}
					}}
					disabled={resent}
					className="btn-primary disabled:opacity-60"
				>
					{resent ? 'Verification email sent!' : 'Resend Verification Email'}
				</button>
			</div>
		)
	}

	// ---------- Chat ----------
	return (
		<div className="max-w-3xl mx-auto flex flex-col h-[calc(100vh-9rem)] sm:h-[calc(100vh-10rem)]">
			<SEO title="AI Chinese Tutor" />

			{/* Header */}
			<div className="flex items-center justify-between gap-3 pb-3 border-b border-gray-200 dark:border-gray-700">
				<div className="flex items-center gap-2.5 min-w-0">
					<div className="w-9 h-9 rounded-full bg-primary-600 flex items-center justify-center flex-shrink-0">
						<Bot className="w-5 h-5 text-white" />
					</div>
					<div className="min-w-0">
						<h1 className="font-semibold text-gray-900 leading-tight">AI Chinese Tutor</h1>
						<p className="text-xs text-gray-500 truncate">Grammar · vocabulary · conversation practice</p>
					</div>
				</div>
				<div className="flex items-center gap-2 flex-shrink-0">
					{remaining !== null && (
						<span
							className={`px-2.5 py-1 rounded-full text-xs font-medium ${
								quotaExhausted
									? 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-300'
									: 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
							}`}
						>
							{remaining} left today
						</span>
					)}
					{messages.length > 0 && (
						<button
							onClick={startNewConversation}
							className="p-2 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
							title="Start a new conversation"
						>
							<RotateCcw className="w-4 h-4" />
						</button>
					)}
				</div>
			</div>

			{/* Messages */}
			<div className="flex-1 overflow-y-auto py-4 space-y-4">
				{messages.length === 0 && (
					<div className="text-center pt-8 sm:pt-14">
						<Sparkles className="w-8 h-8 text-primary-400 mx-auto mb-3" />
						<p className="text-gray-600 font-medium mb-1">你好! What would you like to learn?</p>
						<p className="text-sm text-gray-500 mb-6">Ask anything about Mandarin — or try one of these:</p>
						<div className="flex flex-wrap justify-center gap-2 max-w-lg mx-auto">
							{STARTERS.map((s) => (
								<button
									key={s}
									onClick={() => send(s)}
									className="px-3.5 py-2 rounded-full text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-primary-50 hover:text-primary-700 dark:hover:bg-primary-900/40 dark:hover:text-primary-300 transition-colors"
								>
									{s}
								</button>
							))}
						</div>
					</div>
				)}

				{messages.map((msg, i) => (
					<div key={i} className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
						{msg.role === 'assistant' && (
							<div className="w-7 h-7 rounded-full bg-primary-600 flex items-center justify-center flex-shrink-0 mt-1">
								<Bot className="w-4 h-4 text-white" />
							</div>
						)}
						<div
							className={`max-w-[85%] sm:max-w-[75%] px-4 py-2.5 rounded-2xl text-[15px] leading-relaxed whitespace-pre-wrap break-words ${
								msg.role === 'user'
									? 'bg-primary-600 text-white rounded-br-md'
									: 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-bl-md'
							}`}
						>
							{msg.content}
						</div>
						{msg.role === 'user' && (
							<div className="w-7 h-7 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center flex-shrink-0 mt-1">
								<UserIcon className="w-4 h-4 text-gray-500 dark:text-gray-300" />
							</div>
						)}
					</div>
				))}

				{sendMutation.isPending && (
					<div className="flex gap-2.5 justify-start">
						<div className="w-7 h-7 rounded-full bg-primary-600 flex items-center justify-center flex-shrink-0 mt-1">
							<Bot className="w-4 h-4 text-white" />
						</div>
						<div className="px-4 py-3 rounded-2xl rounded-bl-md bg-gray-100 dark:bg-gray-700">
							<span className="flex gap-1">
								{[0, 150, 300].map((delay) => (
									<span
										key={delay}
										className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"
										style={{ animationDelay: `${delay}ms` }}
									/>
								))}
							</span>
						</div>
					</div>
				)}

				{errorText && (
					<div className="mx-auto max-w-md text-center text-sm text-red-600 dark:text-red-300 bg-red-50 dark:bg-red-900/30 rounded-xl px-4 py-2.5">
						{errorText}
					</div>
				)}

				<div ref={bottomRef} />
			</div>

			{/* Input */}
			<div className="pt-3 border-t border-gray-200 dark:border-gray-700">
				<form
					onSubmit={(e) => {
						e.preventDefault()
						send(input)
					}}
					className="flex items-end gap-2"
				>
					<textarea
						value={input}
						onChange={(e) => setInput(e.target.value)}
						onKeyDown={(e) => {
							if (e.key === 'Enter' && !e.shiftKey) {
								e.preventDefault()
								send(input)
							}
						}}
						rows={1}
						maxLength={2000}
						placeholder={quotaExhausted ? 'Daily limit reached — resets at midnight UTC' : 'Ask about grammar, words, or practice Chinese…'}
						disabled={quotaExhausted}
						className="flex-1 resize-none rounded-2xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-4 py-2.5 text-[15px] focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:opacity-60 disabled:cursor-not-allowed"
					/>
					<button
						type="submit"
						disabled={!input.trim() || sendMutation.isPending || quotaExhausted}
						className="p-3 rounded-full bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex-shrink-0"
						aria-label="Send message"
					>
						<Send className="w-4 h-4" />
					</button>
				</form>
				<p className="text-[11px] text-gray-400 dark:text-gray-500 text-center mt-2">
					The tutor can make mistakes — double-check important grammar with the{' '}
					<Link to="/hsk" className="underline hover:text-gray-600">HSK guide</Link>.
				</p>
			</div>
		</div>
	)
}
