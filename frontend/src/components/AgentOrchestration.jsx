import { useState, useEffect, useRef } from 'react'
import { ArrowLeft, Play, Activity } from 'lucide-react'

// Pentagon layout coordinates (SVG viewBox 700x500)
const NODES = [
  { id: 'intake',        label: 'INTAKE',   sub: 'NLP Extraction',    color: '#60a5fa', cx: 140, cy: 160 },
  { id: 'analyst',       label: 'ANALYST',  sub: 'Pattern Detection',  color: '#fb923c', cx: 350, cy: 75  },
  { id: 'research',      label: 'RESEARCH', sub: 'Investigation',      color: '#a78bfa', cx: 560, cy: 160 },
  { id: 'response',      label: 'RESPONSE', sub: 'SitRep & Alerts',    color: '#4ade80', cx: 490, cy: 380 },
  { id: 'accessibility', label: 'ACCESS',   sub: 'Adaptive Delivery',  color: '#2dd4bf', cx: 210, cy: 380 },
]

const EDGES = [
  ['intake', 'analyst'],
  ['analyst', 'research'],
  ['research', 'response'],
  ['response', 'accessibility'],
]

const nodeMap = Object.fromEntries(NODES.map((n) => [n.id, n]))
const R = 36

function formatTime(ts) {
  if (!ts) return '--:--'
  try {
    return new Date(ts).toLocaleTimeString('en-US', { hour12: false })
  } catch {
    return '--:--'
  }
}

export default function AgentOrchestration({ events, onRunDemo, demoLoading, onBack }) {
  const [activeAgents, setActiveAgents] = useState({})
  const timersRef = useRef({})
  const feedRef = useRef(null)

  // Highlight agent nodes based on incoming events
  useEffect(() => {
    if (events.length === 0) return
    const latest = events[events.length - 1]
    const agentId = latest.agent
    if (!agentId || !nodeMap[agentId]) return

    setActiveAgents((prev) => ({ ...prev, [agentId]: true }))

    if (timersRef.current[agentId]) clearTimeout(timersRef.current[agentId])
    timersRef.current[agentId] = setTimeout(() => {
      setActiveAgents((prev) => ({ ...prev, [agentId]: false }))
    }, 4000)
  }, [events])

  // Cleanup timers on unmount
  useEffect(() => {
    const timers = timersRef.current
    return () => {
      Object.values(timers).forEach((t) => clearTimeout(t))
    }
  }, [])

  // Auto-scroll feed
  useEffect(() => {
    if (feedRef.current) feedRef.current.scrollTop = feedRef.current.scrollHeight
  }, [events])

  const recentEvents = events.slice(-40)

  return (
    <div style={{ display: 'flex', height: '100%', background: '#020617', color: '#e2e8f0' }}>
      {/* Left: SVG Pipeline Diagram */}
      <div style={{ flex: '1 1 65%', display: 'flex', flexDirection: 'column' }}>
        {/* Header bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '10px 20px',
            borderBottom: '1px solid #1e293b',
            background: '#0f172a',
          }}
        >
          <button
            onClick={onBack}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '5px 12px',
              fontSize: 12,
              fontWeight: 600,
              borderRadius: 6,
              background: '#1e293b',
              color: '#94a3b8',
              border: '1px solid #334155',
              cursor: 'pointer',
            }}
          >
            <ArrowLeft size={14} />
            Dashboard
          </button>
          <span
            style={{
              flex: 1,
              textAlign: 'center',
              fontSize: 11,
              color: '#475569',
              textTransform: 'uppercase',
              letterSpacing: 3,
              fontWeight: 700,
            }}
          >
            Agent Orchestration
          </span>
          <button
            onClick={onRunDemo}
            disabled={demoLoading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '5px 14px',
              fontSize: 12,
              fontWeight: 700,
              borderRadius: 6,
              background: '#7f1d1d30',
              color: '#f87171',
              border: '1px solid #7f1d1d50',
              cursor: demoLoading ? 'not-allowed' : 'pointer',
              opacity: demoLoading ? 0.5 : 1,
            }}
          >
            <Play size={14} />
            {demoLoading ? 'RUNNING...' : 'RUN DEMO'}
          </button>
        </div>

        {/* SVG Diagram */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
        >
          <svg
            viewBox="0 0 700 500"
            preserveAspectRatio="xMidYMid meet"
            style={{ width: '100%', maxWidth: 750, height: 'auto' }}
          >
            <defs>
              {/* Glow filter per agent */}
              {NODES.map((n) => (
                <filter
                  key={n.id}
                  id={`glow-${n.id}`}
                  x="-80%"
                  y="-80%"
                  width="260%"
                  height="260%"
                >
                  <feGaussianBlur stdDeviation="6" result="b" />
                  <feFlood floodColor={n.color} floodOpacity="0.5" />
                  <feComposite in2="b" operator="in" />
                  <feMerge>
                    <feMergeNode />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              ))}
              {/* Subtle grid pattern */}
              <pattern
                id="grid"
                width="30"
                height="30"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M 30 0 L 0 0 0 30"
                  fill="none"
                  stroke="#1e293b"
                  strokeWidth="0.3"
                />
              </pattern>
            </defs>

            {/* Grid background */}
            <rect width="700" height="500" fill="url(#grid)" opacity="0.4" />

            {/* Central watermark */}
            <text
              x="350"
              y="235"
              textAnchor="middle"
              fill="#0f172a"
              fontSize="38"
              fontWeight="900"
              letterSpacing="6"
              fontFamily="monospace"
            >
              SENTINEL
            </text>
            <text
              x="350"
              y="258"
              textAnchor="middle"
              fill="#0f172a"
              fontSize="9"
              letterSpacing="3"
            >
              AUTONOMOUS PIPELINE
            </text>

            {/* Connection edges */}
            {EDGES.map(([from, to]) => {
              const f = nodeMap[from]
              const t = nodeMap[to]
              const dx = t.cx - f.cx
              const dy = t.cy - f.cy
              const dist = Math.sqrt(dx * dx + dy * dy)
              const x1 = f.cx + (dx / dist) * (R + 6)
              const y1 = f.cy + (dy / dist) * (R + 6)
              const x2 = t.cx - (dx / dist) * (R + 6)
              const y2 = t.cy - (dy / dist) * (R + 6)
              const active = activeAgents[from] || activeAgents[to]

              return (
                <g key={`${from}-${to}`}>
                  {/* Base line */}
                  <line
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke={active ? '#334155' : '#1e293b'}
                    strokeWidth={active ? 1.5 : 0.8}
                  />
                  {/* Animated flow */}
                  {active && (
                    <line
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      stroke={f.color}
                      strokeWidth="2"
                      strokeDasharray="6 14"
                      opacity="0.8"
                    >
                      <animate
                        attributeName="stroke-dashoffset"
                        from="0"
                        to="-20"
                        dur="0.7s"
                        repeatCount="indefinite"
                      />
                    </line>
                  )}
                  {/* Flow label at midpoint */}
                  {active && (
                    <text
                      x={(x1 + x2) / 2}
                      y={(y1 + y2) / 2 - 8}
                      textAnchor="middle"
                      fill="#475569"
                      fontSize="7"
                      letterSpacing="1"
                    >
                      {from === 'intake'
                        ? 'ENCOUNTERS'
                        : from === 'analyst'
                          ? 'CLUSTERS'
                          : from === 'research'
                            ? 'ASSESSMENT'
                            : 'ALERTS'}
                    </text>
                  )}
                </g>
              )
            })}

            {/* Agent nodes */}
            {NODES.map((n) => {
              const active = activeAgents[n.id]
              return (
                <g key={n.id}>
                  {/* Pulsing outer ring when active */}
                  {active && (
                    <circle
                      cx={n.cx}
                      cy={n.cy}
                      r={R + 14}
                      fill="none"
                      stroke={n.color}
                      strokeWidth="1.5"
                    >
                      <animate
                        attributeName="r"
                        values={`${R + 8};${R + 18};${R + 8}`}
                        dur="2s"
                        repeatCount="indefinite"
                      />
                      <animate
                        attributeName="opacity"
                        values="0.35;0.08;0.35"
                        dur="2s"
                        repeatCount="indefinite"
                      />
                    </circle>
                  )}

                  {/* Node circle */}
                  <circle
                    cx={n.cx}
                    cy={n.cy}
                    r={R}
                    fill={active ? `${n.color}18` : '#0f172a'}
                    stroke={n.color}
                    strokeWidth={active ? 2.5 : 1}
                    opacity={active ? 1 : 0.4}
                    filter={active ? `url(#glow-${n.id})` : undefined}
                  />

                  {/* Letter icon */}
                  <text
                    x={n.cx}
                    y={n.cy + 1}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill={n.color}
                    fontSize="18"
                    fontWeight="bold"
                    fontFamily="monospace"
                    opacity={active ? 1 : 0.5}
                  >
                    {n.label.charAt(0)}
                  </text>

                  {/* Label */}
                  <text
                    x={n.cx}
                    y={n.cy + R + 16}
                    textAnchor="middle"
                    fill={active ? '#e2e8f0' : '#64748b'}
                    fontSize="10"
                    fontWeight="700"
                    letterSpacing="1.5"
                  >
                    {n.label}
                  </text>

                  {/* Sub-label */}
                  <text
                    x={n.cx}
                    y={n.cy + R + 28}
                    textAnchor="middle"
                    fill="#475569"
                    fontSize="8"
                  >
                    {n.sub}
                  </text>

                  {/* Active indicator dot */}
                  {active && (
                    <circle
                      cx={n.cx + R - 6}
                      cy={n.cy - R + 6}
                      r="4"
                      fill={n.color}
                    >
                      <animate
                        attributeName="opacity"
                        values="1;0.3;1"
                        dur="1s"
                        repeatCount="indefinite"
                      />
                    </circle>
                  )}
                </g>
              )
            })}
          </svg>
        </div>
      </div>

      {/* Right: Pipeline Activity Feed */}
      <div
        style={{
          width: 320,
          borderLeft: '1px solid #1e293b',
          display: 'flex',
          flexDirection: 'column',
          background: '#0f172a',
        }}
      >
        {/* Feed header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 14px',
            borderBottom: '1px solid #1e293b',
          }}
        >
          <Activity size={14} color="#22c55e" className="animate-pulse" />
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: '#64748b',
              textTransform: 'uppercase',
              letterSpacing: 1.5,
            }}
          >
            Pipeline Activity
          </span>
          <span style={{ marginLeft: 'auto', fontSize: 10, color: '#334155' }}>
            {events.length}
          </span>
        </div>

        {/* Event list */}
        <div
          ref={feedRef}
          style={{ flex: 1, overflowY: 'auto', padding: 8 }}
        >
          {recentEvents.length === 0 && (
            <div
              style={{
                textAlign: 'center',
                color: '#334155',
                fontSize: 12,
                marginTop: 48,
              }}
            >
              Waiting for agent events...
            </div>
          )}
          {recentEvents.map((ev, i) => {
            const node = nodeMap[ev.agent]
            const color = node?.color || '#64748b'
            const isHighSev =
              ev.severity === 'alert' || ev.severity === 'critical'
            return (
              <div
                key={ev.id || i}
                className="event-card"
                style={{
                  padding: '6px 10px',
                  marginBottom: 4,
                  borderRadius: 6,
                  borderLeft: `2px solid ${color}`,
                  background: isHighSev ? '#7f1d1d12' : '#1e293b30',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    marginBottom: 2,
                  }}
                >
                  <span
                    style={{
                      fontSize: 9,
                      fontWeight: 700,
                      color,
                      letterSpacing: 1,
                    }}
                  >
                    {node?.label || ev.agent?.toUpperCase() || '?'}
                  </span>
                  {ev.severity && ev.severity !== 'info' && (
                    <span
                      style={{
                        fontSize: 8,
                        fontWeight: 700,
                        padding: '1px 5px',
                        borderRadius: 3,
                        textTransform: 'uppercase',
                        background: isHighSev ? '#7f1d1d30' : '#78350f30',
                        color: isHighSev ? '#f87171' : '#fbbf24',
                      }}
                    >
                      {ev.severity}
                    </span>
                  )}
                  <span
                    style={{
                      marginLeft: 'auto',
                      fontSize: 9,
                      color: '#334155',
                      fontFamily: 'monospace',
                    }}
                  >
                    {formatTime(ev.timestamp)}
                  </span>
                </div>
                <div
                  style={{ fontSize: 11, color: '#94a3b8', lineHeight: 1.4 }}
                >
                  {ev.message}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
