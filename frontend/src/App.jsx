import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Shield,
  Activity,
  AlertTriangle,
  Globe,
  Radio,
  Clock,
  Users,
  Zap,
  Play,
  Languages,
  Accessibility,
} from 'lucide-react'
import SurveillanceMap from './components/map/SurveillanceMap'
import AgentFeed from './components/feed/AgentFeed'
import AlertPanel from './components/alerts/AlertPanel'
import IntakePanel from './components/intake/IntakePanel'
import AgentOrchestration from './components/AgentOrchestration'
import AccessibilityPanel from './components/accessibility/AccessibilityPanel'
import KeyboardShortcuts from './components/accessibility/KeyboardShortcuts'
import VoiceCommands from './components/accessibility/VoiceCommands'
import { useAccessibility } from './contexts/AccessibilityContext'
import { t, LANG_OPTIONS } from './i18n'
import { theme, alpha } from './design'

const API = 'http://localhost:8111'
const WS_URL = 'ws://localhost:8111/ws/feed'

function getThreatLevel(clusters) {
  if (!clusters.length) return { label: 'CLEAR', style: theme.severity.clear }
  const maxAnomaly = Math.max(...clusters.filter(c => c.status === 'active').map((c) => c.anomaly_score || 0))
  if (maxAnomaly > 100) return { label: 'CRITICAL', style: theme.severity.critical, className: 'threat-critical' }
  if (maxAnomaly > 50) return { label: 'HIGH', style: theme.severity.alert }
  if (maxAnomaly > 10) return { label: 'MODERATE', style: theme.severity.moderate }
  return { label: 'LOW', style: theme.severity.low }
}

function MetricsBar({ encounters, clusters, events, language = 'en' }) {
  const activeClusters = clusters.filter((c) => c.status === 'active')
  const threat = getThreatLevel(clusters)
  const lastEvent = events.length > 0 ? events[events.length - 1] : null
  const lastTime = lastEvent?.timestamp
    ? new Date(lastEvent.timestamp).toLocaleTimeString('en-US', { hour12: false })
    : '--:--:--'

  const [demoLoading, setDemoLoading] = useState(false)

  const triggerAccessibilityDemo = async () => {
    setDemoLoading(true)
    try {
      await fetch(`${API}/demo/accessibility`, { method: 'POST' })
    } catch {}
    setTimeout(() => setDemoLoading(false), 1000)
  }

  return (
    <nav
      aria-label={t(language, 'encounters') + ' metrics'}
      className="flex items-center gap-6 px-6 py-2 shrink-0 frosted-glass"
      style={{
        backgroundColor: theme.glass.background,
        fontSize: '14px',
      }}
    >
      <div className="flex items-center gap-1.5" style={{ color: theme.colors.textSecondary }}>
        <Users className="w-3.5 h-3.5" aria-hidden="true" />
        <span style={{ color: theme.colors.textTertiary }}>{t(language, 'encounters')}:</span>
        <span className="font-bold metric-value" style={{ color: theme.colors.text }}>{encounters.length}</span>
      </div>

      <div className="flex items-center gap-1.5" style={{ color: theme.colors.textSecondary }}>
        <AlertTriangle className="w-3.5 h-3.5" aria-hidden="true" />
        <span style={{ color: theme.colors.textTertiary }}>{t(language, 'activeClusters')}:</span>
        <span className="font-bold" style={{ color: theme.colors.text }}>{activeClusters.length}</span>
      </div>

      <div className="flex items-center gap-1.5" style={{ color: theme.colors.textSecondary }}>
        <Radio className="w-3.5 h-3.5" style={{ color: theme.colors.accentGreen }} aria-hidden="true" />
        <span style={{ color: theme.colors.textTertiary }}>{t(language, 'agents')}:</span>
        <span className="font-bold" style={{ color: theme.colors.accentGreen }}>5/5 ONLINE</span>
      </div>

      <div className="flex items-center gap-1.5" style={{ color: theme.colors.textSecondary }}>
        <Zap className="w-3.5 h-3.5" aria-hidden="true" />
        <span style={{ color: theme.colors.textTertiary }}>{t(language, 'threat')}:</span>
        <span
          className={`px-2 py-0.5 font-bold rounded ${threat.className || ''}`}
          style={{
            color: threat.style.text,
            backgroundColor: threat.style.bg,
            fontSize: '12px',
          }}
        >
          {threat.label}
        </span>
      </div>

      <div className="flex items-center gap-1.5" style={{ color: theme.colors.textSecondary }}>
        <Clock className="w-3.5 h-3.5" aria-hidden="true" />
        <span style={{ color: theme.colors.textTertiary }}>{t(language, 'lastEvent')}:</span>
        <span style={{ color: theme.colors.text, fontFamily: theme.font.mono.family, fontSize: '13px' }}>{lastTime}</span>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <button
          onClick={triggerAccessibilityDemo}
          disabled={demoLoading}
          aria-label={t(language, 'accessibilityDemo')}
          className="btn-pill flex items-center gap-1.5"
          style={{
            backgroundColor: alpha(theme.agents.accessibility.color, 0.15),
            color: theme.agents.accessibility.color,
            padding: '6px 14px',
            fontSize: '13px',
          }}
        >
          <Globe className="w-3.5 h-3.5" aria-hidden="true" />
          {demoLoading ? t(language, 'running') : t(language, 'accessibilityDemo')}
        </button>
      </div>
    </nav>
  )
}

export default function App() {
  const [encounters, setEncounters] = useState([])
  const [clusters, setClusters] = useState([])
  const [events, setEvents] = useState([])
  const seenEventIds = useRef(new Set())
  const wsRef = useRef(null)

  const uidCounter = useRef(0)

  const { settings, updateSetting } = useAccessibility()
  const language = settings.language

  const [showA11yPanel, setShowA11yPanel] = useState(false)

  const addEvent = useCallback((event) => {
    const dedupKey = event.id || `${event.timestamp}-${event.agent}-${event.message}`
    if (seenEventIds.current.has(dedupKey)) return
    seenEventIds.current.add(dedupKey)
    event._uid = `${Date.now()}-${++uidCounter.current}`
    setEvents((prev) => [...prev, event].slice(-300))
  }, [])

  const fetchData = useCallback(async () => {
    try {
      const [encRes, clsRes] = await Promise.all([
        fetch(`${API}/encounters`),
        fetch(`${API}/clusters`),
      ])
      if (encRes.ok) setEncounters(await encRes.json())
      if (clsRes.ok) setClusters(await clsRes.json())
    } catch (err) {
      console.error('Failed to fetch data:', err)
    }
  }, [])

  // Fetch encounters, clusters, and backfill events on mount
  useEffect(() => {
    fetchData()

    fetch(`${API}/events?limit=50`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        data.forEach(addEvent)
      })
      .catch(() => {})
  }, [fetchData, addEvent])

  // WebSocket connection with auto-reconnect
  useEffect(() => {
    let ws
    let reconnectTimer
    let dead = false

    function connect() {
      if (dead) return
      ws = new WebSocket(WS_URL)
      wsRef.current = ws

      ws.onopen = () => {
        console.log('WebSocket connected')
      }

      ws.onmessage = (e) => {
        try {
          const event = JSON.parse(e.data)
          addEvent(event)
        } catch {}
      }

      ws.onclose = () => {
        if (!dead) {
          reconnectTimer = setTimeout(connect, 2000)
        }
      }

      ws.onerror = () => {
        ws.close()
      }
    }

    connect()

    return () => {
      dead = true
      clearTimeout(reconnectTimer)
      if (ws && ws.readyState <= 1) ws.close()
    }
  }, [addEvent])

  // Auto-refresh map data when new analyst events arrive (cluster updates)
  useEffect(() => {
    if (events.length === 0) return
    const latest = events[events.length - 1]
    if (latest.agent === 'analyst') {
      fetchData()
    }
  }, [events, fetchData])

  const handleIntakeSubmit = useCallback(
    async (text) => {
      try {
        const res = await fetch(`${API}/intake`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, lat: 23.7945, lng: 90.3620 }),
        })
        if (res.ok) {
          fetchData()
          setTimeout(fetchData, 3000)
          setTimeout(fetchData, 8000)
        }
        return res.ok
      } catch (err) {
        console.error('Intake failed:', err)
        return false
      }
    },
    [fetchData],
  )

  const [demoLoading, setDemoLoading] = useState(false)
  const [showOrchestration, setShowOrchestration] = useState(false)
  const [feedSplit, setFeedSplit] = useState(55)
  const rightColRef = useRef(null)

  const handleDragStart = useCallback((e) => {
    e.preventDefault()
    const handleMove = (ev) => {
      if (!rightColRef.current) return
      const rect = rightColRef.current.getBoundingClientRect()
      const pct = Math.max(20, Math.min(80, ((ev.clientY - rect.top) / rect.height) * 100))
      setFeedSplit(pct)
    }
    const handleUp = () => {
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      document.removeEventListener('mousemove', handleMove)
      document.removeEventListener('mouseup', handleUp)
    }
    document.body.style.cursor = 'row-resize'
    document.body.style.userSelect = 'none'
    document.addEventListener('mousemove', handleMove)
    document.addEventListener('mouseup', handleUp)
  }, [])

  const handleRunDemo = useCallback(async () => {
    if (demoLoading) return
    setDemoLoading(true)
    try {
      // Try /demo endpoint first
      let res
      try {
        res = await fetch(`${API}/demo`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
      } catch {
        // Fallback: send directly to /intake
        res = await fetch(`${API}/intake`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: "This is CHW Fatima in Mirpur-12. I saw 6 patients today, all with severe watery diarrhea and vomiting. Three are children under 5. One elderly woman is severely dehydrated and cannot keep fluids down. They all live near the Bhashantek canal. Symptoms started 2-3 days ago. I've never seen this many cases at once.",
            chw_id: "CHW-042-FATIMA",
            lat: 23.8042,
            lng: 90.3687,
          }),
        })
      }
      if (res && res.ok) {
        console.log('[DEMO] Pipeline started')
        fetchData()
        setTimeout(fetchData, 4000)
        setTimeout(fetchData, 10000)
      } else {
        console.error('[DEMO] Failed:', res?.status)
      }
    } catch (err) {
      console.error('[DEMO] Error:', err)
    } finally {
      // Re-enable after pipeline completes (~15s for all agent steps)
      setTimeout(() => setDemoLoading(false), 15000)
    }
  }, [fetchData, demoLoading])

  const handleCloseModals = useCallback(() => {
    setShowA11yPanel(false)
    setShowOrchestration(false)
  }, [])

  if (showOrchestration) {
    return (
      <div className="h-screen w-screen view-fade-enter" style={{ backgroundColor: theme.colors.bg }}>
        <AgentOrchestration
          events={events}
          onBack={() => setShowOrchestration(false)}
        />
      </div>
    )
  }

  return (
    <div className="h-screen w-screen flex flex-col" style={{ backgroundColor: theme.colors.bg }}>
      {/* Skip to content */}
      <a href="#main-content" className="skip-to-content">
        Skip to main content
      </a>

      {/* Header — 48px frosted glass */}
      <header
        role="banner"
        className="flex items-center gap-4 px-6 shrink-0 frosted-glass stagger-1"
        style={{
          height: '48px',
          backgroundColor: theme.glass.background,
        }}
      >
        <Shield className="w-5 h-5" style={{ color: theme.colors.accentRed }} aria-hidden="true" />
        <div>
          <h1
            style={{
              color: theme.colors.text,
              fontSize: '21px',
              fontWeight: 700,
              letterSpacing: '0.1em',
              lineHeight: 1.19,
            }}
          >
            SENTINEL
          </h1>
          <p
            className="-mt-0.5 uppercase"
            style={{
              color: theme.colors.textSecondary,
              fontSize: '14px',
              fontWeight: 400,
              letterSpacing: '0.15em',
            }}
          >
            {t(language, 'subtitle')}
          </p>
        </div>
        <div className="ml-auto flex items-center gap-3">
          {/* Accessibility button — secondary pill */}
          <button
            onClick={() => setShowA11yPanel(true)}
            aria-label={t(language, 'accessibilitySettings')}
            className="btn-pill flex items-center gap-1.5"
            style={{
              backgroundColor: 'transparent',
              color: theme.agents.accessibility.color,
              padding: '8px 18px',
              fontSize: '14px',
            }}
          >
            <Accessibility className="w-4 h-4" aria-hidden="true" />
            {t(language, 'accessibility')}
          </button>

          {/* Language selector */}
          <div className="flex items-center gap-1.5">
            <Languages className="w-4 h-4" style={{ color: theme.colors.textTertiary }} aria-hidden="true" />
            <select
              value={language}
              onChange={(e) => updateSetting('language', e.target.value)}
              aria-label={t(language, 'languageLabel')}
              className="outline-none cursor-pointer"
              style={{
                backgroundColor: theme.colors.surfaceHover,
                color: theme.colors.text,
                fontSize: '14px',
                fontWeight: 400,
                borderRadius: '980px',
                padding: '6px 14px',
                border: 'none',
              }}
            >
              {LANG_OPTIONS.map((opt) => (
                <option key={opt.code} value={opt.code}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Run Demo — primary pill */}
          <button
            onClick={handleRunDemo}
            disabled={demoLoading}
            data-action="run-demo"
            aria-label={t(language, 'runDemo')}
            className="btn-pill flex items-center gap-1.5"
            style={{
              backgroundColor: alpha(theme.colors.accentRed, 0.15),
              color: theme.colors.accentRed,
              padding: '8px 18px',
              fontSize: '14px',
            }}
          >
            <Play className="w-4 h-4" aria-hidden="true" />
            {demoLoading ? t(language, 'running') : t(language, 'runDemo')}
          </button>

          {/* Agent View — secondary pill */}
          <button
            onClick={() => setShowOrchestration(true)}
            aria-label="Agent orchestration view"
            className="agent-view-btn btn-pill flex items-center gap-1.5"
            style={{
              backgroundColor: alpha(theme.agents.research.color, 0.12),
              color: theme.agents.research.color,
              padding: '8px 18px',
              fontSize: '14px',
            }}
          >
            Agent View
          </button>

          <div className="flex items-center gap-2" style={{ color: theme.colors.textTertiary, fontSize: '14px' }} aria-live="polite">
            <Activity className="w-4 h-4 animate-pulse" style={{ color: theme.colors.accentGreen }} aria-hidden="true" />
            <span>{encounters.length} {t(language, 'encounters').toLowerCase()}</span>
            <span style={{ color: theme.colors.textTertiary, opacity: 0.4 }} aria-hidden="true">|</span>
            <span>{clusters.length} clusters</span>
          </div>
        </div>
      </header>

      {/* Metrics Bar */}
      <div className="stagger-2">
        <MetricsBar encounters={encounters} clusters={clusters} events={events} language={language} />
      </div>

      {/* Main content */}
      <main id="main-content" className="flex flex-1 min-h-0">
        {/* Left: Map (60%) — full bleed */}
        <section
          aria-label="Disease surveillance map showing encounter locations in Dhaka"
          className="w-[60%] relative panel-section stagger-3"
        >
          <SurveillanceMap encounters={encounters} clusters={clusters} />
          <IntakePanel onSubmit={handleIntakeSubmit} language={language} />
        </section>

        {/* Right: Feed + Alerts (40%) — resizable */}
        <aside
          ref={rightColRef}
          aria-label="Agent activity and alerts"
          className="w-[40%] flex flex-col"
        >
          {/* Top: Agent Feed */}
          <section
            data-section="agent-feed"
            tabIndex={-1}
            aria-label={t(language, 'agentActivity')}
            style={{ height: `${feedSplit}%` }}
            className="min-h-0 panel-section stagger-4"
          >
            <AgentFeed events={events} language={language} />
          </section>
          {/* Drag handle */}
          <div
            onMouseDown={handleDragStart}
            role="separator"
            aria-orientation="horizontal"
            aria-label="Resize panels"
            tabIndex={0}
            className="h-2 cursor-row-resize shrink-0 flex items-center justify-center"
            style={{
              backgroundColor: theme.colors.bg,
            }}
          >
            <div
              className="w-8 h-0.5 rounded-full transition-colors"
              style={{ backgroundColor: theme.colors.surfaceActive }}
            />
          </div>
          {/* Bottom: Alerts */}
          <section
            aria-label={t(language, 'activeAlerts')}
            style={{ height: `${100 - feedSplit}%` }}
            className="min-h-0 panel-section stagger-5"
          >
            <AlertPanel clusters={clusters} language={language} />
          </section>
        </aside>
      </main>

      {/* Accessibility Panel */}
      <AccessibilityPanel isOpen={showA11yPanel} onClose={() => setShowA11yPanel(false)} />

      {/* Keyboard Shortcuts */}
      <KeyboardShortcuts onClose={handleCloseModals} />

      {/* Voice Commands */}
      <VoiceCommands />
    </div>
  )
}
