import { api } from './api'

const audioCache = new Map<string, string>()
let currentAudio: HTMLAudioElement | null = null

export async function speakText(text: string, lang: 'zh' | 'en') {
  if (currentAudio) {
    currentAudio.pause()
    currentAudio = null
  }

  const cacheKey = `${lang}:${text}`
  const cachedUrl = audioCache.get(cacheKey)

  if (cachedUrl) {
    playAudioUrl(cachedUrl)
    return
  }

  try {
    const response = await api.post('/tts', { text, lang }, { responseType: 'blob' })
    const contentType = response.headers['content-type'] || ''
    if (response.status === 200 && contentType.includes('audio')) {
      const blob = new Blob([response.data], { type: 'audio/mpeg' })
      const blobUrl = URL.createObjectURL(blob)
      audioCache.set(cacheKey, blobUrl)
      playAudioUrl(blobUrl)
      return
    }
  } catch {
    // API failed, fall through to browser fallback
  }

  browserSpeak(text, lang)
}

function playAudioUrl(url: string) {
  const audio = new Audio(url)
  currentAudio = audio
  audio.play().catch(() => {})
}

let cachedVoices: SpeechSynthesisVoice[] = []

function loadVoices() {
  if (!('speechSynthesis' in window)) return
  cachedVoices = speechSynthesis.getVoices()
}

function getChineseVoice(): SpeechSynthesisVoice | undefined {
  if (cachedVoices.length === 0) loadVoices()

  const zhVoices = cachedVoices.filter(
    (v) => v.lang.startsWith('zh') || v.lang.startsWith('cmn')
  )

  const preferred = ['Ting-Ting', 'Meijia', 'Sinji', 'Lili', 'Yuna']
  for (const name of preferred) {
    const match = zhVoices.find((v) => v.name.includes(name))
    if (match) return match
  }

  const nonCompact = zhVoices.find(
    (v) => !v.name.toLowerCase().includes('compact') && !v.default
  )
  if (nonCompact) return nonCompact

  return zhVoices[0]
}

function browserSpeak(text: string, lang: 'zh' | 'en') {
  if (!('speechSynthesis' in window)) return
  speechSynthesis.cancel()

  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = lang === 'zh' ? 'zh-CN' : 'en-US'
  utterance.rate = lang === 'zh' ? 0.8 : 1

  if (lang === 'zh') {
    const voice = getChineseVoice()
    if (voice) utterance.voice = voice
  }

  speechSynthesis.speak(utterance)
}

if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  speechSynthesis.onvoiceschanged = () => {
    cachedVoices = speechSynthesis.getVoices()
  }
  loadVoices()
}
