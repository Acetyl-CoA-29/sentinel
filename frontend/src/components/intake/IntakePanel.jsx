import { useState, useRef, useEffect } from 'react'
import { Send, Mic, MicOff, Loader2 } from 'lucide-react'
import { t, SPEECH_LANG } from '../../i18n'
import { theme, alpha } from '../../design'

export default function IntakePanel({ onSubmit, language = 'en' }) {
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [listening, setListening] = useState(false)
  const [interim, setInterim] = useState('')
  const recognitionRef = useRef(null)
  const autoSubmitRef = useRef(false)

  const handleSubmit = async (e) => {
    e?.preventDefault()
    const input = text.trim()
    if (!input || loading) return

    setLoading(true)
    try {
      await onSubmit(input)
      setText('')
      setInterim('')
    } finally {
      setLoading(false)
    }
  }

  // Auto-submit when voice recognition finishes with final text
  useEffect(() => {
    if (autoSubmitRef.current && text.trim() && !listening && !loading) {
      autoSubmitRef.current = false
      handleSubmit()
    }
  }, [text, listening])

  const toggleVoice = () => {
    if (listening) {
      recognitionRef.current?.stop()
      setListening(false)
      return
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      alert('Speech recognition not supported in this browser')
      return
    }

    const recognition = new SpeechRecognition()
    recognition.continuous = false
    recognition.interimResults = true
    recognition.lang = SPEECH_LANG[language] || 'en-US'
    recognitionRef.current = recognition

    recognition.onresult = (event) => {
      let finalTranscript = ''
      let interimTranscript = ''

      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i]
        if (result.isFinal) {
          finalTranscript += result[0].transcript
        } else {
          interimTranscript += result[0].transcript
        }
      }

      if (finalTranscript) {
        setText(finalTranscript)
        setInterim('')
        autoSubmitRef.current = true
      } else {
        setInterim(interimTranscript)
      }
    }

    recognition.onend = () => {
      setListening(false)
    }

    recognition.onerror = () => {
      setListening(false)
      setInterim('')
    }

    recognition.start()
    setListening(true)
    setText('')
    setInterim('')
  }

  const displayText = listening && interim ? interim : text

  return (
    <div className="absolute bottom-5 left-5 right-5 z-[1000]">
      <form
        onSubmit={handleSubmit}
        aria-label="Submit a health report"
        className="flex items-center gap-3 frosted-glass"
        style={{
          backgroundColor: theme.glass.background,
          borderRadius: theme.radius.xl,
          padding: '10px 12px 10px 20px',
          boxShadow: theme.shadow.elevated,
        }}
      >
        <button
          type="button"
          onClick={toggleVoice}
          aria-label={listening ? 'Stop voice input' : 'Start voice input'}
          aria-pressed={listening}
          className={`shrink-0 btn-pill flex items-center justify-center ${listening ? 'animate-pulse' : ''}`}
          style={{
            width: '36px',
            height: '36px',
            padding: 0,
            backgroundColor: listening ? alpha(theme.colors.accentRed, 0.2) : theme.colors.surfaceHover,
            color: listening ? theme.colors.accentRed : theme.colors.textSecondary,
          }}
        >
          {listening ? <MicOff className="w-4 h-4" aria-hidden="true" /> : <Mic className="w-4 h-4" aria-hidden="true" />}
        </button>

        <div className="flex-1 relative">
          <input
            type="text"
            value={displayText}
            onChange={(e) => setText(e.target.value)}
            placeholder={t(language, 'intakePlaceholder')}
            aria-label="Health report text"
            data-action="intake-input"
            className="w-full bg-transparent outline-none intake-input"
            style={{
              color: theme.colors.text,
              fontSize: '17px',
              fontWeight: 400,
            }}
            disabled={loading || listening}
          />
          {listening && (
            <div
              className="absolute -top-7 left-0 flex items-center gap-1.5"
              style={{ color: theme.colors.accentRed, fontSize: '12px' }}
              aria-live="polite"
            >
              <span
                className="w-1.5 h-1.5 rounded-full animate-pulse"
                style={{ backgroundColor: theme.colors.accentRed }}
                aria-hidden="true"
              />
              {t(language, 'listening')}
            </div>
          )}
        </div>

        {/* Submit — primary pill, Apple blue */}
        <button
          type="submit"
          disabled={!text.trim() || loading || listening}
          aria-label={loading ? 'Submitting report' : 'Submit report'}
          className="shrink-0 btn-pill flex items-center justify-center"
          style={{
            width: '40px',
            height: '40px',
            padding: 0,
            backgroundColor: theme.colors.accent,
            color: '#fff',
          }}
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
          ) : (
            <Send className="w-4 h-4" aria-hidden="true" />
          )}
        </button>
      </form>
    </div>
  )
}
