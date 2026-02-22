import { useEffect, useRef, useState } from 'react'
import { Mic } from 'lucide-react'
import { useAccessibility } from '../../contexts/AccessibilityContext'
import { SPEECH_LANG } from '../../i18n'
import { theme, alpha } from '../../design'

export default function VoiceCommands() {
  const { settings, toggleSetting } = useAccessibility()
  const recognitionRef = useRef(null)
  const [lastCommand, setLastCommand] = useState('')

  useEffect(() => {
    if (!settings.voiceCommands) {
      recognitionRef.current?.stop()
      recognitionRef.current = null
      return
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) return

    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = false
    recognition.lang = SPEECH_LANG[settings.language] || 'en-US'
    recognitionRef.current = recognition

    recognition.onresult = (event) => {
      const last = event.results[event.results.length - 1]
      if (!last.isFinal) return
      const command = last[0].transcript.toLowerCase().trim()
      setLastCommand(command)
      setTimeout(() => setLastCommand(''), 2000)

      if (command.includes('report')) {
        document.querySelector('[data-action="intake-input"]')?.focus()
      } else if (command.includes('demo')) {
        document.querySelector('[data-action="run-demo"]')?.click()
      } else if (command.includes('contrast')) {
        toggleSetting('highContrast')
      } else if (command.includes('simple')) {
        toggleSetting('simpleView')
      } else if (command.includes('stop')) {
        window.speechSynthesis?.cancel()
      }
    }

    recognition.onend = () => {
      if (settings.voiceCommands && recognitionRef.current) {
        try { recognition.start() } catch {}
      }
    }

    recognition.onerror = () => {}

    try { recognition.start() } catch {}

    return () => {
      recognition.onend = null
      recognition.stop()
      recognitionRef.current = null
    }
  }, [settings.voiceCommands, settings.language, toggleSetting])

  if (!settings.voiceCommands) return null

  return (
    <div
      className="fixed bottom-20 right-4 z-[1500] flex items-center gap-2 px-3 py-1.5 rounded-full shadow-lg text-xs frosted-glass"
      style={{
        backgroundColor: 'rgba(28, 28, 30, 0.72)',
      }}
    >
      <Mic
        className="w-3.5 h-3.5 animate-pulse"
        style={{ color: theme.agents.accessibility.color }}
      />
      <span style={{ color: theme.agents.accessibility.color }}>
        {lastCommand ? `"${lastCommand}"` : 'Listening...'}
      </span>
    </div>
  )
}
