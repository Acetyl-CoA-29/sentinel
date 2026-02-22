import { useEffect, useState } from 'react'
import { X, Keyboard } from 'lucide-react'
import { useAccessibility } from '../../contexts/AccessibilityContext'
import { theme, alpha } from '../../design'

const SHORTCUTS = [
  { key: 'R', description: 'Focus report input' },
  { key: 'D', description: 'Run full demo' },
  { key: 'H', description: 'Toggle high contrast' },
  { key: 'A', description: 'Jump to agent feed' },
  { key: 'Esc', description: 'Close modal / panel' },
  { key: '?', description: 'Show this help' },
]

export default function KeyboardShortcuts({ onClose }) {
  const { toggleSetting } = useAccessibility()
  const [showHelp, setShowHelp] = useState(false)

  useEffect(() => {
    const handler = (e) => {
      const tag = document.activeElement?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return

      switch (e.key) {
        case 'r':
        case 'R': {
          e.preventDefault()
          const input = document.querySelector('[data-action="intake-input"]')
          input?.focus()
          break
        }
        case 'd':
        case 'D': {
          e.preventDefault()
          const btn = document.querySelector('[data-action="run-demo"]')
          btn?.click()
          break
        }
        case 'h':
        case 'H': {
          e.preventDefault()
          toggleSetting('highContrast')
          break
        }
        case 'a':
        case 'A': {
          e.preventDefault()
          const feed = document.querySelector('[data-section="agent-feed"]')
          feed?.focus()
          break
        }
        case '?': {
          e.preventDefault()
          setShowHelp((prev) => !prev)
          break
        }
        case 'Escape': {
          if (showHelp) {
            setShowHelp(false)
          } else {
            onClose?.()
          }
          break
        }
      }
    }

    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [toggleSetting, onClose, showHelp])

  if (!showHelp) return null

  return (
    <div
      className="fixed inset-0 z-[3000] flex items-center justify-center view-fade-enter"
      style={{ backgroundColor: alpha(theme.colors.bg, 0.6), backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
    >
      <div
        className="rounded-xl w-[380px] overflow-hidden frosted-glass"
        style={{
          backgroundColor: 'rgba(28, 28, 30, 0.72)',
          boxShadow: theme.shadow.elevated,
        }}
        role="dialog"
        aria-modal="true"
        aria-label="Keyboard shortcuts"
      >
        <div
          className="flex items-center justify-between px-4 py-3"
        >
          <div className="flex items-center gap-2">
            <Keyboard className="w-4 h-4" style={{ color: theme.colors.accent }} />
            <h2 className="text-sm font-bold" style={{ color: theme.colors.text }}>
              Keyboard Shortcuts
            </h2>
          </div>
          <button
            onClick={() => setShowHelp(false)}
            className="p-1 rounded btn-icon"
            style={{ color: theme.colors.textSecondary }}
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-4 space-y-2">
          {SHORTCUTS.map((s) => (
            <div key={s.key} className="flex items-center justify-between text-sm">
              <span style={{ color: theme.colors.text }}>{s.description}</span>
              <kbd
                className="px-2 py-0.5 text-xs font-mono rounded"
                style={{
                  backgroundColor: theme.colors.surfaceHover,
                  color: theme.colors.text,
                }}
              >
                {s.key}
              </kbd>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
