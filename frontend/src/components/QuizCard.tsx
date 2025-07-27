import { useState } from 'react'
import { RotateCcw, Volume2, Eye, EyeOff } from 'lucide-react'

interface QuizCardProps {
	card: {
		id: string
		chinese: string
		pinyin: string
		english: string
		example_sentences: Array<{
			chinese: string
			pinyin: string
			english: string
		}>
	}
	onNext: () => void
	onPrevious: () => void
	isFirst: boolean
	isLast: boolean
}

export function QuizCard({ card, onNext, onPrevious, isFirst, isLast }: QuizCardProps) {
	const [showPinyin, setShowPinyin] = useState(false)
	const [showAnswer, setShowAnswer] = useState(false)
	const [isFlipped, setIsFlipped] = useState(false)

	const handleFlip = () => {
		setIsFlipped(!isFlipped)
	}

	const handleShowPinyin = () => {
		setShowPinyin(!showPinyin)
	}

	const handleShowAnswer = () => {
		setShowAnswer(!showAnswer)
	}

	const speakText = (text: string, lang: 'zh' | 'en') => {
		if ('speechSynthesis' in window) {
			const utterance = new SpeechSynthesisUtterance(text)
			utterance.lang = lang === 'zh' ? 'zh-CN' : 'en-US'
			speechSynthesis.speak(utterance)
		}
	}

	return (
		<div className="w-full max-w-md mx-auto">
			{/* Flashcard */}
			<div
				className={`relative w-full h-64 cursor-pointer transition-transform duration-500 transform-style-preserve-3d ${
					isFlipped ? 'rotate-y-180' : ''
				}`}
				onClick={handleFlip}
			>
				{/* Front of card */}
				<div className={`absolute w-full h-full backface-hidden ${isFlipped ? 'opacity-0' : 'opacity-100'}`}>
					<div className="card h-full flex flex-col justify-center items-center p-6 text-center">
						{/* Chinese Character */}
						<div className="text-6xl font-bold mb-4 text-gray-800">{card.chinese}</div>
						
						{/* Pinyin Toggle */}
						<div className="flex items-center space-x-2 mb-4">
							<button
								onClick={(e) => {
									e.stopPropagation()
									handleShowPinyin()
								}}
								className="btn-outline btn-sm"
							>
								{showPinyin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
								{showPinyin ? 'Hide' : 'Show'} Pinyin
							</button>
							<button
								onClick={(e) => {
									e.stopPropagation()
									speakText(card.chinese, 'zh')
								}}
								className="btn-outline btn-sm"
							>
								<Volume2 className="w-4 h-4" />
							</button>
						</div>

						{/* Pinyin */}
						{showPinyin && (
							<div className="text-2xl text-gray-600 mb-4">{card.pinyin}</div>
						)}

						{/* Instructions */}
						<div className="text-sm text-gray-500">
							Click to flip card • Tap to hear pronunciation
						</div>
					</div>
				</div>

				{/* Back of card */}
				<div className={`absolute w-full h-full backface-hidden rotate-y-180 ${isFlipped ? 'opacity-100' : 'opacity-0'}`}>
					<div className="card h-full flex flex-col justify-center items-center p-6 text-center">
						{/* English Translation */}
						<div className="text-2xl font-semibold mb-4 text-gray-800">{card.english}</div>
						
						{/* Answer Toggle */}
						<div className="flex items-center space-x-2 mb-4">
							<button
								onClick={(e) => {
									e.stopPropagation()
									handleShowAnswer()
								}}
								className="btn-outline btn-sm"
							>
								{showAnswer ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
								{showAnswer ? 'Hide' : 'Show'} Examples
							</button>
						</div>

						{/* Example Sentences */}
						{showAnswer && card.example_sentences && card.example_sentences.length > 0 && (
							<div className="space-y-2 text-sm">
								{card.example_sentences.slice(0, 2).map((sentence, index) => (
									<div key={index} className="p-2 bg-gray-50 rounded">
										<div className="font-medium">{sentence.chinese}</div>
										<div className="text-gray-600">{sentence.pinyin}</div>
										<div className="text-gray-500 italic">{sentence.english}</div>
									</div>
								))}
							</div>
						)}

						{/* Instructions */}
						<div className="text-sm text-gray-500 mt-4">
							Click to flip back • Tap to see examples
						</div>
					</div>
				</div>
			</div>

			{/* Navigation Controls */}
			<div className="flex justify-between items-center mt-6">
				<button
					onClick={onPrevious}
					disabled={isFirst}
					className="btn-outline disabled:opacity-50 disabled:cursor-not-allowed"
				>
					Previous
				</button>

				<button
					onClick={() => {
						setIsFlipped(false)
						setShowPinyin(false)
						setShowAnswer(false)
					}}
					className="btn-outline"
				>
					<RotateCcw className="w-4 h-4 mr-2" />
					Reset
				</button>

				<button
					onClick={onNext}
					disabled={isLast}
					className="btn-outline disabled:opacity-50 disabled:cursor-not-allowed"
				>
					Next
				</button>
			</div>
		</div>
	)
} 