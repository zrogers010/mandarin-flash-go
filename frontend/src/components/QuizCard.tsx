import { useState } from 'react'
import { Volume2 } from 'lucide-react'
import { speakText } from '@/lib/speech'
import { parseDefinitions } from '@/lib/definitions'

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
		multiple_choice?: string[]
		correct_answer?: string
		userAnswer?: string
		isCorrect?: boolean
	}
	onNext: () => void
	onPrevious: () => void
	isFirst: boolean
	isLast: boolean
	onAnswer?: (cardId: string, answer: string) => void
	userAnswer?: string
	isScored?: boolean
	showResults?: boolean
}

export function QuizCard({ 
	card, 
	onNext, 
	onPrevious, 
	isFirst, 
	isLast, 
	onAnswer, 
	userAnswer, 
	isScored = false,
	showResults = false
}: QuizCardProps) {
	const [isFlipped, setIsFlipped] = useState(false)
	const [showPinyin, setShowPinyin] = useState(false)

	const handleFlip = () => {
		if (!isScored) {
			setIsFlipped(!isFlipped)
		}
	}

	const handleShowPinyin = (e: React.MouseEvent) => {
		e.stopPropagation()
		setShowPinyin(!showPinyin)
	}

	const handleAnswerSelect = (answer: string) => {
		if (onAnswer) {
			onAnswer(card.id, answer)
		}
	}

	return (
		<div className="w-full max-w-4xl mx-auto">
			{/* Flashcard Container */}
			<div className={`relative w-full perspective-1000 ${isScored ? 'min-h-[20rem] sm:min-h-[24rem]' : 'h-72 sm:h-96'}`}>
				{/* Flashcard */}
				<div
					className={`relative w-full h-full transition-transform duration-700 transform-style-preserve-3d cursor-pointer ${
						isFlipped ? 'rotate-y-180' : ''
					}`}
					onClick={handleFlip}
				>
					{/* Front of card */}
					<div className={`${isScored ? '' : 'absolute'} w-full h-full backface-hidden`}>
						<div className="card h-full flex flex-col justify-center items-center p-4 sm:p-6 text-center bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 shadow-lg relative">
							{/* Audio Button - Top Right */}
							<button
								onClick={(e) => {
									e.stopPropagation()
									speakText(card.chinese, 'zh')
								}}
								className="absolute top-3 right-3 sm:top-4 sm:right-4 p-2 rounded-full bg-blue-100 hover:bg-blue-200 active:bg-blue-300 transition-colors"
							>
								<Volume2 className="w-5 h-5 text-blue-600" />
							</button>

							{/* Chinese Character */}
							<div className="text-4xl sm:text-6xl font-bold mb-3 sm:mb-4 text-gray-800 chinese-text">{card.chinese}</div>
							
							{/* Pinyin Toggle Button */}
							<button
								onClick={handleShowPinyin}
								className="px-3 py-1.5 text-sm bg-blue-100 hover:bg-blue-200 active:bg-blue-300 text-blue-700 rounded-lg transition-colors mb-2"
							>
								{showPinyin ? 'Hide' : 'Show'} Pinyin
							</button>

							{/* Pinyin */}
							{showPinyin && (
								<div className="text-base sm:text-lg text-gray-600 mb-2 sm:mb-3">{card.pinyin}</div>
							)}

							{/* Multiple Choice Options for Scored Quiz */}
							{isScored && card.multiple_choice && (
								<div className="w-full max-w-2xl mt-2 sm:mt-3">
									<div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
										{card.multiple_choice.slice(0, 4).map((option, index) => {
											const isCorrect = option === card.correct_answer
											const isUserAnswer = userAnswer === option
											const showFeedback = showResults || card.isCorrect !== undefined
											
											let buttonClass = "p-2.5 sm:p-3 text-center rounded-lg border-2 transition-colors text-sm "
											
											if (showFeedback) {
												if (isCorrect) {
													buttonClass += "border-green-600 bg-green-50 text-green-700"
												} else if (isUserAnswer && !isCorrect) {
													buttonClass += "border-red-600 bg-red-50 text-red-700"
												} else {
													buttonClass += "border-gray-300 bg-gray-50 text-gray-500"
												}
											} else {
												if (isUserAnswer) {
													buttonClass += "border-primary-600 bg-primary-50 text-primary-700"
												} else {
													buttonClass += "border-gray-200 hover:border-gray-300 active:border-gray-400 bg-white hover:bg-gray-50"
												}
											}
											
											return (
												<button
													key={index}
													onClick={(e) => {
														e.stopPropagation()
														if (!showFeedback) {
															handleAnswerSelect(option)
														}
													}}
													disabled={showFeedback}
													className={buttonClass}
												>
													<span className="font-medium mr-1">{String.fromCharCode(65 + index)}.</span>
													{option}
													{showFeedback && isCorrect && (
														<span className="ml-2 text-green-600">✓</span>
													)}
													{showFeedback && isUserAnswer && !isCorrect && (
														<span className="ml-2 text-red-600">✗</span>
													)}
												</button>
											)
										})}
									</div>
									
									{/* Show immediate feedback for scored quizzes */}
									{card.isCorrect !== undefined && (
										<div className={`mt-2 sm:mt-3 p-2 rounded-lg text-center text-sm font-medium ${
											card.isCorrect 
												? 'bg-green-100 text-green-800 border border-green-200' 
												: 'bg-red-100 text-red-800 border border-red-200'
										}`}>
											{card.isCorrect ? '✓ Correct!' : '✗ Incorrect'}
										</div>
									)}
								</div>
							)}

							{/* Instructions */}
							<div className="text-xs sm:text-sm text-gray-500 mt-2 sm:mt-3">
								{isScored ? 'Select the correct English translation' : 'Tap to show answer'}
							</div>
							
							{/* Show correct answer when reviewing */}
							{showResults && isScored && card.correct_answer && (
								<div className="mt-2 sm:mt-3 p-2 sm:p-3 bg-green-50 border border-green-200 rounded-lg">
									<div className="text-sm font-medium text-green-800">
										Correct Answer: {card.correct_answer}
									</div>
								</div>
							)}
						</div>
					</div>

					{/* Back of card - Only for practice mode */}
					{!isScored && (
						<div className="absolute w-full h-full backface-hidden rotate-y-180">
							<div className="card h-full flex flex-col p-4 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 shadow-lg">
								{/* Character + Pinyin + Audio */}
								<div className="flex items-center justify-center gap-2 mb-2">
									<span className="text-lg chinese-text font-bold text-gray-800">{card.chinese}</span>
									<span className="text-sm text-gray-500">{card.pinyin}</span>
									<button
										onClick={(e) => {
											e.stopPropagation()
											speakText(card.chinese, 'zh')
										}}
										className="p-1 rounded-full bg-green-100 hover:bg-green-200 transition-colors"
										aria-label="Listen to pronunciation"
									>
										<Volume2 className="w-3.5 h-3.5 text-green-600" />
									</button>
								</div>

								{/* English Definitions */}
								<div className="mb-2" onClick={(e) => e.stopPropagation()}>
									{(() => {
										const defs = parseDefinitions(card.english)
										if (defs.length <= 1) {
											return (
												<div className="flex items-center justify-center gap-1.5">
													<span className="text-base font-semibold text-gray-800">{card.english}</span>
													<button
														onClick={() => speakText(card.english, 'en')}
														className="flex-shrink-0 p-0.5 rounded-full hover:bg-gray-200 transition-colors"
													>
														<Volume2 className="w-3 h-3 text-gray-400" />
													</button>
												</div>
											)
										}
										return (
											<div className="max-w-sm mx-auto">
												{defs.map((def, i) => (
													<div key={i} className="flex items-center gap-1 leading-snug py-[1px]">
														<span className="text-xs font-semibold text-green-600 flex-shrink-0 w-4 text-right">{i + 1}.</span>
														<span className="text-xs text-gray-800 flex-1">{def}</span>
														<button
															onClick={() => speakText(def, 'en')}
															className="flex-shrink-0 p-0.5 rounded-full hover:bg-gray-200 transition-colors"
														>
															<Volume2 className="w-2.5 h-2.5 text-gray-400" />
														</button>
													</div>
												))}
											</div>
										)
									})()}
								</div>

								{/* Example Sentences */}
								{card.example_sentences && card.example_sentences.length > 0 && (
									<div className="space-y-1.5 w-full flex-1" onClick={(e) => e.stopPropagation()}>
										{card.example_sentences.slice(0, 2).map((sentence, index) => (
											<div key={index} className="px-2.5 py-1.5 bg-white rounded-lg border border-gray-100">
												<div className="flex items-center gap-1 mb-px">
													<span className="text-xs chinese-text font-medium text-gray-900">{sentence.chinese}</span>
													<button
														onClick={() => speakText(sentence.chinese, 'zh')}
														className="flex-shrink-0 p-0.5 rounded-full hover:bg-blue-50 transition-colors"
													>
														<Volume2 className="w-2.5 h-2.5 text-blue-500" />
													</button>
												</div>
												{sentence.pinyin && (
													<div className="text-[10px] text-gray-400 leading-tight">{sentence.pinyin}</div>
												)}
												<div className="flex items-center gap-1">
													<span className="text-[11px] text-gray-600 italic">{sentence.english}</span>
													<button
														onClick={() => speakText(sentence.english, 'en')}
														className="flex-shrink-0 p-0.5 rounded-full hover:bg-gray-100 transition-colors"
													>
														<Volume2 className="w-2.5 h-2.5 text-gray-400" />
													</button>
												</div>
											</div>
										))}
									</div>
								)}

								<div className="text-[10px] text-gray-400 text-center pt-1">
									Click to flip back
								</div>
							</div>
						</div>
					)}
				</div>
			</div>

			{/* Navigation Controls */}
			<div className="flex justify-between items-center mt-4 sm:mt-8">
				<button
					onClick={onPrevious}
					disabled={isFirst}
					className="btn-outline disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base px-3 sm:px-4 py-2"
				>
					Previous
				</button>

				{isLast ? (
					<button
						onClick={onNext}
						className="btn-primary text-sm sm:text-base px-4 sm:px-4 py-2"
					>
						Finish
					</button>
				) : (
					<button
						onClick={onNext}
						className="btn-outline text-sm sm:text-base px-3 sm:px-4 py-2"
					>
						Next
					</button>
				)}
			</div>
		</div>
	)
} 