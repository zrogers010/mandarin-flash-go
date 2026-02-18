import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
	BarChart3, Trophy, Target, Flame, Calendar, ChevronDown, ChevronUp,
	CheckCircle2, XCircle, ArrowLeft, Brain, TrendingUp
} from 'lucide-react'
import { quizApi, QuizHistoryItem, QuizDetail, QuizStats } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'

export function Progress() {
	const { isAuthenticated } = useAuth()
	const [expandedQuiz, setExpandedQuiz] = useState<string | null>(null)
	const [historyPage, setHistoryPage] = useState(1)

	const { data: statsData, isLoading: statsLoading } = useQuery({
		queryKey: ['quiz-stats'],
		queryFn: () => quizApi.getStats(),
		enabled: isAuthenticated,
		staleTime: 2 * 60 * 1000,
	})

	const { data: historyData, isLoading: historyLoading } = useQuery({
		queryKey: ['quiz-history', historyPage],
		queryFn: () => quizApi.getHistory(historyPage, 10),
		enabled: isAuthenticated,
		staleTime: 2 * 60 * 1000,
	})

	const { data: quizDetail, isLoading: detailLoading } = useQuery({
		queryKey: ['quiz-detail', expandedQuiz],
		queryFn: () => quizApi.getDetail(expandedQuiz!),
		enabled: !!expandedQuiz,
		staleTime: 5 * 60 * 1000,
	})

	if (!isAuthenticated) {
		return (
			<div className="max-w-2xl mx-auto text-center py-16">
				<BarChart3 className="w-16 h-16 text-primary-600 mx-auto mb-6" />
				<h1 className="text-3xl font-bold text-gray-900 mb-3">Track Your Progress</h1>
				<p className="text-gray-600 mb-8">
					Sign in to see your quiz performance, track which words you get wrong, and monitor your improvement over time.
				</p>
				<div className="flex justify-center gap-4">
					<Link to="/login" className="btn-primary">Sign In</Link>
					<Link to="/signup" className="btn-outline">Create Account</Link>
				</div>
			</div>
		)
	}

	const stats: QuizStats | undefined = statsData?.stats
	const history: QuizHistoryItem[] = historyData?.history || []
	const totalPages = historyData ? Math.ceil(historyData.total / historyData.limit) : 0

	return (
		<div className="space-y-8 max-w-4xl mx-auto">
			{/* Header */}
			<div>
				<h1 className="text-3xl font-bold text-gray-900">Your Progress</h1>
				<p className="text-gray-600 mt-1">Track your quiz performance and see which words need more practice.</p>
			</div>

			{/* Stats Overview */}
			{statsLoading ? (
				<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
					{[1, 2, 3, 4].map(i => (
						<div key={i} className="card animate-pulse">
							<div className="p-4"><div className="h-16 bg-gray-200 rounded" /></div>
						</div>
					))}
				</div>
			) : stats && stats.total_quizzes > 0 ? (
				<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
					<StatCard
						icon={<Target className="w-5 h-5 text-blue-600" />}
						label="Quizzes Taken"
						value={stats.total_quizzes.toString()}
						bgColor="bg-blue-50"
					/>
					<StatCard
						icon={<TrendingUp className="w-5 h-5 text-green-600" />}
						label="Average Score"
						value={`${stats.average_score.toFixed(1)}%`}
						bgColor="bg-green-50"
					/>
					<StatCard
						icon={<Trophy className="w-5 h-5 text-amber-600" />}
						label="Best Score"
						value={`${stats.best_score.toFixed(1)}%`}
						bgColor="bg-amber-50"
					/>
					<StatCard
						icon={<Flame className="w-5 h-5 text-orange-600" />}
						label="Current Streak"
						value={`${stats.current_streak} day${stats.current_streak !== 1 ? 's' : ''}`}
						bgColor="bg-orange-50"
					/>
				</div>
			) : (
				<div className="card">
					<div className="text-center py-8">
						<Brain className="w-12 h-12 text-gray-300 mx-auto mb-4" />
						<h2 className="text-lg font-semibold text-gray-700 mb-2">No quizzes yet</h2>
						<p className="text-gray-500 mb-6">Take a scored quiz to start tracking your progress.</p>
						<Link to="/flashcards" className="btn-primary inline-flex items-center">
							<Brain className="w-4 h-4 mr-2" />
							Start a Quiz
						</Link>
					</div>
				</div>
			)}

			{/* Additional stats row */}
			{stats && stats.total_quizzes > 0 && (
				<div className="grid grid-cols-3 gap-4">
					<div className="card">
						<div className="p-4 text-center">
							<div className="text-2xl font-bold text-gray-900">{stats.total_questions}</div>
							<div className="text-sm text-gray-500">Questions Answered</div>
						</div>
					</div>
					<div className="card">
						<div className="p-4 text-center">
							<div className="text-2xl font-bold text-green-600">{stats.total_correct}</div>
							<div className="text-sm text-gray-500">Correct Answers</div>
						</div>
					</div>
					<div className="card">
						<div className="p-4 text-center">
							<div className="text-2xl font-bold text-primary-600">{stats.quizzes_this_week}</div>
							<div className="text-sm text-gray-500">This Week</div>
						</div>
					</div>
				</div>
			)}

			{/* Quiz History */}
			{historyLoading ? (
				<div className="card animate-pulse">
					<div className="p-6"><div className="h-40 bg-gray-200 rounded" /></div>
				</div>
			) : history.length > 0 ? (
				<div className="space-y-4">
					<h2 className="text-xl font-semibold text-gray-900">Quiz History</h2>

					<div className="space-y-3">
						{history.map((quiz) => (
							<QuizHistoryRow
								key={quiz.id}
								quiz={quiz}
								isExpanded={expandedQuiz === quiz.id}
								detail={expandedQuiz === quiz.id ? quizDetail : undefined}
								detailLoading={expandedQuiz === quiz.id && detailLoading}
								onToggle={() => setExpandedQuiz(expandedQuiz === quiz.id ? null : quiz.id)}
							/>
						))}
					</div>

					{/* Pagination */}
					{totalPages > 1 && (
						<div className="flex justify-center items-center gap-4 pt-4">
							<button
								onClick={() => setHistoryPage(p => Math.max(1, p - 1))}
								disabled={historyPage <= 1}
								className="btn-outline text-sm disabled:opacity-50"
							>
								<ArrowLeft className="w-4 h-4 mr-1" />
								Previous
							</button>
							<span className="text-sm text-gray-600">
								Page {historyPage} of {totalPages}
							</span>
							<button
								onClick={() => setHistoryPage(p => Math.min(totalPages, p + 1))}
								disabled={historyPage >= totalPages}
								className="btn-outline text-sm disabled:opacity-50"
							>
								Next
								<ArrowLeft className="w-4 h-4 ml-1 rotate-180" />
							</button>
						</div>
					)}
				</div>
			) : null}
		</div>
	)
}

// ═══════════════════════════════════════════════════════════════════
// Sub-components
// ═══════════════════════════════════════════════════════════════════

function StatCard({ icon, label, value, bgColor }: {
	icon: React.ReactNode
	label: string
	value: string
	bgColor: string
}) {
	return (
		<div className="card">
			<div className="p-4 flex items-center gap-3">
				<div className={`p-2.5 rounded-xl ${bgColor}`}>
					{icon}
				</div>
				<div>
					<div className="text-xl font-bold text-gray-900">{value}</div>
					<div className="text-xs text-gray-500">{label}</div>
				</div>
			</div>
		</div>
	)
}

function QuizHistoryRow({ quiz, isExpanded, detail, detailLoading, onToggle }: {
	quiz: QuizHistoryItem
	isExpanded: boolean
	detail?: QuizDetail
	detailLoading: boolean
	onToggle: () => void
}) {
	const scoreColor = quiz.percentage >= 80
		? 'text-green-600'
		: quiz.percentage >= 50
			? 'text-yellow-600'
			: 'text-red-600'

	const scoreBg = quiz.percentage >= 80
		? 'bg-green-50'
		: quiz.percentage >= 50
			? 'bg-yellow-50'
			: 'bg-red-50'

	return (
		<div className="card overflow-hidden">
			{/* Summary row */}
			<button
				onClick={onToggle}
				className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors text-left"
			>
				<div className="flex items-center gap-4">
					<div className={`px-3 py-1.5 rounded-lg text-sm font-semibold ${scoreColor} ${scoreBg}`}>
						{quiz.percentage.toFixed(0)}%
					</div>
					<div>
						<div className="font-medium text-gray-900">
							{quiz.type === 'scored' ? 'Scored Quiz' : 'Practice'}
							{quiz.hsk_level && <span className="text-gray-500 ml-2">HSK {quiz.hsk_level}</span>}
						</div>
						<div className="text-sm text-gray-500">
							{quiz.correct}/{quiz.total} correct &middot;{' '}
							{new Date(quiz.completed_at).toLocaleDateString(undefined, {
								month: 'short', day: 'numeric', year: 'numeric',
								hour: 'numeric', minute: '2-digit'
							})}
						</div>
					</div>
				</div>
				<div className="flex items-center gap-2">
					{/* Mini dots for quick glance */}
					<div className="hidden sm:flex items-center gap-0.5">
						{quiz.card_results?.slice(0, 10).map((cr, i) => (
							<div
								key={i}
								className={`w-2 h-2 rounded-full ${cr.is_correct ? 'bg-green-400' : 'bg-red-400'}`}
							/>
						))}
					</div>
					{isExpanded ? (
						<ChevronUp className="w-5 h-5 text-gray-400" />
					) : (
						<ChevronDown className="w-5 h-5 text-gray-400" />
					)}
				</div>
			</button>

			{/* Expanded detail */}
			{isExpanded && (
				<div className="border-t border-gray-100 p-4 bg-gray-50">
					{detailLoading ? (
						<div className="flex items-center justify-center py-6">
							<div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600" />
							<span className="ml-3 text-sm text-gray-500">Loading details...</span>
						</div>
					) : detail?.card_results && detail.card_results.length > 0 ? (
						<div className="space-y-2">
							{/* Wrong answers first */}
							{detail.card_results
								.sort((a, b) => (a.is_correct === b.is_correct ? 0 : a.is_correct ? 1 : -1))
								.map((cr) => (
									<div
										key={cr.card_id}
										className={`flex items-center justify-between p-3 rounded-lg border ${
											cr.is_correct
												? 'bg-green-50 border-green-100'
												: 'bg-red-50 border-red-100'
										}`}
									>
										<div className="flex items-center gap-3 flex-1 min-w-0">
											{cr.is_correct ? (
												<CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
											) : (
												<XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
											)}
											<span className="text-lg font-medium">{cr.chinese || '—'}</span>
											<span className="text-sm text-gray-500">{cr.pinyin || ''}</span>
										</div>
										<div className="text-right text-sm flex-shrink-0 ml-4">
											{cr.is_correct ? (
												<span className="text-green-700">{cr.correct_answer}</span>
											) : (
												<div>
													<div className="text-red-600 line-through">{cr.user_answer}</div>
													<div className="text-green-700 font-medium">{cr.correct_answer}</div>
												</div>
											)}
										</div>
									</div>
								))}
						</div>
					) : (
						<p className="text-sm text-gray-500 text-center py-4">
							No detailed results available for this quiz.
						</p>
					)}
				</div>
			)}
		</div>
	)
}
