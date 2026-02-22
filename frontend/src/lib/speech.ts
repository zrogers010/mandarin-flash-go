export function speakText(text: string, lang: 'zh' | 'en') {
  if (!('speechSynthesis' in window)) return

  speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = lang === 'zh' ? 'zh-CN' : 'en-US'
  utterance.rate = lang === 'zh' ? 0.85 : 1
  speechSynthesis.speak(utterance)
}
