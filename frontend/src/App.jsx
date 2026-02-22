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
} from 'lucide-react'
import SurveillanceMap from './components/map/SurveillanceMap'
import AgentFeed from './components/feed/AgentFeed'
import AlertPanel from './components/alerts/AlertPanel'
import IntakePanel from './components/intake/IntakePanel'

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

function MetricsBar({ encounters, clusters, events }) {
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
        <span className="text-slate-500">Encounters:</span>
        <span className="text-slate-200 font-bold metric-value">{encounters.length}</span>
      </div>

      <div className="w-px h-3 bg-slate-700/50" />

      <div className="flex items-center gap-1.5 text-slate-400">
        <AlertTriangle className="w-3 h-3" />
        <span className="text-slate-500">Active Clusters:</span>
        <span className="text-slate-200 font-bold">{activeClusters.length}</span>
      </div>

      <div className="w-px h-3 bg-slate-700/50" />

      <div className="flex items-center gap-1.5 text-slate-400">
        <Radio className="w-3 h-3 text-green-500" />
        <span className="text-slate-500">Agents:</span>
        <span className="text-green-400 font-bold">5/5 ONLINE</span>
      </div>

      <div className="w-px h-3 bg-slate-700/50" />

      <div className="flex items-center gap-1.5 text-slate-400">
        <Zap className="w-3 h-3" />
        <span className="text-slate-500">Threat:</span>
        <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded border ${threat.cls}`}>
          {threat.label}
        </span>
      </div>

      <div className="w-px h-3 bg-slate-700/50" />

      <div className="flex items-center gap-1.5 text-slate-400">
        <Clock className="w-3 h-3" />
        <span className="text-slate-500">Last Event:</span>
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
          {demoLoading ? 'Running...' : 'Accessibility Demo'}
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
            Autonomous Community Health Surveillance
          </p>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <button
            onClick={handleRunDemo}
            disabled={demoLoading}
            className="flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded
                       bg-red-600/20 text-red-400 border border-red-600/30
                       hover:bg-red-600/30 disabled:opacity-50 cursor-pointer transition-colors"
          >
            <Play className="w-3.5 h-3.5" />
            {demoLoading ? 'RUNNING...' : 'RUN FULL DEMO'}
          </button>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Activity className="w-3.5 h-3.5 text-green-500 animate-pulse" />
            <span>{encounters.length} encounters</span>
            <span className="text-slate-700">|</span>
            <span>{clusters.length} clusters</span>
          </div>
        </div>
      </header>

      {/* Metrics Bar */}
      <MetricsBar encounters={encounters} clusters={clusters} events={events} />

      {/* Main content */}
      <div className="flex flex-1 min-h-0">
        {/* Left: Map (60%) */}
        <div className="w-[60%] relative">
          <SurveillanceMap encounters={encounters} clusters={clusters} />
          <IntakePanel onSubmit={handleIntakeSubmit} />
        </div>

        {/* Right: Feed + Alerts (40%) */}
        <div className="w-[40%] flex flex-col border-l border-slate-700/50">
          {/* Top: Agent Feed */}
          <div className="flex-1 min-h-0 border-b border-slate-700/50">
            <AgentFeed events={events} />
          </div>
          {/* Bottom: Alerts */}
          <div className="h-[45%] min-h-0">
            <AlertPanel clusters={clusters} encounters={encounters} />
          </div>
        </div>
      </div>
    </div>
  )
}
