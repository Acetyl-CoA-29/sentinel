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
} from 'lucide-react'
import SurveillanceMap from './components/map/SurveillanceMap'
import AgentFeed from './components/feed/AgentFeed'
import AlertPanel from './components/alerts/AlertPanel'
import IntakePanel from './components/intake/IntakePanel'
import AgentOrchestration from './components/AgentOrchestration'
import { t, LANG_OPTIONS } from './i18n'

const API = 'http://localhost:8111'
const WS_URL = 'ws://localhost:8111/ws/feed'

function getThreatLevel(clusters) {
  if (!clusters.length) return { label: 'CLEAR', cls: 'text-green-400 bg-green-500/10 border-green-500/30' }
  const maxAnomaly = Math.max(...clusters.filter(c => c.status === 'active').map((c) => c.anomaly_score || 0))
  if (maxAnomaly > 100) return { label: 'CRITICAL', cls: 'text-red-400 bg-red-500/15 border-red-500/30 threat-critical' }
  if (maxAnomaly > 50) return { label: 'HIGH', cls: 'text-orange-400 bg-orange-500/10 border-orange-500/30' }
  if (maxAnomaly > 10) return { label: 'MODERATE', cls: 'text-amber-400 bg-amber-500/10 border-amber-500/30' }
  return { label: 'LOW', cls: 'text-green-400 bg-green-500/10 border-green-500/30' }
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
    <div className="flex items-center gap-4 px-5 py-1.5 bg-slate-900/60 border-b border-slate-700/30 shrink-0 text-[11px]">
      <div className="flex items-center gap-1.5 text-slate-400">
        <Users className="w-3 h-3" />
        <span className="text-slate-500">{t(language, 'encounters')}:</span>
        <span className="text-slate-200 font-bold metric-value">{encounters.length}</span>
      </div>

      <div className="w-px h-3 bg-slate-700/50" />

      <div className="flex items-center gap-1.5 text-slate-400">
        <AlertTriangle className="w-3 h-3" />
        <span className="text-slate-500">{t(language, 'activeClusters')}:</span>
        <span className="text-slate-200 font-bold">{activeClusters.length}</span>
      </div>

      <div className="w-px h-3 bg-slate-700/50" />

      <div className="flex items-center gap-1.5 text-slate-400">
        <Radio className="w-3 h-3 text-green-500" />
        <span className="text-slate-500">{t(language, 'agents')}:</span>
        <span className="text-green-400 font-bold">5/5 ONLINE</span>
      </div>

      <div className="w-px h-3 bg-slate-700/50" />

      <div className="flex items-center gap-1.5 text-slate-400">
        <Zap className="w-3 h-3" />
        <span className="text-slate-500">{t(language, 'threat')}:</span>
        <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded border ${threat.cls}`}>
          {threat.label}
        </span>
      </div>

      <div className="w-px h-3 bg-slate-700/50" />

      <div className="flex items-center gap-1.5 text-slate-400">
        <Clock className="w-3 h-3" />
        <span className="text-slate-500">{t(language, 'lastEvent')}:</span>
        <span className="text-slate-300 font-mono tabular-nums">{lastTime}</span>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <button
          onClick={triggerAccessibilityDemo}
          disabled={demoLoading}
          className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded
                     bg-teal-600/20 text-teal-400 border border-teal-600/30
                     hover:bg-teal-600/30 disabled:opacity-50 cursor-pointer transition-colors"
        >
          <Globe className="w-3 h-3" />
          {demoLoading ? t(language, 'running') : t(language, 'accessibilityDemo')}
        </button>
      </div>
    </div>
  )
}

export default function App() {
  const [encounters, setEncounters] = useState([])
  const [clusters, setClusters] = useState([])
  const [events, setEvents] = useState([])
  const seenEventIds = useRef(new Set())
  const wsRef = useRef(null)

  const addEvent = useCallback((event) => {
    const key = event.id || `${event.timestamp}-${event.agent}-${event.message}`
    if (seenEventIds.current.has(key)) return
    seenEventIds.current.add(key)
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
          body: JSON.stringify({ text, lat: 23.71, lng: 90.41 }),
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
  const [language, setLanguage] = useState('en')
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
    setDemoLoading(true)
    try {
      await fetch(`${API}/intake`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: "This is CHW Fatima in Mirpur-12. I saw 6 patients today, all with severe watery diarrhea and vomiting. Three are children under 5. One elderly woman is severely dehydrated and cannot keep fluids down. They all live near the Bhashantek canal. Symptoms started 2-3 days ago. I've never seen this many cases at once.",
          lat: 23.812,
          lng: 90.368,
        }),
      })
      fetchData()
      setTimeout(fetchData, 4000)
      setTimeout(fetchData, 10000)
    } catch (err) {
      console.error('Demo failed:', err)
    } finally {
      setTimeout(() => setDemoLoading(false), 2000)
    }
  }, [fetchData])

  if (showOrchestration) {
    return (
      <div className="h-screen w-screen bg-slate-950">
        <AgentOrchestration
          events={events}
          onRunDemo={handleRunDemo}
          demoLoading={demoLoading}
          onBack={() => setShowOrchestration(false)}
        />
      </div>
    )
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-950">
      {/* Header */}
      <header className="flex items-center gap-3 px-5 py-2.5 bg-slate-900 border-b border-slate-700/50 shrink-0">
        <Shield className="w-6 h-6 text-red-500" />
        <div>
          <h1 className="text-lg font-bold tracking-wide text-slate-100">
            SENTINEL
          </h1>
          <p className="text-[11px] text-slate-400 -mt-0.5 tracking-widest uppercase">
            {t(language, 'subtitle')}
          </p>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <Languages className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="bg-slate-800 text-slate-300 text-xs border border-slate-700/50 rounded px-2 py-1 outline-none cursor-pointer"
            >
              {LANG_OPTIONS.map((opt) => (
                <option key={opt.code} value={opt.code}>{opt.label}</option>
              ))}
            </select>
          </div>
          <button
            onClick={handleRunDemo}
            disabled={demoLoading}
            className="flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded
                       bg-red-600/20 text-red-400 border border-red-600/30
                       hover:bg-red-600/30 disabled:opacity-50 cursor-pointer transition-colors"
          >
            <Play className="w-3.5 h-3.5" />
            {demoLoading ? t(language, 'running') : t(language, 'runDemo')}
          </button>
          <button
            onClick={() => setShowOrchestration(true)}
            className="agent-view-btn flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded
                       bg-purple-600/20 text-purple-400 border border-purple-600/30
                       hover:bg-purple-600/30 cursor-pointer transition-colors"
          >
            🧠 Agent View
          </button>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Activity className="w-3.5 h-3.5 text-green-500 animate-pulse" />
            <span>{encounters.length} {t(language, 'encounters').toLowerCase()}</span>
            <span className="text-slate-700">|</span>
            <span>{clusters.length} clusters</span>
          </div>
        </div>
      </header>

      {/* Metrics Bar */}
      <MetricsBar encounters={encounters} clusters={clusters} events={events} language={language} />

      {/* Main content */}
      <div className="flex flex-1 min-h-0">
        {/* Left: Map (60%) */}
        <div className="w-[60%] relative">
          <SurveillanceMap encounters={encounters} clusters={clusters} />
          <IntakePanel onSubmit={handleIntakeSubmit} language={language} />
        </div>

        {/* Right: Feed + Alerts (40%) — resizable */}
        <div ref={rightColRef} className="w-[40%] flex flex-col border-l border-slate-700/50">
          {/* Top: Agent Feed */}
          <div style={{ height: `${feedSplit}%` }} className="min-h-0">
            <AgentFeed events={events} language={language} />
          </div>
          {/* Drag handle */}
          <div
            onMouseDown={handleDragStart}
            className="h-1.5 bg-slate-800/80 hover:bg-slate-600 cursor-row-resize shrink-0 flex items-center justify-center group border-y border-slate-700/30"
          >
            <div className="w-8 h-0.5 bg-slate-600 group-hover:bg-slate-400 rounded-full transition-colors" />
          </div>
          {/* Bottom: Alerts */}
          <div style={{ height: `${100 - feedSplit}%` }} className="min-h-0">
            <AlertPanel clusters={clusters} encounters={encounters} language={language} />
          </div>
        </div>
      </div>
    </div>
  )
}
