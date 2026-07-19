import { useEffect, useRef, useState } from 'react'
import HanziWriter from 'hanzi-writer'
import { RotateCcw } from 'lucide-react'

const HAN_RE = /\p{Script=Han}/u
const MAX_CHARS = 6

/**
 * Animated stroke-order diagrams for each Han character in `text`,
 * played sequentially left to right. Stroke data is fetched on demand
 * by hanzi-writer (jsdelivr CDN).
 */
export function StrokeOrder({ text, size = 88, className = '' }: { text: string; size?: number; className?: string }) {
	const chars = [...text].filter((c) => HAN_RE.test(c)).slice(0, MAX_CHARS)
	const charSize = chars.length > 3 ? Math.round(size * 0.75) : size
	const containerRef = useRef<HTMLDivElement>(null)
	const [failedCount, setFailedCount] = useState(0)
	const [round, setRound] = useState(0)

	useEffect(() => {
		const container = containerRef.current
		if (!container || chars.length === 0) return

		let cancelled = false
		setFailedCount(0)
		const dark = document.documentElement.classList.contains('dark')
		const targets = Array.from(container.querySelectorAll<HTMLElement>('[data-stroke-char]'))
		const writers: (HanziWriter | null)[] = targets.map((el) => {
			el.innerHTML = ''
			try {
				return HanziWriter.create(el, el.dataset.strokeChar!, {
					width: charSize,
					height: charSize,
					padding: 4,
					showCharacter: false,
					strokeColor: dark ? '#5eead4' : '#0d7377',
					outlineColor: dark ? '#4b5563' : '#e5e7eb',
					strokeAnimationSpeed: 1.3,
					delayBetweenStrokes: 110,
					onLoadCharDataError: () => setFailedCount((n) => n + 1),
				})
			} catch {
				setFailedCount((n) => n + 1)
				return null
			}
		})

		const animateFrom = (i: number) => {
			if (cancelled || i >= writers.length) return
			const writer = writers[i]
			if (!writer) {
				animateFrom(i + 1)
				return
			}
			writer
				.animateCharacter()
				.then(() => {
					if (!cancelled) setTimeout(() => animateFrom(i + 1), 300)
				})
				.catch(() => animateFrom(i + 1))
		}
		const startTimer = setTimeout(() => animateFrom(0), 250)

		return () => {
			cancelled = true
			clearTimeout(startTimer)
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [text, charSize, round])

	if (chars.length === 0) return null

	if (failedCount >= chars.length) {
		return (
			<div className={`text-sm text-gray-400 dark:text-gray-500 text-center ${className}`}>
				Stroke-order data isn't available for this word.
			</div>
		)
	}

	return (
		<div ref={containerRef} className={`flex flex-col items-center gap-2.5 ${className}`}>
			<div className="flex flex-wrap items-center justify-center gap-2">
				{chars.map((ch, i) => (
					<div
						key={`${ch}-${i}`}
						data-stroke-char={ch}
						className="rounded-xl border border-gray-200 dark:border-gray-600 bg-white/80 dark:bg-gray-900/50"
						style={{ width: charSize, height: charSize }}
					/>
				))}
			</div>
			<button
				onClick={(e) => {
					e.stopPropagation()
					setRound((r) => r + 1)
				}}
				className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium text-primary-700 dark:text-primary-300 bg-primary-50 dark:bg-primary-900/30 hover:bg-primary-100 dark:hover:bg-primary-900/50 transition-colors"
			>
				<RotateCcw className="w-3 h-3" />
				Replay strokes
			</button>
		</div>
	)
}
