import { useState, useEffect } from 'react'
import { Volume2, RotateCw } from 'lucide-react'
import { speakText } from '@/lib/speech'
import { parseDefinitions } from '@/lib/definitions'
import { TonePinyin, ToneLegend } from '@/lib/pinyin'

interface QuizCardProps {
	card: {
		id: string
		chinese: string
		pinyin: string
		english: string
		hsk_level?: number
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
	/**
	 * When provided, practice mode shows Again/Hard/Good/Easy grading buttons
	 * on the card back (spaced repetition). Quality follows SM-2: 1=Again,
	 * 3=Hard, 4=Good, 5=Easy. Grading advances to the next card.
	 */
	onGrade?: (cardId: string, quality: number) => void
}

const GRADES: { label: string; sub: string; quality: number; key: string; cls: string }[] = [
	{ label: 'Again', sub: 'forgot', quality: 1, key: '1', cls: 'border-red-300 text-red-700 hover:bg-red-50 hover:border-red-400 dark:border-red-500/50 dark:text-red-300 dark:hover:bg-red-900/30' },
	{ label: 'Hard', sub: 'struggled', quality: 3, key: '2', cls: 'border-orange-300 text-orange-700 hover:bg-orange-50 hover:border-orange-400 dark:border-orange-500/50 dark:text-orange-300 dark:hover:bg-orange-900/30' },
	{ label: 'Good', sub: 'knew it', quality: 4, key: '3', cls: 'border-green-300 text-green-700 hover:bg-green-50 hover:border-green-400 dark:border-green-500/50 dark:text-green-300 dark:hover:bg-green-900/30' },
	{ label: 'Easy', sub: 'instant', quality: 5, key: '4', cls: 'border-primary-300 text-primary-700 hover:bg-primary-50 hover:border-primary-400 dark:border-primary-500/50 dark:text-primary-300 dark:hover:bg-primary-900/30' },
]

function isTypingTarget(e: KeyboardEvent): boolean {
	const el = e.target as HTMLElement | null
	if (!el) return false
	const tag = el.tagName
	return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable
}

function HskChip({ level }: { level?: number }) {
	if (!level || level < 1) return null
	return (
		<span className="absolute top-4 left-4 px-2.5 py-1 rounded-full bg-primary-50 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 text-xs font-semibold tracking-wide">
			HSK {level}
		</span>
	)
}

function AudioButton({ text, className = '', size = 'md' }: { text: string; className?: string; size?: 'sm' | 'md' }) {
	return (
		<button
			onClick={(e) => {
				e.stopPropagation()
				speakText(text, 'zh')
			}}
			className={`rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-300 hover:bg-primary-100 hover:text-primary-700 dark:hover:bg-primary-900/50 dark:hover:text-primary-300 transition-colors ${
				size === 'md' ? 'p-2.5' : 'p-1.5'
			} ${className}`}
			aria-label="Listen to pronunciation"
		>
			<Volume2 className={size === 'md' ? 'w-5 h-5' : 'w-4 h-4'} />
		</button>
	)
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
	showResults = false,
	onGrade,
}: QuizCardProps) {
	const [isFlipped, setIsFlipped] = useState(false)
	const [showPinyin, setShowPinyin] = useState(false)

	// Reset face/pinyin state whenever a new card is shown.
	useEffect(() => {
		setIsFlipped(false)
		setShowPinyin(false)
	}, [card.id])

	const handleFlip = () => {
		if (!isScored) setIsFlipped((f) => !f)
	}

	const handleShowPinyin = (e: React.MouseEvent) => {
		e.stopPropagation()
		setShowPinyin((s) => !s)
	}

	const handleAnswerSelect = (answer: string) => {
		onAnswer?.(card.id, answer)
	}

	const handleGrade = (quality: number) => {
		onGrade?.(card.id, quality)
		onNext()
	}

	// Keyboard shortcuts. Space flips (practice), 1-4 answers (scored) or
	// grades (practice+SRS), arrows navigate, P toggles pinyin, S speaks.
	useEffect(() => {
		const feedbackShown = showResults || card.isCorrect !== undefined

		function handleKey(e: KeyboardEvent) {
			if (isTypingTarget(e) || e.metaKey || e.ctrlKey || e.altKey) return

			switch (e.key) {
				case ' ':
					e.preventDefault()
					if (!isScored) setIsFlipped((f) => !f)
					break
				case 'ArrowRight':
				case 'Enter':
					e.preventDefault()
					onNext()
					break
				case 'ArrowLeft':
					e.preventDefault()
					if (!isFirst) onPrevious()
					break
				case 'p':
				case 'P':
					e.preventDefault()
					setShowPinyin((s) => !s)
					break
				case 's':
				case 'S':
					e.preventDefault()
					speakText(card.chinese, 'zh')
					break
				case '1':
				case '2':
				case '3':
				case '4': {
					e.preventDefault()
					const idx = Number(e.key) - 1
					if (isScored) {
						if (!feedbackShown && card.multiple_choice && card.multiple_choice[idx]) {
							onAnswer?.(card.id, card.multiple_choice[idx])
						}
					} else if (onGrade && isFlipped) {
						handleGrade(GRADES[idx].quality)
					}
					break
				}
			}
		}

		document.addEventListener('keydown', handleKey)
		return () => document.removeEventListener('keydown', handleKey)
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [card, isScored, isFlipped, isFirst, showResults, onGrade, onAnswer, onNext, onPrevious])

	const definitions = parseDefinitions(card.english)
	const primaryExample = card.example_sentences?.[0]

	// Show at most 5 senses on a card; scale the text down as the count grows so
	// multi-sense CC-CEDICT entries still fit neatly on the fixed-height card.
	const MAX_DEFS = 5
	const meaningSize = definitions.length <= 3 ? 'text-lg sm:text-xl' : 'text-base'

	// Soft face styling shared by both card faces.
	const face =
		'h-full rounded-3xl border border-gray-200/80 dark:border-gray-700 ' +
		'bg-gradient-to-br from-white via-white to-primary-50/60 ' +
		'dark:from-gray-800 dark:via-gray-800 dark:to-primary-900/20 ' +
		'shadow-[0_12px_40px_-12px_rgba(13,115,119,0.25)] dark:shadow-[0_12px_40px_-12px_rgba(0,0,0,0.6)]'

	// ---------- Scored (multiple-choice) mode ----------
	if (isScored) {
		return (
			<div key={card.id} className="w-full max-w-2xl mx-auto animate-slide-up">
				<div className={`${face.replace('h-full ', '')} p-6 sm:p-8 relative`}>
					<HskChip level={card.hsk_level} />
					<div className="relative text-center">
						<AudioButton text={card.chinese} className="absolute top-0 right-0" />

						<div className="chinese-text font-bold text-gray-900 dark:text-gray-50 pt-8 sm:pt-4 text-6xl sm:text-7xl tracking-wide">
							{card.chinese}
						</div>

						<div className="h-9 mt-4">
							{showPinyin ? (
								<TonePinyin text={card.pinyin} hanzi={card.chinese} className="text-xl font-medium" />
							) : (
								<button
									onClick={handleShowPinyin}
									className="px-3 py-1 text-sm text-primary-700 dark:text-primary-300 bg-primary-50 dark:bg-primary-900/30 rounded-full hover:bg-primary-100 dark:hover:bg-primary-900/50 transition-colors"
								>
									Show pinyin
								</button>
							)}
						</div>
					</div>

					{card.multiple_choice && (
						<div className="mt-6">
							<p className="text-center text-sm text-gray-500 dark:text-gray-400 mb-3">
								Select the correct English translation
							</p>
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
								{card.multiple_choice.slice(0, 4).map((option, index) => {
									const isCorrect = option === card.correct_answer
									const isUserAnswer = userAnswer === option
									const showFeedback = showResults || card.isCorrect !== undefined

									let cls =
										'flex items-center gap-2.5 p-3.5 text-left rounded-2xl border-2 transition-all text-sm '
									let chipCls = 'bg-black/5 dark:bg-white/10 text-gray-600 dark:text-gray-300'
									if (showFeedback) {
										if (isCorrect) {
											cls += 'border-green-500 bg-green-50 text-green-800 dark:bg-green-900/30 dark:text-green-200 dark:border-green-500'
											chipCls = 'bg-green-500 text-white'
										} else if (isUserAnswer) {
											cls += 'border-red-500 bg-red-50 text-red-800 dark:bg-red-900/30 dark:text-red-200 dark:border-red-500'
											chipCls = 'bg-red-500 text-white'
										} else {
											cls += 'border-gray-200 bg-gray-50 text-gray-400 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-500'
										}
									} else if (isUserAnswer) {
										cls += 'border-primary-500 bg-primary-50 text-primary-800 dark:bg-primary-900/40 dark:text-primary-100 dark:border-primary-500'
										chipCls = 'bg-primary-600 text-white'
									} else {
										cls +=
											'border-gray-200 bg-white text-gray-800 hover:border-primary-300 hover:bg-primary-50/40 hover:-translate-y-0.5 ' +
											'dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:hover:border-primary-500 dark:hover:bg-gray-600'
									}

									return (
										<button
											key={index}
											onClick={() => !showFeedback && handleAnswerSelect(option)}
											disabled={showFeedback}
											className={cls}
										>
											<span className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${chipCls}`}>
												{String.fromCharCode(65 + index)}
											</span>
											<span className="flex-1">{option}</span>
											{showFeedback && isCorrect && <span className="text-green-600 dark:text-green-400 font-bold">✓</span>}
											{showFeedback && isUserAnswer && !isCorrect && (
												<span className="text-red-600 dark:text-red-400 font-bold">✗</span>
											)}
										</button>
									)
								})}
							</div>

							{card.isCorrect !== undefined && (
								<div
									className={`mt-4 p-3 rounded-2xl text-center text-sm font-medium animate-slide-up ${
										card.isCorrect
											? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200'
											: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200'
									}`}
								>
									{card.isCorrect ? (
										'✓ Correct!'
									) : (
										<>✗ Correct answer: <span className="font-semibold">{card.correct_answer}</span></>
									)}
									<span className="block text-xs opacity-70 mt-0.5">
										<TonePinyin text={card.pinyin} hanzi={card.chinese} /> — press Enter for next
									</span>
								</div>
							)}
						</div>
					)}
				</div>

				<NavControls
					onPrevious={onPrevious}
					onNext={onNext}
					isFirst={isFirst}
					isLast={isLast}
				/>
				<KeyboardHint isScored />
			</div>
		)
	}

	// ---------- Practice (flip) mode ----------
	return (
		<div key={card.id} className="w-full max-w-xl mx-auto animate-slide-up">
			<div className="relative w-full h-[22rem] sm:h-[26rem] perspective-1000">
				<div
					className={`relative w-full h-full transition-transform duration-500 ease-out transform-style-preserve-3d cursor-pointer ${
						isFlipped ? 'rotate-y-180' : ''
					}`}
					onClick={handleFlip}
				>
					{/* Front: the character */}
					<div className="absolute inset-0 backface-hidden">
						<div className={`${face} flex flex-col items-center justify-center p-6 text-center relative`}>
							<HskChip level={card.hsk_level} />
							<AudioButton text={card.chinese} className="absolute top-4 right-4" />

							<div
								className="chinese-text font-bold text-gray-900 dark:text-gray-50 leading-none tracking-wide"
								style={{ fontSize: card.chinese.length > 3 ? '3.5rem' : card.chinese.length > 2 ? '4.5rem' : '6rem' }}
							>
								{card.chinese}
							</div>

							<div className="h-9 mt-6">
								{showPinyin ? (
									<TonePinyin text={card.pinyin} hanzi={card.chinese} className="text-2xl font-medium" />
								) : (
									<button
										onClick={handleShowPinyin}
										className="text-sm text-primary-700 dark:text-primary-300 bg-primary-50 dark:bg-primary-900/30 px-3.5 py-1.5 rounded-full hover:bg-primary-100 dark:hover:bg-primary-900/50 transition-colors"
									>
										Show pinyin
									</button>
								)}
							</div>

							<div className="absolute bottom-5 inset-x-0 flex items-center justify-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
								<RotateCw className="w-3.5 h-3.5" />
								Tap to reveal meaning
							</div>
						</div>
					</div>

					{/* Back: pinyin, meaning, example */}
					<div className="absolute inset-0 backface-hidden rotate-y-180">
						<div className={`${face} flex flex-col p-5 sm:p-6`}>
							{/* Header: character + pinyin + audio */}
							<div className="flex items-center justify-center gap-3 pb-3 border-b border-gray-100 dark:border-gray-700">
								<span className="text-3xl chinese-text font-bold text-gray-900 dark:text-gray-50">
									{card.chinese}
								</span>
								<TonePinyin text={card.pinyin} hanzi={card.chinese} className="text-xl font-medium" />
								<AudioButton text={card.chinese} size="sm" />
							</div>

							{/* Meaning */}
							<div className="flex-1 min-h-0 flex flex-col items-center justify-center py-2" onClick={(e) => e.stopPropagation()}>
								{definitions.length <= 1 ? (
									<div className="text-2xl sm:text-3xl font-semibold text-gray-900 dark:text-gray-50 text-center px-2 break-words">
										{card.english}
									</div>
								) : (
									<ol className={`w-full max-w-sm mx-auto overflow-y-auto max-h-full text-left space-y-1 px-1 ${meaningSize}`}>
										{definitions.slice(0, MAX_DEFS).map((def, i) => (
											<li key={i} className="flex gap-1.5 text-gray-800 dark:text-gray-100 leading-snug">
												<span className="text-primary-500 dark:text-primary-300 font-semibold flex-shrink-0">{i + 1}.</span>
												<span className="break-words min-w-0">{def}</span>
											</li>
										))}
										{definitions.length > MAX_DEFS && (
											<li className="text-xs text-gray-400 dark:text-gray-500 pl-5 pt-0.5">
												+{definitions.length - MAX_DEFS} more
											</li>
										)}
									</ol>
								)}
							</div>

							{/* One example sentence */}
							{primaryExample && (
								<div
									className="rounded-2xl bg-white/70 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700 px-4 py-3"
									onClick={(e) => e.stopPropagation()}
								>
									<div className="flex items-center gap-1.5">
										<span className="text-[15px] chinese-text font-medium text-gray-900 dark:text-gray-100">
											{primaryExample.chinese}
										</span>
										<button
											onClick={() => speakText(primaryExample.chinese, 'zh')}
											className="flex-shrink-0 p-0.5 rounded-full text-primary-500 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
											aria-label="Listen to example"
										>
											<Volume2 className="w-3 h-3" />
										</button>
									</div>
									{primaryExample.pinyin && (
										<div className="text-xs leading-snug mt-0.5">
											<TonePinyin text={primaryExample.pinyin} hanzi={primaryExample.chinese} />
										</div>
									)}
									<div className="text-xs text-gray-600 dark:text-gray-300 italic mt-0.5">
										{primaryExample.english}
									</div>
								</div>
							)}

							<div className="flex items-center justify-center gap-1.5 text-xs text-gray-400 dark:text-gray-500 pt-2.5">
								<RotateCw className="w-3.5 h-3.5" />
								Tap to flip back
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* SRS grading bar: shown once the card is revealed */}
			{onGrade && isFlipped ? (
				<div className="mt-5 sm:mt-6 animate-slide-up">
					<p className="text-center text-xs text-gray-500 dark:text-gray-400 mb-2">How well did you know this word?</p>
					<div className="grid grid-cols-4 gap-2">
						{GRADES.map((g) => (
							<button
								key={g.label}
								onClick={() => handleGrade(g.quality)}
								className={`py-2.5 rounded-2xl border-2 bg-white dark:bg-gray-800 font-medium transition-all hover:-translate-y-0.5 ${g.cls}`}
							>
								<span className="block text-sm">{g.label}</span>
								<span className="block text-[10px] opacity-60 font-normal">{g.sub}</span>
							</button>
						))}
					</div>
					<div className="flex justify-between items-center mt-3">
						<button
							onClick={onPrevious}
							disabled={isFirst}
							className="text-sm text-gray-500 hover:text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"
						>
							← Previous
						</button>
						<button onClick={onNext} className="text-sm text-gray-500 hover:text-gray-700">
							Skip →
						</button>
					</div>
				</div>
			) : (
				<NavControls onPrevious={onPrevious} onNext={onNext} isFirst={isFirst} isLast={isLast} />
			)}
			<KeyboardHint isScored={false} grading={!!onGrade} showLegend={isFlipped || showPinyin} />
		</div>
	)
}

function KeyboardHint({ isScored, grading = false, showLegend = false }: { isScored: boolean; grading?: boolean; showLegend?: boolean }) {
	return (
		<div className="mt-4 space-y-1.5">
			<div className="hidden sm:flex items-center justify-center gap-3 text-[11px] text-gray-400 dark:text-gray-500">
				{isScored ? (
					<>
						<span><Kbd>1</Kbd>–<Kbd>4</Kbd> answer</span>
						<span><Kbd>←</Kbd> <Kbd>→</Kbd> navigate</span>
					</>
				) : (
					<>
						<span><Kbd>Space</Kbd> flip</span>
						{grading && <span><Kbd>1</Kbd>–<Kbd>4</Kbd> grade</span>}
						<span><Kbd>←</Kbd> <Kbd>→</Kbd> navigate</span>
					</>
				)}
				<span><Kbd>P</Kbd> pinyin</span>
				<span><Kbd>S</Kbd> audio</span>
			</div>
			{showLegend && (
				<div className="flex justify-center text-[11px] text-gray-400 dark:text-gray-500">
					<ToneLegend />
				</div>
			)}
		</div>
	)
}

function Kbd({ children }: { children: React.ReactNode }) {
	return (
		<kbd className="px-1 py-0.5 rounded border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 font-sans text-[10px]">
			{children}
		</kbd>
	)
}

function NavControls({
	onPrevious,
	onNext,
	isFirst,
	isLast,
}: {
	onPrevious: () => void
	onNext: () => void
	isFirst: boolean
	isLast: boolean
}) {
	return (
		<div className="flex justify-between items-center mt-5 sm:mt-6">
			<button
				onClick={onPrevious}
				disabled={isFirst}
				className="btn-outline disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base px-4 py-2"
			>
				Previous
			</button>
			<button
				onClick={onNext}
				className={`${isLast ? 'btn-primary' : 'btn-outline'} text-sm sm:text-base px-5 py-2`}
			>
				{isLast ? 'Finish' : 'Next'}
			</button>
		</div>
	)
}
