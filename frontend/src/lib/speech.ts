import { api } from './api'

const audioCache = new Map<string, string>()
let currentAudio: HTMLAudioElement | null = null

export async function speakText(text: string, lang: 'zh' | 'en') {
  if (currentAudio) {
    currentAudio.pause()
    currentAudio = null
  }

  const cacheKey = `${lang}:${text}`
  let blobUrl = audioCache.get(cacheKey)

  if (!blobUrl) {
    try {
      const response = await api.post('/tts', { text, lang }, { responseType: 'blob' })
      const blob = new Blob([response.data], { type: 'audio/mpeg' })
      blobUrl = URL.createObjectURL(blob)
      audioCache.set(cacheKey, blobUrl)
    } catch {
      fallbackSpeak(text, lang)
      return
    }
  }

  const audio = new Audio(blobUrl)
  currentAudio = audio
  audio.play()
}

function fallbackSpeak(text: string, lang: 'zh' | 'en') {
  if (!('speechSynthesis' in window)) return
  speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = lang === 'zh' ? 'zh-CN' : 'en-US'
  utterance.rate = lang === 'zh' ? 0.85 : 1
  speechSynthesis.speak(utterance)
}
