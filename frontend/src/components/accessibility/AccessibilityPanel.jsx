import { useEffect, useRef } from 'react'
import {
  X,
  Eye,
  Hand,
  Brain,
  Globe,
  RotateCcw,
  Keyboard,
} from 'lucide-react'
import { useAccessibility } from '../../contexts/AccessibilityContext'
import { t, LANG_OPTIONS } from '../../i18n'
import { theme, alpha } from '../../design'

function Toggle({ checked, onChange, label, description, id }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <div className="flex-1 min-w-0">
        <label htmlFor={id} className="text-sm font-medium cursor-pointer" style={{ color: theme.colors.text }}>
          {label}
        </label>
        {description && (
          <p className="text-xs mt-0.5" style={{ color: theme.colors.textSecondary }}>{description}</p>
        )}
      </div>
      <button
        id={id}
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className="relative shrink-0 w-12 h-7 rounded-full transition-colors cursor-pointer"
        style={{
          backgroundColor: checked ? theme.colors.accent : theme.colors.surfaceActive,
        }}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${
            checked ? 'translate-x-5' : ''
          }`}
        />
      </button>
    </div>
  )
}

function RadioGroup({ value, onChange, options, label }) {
  return (
    <div className="py-2">
      <span className="text-sm font-medium" style={{ color: theme.colors.text }}>{label}</span>
      <div className="flex gap-2 mt-1.5" role="radiogroup" aria-label={label}>
        {options.map((opt) => (
          <button
            key={opt.value}
            role="radio"
            aria-checked={value === opt.value}
            onClick={() => onChange(opt.value)}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
            style={value === opt.value ? {
              backgroundColor: alpha(theme.colors.accent, 0.2),
              color: theme.colors.accent,
            } : {
              backgroundColor: theme.colors.surfaceHover,
              color: theme.colors.textSecondary,
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  )
}

function SelectGroup({ value, onChange, options, label, id }) {
  return (
    <div className="py-2">
      <label htmlFor={id} className="text-sm font-medium" style={{ color: theme.colors.text }}>
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1.5 w-full text-sm rounded-lg px-3 py-2 outline-none cursor-pointer"
        style={{
          backgroundColor: theme.colors.surfaceHover,
          color: theme.colors.text,
        }}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  )
}

// Section header colors mapped to theme
const SECTION_COLORS = {
  vision: theme.colors.accent,
  motor: theme.colors.accentOrange,
  cognitive: theme.agents.research.color,
  language: theme.agents.accessibility.color,
}

export default function AccessibilityPanel({ isOpen, onClose }) {
  const { settings, updateSetting, toggleSetting, resetSettings } = useAccessibility()
  const panelRef = useRef(null)
  const lang = settings.language

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [isOpen, onClose])

  // Focus trap
  useEffect(() => {
    if (!isOpen || !panelRef.current) return
    const firstFocusable = panelRef.current.querySelector('button, [role="switch"], select')
    firstFocusable?.focus()
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[2000] flex">
      {/* Backdrop */}
      <div
        className="flex-1 backdrop-blur-sm"
        style={{ backgroundColor: alpha(theme.colors.bg, 0.5) }}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <aside
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={t(lang, 'accessibilitySettings')}
        className="w-80 overflow-y-auto flex flex-col frosted-glass"
        style={{
          backgroundColor: 'rgba(28, 28, 30, 0.72)',
          animation: 'slideInRight 0.25s ease-out',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-3 shrink-0"
        >
          <h2 className="text-sm font-bold tracking-wide uppercase" style={{ color: theme.colors.text }}>
            {t(lang, 'accessibilitySettings')}
          </h2>
          <button
            onClick={onClose}
            aria-label={t(lang, 'close')}
            className="p-1.5 rounded-lg btn-icon"
            style={{ color: theme.colors.textSecondary }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Sections */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-5">
          {/* Vision */}
          <section>
            <div className="flex items-center gap-2 mb-2">
              <Eye className="w-4 h-4" style={{ color: SECTION_COLORS.vision }} />
              <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: SECTION_COLORS.vision }}>
                {t(lang, 'vision')}
              </h3>
            </div>
            <div className="space-y-1 pl-3" style={{ borderLeft: `2px solid ${alpha(SECTION_COLORS.vision, 0.2)}` }}>
              <Toggle
                id="high-contrast"
                label={t(lang, 'highContrastMode')}
                description="Black background, white text, bold borders"
                checked={settings.highContrast}
                onChange={(v) => updateSetting('highContrast', v)}
              />
              <RadioGroup
                id="font-size"
                label={t(lang, 'fontSize')}
                value={settings.fontSize}
                onChange={(v) => updateSetting('fontSize', v)}
                options={[
                  { value: 'normal', label: t(lang, 'fontNormal') },
                  { value: 'large', label: t(lang, 'fontLarge') },
                  { value: 'xlarge', label: t(lang, 'fontXlarge') },
                ]}
              />
              <SelectGroup
                id="color-blind"
                label={t(lang, 'colorBlindMode')}
                value={settings.colorBlindMode}
                onChange={(v) => updateSetting('colorBlindMode', v)}
                options={[
                  { value: 'normal', label: t(lang, 'colorNormal') },
                  { value: 'protanopia', label: t(lang, 'protanopia') },
                  { value: 'deuteranopia', label: t(lang, 'deuteranopia') },
                  { value: 'tritanopia', label: t(lang, 'tritanopia') },
                ]}
              />
            </div>
          </section>

          {/* Motor */}
          <section>
            <div className="flex items-center gap-2 mb-2">
              <Hand className="w-4 h-4" style={{ color: SECTION_COLORS.motor }} />
              <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: SECTION_COLORS.motor }}>
                {t(lang, 'motor')}
              </h3>
            </div>
            <div className="space-y-1 pl-3" style={{ borderLeft: `2px solid ${alpha(SECTION_COLORS.motor, 0.2)}` }}>
              <Toggle
                id="focus-assist"
                label={t(lang, 'focusAssist')}
                description={t(lang, 'focusAssistDesc')}
                checked={settings.focusAssist}
                onChange={(v) => updateSetting('focusAssist', v)}
              />
              <div className="flex items-center gap-2 py-2 text-sm" style={{ color: theme.colors.textSecondary }}>
                <Keyboard className="w-4 h-4" />
                <span>{t(lang, 'keyboardShortcuts')}</span>
                <kbd
                  className="ml-auto px-1.5 py-0.5 text-[10px] rounded font-mono"
                  style={{
                    backgroundColor: theme.colors.surfaceHover,
                    color: theme.colors.text,
                  }}
                >
                  ?
                </kbd>
              </div>
            </div>
          </section>

          {/* Cognitive */}
          <section>
            <div className="flex items-center gap-2 mb-2">
              <Brain className="w-4 h-4" style={{ color: SECTION_COLORS.cognitive }} />
              <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: SECTION_COLORS.cognitive }}>
                {t(lang, 'cognitive')}
              </h3>
            </div>
            <div className="space-y-1 pl-3" style={{ borderLeft: `2px solid ${alpha(SECTION_COLORS.cognitive, 0.2)}` }}>
              <Toggle
                id="simple-view"
                label={t(lang, 'simpleView')}
                description={t(lang, 'simpleViewDesc')}
                checked={settings.simpleView}
                onChange={(v) => updateSetting('simpleView', v)}
              />
              <Toggle
                id="tts"
                label={t(lang, 'textToSpeech')}
                description="Read content aloud using your device speaker"
                checked={settings.ttsEnabled}
                onChange={(v) => updateSetting('ttsEnabled', v)}
              />
              {settings.ttsEnabled && (
                <Toggle
                  id="tts-auto"
                  label={t(lang, 'autoReadAlerts')}
                  description="Automatically read critical alerts when they appear"
                  checked={settings.ttsAutoRead}
                  onChange={(v) => updateSetting('ttsAutoRead', v)}
                />
              )}
            </div>
          </section>

          {/* Language & Communication */}
          <section>
            <div className="flex items-center gap-2 mb-2">
              <Globe className="w-4 h-4" style={{ color: SECTION_COLORS.language }} />
              <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: SECTION_COLORS.language }}>
                {t(lang, 'languageComm')}
              </h3>
            </div>
            <div className="space-y-1 pl-3" style={{ borderLeft: `2px solid ${alpha(SECTION_COLORS.language, 0.2)}` }}>
              <SelectGroup
                id="language"
                label={t(lang, 'languageLabel')}
                value={settings.language}
                onChange={(v) => updateSetting('language', v)}
                options={LANG_OPTIONS.map((o) => ({ value: o.code, label: o.label }))}
              />
              <Toggle
                id="voice-commands"
                label={t(lang, 'voiceCommands')}
                description="Control the dashboard with voice (say 'help' for commands)"
                checked={settings.voiceCommands}
                onChange={(v) => updateSetting('voiceCommands', v)}
              />
            </div>
          </section>
        </div>

        {/* Reset */}
        <div className="px-4 py-3 shrink-0">
          <button
            onClick={resetSettings}
            className="flex items-center justify-center gap-2 w-full py-2 text-xs font-semibold btn-pill cursor-pointer"
            style={{
              backgroundColor: theme.colors.surfaceHover,
              color: theme.colors.textSecondary,
            }}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            {t(lang, 'resetDefaults')}
          </button>
        </div>
      </aside>

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </div>
  )
}
