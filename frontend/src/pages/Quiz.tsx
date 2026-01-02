import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Play, Trophy, History, RefreshCw, ArrowLeft, LogIn } from 'lucide-react'
import { Link } from 'react-router-dom'
import { quizApi } from '@/lib/api'
import { QuizCard } from '@/components/QuizCard'
import { useAuth } from '@/contexts/AuthContext'

type QuizType = 'practice' | 'scored'

export function Quiz() {
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
	})

	// Submit quiz mutation
	const submitQuizMutation = useMutation({
		mutationFn: (data: { quizId: string; answers: Record<string, string>; completed: boolean }) =>
			quizApi.submit(data.quizId, data.answers, data.completed),
		onSuccess: (data) => {
			setQuizResult(data)
			setShowResults(true)
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
				{/* Header with Back Button */}
				<div className="relative">
					{/* Back Button - Top Left */}
					<button onClick={handleNewQuiz} className="absolute left-0 top-0 btn-outline">
						<ArrowLeft className="w-4 h-4 mr-2" />
						Go Back
					</button>
					
					{/* Title - Centered */}
					<div className="text-center">
						<h1 className="text-3xl font-bold text-gray-900 mb-4">Flashcards</h1>
						<p className="text-gray-600">Test your Chinese vocabulary knowledge with interactive flashcards.</p>
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

	if (showResults) {
		return (
			<div className="space-y-6">
				{/* Header with Back Button */}
				<div className="relative">
					{/* Back Button - Top Left */}
					<button onClick={handleNewQuiz} className="absolute left-0 top-0 btn-outline">
						<ArrowLeft className="w-4 h-4 mr-2" />
						Go Back
					</button>
					
					{/* Title - Centered */}
					<div className="text-center">
						<h1 className="text-3xl font-bold text-gray-900 mb-4">Quiz Complete!</h1>
						<p className="text-gray-600">Great job completing the quiz.</p>
					</div>
				</div>

				<div className="card">
					<div className="text-center py-8">
						<div className="text-6xl mb-4">🎉</div>
						<h2 className="text-xl font-semibold mb-2">Quiz Finished</h2>
						
						{/* Score Display for Scored Quizzes */}
						{quizType === 'scored' && quizResult && (
							<div className="mb-6">
								<div className="text-4xl font-bold text-primary-600 mb-2">
									{quizResult.correct}/{quizResult.total} Correct
								</div>
								<div className="text-lg text-gray-600">
									Score: {quizResult.percentage.toFixed(1)}%
								</div>
								<div className="mt-4 p-4 bg-gray-50 rounded-lg">
									<div className="text-sm text-gray-600 mb-2">Performance:</div>
									<div className="flex justify-center space-x-2">
										{Array.from({ length: quizResult.total }, (_, i) => (
											<div
												key={i}
												className={`w-4 h-4 rounded-full ${
													i < quizResult.correct ? 'bg-green-500' : 'bg-red-500'
												}`}
												title={i < quizResult.correct ? 'Correct' : 'Incorrect'}
											/>
										))}
									</div>
								</div>
							</div>
						)}
						
						{/* General completion message */}
						<p className="text-gray-600 mb-6">
							You've completed {quizType === 'scored' ? 'a quiz' : 'practice vocabulary'} with {currentQuiz?.cards.length} words.
						</p>
						
						<div className="flex justify-center space-x-4">
							<button onClick={handleNewQuiz} className="btn-primary">
								<Play className="w-4 h-4 mr-2" />
								New Quiz
							</button>
							{quizType === 'scored' && (
								<button onClick={() => setShowResults(false)} className="btn-outline">
									<ArrowLeft className="w-4 h-4 mr-2" />
									Review Quiz
								</button>
							)}
						</div>
					</div>
				</div>
			</div>
		)
	}

	if (currentQuiz) {
		const currentCard = currentQuiz.cards[currentCardIndex]
		const isFirst = currentCardIndex === 0
		const isLast = currentCardIndex === currentQuiz.cards.length - 1

		return (
			<div className="space-y-6">
				{/* Header with Back Button */}
				<div className="relative">
					{/* Back Button - Top Left */}
					<button onClick={handleNewQuiz} className="absolute left-0 top-0 btn-outline">
						<ArrowLeft className="w-4 h-4 mr-2" />
						Go Back
					</button>
					
					{/* Title - Centered */}
					<div className="text-center">
						<h1 className="text-3xl font-bold text-gray-900 mb-4">Flashcards</h1>
						<div className="flex items-center justify-center space-x-4 mb-4">
							<span className="text-sm text-gray-600">
								{quizType === 'scored' ? 'Take Quiz' : 'Practice Vocabulary'}
							</span>
							<span className="text-sm text-gray-600">
								Card {currentCardIndex + 1} of {currentQuiz.cards.length}
							</span>
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
		<div className="space-y-8">
			{/* Header */}
			<div className="text-center">
				<h1 className="text-3xl font-bold text-gray-900 mb-4">Flashcards</h1>
				<p className="text-gray-600">Test your Chinese vocabulary knowledge with interactive flashcards.</p>
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

			{/* Quiz History */}
			{isAuthenticated ? (
				historyData && historyData.history && historyData.history.length > 0 && (
					<div className="card">
						<div className="flex items-center justify-between mb-6">
							<div className="flex items-center space-x-2">
								<History className="w-5 h-5 text-primary-600" />
								<h2 className="text-xl font-semibold">Recent Quizzes</h2>
							</div>
							<button
								onClick={() => window.location.reload()}
								className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
							>
								<RefreshCw className="w-4 h-4" />
								<span>Refresh</span>
							</button>
						</div>

						<div className="space-y-4">
							{historyData.history.slice(0, 5).map((quiz: any) => (
								<div key={quiz.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
									<div>
										<div className="font-medium">
											{quiz.type === 'scored' ? 'Take Quiz' : 'Practice Vocabulary'}
										</div>
										<div className="text-sm text-gray-600">
											{quiz.correct}/{quiz.total} correct ({quiz.percentage}%)
										</div>
									</div>
									<div className="text-sm text-gray-500">
										{new Date(quiz.completed_at).toLocaleDateString()}
									</div>
								</div>
							))}
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