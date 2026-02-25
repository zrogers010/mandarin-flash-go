import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Play, Trophy, History, ArrowLeft, LogIn, CheckCircle2, XCircle, BarChart3 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { quizApi } from '@/lib/api'
import { QuizCard } from '@/components/QuizCard'
import { useAuth } from '@/contexts/AuthContext'

type QuizType = 'practice' | 'scored'

export function Quiz() {
	const queryClient = useQueryClient()
	const { isAuthenticated } = useAuth()
	const [quizType, setQuizType] = useState<QuizType>('practice')
	const [selectedLevel, setSelectedLevel] = useState<number | undefined>(undefined)
	const [currentQuiz, setCurrentQuiz] = useState<any>(null)
	const [currentCardIndex, setCurrentCardIndex] = useState(0)
	const [showResults, setShowResults] = useState(false)
	const [userAnswers, setUserAnswers] = useState<Record<string, string>>({})
	const [quizResult, setQuizResult] = useState<any>(null)

	// Generate quiz mutation
	const generateQuizMutation = useMutation({
		mutationFn: (type: QuizType) => quizApi.generate(type, selectedLevel, 10),
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
							<button onClick={handleNewQuiz} className="btn-primary">
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

		return (
			<div className="space-y-4 sm:space-y-6">
				<div>
					<button onClick={handleNewQuiz} className="btn-outline mb-3">
						<ArrowLeft className="w-4 h-4 mr-2" />
						Go Back
					</button>
					<div className="text-center">
						<h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Flashcards</h1>
						<div className="flex items-center justify-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600 mb-2">
							<span>{quizType === 'scored' ? 'Take Quiz' : 'Practice Vocabulary'}</span>
							<span className="text-gray-300">|</span>
							<span>Card {currentCardIndex + 1} of {currentQuiz.cards.length}</span>
						</div>
					</div>
				</div>

				{/* Progress Bar */}
				<div className="w-full bg-gray-200 rounded-full h-2">
					<div
						className="bg-primary-600 h-2 rounded-full transition-all duration-300"
						style={{ width: `${((currentCardIndex + 1) / currentQuiz.cards.length) * 100}%` }}
					></div>
				</div>

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
				/>




			</div>
		)
	}

	return (
		<div className="space-y-6 sm:space-y-8">
			{/* Header */}
			<div className="text-center">
				<h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 sm:mb-4">Flashcards</h1>
				<p className="text-gray-600 text-sm sm:text-base">Test your Chinese vocabulary knowledge with interactive flashcards.</p>
			</div>

			{/* HSK Level Selection */}
			<div className="card">
				<div className="text-center p-6">
					<div className="text-sm font-medium text-gray-700 mb-4">Select HSK Level (Optional)</div>
					<div className="flex flex-wrap justify-center gap-2">
						<button
							onClick={() => handleLevelChange(undefined)}
							className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
								selectedLevel === undefined
									? 'bg-primary-600 text-white'
									: 'bg-gray-100 text-gray-700 hover:bg-gray-200'
							}`}
						>
							All Levels
						</button>
						{[1, 2, 3, 4, 5, 6].map((level) => (
							<button
								key={level}
								onClick={() => handleLevelChange(selectedLevel === level ? undefined : level)}
								className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
									selectedLevel === level
										? 'bg-primary-600 text-white'
										: 'bg-gray-100 text-gray-700 hover:bg-gray-200'
								}`}
							>
								HSK {level}
							</button>
						))}
					</div>
					{selectedLevel && (
						<p className="text-sm text-gray-600 mt-3">
							Quiz will include vocabulary from HSK Level {selectedLevel}
						</p>
					)}
				</div>
			</div>

			{/* Quiz Types */}
			<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
				{/* Practice Mode */}
				<div className="card">
					<div className="text-center p-6">
						<div className="text-4xl mb-4">📚</div>
						<h2 className="text-xl font-semibold mb-2">Practice Vocabulary</h2>
						<p className="text-gray-600 mb-4">
							Learn at your own pace with no pressure. Perfect for studying and reviewing vocabulary.
						</p>
						<button
							onClick={() => handleGenerateQuiz('practice')}
							disabled={generateQuizMutation.isPending}
							className="btn-primary w-full"
						>
							<Play className="w-4 h-4 mr-2" />
							{selectedLevel ? `Practice HSK Level ${selectedLevel}` : 'Start Practice'}
						</button>
					</div>
				</div>

				{/* Scored Mode */}
				<div className="card">
					<div className="text-center p-6">
						<div className="text-4xl mb-4">🏆</div>
						<h2 className="text-xl font-semibold mb-2">Take Quiz</h2>
						<p className="text-gray-600 mb-4">
							Test your knowledge and track your progress. Challenge yourself with multiple choice questions.
						</p>
						<button
							onClick={() => handleGenerateQuiz('scored')}
							disabled={generateQuizMutation.isPending}
							className="btn-primary w-full"
						>
							<Trophy className="w-4 h-4 mr-2" />
							{selectedLevel ? `Quiz HSK Level ${selectedLevel}` : 'Start Quiz'}
						</button>
					</div>
				</div>
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