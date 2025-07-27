import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Play, Trophy, History, RefreshCw, ArrowLeft } from 'lucide-react'
import { quizApi } from '@/lib/api'
import { QuizCard } from '@/components/QuizCard'

type QuizType = 'practice' | 'scored'

export function Quiz() {
	const [quizType, setQuizType] = useState<QuizType>('practice')
	const [currentQuiz, setCurrentQuiz] = useState<any>(null)
	const [currentCardIndex, setCurrentCardIndex] = useState(0)
	const [showResults, setShowResults] = useState(false)

	// Generate quiz mutation
	const generateQuizMutation = useMutation({
		mutationFn: (type: QuizType) => quizApi.generate(type, 1, 10),
		onSuccess: (data) => {
			setCurrentQuiz(data)
			setCurrentCardIndex(0)
			setShowResults(false)
		},
	})

	// Submit quiz mutation
	const submitQuizMutation = useMutation({
		mutationFn: (data: { quizId: string; answers: Record<string, string>; completed: boolean }) =>
			quizApi.submit(data.quizId, data.answers, data.completed),
		onSuccess: () => {
			setShowResults(true)
		},
	})

	// Get quiz history
	const { data: historyData } = useQuery({
		queryKey: ['quiz-history'],
		queryFn: () => quizApi.getHistory(),
		staleTime: 5 * 60 * 1000, // 5 minutes
	})

	const handleGenerateQuiz = (type: QuizType) => {
		setQuizType(type)
		generateQuizMutation.mutate(type)
	}

	const handleNextCard = () => {
		if (currentCardIndex < currentQuiz.cards.length - 1) {
			setCurrentCardIndex(currentCardIndex + 1)
		}
	}

	const handlePreviousCard = () => {
		if (currentCardIndex > 0) {
			setCurrentCardIndex(currentCardIndex - 1)
		}
	}

	const handleFinishQuiz = () => {
		if (quizType === 'scored') {
			// For scored mode, submit the quiz
			submitQuizMutation.mutate({
				quizId: currentQuiz.id,
				answers: {}, // In a real implementation, you'd collect user answers
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
	}

	if (generateQuizMutation.isPending) {
		return (
			<div className="space-y-6">
				<div className="text-center">
					<h1 className="text-3xl font-bold text-gray-900 mb-4">Quiz Practice</h1>
					<p className="text-gray-600">Test your Chinese vocabulary knowledge with interactive flashcards.</p>
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
				<div className="text-center">
					<h1 className="text-3xl font-bold text-gray-900 mb-4">Quiz Complete!</h1>
					<p className="text-gray-600">Great job completing the quiz.</p>
				</div>

				<div className="card">
					<div className="text-center py-8">
						<div className="text-6xl mb-4">🎉</div>
						<h2 className="text-xl font-semibold mb-2">Quiz Finished</h2>
						<p className="text-gray-600 mb-6">
							You've completed {quizType === 'scored' ? 'a scored quiz' : 'practice mode'} with {currentQuiz?.cards.length} words.
						</p>
						
						<div className="flex justify-center space-x-4">
							<button onClick={handleNewQuiz} className="btn-primary">
								<Play className="w-4 h-4 mr-2" />
								New Quiz
							</button>
							<button onClick={() => setShowResults(false)} className="btn-outline">
								<ArrowLeft className="w-4 h-4 mr-2" />
								Back to Quiz
							</button>
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
				{/* Header */}
				<div className="text-center">
					<h1 className="text-3xl font-bold text-gray-900 mb-4">Quiz Practice</h1>
					<div className="flex items-center justify-center space-x-4 mb-4">
						<span className="text-sm text-gray-600">
							{quizType === 'scored' ? 'Scored Mode' : 'Practice Mode'}
						</span>
						<span className="text-sm text-gray-600">
							Card {currentCardIndex + 1} of {currentQuiz.cards.length}
						</span>
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
				/>

				{/* Finish Button */}
				{isLast && (
					<div className="text-center">
						<button onClick={handleFinishQuiz} className="btn-primary">
							<Trophy className="w-4 h-4 mr-2" />
							Finish Quiz
						</button>
					</div>
				)}

				{/* Back to Menu */}
				<div className="text-center">
					<button onClick={handleNewQuiz} className="btn-outline">
						<ArrowLeft className="w-4 h-4 mr-2" />
						Back to Menu
					</button>
				</div>
			</div>
		)
	}

	return (
		<div className="space-y-8">
			{/* Header */}
			<div className="text-center">
				<h1 className="text-3xl font-bold text-gray-900 mb-4">Quiz Practice</h1>
				<p className="text-gray-600">Test your Chinese vocabulary knowledge with interactive flashcards.</p>
			</div>

			{/* Quiz Types */}
			<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
				{/* Practice Mode */}
				<div className="card">
					<div className="text-center p-6">
						<div className="text-4xl mb-4">📚</div>
						<h2 className="text-xl font-semibold mb-2">Practice Mode</h2>
						<p className="text-gray-600 mb-4">
							Learn at your own pace with no pressure. Perfect for studying and reviewing vocabulary.
						</p>
						<button
							onClick={() => handleGenerateQuiz('practice')}
							disabled={generateQuizMutation.isPending}
							className="btn-primary w-full"
						>
							<Play className="w-4 h-4 mr-2" />
							Start Practice
						</button>
					</div>
				</div>

				{/* Scored Mode */}
				<div className="card">
					<div className="text-center p-6">
						<div className="text-4xl mb-4">🏆</div>
						<h2 className="text-xl font-semibold mb-2">Scored Mode</h2>
						<p className="text-gray-600 mb-4">
							Test your knowledge and track your progress. Challenge yourself with timed quizzes.
						</p>
						<button
							onClick={() => handleGenerateQuiz('scored')}
							disabled={generateQuizMutation.isPending}
							className="btn-primary w-full"
						>
							<Trophy className="w-4 h-4 mr-2" />
							Start Scored Quiz
						</button>
					</div>
				</div>
			</div>

			{/* Quiz History */}
			{historyData && historyData.history && historyData.history.length > 0 && (
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
										{quiz.type === 'scored' ? 'Scored Quiz' : 'Practice Mode'}
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
			)}
		</div>
	)
} 