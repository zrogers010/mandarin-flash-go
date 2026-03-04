import { useState, useCallback, useRef, useEffect } from 'react'
import { Volume2, X } from 'lucide-react'
import { initials, isValidSyllable, getSyllable, applyTone, toneColors } from '@/data/pinyin'
import { getToneCharacter } from '@/data/toneCharacters'
import { speakText } from '@/lib/speech'
import { SEO } from '@/components/SEO'

const allFinals = [
  'a', 'o', 'e', 'i', 'u', 'ü',
  'ai', 'ei', 'ao', 'ou',
  'an', 'en', 'ang', 'eng', 'ong',
  'er',
  'ia', 'ie', 'iu', 'iao', 'ian', 'in', 'iang', 'ing', 'iong',
  'ua', 'uo', 'ui', 'uai', 'uan', 'un', 'uang',
  'üe', 'üan', 'ün',
]

const finalGroups = [
  { label: 'Simple', count: 6 },
  { label: 'Compound', count: 4 },
  { label: 'Nasal', count: 5 },
  { label: 'Other', count: 1 },
  { label: 'i-', count: 9 },
  { label: 'u-', count: 7 },
  { label: 'ü-', count: 3 },
]

const toneInfo = [
  { ordinal: '1st', desc: 'flat' },
  { ordinal: '2nd', desc: 'rising' },
  { ordinal: '3rd', desc: 'dipping' },
  { ordinal: '4th', desc: 'falling' },
]

interface TonePopover {
  syllable: string
  rect: DOMRect
}

export function PinyinChart() {
  const [popover, setPopover] = useState<TonePopover | null>(null)
  const [playingTone, setPlayingTone] = useState<string | null>(null)
  const popoverRef = useRef<HTMLDivElement>(null)

  const handleCellClick = useCallback((syllable: string, e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    setPopover((prev) => prev?.syllable === syllable ? null : { syllable, rect })
  }, [])

  const handleTonePlay = useCallback(async (syllable: string, tone: number) => {
    const character = getToneCharacter(syllable, tone)
    const textToSpeak = character || applyTone(syllable, tone)
    const key = `${syllable}-${tone}`
    setPlayingTone(key)
    try {
      await speakText(textToSpeak, 'zh')
    } catch {
      // TTS may fail
    }
    setTimeout(() => setPlayingTone(null), 800)
  }, [])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        popoverRef.current && !popoverRef.current.contains(e.target as Node)
      ) {
        setPopover(null)
      }
    }
    if (popover) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [popover])

  useEffect(() => {
    if (popover) {
      setPopover(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const getPopoverStyle = (): React.CSSProperties => {
    if (!popover) return { display: 'none' }
    const pw = 170
    const ph = 150
    const gap = 6

    let top = popover.rect.bottom + gap
    let left = popover.rect.left + popover.rect.width / 2 - pw / 2

    if (left < 8) left = 8
    if (left + pw > window.innerWidth - 8) left = window.innerWidth - pw - 8
    if (top + ph > window.innerHeight - 8) {
      top = popover.rect.top - ph - gap
    }

    return { position: 'fixed' as const, top, left, width: pw, zIndex: 9999 }
  }

  return (
    <div className="space-y-6">
      <SEO
        title="Interactive Pinyin Chart"
        description="Learn Mandarin Chinese pronunciation with our interactive pinyin chart. Click any syllable to hear it spoken with audio for all 400+ valid pinyin combinations."
      />

      <div className="text-center space-y-3">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900">
          Interactive Pinyin Chart
        </h1>
        <p className="text-gray-600 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed">
          Pinyin (拼音) is the standard romanization system for Mandarin Chinese.
          Click any syllable to hear all four tones.
        </p>
      </div>

      <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 pb-2">
        <table className="border-collapse text-sm" style={{ minWidth: '900px' }}>
          <thead>
            <tr>
              <th
                rowSpan={2}
                className="sticky left-0 z-20 bg-gray-800 text-white border border-gray-700 px-2 py-1.5 text-xs font-semibold w-12"
              />
              {finalGroups.map((g) => (
                <th
                  key={g.label}
                  colSpan={g.count}
                  className="bg-gray-800 text-white border border-gray-700 px-1 py-1 text-[10px] font-medium tracking-wide uppercase text-center"
                >
                  {g.label}
                </th>
              ))}
            </tr>
            <tr>
              {allFinals.map((f) => (
                <th
                  key={f}
                  className="bg-gray-100 border border-gray-200 px-1 py-1.5 text-center text-xs font-semibold text-gray-600 min-w-[44px]"
                >
                  {f}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {initials.map((initial) => {
              const hasAny = allFinals.some((f) => isValidSyllable(initial, f))
              if (!hasAny) return null

              return (
                <tr key={initial || '_empty'}>
                  <td className="sticky left-0 z-10 bg-gray-100 border border-gray-200 px-2 py-1 font-mono font-semibold text-gray-700 text-center text-xs">
                    {initial || '—'}
                  </td>
                  {allFinals.map((f) => {
                    const valid = isValidSyllable(initial, f)
                    const syllable = getSyllable(initial, f)
                    const isSelected = popover?.syllable === syllable

                    return (
                      <td
                        key={f}
                        className={`border border-gray-200 p-0 text-center ${
                          valid
                            ? isSelected ? 'bg-primary-100' : 'bg-white'
                            : 'bg-gray-50'
                        }`}
                      >
                        {valid ? (
                          <button
                            onClick={(e) => handleCellClick(syllable, e)}
                            className={`w-full px-0.5 py-1.5 text-xs font-medium transition-all hover:bg-primary-50 hover:text-primary-700 ${
                              isSelected
                                ? 'text-primary-700 font-semibold'
                                : 'text-gray-800'
                            }`}
                            title={syllable}
                          >
                            {syllable}
                          </button>
                        ) : null}
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>

        {popover && (
          <div
            ref={popoverRef}
            className="bg-white rounded-lg shadow-xl border border-gray-200 p-2 animate-fade-in"
            style={getPopoverStyle()}
          >
            <div className="flex items-center justify-between mb-1 px-1">
              <span className="text-sm font-bold text-gray-900">{popover.syllable}</span>
              <button
                onClick={() => setPopover(null)}
                className="p-0.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
            <div className="space-y-0.5">
              {[1, 2, 3, 4].map((tone) => {
                const withTone = applyTone(popover.syllable, tone)
                const key = `${popover.syllable}-${tone}`
                const isPlaying = playingTone === key
                return (
                  <button
                    key={tone}
                    onClick={() => handleTonePlay(popover.syllable, tone)}
                    className={`flex items-center w-full px-2 py-1 rounded text-xs transition-all ${
                      isPlaying
                        ? 'bg-primary-50 ring-1 ring-primary-200'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <Volume2 className={`w-3 h-3 mr-2 flex-shrink-0 ${
                      isPlaying ? 'text-primary-600' : 'text-gray-300'
                    }`} />
                    <span className={`font-semibold text-sm ${toneColors[tone - 1]}`}>
                      {withTone}
                    </span>
                    <span className="text-[10px] text-gray-400 ml-auto">
                      {toneInfo[tone - 1].desc}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-4 text-xs text-gray-500 justify-center">
        <span>Click any syllable to see all tones</span>
        <span className="text-gray-300">|</span>
        <span>Grey cells = invalid combinations</span>
        <span className="text-gray-300">|</span>
        <span>{allFinals.length} finals × {initials.length} initials</span>
      </div>

      <div className="card space-y-4">
        <h2 className="text-xl font-bold text-gray-900">What is Pinyin?</h2>
        <div className="text-gray-600 text-sm leading-relaxed space-y-3">
          <p>
            Pinyin (拼音, pīnyīn) literally means "spell sounds" in Chinese. It's the official
            romanization system for Standard Mandarin and is used by virtually all Chinese learners
            and native speakers alike. Children in China learn pinyin before they learn characters.
          </p>
          <p>
            Every possible sound in Mandarin Chinese can be represented as a combination of an
            <strong> initial</strong> (the consonant at the beginning) and a <strong>final</strong> (the
            vowel part that follows). Combined with one of four tones (plus a neutral tone), these
            syllables form the building blocks of every Chinese word.
          </p>
          <p>
            Mastering pinyin pronunciation is the single most important foundation for learning
            Mandarin. Once you can pronounce all the syllables correctly with proper tones, you'll
            be able to speak any word you encounter.
          </p>
        </div>
      </div>
    </div>
  )
}
