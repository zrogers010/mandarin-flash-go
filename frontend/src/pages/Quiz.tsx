import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Play, Trophy, History, ArrowLeft, LogIn, CheckCircle2, XCircle, BarChart3, RefreshCw, CalendarClock, ArrowRight, Layers, Brain } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import { quizApi, learningApi } from '@/lib/api'
import { QuizCard } from '@/components/QuizCard'
import { useAuth } from '@/contexts/AuthContext'

type QuizType = 'practice' | 'scored'

const CARD_COUNTS = [10, 25, 50]

const HSK_WORD_COUNTS: Record<number, number> = { 1: 155, 2: 169, 3: 308, 4: 600, 5: 1300 }

const MODES: {
	type: QuizType
	title: string
	description: string
	icon: typeof Brain
	accent: string
}[] = [
	{
		type: 'practice',
		title: 'Practice',
		description: 'Flip cards at your own pace. Grade yourself to build your review schedule.',
		icon: Layers,
		accent: 'text-primary-600 dark:text-primary-300',
	},
	{
		type: 'scored',
		title: 'Quiz',
		description: 'Multiple choice, scored at the end. Results are saved to your progress.',
		icon: Trophy,
		accent: 'text-secondary-600 dark:text-secondary-400',
	},
]

/** Segmented session progress: one segment per card, colored by result. */
function SegmentedProgress({
	total,
	currentIndex,
	cards,
	isScored,
}: {
	total: number
	currentIndex: number
	cards: any[]
	isScored: boolean
}) {
	return (
		<div className="flex gap-[3px] w-full" role="progressbar" aria-valuenow={currentIndex + 1} aria-valuemax={total}>
			{cards.map((c, i) => {
				let cls = 'bg-gray-200 dark:bg-gray-700' // upcoming
				if (isScored && c.isCorrect === true) cls = 'bg-green-500'
				else if (isScored && c.isCorrect === false) cls = 'bg-red-400'
				else if (i < currentIndex) cls = 'bg-primary-500'
				else if (i === currentIndex) cls = 'bg-primary-600 dark:bg-primary-400'
				return <div key={c.id ?? i} className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${cls}`} />
			})}
		</div>
	)
}

export function Quiz() {
	const queryClient = useQueryClient()
	const { isAuthenticated } = useAuth()
	const [searchParams] = useSearchParams()
	const lessonSlug = searchParams.get('lesson') || undefined
	const initialHskLevel = searchParams.get('hsk_level') ? Number(searchParams.get('hsk_level')) : undefined

	const [quizType, setQuizType] = useState<QuizType>('practice')
	const [selectedLevel, setSelectedLevel] = useState<number | undefined>(initialHskLevel)
	const [cardCount, setCardCount] = useState(10)
	const [currentQuiz, setCurrentQuiz] = useState<any>(null)
	const [currentCardIndex, setCurrentCardIndex] = useState(0)
	const [showResults, setShowResults] = useState(false)
	const [userAnswers, setUserAnswers] = useState<Record<string, string>>({})
	const [quizResult, setQuizResult] = useState<any>(null)

	// Generate quiz mutation
	const generateQuizMutation = useMutation({
		mutationFn: (type: QuizType) => quizApi.generate(type, lessonSlug ? undefined : selectedLevel, cardCount, lessonSlug),
		onSuccess: (data) => {
			setCurrentQuiz(data)
			setCurrentCardIndex(0)
			setShowResults(false)
			setUserAnswers({})
		},
		onError: () => {
			setCurrentQuiz(null)
		},
	})

	// Spaced-repetition: record how well the user knew a practice card
	const gradeMutation = useMutation({
		mutationFn: (review: { vocabulary_id: string; quality: number }) =>
			learningApi.submitReviews([review]),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['learning-stats'] })
		},
	})

	// Due-for-review count for the banner (authenticated users only)
	const { data: learningStatsData } = useQuery({
		queryKey: ['learning-stats'],
		queryFn: () => learningApi.getStats(),
		enabled: isAuthenticated,
		staleTime: 60 * 1000,
		retry: false,
	})
	const dueCount = learningStatsData?.stats?.words_due_for_review ?? 0

	// Submit quiz mutation
	const submitQuizMutation = useMutation({
		mutationFn: (data: {
			quizId: string
			answers: Record<string, string>
			completed: boolean
			quizType: 'practice' | 'scored'
			hskLevel?: number
		}) => quizApi.submit(data.quizId, data.answers, data.completed, data.quizType, data.hskLevel),
		onSuccess: (data) => {
			setQuizResult(data)
			setShowResults(true)
			queryClient.invalidateQueries({ queryKey: ['quiz-history'] })
			queryClient.invalidateQueries({ queryKey: ['quiz-stats'] })
		},
	})

	// Get quiz history (only if authenticated)
	const { data: historyData } = useQuery({
		queryKey: ['quiz-history'],
		queryFn: () => quizApi.getHistory(),
		staleTime: 5 * 60 * 1000, // 5 minutes
		enabled: isAuthenticated, // Only fetch if authenticated
		retry: false, // Don't retry on 401 errors
	})

	const handleGenerateQuiz = (type: QuizType) => {
		setQuizType(type)
		generateQuizMutation.mutate(type)
	}

	const handleLevelChange = (level: number | undefined) => {
		setSelectedLevel(level)
	}

	const handleNextCard = () => {
		if (currentCardIndex < currentQuiz.cards.length - 1) {
			setCurrentCardIndex(currentCardIndex + 1)
		} else {
			// If it's the last card, finish the quiz
			handleFinishQuiz()
		}
	}

	const handlePreviousCard = () => {
		if (currentCardIndex > 0) {
			setCurrentCardIndex(currentCardIndex - 1)
		}
	}

	const handleAnswer = (cardId: string, answer: string) => {
		setUserAnswers(prev => ({
			...prev,
			[cardId]: answer
		}))
		
		// For scored quizzes, show immediate feedback
		if (quizType === 'scored') {
			// Find the current card to check if answer is correct
			const currentCard = currentQuiz.cards[currentCardIndex]
			if (currentCard && currentCard.correct_answer) {
				const isCorrect = answer === currentCard.correct_answer
				
				// Update the card to show if the answer was correct
				setCurrentQuiz((prev: any) => ({
					...prev,
					cards: prev.cards.map((card: any) => 
						card.id === cardId 
							? { ...card, isCorrect, userAnswer: answer }
							: card
					)
				}))
			}
		}
	}

	const handleFinishQuiz = () => {
		if (quizType === 'scored') {
			// For scored mode, submit the quiz
			submitQuizMutation.mutate({
				quizId: currentQuiz.id,
				answers: userAnswers,
				completed: true,
				quizType: quizType,
				hskLevel: selectedLevel,
			})
		} else {
			// For practice mode, just show completion
			setShowResults(true)
		}
	}

	const handleNewQuiz = () => {
		setCurrentQuiz(null)
		setCurrentCardIndex(0)
		setShowResults(false)
		setUserAnswers({})
		setQuizResult(null)
	}

	// Start a practice session containing only the words missed in the last quiz
	const handlePracticeMissedWords = () => {
		const cardResults = quizResult?.card_results || []
		const wrongIds = new Set(cardResults.filter((cr: any) => !cr.is_correct).map((cr: any) => cr.card_id))
		const wrongCards = (currentQuiz?.cards || [])
			.filter((c: any) => wrongIds.has(c.id))
			.map((c: any) => ({
				...c,
				multiple_choice: undefined,
				correct_answer: undefined,
				userAnswer: undefined,
				isCorrect: undefined,
			}))
		if (wrongCards.length === 0) return
		setQuizType('practice')
		setCurrentQuiz({ id: `missed-${Date.now()}`, type: 'practice', cards: wrongCards })
		setCurrentCardIndex(0)
		setShowResults(false)
		setUserAnswers({})
		setQuizResult(null)
	}

	if (generateQuizMutation.isPending) {
		return (
			<div className="space-y-6">
				<div>
					<button onClick={handleNewQuiz} className="btn-outline mb-4">
						<ArrowLeft className="w-4 h-4 mr-2" />
						Go Back
					</button>
					<div className="text-center">
						<h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Flashcards</h1>
						<p className="text-gray-600 text-sm sm:text-base">Test your Chinese vocabulary knowledge with interactive flashcards.</p>
					</div>
				</div>
				
				<div className="card">
					<div className="text-center py-12">
						<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
						<p className="text-gray-600">Generating quiz...</p>
					</div>
				</div>
			</div>
		)
	}

	if (generateQuizMutation.isError) {
		const errorMessage = (generateQuizMutation.error as any)?.response?.data?.error
			|| 'Failed to generate quiz. Please try again.'
		return (
			<div className="space-y-6">
				<div>
					<button onClick={handleNewQuiz} className="btn-outline mb-4">
						<ArrowLeft className="w-4 h-4 mr-2" />
						Go Back
					</button>
					<div className="text-center">
						<h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Flashcards</h1>
						<p className="text-gray-600 text-sm sm:text-base">Test your Chinese vocabulary knowledge with interactive flashcards.</p>
					</div>
				</div>
				<div className="card">
					<div className="text-center py-12">
						<div className="text-6xl mb-4">📭</div>
						<h2 className="text-xl font-semibold mb-2">No Vocabulary Available</h2>
						<p className="text-gray-600 mb-6">{errorMessage}</p>
						<button onClick={handleNewQuiz} className="btn-primary">
							<ArrowLeft className="w-4 h-4 mr-2" />
							Choose a Different Level
						</button>
					</div>
				</div>
			</div>
		)
	}

	if (currentQuiz && (!currentQuiz.cards || currentQuiz.cards.length === 0)) {
		return (
			<div className="space-y-6">
				<div>
					<button onClick={handleNewQuiz} className="btn-outline mb-4">
						<ArrowLeft className="w-4 h-4 mr-2" />
						Go Back
					</button>
					<div className="text-center">
						<h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Flashcards</h1>
						<p className="text-gray-600 text-sm sm:text-base">Test your Chinese vocabulary knowledge with interactive flashcards.</p>
					</div>
				</div>
				<div className="card">
					<div className="text-center py-12">
						<div className="text-6xl mb-4">📭</div>
						<h2 className="text-xl font-semibold mb-2">No Vocabulary Available</h2>
						<p className="text-gray-600 mb-6">
							{selectedLevel
								? `HSK Level ${selectedLevel} doesn't have any vocabulary yet. Please choose a different level.`
								: 'No vocabulary is available right now. Please try again later.'}
						</p>
						<button onClick={handleNewQuiz} className="btn-primary">
							<ArrowLeft className="w-4 h-4 mr-2" />
							Choose a Different Level
						</button>
					</div>
				</div>
			</div>
		)
	}

	if (showResults) {
		const cardResults = quizResult?.card_results || []
		const wrongCards = cardResults.filter((cr: any) => !cr.is_correct)
		const correctCards = cardResults.filter((cr: any) => cr.is_correct)

		return (
			<div className="space-y-6">
				<div>
					<button onClick={handleNewQuiz} className="btn-outline mb-4">
						<ArrowLeft className="w-4 h-4 mr-2" />
						Go Back
					</button>
					<div className="text-center">
						<h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Quiz Complete!</h1>
						<p className="text-gray-600 text-sm sm:text-base">Great job completing the quiz.</p>
					</div>
				</div>

				{/* Score Summary Card */}
				<div className="card">
					<div className="text-center py-8">
						<div className="text-6xl mb-4">
							{quizType === 'scored' && quizResult
								? quizResult.percentage >= 80 ? '🏆' : quizResult.percentage >= 50 ? '👍' : '💪'
								: '🎉'
							}
						</div>

						{quizType === 'scored' && quizResult ? (
							<div className="mb-6">
								<div className="text-4xl font-bold text-primary-600 mb-2">
									{quizResult.correct}/{quizResult.total} Correct
								</div>
								<div className="text-lg text-gray-600 mb-4">
									Score: {quizResult.percentage.toFixed(1)}%
								</div>
								{/* Visual score bar */}
								<div className="max-w-xs mx-auto">
									<div className="w-full bg-gray-200 rounded-full h-3">
										<div
											className={`h-3 rounded-full transition-all duration-500 ${
												quizResult.percentage >= 80 ? 'bg-green-500'
													: quizResult.percentage >= 50 ? 'bg-yellow-500'
													: 'bg-red-500'
											}`}
											style={{ width: `${quizResult.percentage}%` }}
										/>
									</div>
								</div>
							</div>
						) : (
							<p className="text-gray-600 mb-6">
								You've practiced {currentQuiz?.cards.length} words.
							</p>
						)}

						<div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
							{wrongCards.length > 0 && (
								<button onClick={handlePracticeMissedWords} className="btn-primary">
									<RefreshCw className="w-4 h-4 mr-2" />
									Practice {wrongCards.length} Missed Word{wrongCards.length !== 1 ? 's' : ''}
								</button>
							)}
							<button onClick={handleNewQuiz} className={wrongCards.length > 0 ? 'btn-outline' : 'btn-primary'}>
								<Play className="w-4 h-4 mr-2" />
								New Quiz
							</button>
							{isAuthenticated && (
								<Link to="/progress" className="btn-outline inline-flex items-center justify-center">
									<BarChart3 className="w-4 h-4 mr-2" />
									View All Stats
								</Link>
							)}
						</div>
					</div>
				</div>

				{/* Word-by-Word Results (scored quizzes only) */}
				{quizType === 'scored' && cardResults.length > 0 && (
					<>
						{/* Wrong Answers */}
						{wrongCards.length > 0 && (
							<div className="card">
								<div className="flex items-center space-x-2 mb-4">
									<XCircle className="w-5 h-5 text-red-500" />
									<h3 className="text-lg font-semibold text-gray-900">
										Words to Review ({wrongCards.length})
									</h3>
								</div>
								<div className="space-y-3">
									{wrongCards.map((cr: any) => {
										const card = currentQuiz?.cards.find((c: any) => c.id === cr.card_id)
										return (
											<div key={cr.card_id} className="flex items-start sm:items-center justify-between p-3 sm:p-4 bg-red-50 border border-red-100 rounded-lg gap-2">
												<div className="flex-1 min-w-0">
													<div className="flex items-center gap-2 sm:gap-3">
														<span className="text-lg sm:text-xl font-medium">{card?.chinese || '—'}</span>
														<span className="text-xs sm:text-sm text-gray-500">{card?.pinyin || ''}</span>
													</div>
													<div className="mt-1 text-xs sm:text-sm flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-0">
														<span className="text-red-600">Your answer: {cr.user_answer}</span>
														<span className="hidden sm:inline mx-2 text-gray-300">|</span>
														<span className="text-green-700 font-medium">Correct: {cr.correct_answer}</span>
													</div>
												</div>
												<XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5 sm:mt-0" />
											</div>
										)
									})}
								</div>
							</div>
						)}

						{/* Correct Answers */}
						{correctCards.length > 0 && (
							<div className="card">
								<div className="flex items-center space-x-2 mb-4">
									<CheckCircle2 className="w-5 h-5 text-green-500" />
									<h3 className="text-lg font-semibold text-gray-900">
										Correct ({correctCards.length})
									</h3>
								</div>
								<div className="space-y-2">
									{correctCards.map((cr: any) => {
										const card = currentQuiz?.cards.find((c: any) => c.id === cr.card_id)
										return (
											<div key={cr.card_id} className="flex items-center justify-between p-3 bg-green-50 border border-green-100 rounded-lg">
												<div className="flex items-center gap-3">
													<span className="text-lg font-medium">{card?.chinese || '—'}</span>
													<span className="text-sm text-gray-500">{card?.pinyin || ''}</span>
													<span className="text-sm text-gray-600">{cr.correct_answer}</span>
												</div>
												<CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
											</div>
										)
									})}
								</div>
							</div>
						)}
					</>
				)}
			</div>
		)
	}

	if (currentQuiz) {
		const currentCard = currentQuiz.cards[currentCardIndex]
		const isFirst = currentCardIndex === 0
		const isLast = currentCardIndex === currentQuiz.cards.length - 1
		const answeredCorrect = quizType === 'scored'
			? currentQuiz.cards.filter((c: any) => c.isCorrect === true).length
			: 0
		const answeredWrong = quizType === 'scored'
			? currentQuiz.cards.filter((c: any) => c.isCorrect === false).length
			: 0

		return (
			<div className="space-y-4 sm:space-y-5 max-w-2xl mx-auto">
				{/* Compact session header */}
				<div className="flex items-center justify-between gap-3">
					<button
						onClick={handleNewQuiz}
						className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
					>
						<ArrowLeft className="w-4 h-4" />
						End session
					</button>
					<div className="text-sm font-medium text-gray-700">
						{quizType === 'scored' ? 'Quiz' : 'Practice'}
						{selectedLevel ? ` · HSK ${selectedLevel}` : ''}
					</div>
					<div className="flex items-center gap-2.5 text-sm tabular-nums">
						{quizType === 'scored' && (answeredCorrect > 0 || answeredWrong > 0) && (
							<span className="hidden sm:flex items-center gap-2 text-xs">
								<span className="text-green-600 dark:text-green-400 font-semibold">✓ {answeredCorrect}</span>
								<span className="text-red-500 dark:text-red-400 font-semibold">✗ {answeredWrong}</span>
							</span>
						)}
						<span className="text-gray-500">
							{currentCardIndex + 1}<span className="text-gray-400"> / {currentQuiz.cards.length}</span>
						</span>
					</div>
				</div>

				{/* Segmented per-card progress */}
				<SegmentedProgress
					total={currentQuiz.cards.length}
					currentIndex={currentCardIndex}
					cards={currentQuiz.cards}
					isScored={quizType === 'scored'}
				/>

				{/* Flashcard */}
				<QuizCard
					card={currentCard}
					onNext={handleNextCard}
					onPrevious={handlePreviousCard}
					isFirst={isFirst}
					isLast={isLast}
					onAnswer={handleAnswer}
					userAnswer={userAnswers[currentCard.id]}
					isScored={quizType === 'scored'}
					showResults={showResults}
					onGrade={
						isAuthenticated && quizType === 'practice'
							? (cardId, quality) => gradeMutation.mutate({ vocabulary_id: cardId, quality })
							: undefined
					}
				/>
			</div>
		)
	}

	return (
		<div className="space-y-6 sm:space-y-8">
			{/* Header */}
			<div className="text-center">
				<h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 sm:mb-4">Flashcards</h1>
				<p className="text-gray-600 text-sm sm:text-base">
					{lessonSlug
						? `Practice vocabulary from the "${lessonSlug.replace(/-/g, ' ')}" lesson.`
						: 'Test your Chinese vocabulary knowledge with interactive flashcards.'}
				</p>
			</div>

			{/* Spaced-repetition review banner */}
			{isAuthenticated && dueCount > 0 && (
				<Link
					to="/review"
					className="flex items-center justify-between gap-3 p-4 sm:p-5 rounded-xl border-2 border-primary-200 dark:border-primary-500/40 bg-primary-50 dark:bg-primary-900/20 hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors group"
				>
					<div className="flex items-center gap-3 min-w-0">
						<div className="w-10 h-10 rounded-xl bg-primary-600 text-white flex items-center justify-center flex-shrink-0">
							<CalendarClock className="w-5 h-5" />
						</div>
						<div className="min-w-0">
							<div className="font-semibold text-gray-900">
								{dueCount} word{dueCount !== 1 ? 's' : ''} due for review
							</div>
							<div className="text-sm text-gray-600">Keep your memory fresh with a quick spaced-repetition session</div>
						</div>
					</div>
					<div className="flex items-center text-primary-700 dark:text-primary-300 text-sm font-medium flex-shrink-0">
						Review Now
						<ArrowRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-0.5" />
					</div>
				</Link>
			)}

			{/* Session builder */}
			<div className="card max-w-3xl mx-auto !p-5 sm:!p-8">
				{/* Step 1: Mode */}
				<div className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3">Mode</div>
				<div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-7">
					{MODES.map((mode) => {
						const selected = quizType === mode.type
						return (
							<button
								key={mode.type}
								onClick={() => setQuizType(mode.type)}
								aria-pressed={selected}
								className={`flex items-start gap-3.5 p-4 rounded-2xl border-2 text-left transition-all ${
									selected
										? 'border-primary-500 bg-primary-50/70 dark:bg-primary-900/25 shadow-sm'
										: 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/40'
								}`}
							>
								<div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
									selected ? 'bg-primary-600 text-white' : `bg-gray-100 dark:bg-gray-700 ${mode.accent}`
								}`}>
									<mode.icon className="w-5 h-5" />
								</div>
								<div className="min-w-0">
									<div className="flex items-center gap-2">
										<span className="font-semibold text-gray-900">{mode.title}</span>
										{selected && <CheckCircle2 className="w-4 h-4 text-primary-600 dark:text-primary-300" />}
									</div>
									<p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mt-0.5">{mode.description}</p>
								</div>
							</button>
						)
					})}
				</div>

				{/* Step 2: Level (or lesson badge) */}
				{lessonSlug ? (
					<div className="mb-7">
						<div className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3">Lesson</div>
						<div className="flex items-center justify-between p-4 rounded-2xl border-2 border-primary-500 bg-primary-50/70 dark:bg-primary-900/25">
							<div className="font-semibold text-gray-900 capitalize">{lessonSlug.replace(/-/g, ' ')}</div>
							<Link to="/flashcards" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
								Switch to HSK
							</Link>
						</div>
					</div>
				) : (
					<div className="mb-7">
						<div className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3">HSK Level</div>
						<div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
							<button
								onClick={() => handleLevelChange(undefined)}
								aria-pressed={selectedLevel === undefined}
								className={`py-2.5 rounded-xl border-2 text-center transition-all ${
									selectedLevel === undefined
										? 'border-primary-500 bg-primary-50/70 dark:bg-primary-900/25'
										: 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
								}`}
							>
								<span className="block text-sm font-semibold text-gray-900">All</span>
								<span className="block text-[10px] text-gray-400 dark:text-gray-500">2,532 words</span>
							</button>
							{[1, 2, 3, 4, 5].map((level) => (
								<button
									key={level}
									onClick={() => handleLevelChange(selectedLevel === level ? undefined : level)}
									aria-pressed={selectedLevel === level}
									className={`py-2.5 rounded-xl border-2 text-center transition-all ${
										selectedLevel === level
											? 'border-primary-500 bg-primary-50/70 dark:bg-primary-900/25'
											: 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
									}`}
								>
									<span className="block text-sm font-semibold text-gray-900">HSK {level}</span>
									<span className="block text-[10px] text-gray-400 dark:text-gray-500">{HSK_WORD_COUNTS[level]} words</span>
								</button>
							))}
						</div>
					</div>
				)}

				{/* Step 3: Length */}
				<div className="mb-8">
					<div className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3">Session Length</div>
					<div className="grid grid-cols-3 gap-2 max-w-xs">
						{CARD_COUNTS.map((count) => (
							<button
								key={count}
								onClick={() => setCardCount(count)}
								aria-pressed={cardCount === count}
								className={`py-2 rounded-xl border-2 text-sm font-semibold transition-all ${
									cardCount === count
										? 'border-primary-500 bg-primary-50/70 dark:bg-primary-900/25 text-gray-900'
										: 'border-gray-200 dark:border-gray-700 text-gray-600 hover:border-gray-300 dark:hover:border-gray-600'
								}`}
							>
								{count}
							</button>
						))}
					</div>
				</div>

				{/* Start */}
				<button
					onClick={() => handleGenerateQuiz(quizType)}
					disabled={generateQuizMutation.isPending}
					className="btn-primary w-full !py-3.5 text-base !rounded-xl"
				>
					{quizType === 'scored' ? <Trophy className="w-5 h-5 mr-2" /> : <Play className="w-5 h-5 mr-2" />}
					Start {quizType === 'scored' ? 'Quiz' : 'Practice'}
					{!lessonSlug && (selectedLevel ? ` · HSK ${selectedLevel}` : ' · All Levels')} · {cardCount} cards
				</button>
			</div>

			{/* Quiz History / Progress Link */}
			{isAuthenticated ? (
				historyData && historyData.history && historyData.history.length > 0 && (
					<div className="card">
						<div className="flex items-center justify-between mb-4">
							<div className="flex items-center space-x-2">
								<History className="w-5 h-5 text-primary-600" />
								<h2 className="text-xl font-semibold">Recent Quizzes</h2>
							</div>
							<Link
								to="/progress"
								className="flex items-center space-x-1 text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
							>
								<BarChart3 className="w-4 h-4" />
								<span>View All Stats</span>
							</Link>
						</div>

						<div className="space-y-3">
							{historyData.history.slice(0, 3).map((quiz: any) => {
								const scoreColor = quiz.percentage >= 80
									? 'text-green-600 bg-green-50'
									: quiz.percentage >= 50
										? 'text-yellow-600 bg-yellow-50'
										: 'text-red-600 bg-red-50'
								return (
									<Link
										key={quiz.id}
										to="/progress"
										className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
									>
										<div className="flex items-center gap-3">
											<div className={`px-2.5 py-1 rounded-lg text-sm font-semibold ${scoreColor}`}>
												{quiz.percentage.toFixed(0)}%
											</div>
											<div>
												<div className="font-medium text-gray-900">
													{quiz.type === 'scored' ? 'Scored Quiz' : 'Practice'}
													{quiz.hsk_level && <span className="text-gray-500 ml-1">HSK {quiz.hsk_level}</span>}
												</div>
												<div className="text-sm text-gray-500">
													{quiz.correct}/{quiz.total} correct
												</div>
											</div>
										</div>
										<div className="text-sm text-gray-400">
											{new Date(quiz.completed_at).toLocaleDateString()}
										</div>
									</Link>
								)
							})}
						</div>
					</div>
				)
			) : (
				<div className="card">
					<div className="text-center p-6">
						<History className="w-12 h-12 text-primary-600 mx-auto mb-4" />
						<h2 className="text-xl font-semibold mb-2">Track Your Progress</h2>
						<p className="text-gray-600 mb-4">
							Sign in to save your quiz history and track your learning progress over time.
						</p>
						<Link to="/login" className="btn-primary inline-flex items-center">
							<LogIn className="w-4 h-4 mr-2" />
							Sign In to Track Progress
						</Link>
					</div>
				</div>
			)}
		</div>
	)
} 