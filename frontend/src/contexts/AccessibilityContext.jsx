import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const AccessibilityContext = createContext(null)

const STORAGE_KEY = 'sentinel-accessibility'

const DEFAULT_SETTINGS = {
  highContrast: false,
  fontSize: 'normal',       // 'normal' | 'large' | 'xlarge'
  simpleView: false,
  colorBlindMode: 'normal', // 'normal' | 'protanopia' | 'deuteranopia' | 'tritanopia'
  ttsEnabled: false,
  ttsAutoRead: false,
  voiceCommands: false,
  focusAssist: false,
  language: 'en',
}

export function AccessibilityProvider({ children }) {
  const [settings, setSettings] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      return stored ? { ...DEFAULT_SETTINGS, ...JSON.parse(stored) } : DEFAULT_SETTINGS
    } catch {
      return DEFAULT_SETTINGS
    }
  })

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  }, [settings])

  // Sync CSS classes onto <html>
  useEffect(() => {
    const html = document.documentElement

    html.classList.toggle('high-contrast', settings.highContrast)

    html.classList.remove('font-normal', 'font-large', 'font-xlarge')
    html.classList.add(`font-${settings.fontSize}`)

    html.dataset.colorBlind = settings.colorBlindMode

    html.classList.toggle('simple-view', settings.simpleView)
    html.classList.toggle('focus-assist', settings.focusAssist)
  }, [settings])

  const updateSetting = useCallback((key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }, [])

  const toggleSetting = useCallback((key) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }))
  }, [])

  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS)
  }, [])

  return (
    <AccessibilityContext.Provider value={{ settings, updateSetting, toggleSetting, resetSettings }}>
      {children}
    </AccessibilityContext.Provider>
  )
}

export function useAccessibility() {
  const ctx = useContext(AccessibilityContext)
  if (!ctx) throw new Error('useAccessibility must be used within AccessibilityProvider')
  return ctx
}
