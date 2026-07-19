/**
 * Tone-aware pinyin rendering.
 *
 * Splits a pinyin string (with tone marks, e.g. "xiàlìngyíng" or "guāng hé")
 * into syllables and colors each one by its tone — a widely used learning aid
 * (tone 1 red, tone 2 amber, tone 3 green, tone 4 blue, neutral gray).
 */

interface TonedVowel {
	base: string
	tone: 1 | 2 | 3 | 4
}

const TONED: Record<string, TonedVowel> = {
	'ā': { base: 'a', tone: 1 }, 'á': { base: 'a', tone: 2 }, 'ǎ': { base: 'a', tone: 3 }, 'à': { base: 'a', tone: 4 },
	'ē': { base: 'e', tone: 1 }, 'é': { base: 'e', tone: 2 }, 'ě': { base: 'e', tone: 3 }, 'è': { base: 'e', tone: 4 },
	'ī': { base: 'i', tone: 1 }, 'í': { base: 'i', tone: 2 }, 'ǐ': { base: 'i', tone: 3 }, 'ì': { base: 'i', tone: 4 },
	'ō': { base: 'o', tone: 1 }, 'ó': { base: 'o', tone: 2 }, 'ǒ': { base: 'o', tone: 3 }, 'ò': { base: 'o', tone: 4 },
	'ū': { base: 'u', tone: 1 }, 'ú': { base: 'u', tone: 2 }, 'ǔ': { base: 'u', tone: 3 }, 'ù': { base: 'u', tone: 4 },
	'ǖ': { base: 'ü', tone: 1 }, 'ǘ': { base: 'ü', tone: 2 }, 'ǚ': { base: 'ü', tone: 3 }, 'ǜ': { base: 'ü', tone: 4 },
	'Ā': { base: 'a', tone: 1 }, 'Á': { base: 'a', tone: 2 }, 'Ǎ': { base: 'a', tone: 3 }, 'À': { base: 'a', tone: 4 },
	'Ē': { base: 'e', tone: 1 }, 'É': { base: 'e', tone: 2 }, 'Ě': { base: 'e', tone: 3 }, 'È': { base: 'e', tone: 4 },
	'Ī': { base: 'i', tone: 1 }, 'Í': { base: 'i', tone: 2 }, 'Ǐ': { base: 'i', tone: 3 }, 'Ì': { base: 'i', tone: 4 },
	'Ō': { base: 'o', tone: 1 }, 'Ó': { base: 'o', tone: 2 }, 'Ǒ': { base: 'o', tone: 3 }, 'Ò': { base: 'o', tone: 4 },
	'Ū': { base: 'u', tone: 1 }, 'Ú': { base: 'u', tone: 2 }, 'Ǔ': { base: 'u', tone: 3 }, 'Ù': { base: 'u', tone: 4 },
	'Ǖ': { base: 'ü', tone: 1 }, 'Ǘ': { base: 'ü', tone: 2 }, 'Ǚ': { base: 'ü', tone: 3 }, 'Ǜ': { base: 'ü', tone: 4 },
}

const INITIALS = [
	'zh', 'ch', 'sh',
	'b', 'p', 'm', 'f', 'd', 't', 'n', 'l', 'g', 'k', 'h',
	'j', 'q', 'x', 'r', 'z', 'c', 's', 'y', 'w',
]

// Longest-first so the backtracking parser tries the greediest match first.
const FINALS = [
	'iang', 'iong', 'uang', 'ueng', 'üan',
	'ang', 'eng', 'ong', 'iao', 'ian', 'ing', 'uai', 'uan', 'üe', 'ün',
	'ai', 'ei', 'ao', 'ou', 'an', 'en', 'er', 'ua', 'uo', 'ui', 'un', 'ia', 'ie', 'iu', 'in',
	'a', 'o', 'e', 'i', 'u', 'ü',
]

// Finals that can stand alone without an initial consonant (standalone i/u/ü
// syllables are always written with y/w in pinyin, so exclude those).
const STANDALONE_OK = new Set([
	'a', 'o', 'e', 'ai', 'ei', 'ao', 'ou', 'an', 'en', 'ang', 'eng', 'er',
])

export type Tone = 1 | 2 | 3 | 4 | 5

export interface PinyinPart {
	text: string
	tone: Tone | null // null for separators/punctuation
}

const LETTER_RE = /[a-zA-ZüÜāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜĀÁǍÀĒÉĚÈĪÍǏÌŌÓǑÒŪÚǓÙǕǗǙǛ]/

function isLetter(ch: string): boolean {
	return LETTER_RE.test(ch)
}

/** Recursively split a base (tone-stripped, lowercase) string into syllables. */
function findParses(base: string, pos: number, acc: number[], out: number[][], limit: number): void {
	if (out.length >= limit) return
	if (pos === base.length) {
		out.push([...acc])
		return
	}

	// Erhua: a single trailing "r" attaches to the previous syllable.
	if (base[pos] === 'r' && pos === base.length - 1 && acc.length > 0) {
		const extended = [...acc]
		extended[extended.length - 1] += 1
		out.push(extended)
		return
	}

	for (const initial of ['', ...INITIALS]) {
		if (initial && !base.startsWith(initial, pos)) continue
		const finalStart = pos + initial.length
		for (const final of FINALS) {
			if (!base.startsWith(final, finalStart)) continue
			if (!initial && !STANDALONE_OK.has(final)) continue
			acc.push(initial.length + final.length)
			findParses(base, finalStart + final.length, acc, out, limit)
			acc.pop()
			if (out.length >= limit) return
		}
	}
}

/** Split one continuous run of pinyin letters into syllable strings. */
function splitRun(run: string, wantCount?: number): string[] {
	let base = ''
	for (const ch of run) {
		const toned = TONED[ch]
		base += toned ? toned.base : ch.toLowerCase()
	}

	const parses: number[][] = []
	findParses(base, 0, [], parses, 48)

	if (parses.length === 0) return [run]

	// Prefer a parse whose syllable count matches the hanzi length; otherwise
	// the fewest syllables (greedy) as ties go to longest-match-first ordering.
	let best = parses[0]
	if (wantCount !== undefined) {
		const match = parses.find((p) => p.length === wantCount)
		if (match) best = match
		else best = parses.reduce((a, b) => (Math.abs(b.length - wantCount) < Math.abs(a.length - wantCount) ? b : a), best)
	} else {
		best = parses.reduce((a, b) => (b.length < a.length ? b : a), best)
	}

	const syllables: string[] = []
	let idx = 0
	for (const len of best) {
		syllables.push(run.slice(idx, idx + len))
		idx += len
	}
	return syllables
}

function toneOf(syllable: string): Tone {
	for (const ch of syllable) {
		const toned = TONED[ch]
		if (toned) return toned.tone
	}
	return 5
}

/**
 * Tokenize a pinyin string into parts with tones. `hanzi` (the corresponding
 * Chinese text) is an optional hint used to pick the right syllable split for
 * unspaced pinyin like "xiàlìngyíng".
 */
export function tokenizePinyin(text: string, hanzi?: string): PinyinPart[] {
	const parts: PinyinPart[] = []
	const wantTotal = hanzi ? [...hanzi].filter((c) => /\p{Script=Han}/u.test(c)).length : undefined

	// Split into letter runs and separator runs.
	const runs: { text: string; letters: boolean }[] = []
	for (const ch of text) {
		const letters = isLetter(ch)
		const last = runs[runs.length - 1]
		if (last && last.letters === letters) last.text += ch
		else runs.push({ text: ch, letters })
	}

	const letterRunCount = runs.filter((r) => r.letters).length
	for (const run of runs) {
		if (!run.letters) {
			parts.push({ text: run.text, tone: null })
			continue
		}
		// Only use the hanzi count hint when the whole pinyin is one run;
		// otherwise each spaced run is (almost always) already one syllable.
		const hint = letterRunCount === 1 ? wantTotal : undefined
		for (const syl of splitRun(run.text, hint)) {
			parts.push({ text: syl, tone: toneOf(syl) })
		}
	}
	return parts
}

export const TONE_CLASSES: Record<Tone, string> = {
	1: 'text-red-500 dark:text-red-400',
	2: 'text-amber-600 dark:text-amber-400',
	3: 'text-green-600 dark:text-green-400',
	4: 'text-blue-600 dark:text-blue-400',
	5: 'text-gray-500 dark:text-gray-400',
}

export const TONE_NAMES: Record<Tone, string> = {
	1: '1st tone (flat)',
	2: '2nd tone (rising)',
	3: '3rd tone (dipping)',
	4: '4th tone (falling)',
	5: 'neutral tone',
}

/** Renders pinyin with each syllable colored by tone. */
export function TonePinyin({ text, hanzi, className = '' }: { text: string; hanzi?: string; className?: string }) {
	const parts = tokenizePinyin(text, hanzi)
	return (
		<span className={className} title="Colors show tones: red 1st, amber 2nd, green 3rd, blue 4th">
			{parts.map((p, i) => (
				<span key={i} className={p.tone ? TONE_CLASSES[p.tone] : undefined}>
					{p.text}
				</span>
			))}
		</span>
	)
}

/** Compact legend explaining the tone colors. */
export function ToneLegend({ className = '' }: { className?: string }) {
	const items: { label: string; tone: Tone }[] = [
		{ label: 'mā', tone: 1 },
		{ label: 'má', tone: 2 },
		{ label: 'mǎ', tone: 3 },
		{ label: 'mà', tone: 4 },
		{ label: 'ma', tone: 5 },
	]
	return (
		<span className={`inline-flex items-center gap-2 ${className}`}>
			<span>Tones:</span>
			{items.map((it, i) => (
				<span key={it.tone} className={`font-medium ${TONE_CLASSES[it.tone]}`}>
					{it.label}
					<span className="text-gray-400 dark:text-gray-500 font-normal">{i < 4 ? ` ${it.tone}` : ''}</span>
				</span>
			))}
		</span>
	)
}
