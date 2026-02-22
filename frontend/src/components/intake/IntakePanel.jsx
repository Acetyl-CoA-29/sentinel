import { useState, useRef, useEffect } from 'react'
import { Send, Mic, MicOff, Loader2 } from 'lucide-react'

export default function IntakePanel({ onSubmit }) {
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
    recognition.lang = 'en-US'
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
    <div className="absolute bottom-4 left-4 right-4 z-[1000]">
      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2 bg-slate-900/95 backdrop-blur border border-slate-700/50 rounded-xl px-3 py-2 shadow-2xl"
      >
        <button
          type="button"
          onClick={toggleVoice}
          className={`shrink-0 p-2 rounded-lg transition-colors cursor-pointer ${
            listening
              ? 'bg-red-500/20 text-red-400 animate-pulse'
              : 'bg-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          {listening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        </button>

        <div className="flex-1 relative">
          <input
            type="text"
            value={displayText}
            onChange={(e) => setText(e.target.value)}
            placeholder="Report an encounter... (e.g. 'saw 4 patients with severe watery diarrhea in Old Dhaka today')"
            className="w-full bg-transparent text-sm text-slate-200 placeholder-slate-600 outline-none"
            disabled={loading || listening}
          />
          {listening && (
            <div className="absolute -top-7 left-0 flex items-center gap-1.5 text-[10px] text-red-400">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              Listening... speak your report
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={!text.trim() || loading || listening}
          className="shrink-0 p-2 rounded-lg bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </button>
      </form>
    </div>
  )
}
