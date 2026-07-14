import { useState, useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { ArrowLeft, CalendarClock, CheckCircle2, Sparkles, BarChart3, LogIn, Play } from 'lucide-react'
import { learningApi, ReviewItem } from '@/lib/api'
import { QuizCard } from '@/components/QuizCard'
import { celebrate } from '@/lib/celebrate'
import { useAuth } from '@/contexts/AuthContext'
import { SEO } from '@/components/SEO'

type SessionKind = 'due' | 'new'

interface SessionState {
	kind: SessionKind
	items: ReviewItem[]
	index: number
	graded: number
	missed: number
}

export function Review() {
	const { isAuthenticated } = useAuth()
	const queryClient = useQueryClient()
	const [session, setSession] = useState<SessionState | null>(null)
	const [finished, setFinished] = useState(false)

	// Confetti when a review session wraps up
	useEffect(() => {
		if (finished && session) celebrate()
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [finished])

	const { data: statsData, isLoading: statsLoading } = useQuery({
		queryKey: ['learning-stats'],
		queryFn: () => learningApi.getStats(),
		enabled: isAuthenticated,
		staleTime: 30 * 1000,
		retry: false,
	})

	const startDueMutation = useMutation({
		mutationFn: () => learningApi.getReviewItems(undefined, 20),
		onSuccess: (data) => {
			if (data.items && data.items.length > 0) {
				setSession({ kind: 'due', items: data.items, index: 0, graded: 0, missed: 0 })
				setFinished(false)
			}
		},
	})

	const startNewMutation = useMutation({
		mutationFn: () => learningApi.getNewWords(undefined, 10),
		onSuccess: (data) => {
			if (data.items && data.items.length > 0) {
				setSession({ kind: 'new', items: data.items, index: 0, graded: 0, missed: 0 })
				setFinished(false)
			}
		},
	})

	const gradeMutation = useMutation({
		mutationFn: (review: { vocabulary_id: string; quality: number }) =>
			learningApi.submitReviews([review]),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['learning-stats'] })
		},
	})

	if (!isAuthenticated) {
		return (
			<div className="max-w-2xl mx-auto text-center py-16">
				<SEO title="Review" />
				<CalendarClock className="w-16 h-16 text-primary-600 mx-auto mb-6" />
				<h1 className="text-3xl font-bold text-gray-900 mb-3">Spaced-Repetition Review</h1>
				<p className="text-gray-600 mb-8">
					Sign in to build a personal review queue. We track how well you know each word and
					schedule it for review right before you'd forget it.
				</p>
				<div className="flex justify-center gap-4">
					<Link to="/login" className="btn-primary inline-flex items-center">
						<LogIn className="w-4 h-4 mr-2" />
						Sign In
					</Link>
					<Link to="/signup" className="btn-outline">Create Account</Link>
				</div>
			</div>
		)
	}

	const stats = statsData?.stats
	const dueCount = stats?.words_due_for_review ?? 0

	// ---------- Active session ----------
	if (session && !finished) {
		const item = session.items[session.index]
		const isLast = session.index === session.items.length - 1

		const advance = () => {
			if (isLast) {
				setFinished(true)
			} else {
				setSession((s) => s && { ...s, index: s.index + 1 })
			}
		}

		const handleGrade = (cardId: string, quality: number) => {
			gradeMutation.mutate({ vocabulary_id: cardId, quality })
			setSession((s) => s && {
				...s,
				graded: s.graded + 1,
				missed: s.missed + (quality < 3 ? 1 : 0),
			})
			// QuizCard calls onNext after onGrade, which advances the card.
		}

		return (
			<div className="space-y-4 sm:space-y-6">
				<SEO title="Review Session" />
				<div>
					<button onClick={() => { setSession(null); setFinished(false) }} className="btn-outline mb-3">
						<ArrowLeft className="w-4 h-4 mr-2" />
						End Session
					</button>
					<div className="text-center">
						<h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
							{session.kind === 'due' ? 'Review Session' : 'New Words'}
						</h1>
						<div className="flex items-center justify-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600 mb-2">
							<span>{session.kind === 'due' ? 'Words due for review' : 'Words you haven\'t studied yet'}</span>
							<span className="text-gray-300">|</span>
							<span>Card {session.index + 1} of {session.items.length}</span>
						</div>
					</div>
				</div>

				{/* Progress Bar */}
				<div className="w-full bg-gray-200 rounded-full h-2">
					<div
						className="bg-primary-600 h-2 rounded-full transition-all duration-300"
						style={{ width: `${((session.index + 1) / session.items.length) * 100}%` }}
					/>
				</div>

				<QuizCard
					key={item.id}
					card={{ ...item, example_sentences: item.example_sentences || [] }}
					onNext={advance}
					onPrevious={() => setSession((s) => s && { ...s, index: Math.max(0, s.index - 1) })}
					isFirst={session.index === 0}
					isLast={isLast}
					onGrade={handleGrade}
				/>
			</div>
		)
	}

	// ---------- Session complete ----------
	if (session && finished) {
		return (
			<div className="space-y-6 max-w-2xl mx-auto">
				<SEO title="Review Complete" />
				<div className="card text-center py-10">
					<div className="text-6xl mb-4">{session.missed === 0 ? '🎉' : '💪'}</div>
					<h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
						{session.kind === 'due' ? 'Review Complete!' : 'New Words Studied!'}
					</h1>
					<p className="text-gray-600 mb-6">
						You graded {session.graded} word{session.graded !== 1 ? 's' : ''}
						{session.missed > 0 && ` — ${session.missed} marked "Again" will come back soon`}.
					</p>
					<div className="flex flex-col sm:flex-row justify-center gap-3">
						<button
							onClick={() => { setSession(null); setFinished(false); startDueMutation.mutate() }}
							className="btn-primary"
						>
							<Play className="w-4 h-4 mr-2" />
							Keep Reviewing
						</button>
						<button
							onClick={() => { setSession(null); setFinished(false); startNewMutation.mutate() }}
							className="btn-outline"
						>
							<Sparkles className="w-4 h-4 mr-2" />
							Learn New Words
						</button>
						<Link to="/progress" className="btn-outline inline-flex items-center justify-center">
							<BarChart3 className="w-4 h-4 mr-2" />
							View Progress
						</Link>
					</div>
				</div>
			</div>
		)
	}

	// ---------- Landing ----------
	return (
		<div className="space-y-6 sm:space-y-8 max-w-3xl mx-auto">
			<SEO title="Review" description="Spaced-repetition review of your Mandarin vocabulary." />
			<div className="text-center">
				<h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Review</h1>
				<p className="text-gray-600 text-sm sm:text-base">
					Spaced repetition schedules each word for review right before you'd forget it.
					Grade yourself honestly and the schedule adapts.
				</p>
			</div>

			{statsLoading ? (
				<div className="card animate-pulse"><div className="h-32 bg-gray-200 rounded" /></div>
			) : (
				<>
					<div className="grid grid-cols-3 gap-2 sm:gap-4">
						<div className="card !p-3 sm:!p-6 text-center">
							<div className="text-lg sm:text-2xl font-bold text-primary-600">{dueCount}</div>
							<div className="text-xs sm:text-sm text-gray-500">Due Now</div>
						</div>
						<div className="card !p-3 sm:!p-6 text-center">
							<div className="text-lg sm:text-2xl font-bold text-gray-900">{stats?.total_words_learned ?? 0}</div>
							<div className="text-xs sm:text-sm text-gray-500">Words Learning</div>
						</div>
						<div className="card !p-3 sm:!p-6 text-center">
							<div className="text-lg sm:text-2xl font-bold text-green-600">{stats?.words_mastered ?? 0}</div>
							<div className="text-xs sm:text-sm text-gray-500">Mastered</div>
						</div>
					</div>

					{dueCount > 0 ? (
						<div className="card text-center py-8">
							<CalendarClock className="w-10 h-10 text-primary-600 mx-auto mb-3" />
							<h2 className="text-xl font-semibold mb-1">
								{dueCount} word{dueCount !== 1 ? 's' : ''} due for review
							</h2>
							<p className="text-gray-600 mb-5">A few minutes now saves relearning later.</p>
							<button
								onClick={() => startDueMutation.mutate()}
								disabled={startDueMutation.isPending}
								className="btn-primary"
							>
								<Play className="w-4 h-4 mr-2" />
								{startDueMutation.isPending ? 'Loading…' : 'Start Review'}
							</button>
						</div>
					) : (
						<div className="card text-center py-8">
							<CheckCircle2 className="w-10 h-10 text-green-500 mx-auto mb-3" />
							<h2 className="text-xl font-semibold mb-1">All caught up!</h2>
							<p className="text-gray-600 mb-5">
								{stats && stats.total_words_learned > 0
									? 'Nothing due right now. Learn some new words to grow your queue.'
									: 'Start learning words and they\'ll show up here for review at the right time.'}
							</p>
							<button
								onClick={() => startNewMutation.mutate()}
								disabled={startNewMutation.isPending}
								className="btn-primary"
							>
								<Sparkles className="w-4 h-4 mr-2" />
								{startNewMutation.isPending ? 'Loading…' : 'Learn 10 New Words'}
							</button>
						</div>
					)}

					{dueCount > 0 && (
						<div className="text-center">
							<button
								onClick={() => startNewMutation.mutate()}
								disabled={startNewMutation.isPending}
								className="text-sm text-primary-600 hover:text-primary-700 font-medium"
							>
								Or learn 10 new words instead →
							</button>
						</div>
					)}
				</>
			)}
		</div>
	)
}
