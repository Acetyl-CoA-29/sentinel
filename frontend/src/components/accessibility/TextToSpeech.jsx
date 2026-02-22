import { useCallback } from 'react'
import { useAccessibility } from '../../contexts/AccessibilityContext'
import { SPEECH_LANG } from '../../i18n'

export function useTTS() {
  const { settings } = useAccessibility()

  const speak = useCallback((text) => {
    if (!settings.ttsEnabled || !window.speechSynthesis) return
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = SPEECH_LANG[settings.language] || 'en-US'
    utterance.rate = 0.9
    utterance.pitch = 1.0
    window.speechSynthesis.speak(utterance)
  }, [settings.ttsEnabled, settings.language])

  const stop = useCallback(() => {
    window.speechSynthesis?.cancel()
  }, [])

  return { speak, stop, enabled: settings.ttsEnabled }
}
