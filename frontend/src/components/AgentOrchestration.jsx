import { useState, useEffect, useRef } from 'react'
import { ArrowLeft, Play, Activity } from 'lucide-react'
import { theme, alpha } from '../design'

// Pentagon layout coordinates (SVG viewBox 700x500)
const NODES = [
  { id: 'intake',        sub: 'NLP Extraction',    cx: 140, cy: 160 },
  { id: 'analyst',       sub: 'Pattern Detection',  cx: 350, cy: 75  },
  { id: 'research',      sub: 'Investigation',      cx: 560, cy: 160 },
  { id: 'response',      sub: 'SitRep & Alerts',    cx: 490, cy: 380 },
  { id: 'accessibility', sub: 'Adaptive Delivery',  cx: 210, cy: 380 },
]

const EDGES = [
  ['intake', 'analyst'],
  ['analyst', 'research'],
  ['research', 'response'],
  ['response', 'accessibility'],
]

const nodeMap = Object.fromEntries(NODES.map((n) => [n.id, n]))
const R = 36

function getNodeColor(id) {
  return theme.agents[id]?.color || theme.colors.textTertiary
}

function getNodeLabel(id) {
  return theme.agents[id]?.label || id.toUpperCase()
}

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
    if (feedRef.current) {
      feedRef.current.scrollTo({
        top: feedRef.current.scrollHeight,
        behavior: 'smooth',
      })
    }
  }, [events])

  const recentEvents = events.slice(-40)

  return (
    <div style={{ display: 'flex', height: '100%', background: theme.colors.bg, color: theme.colors.text }} role="region" aria-label="Agent orchestration pipeline">
      {/* Left: SVG Pipeline Diagram */}
      <div style={{ flex: '1 1 65%', display: 'flex', flexDirection: 'column' }}>
        {/* Header bar */}
        <div
          className="frosted-glass"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '10px 20px',
            background: theme.glass.background,
          }}
        >
          <button
            onClick={onBack}
            aria-label="Back to dashboard"
            className="btn-pill"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 14px',
              fontSize: 12,
              fontWeight: 600,
              background: theme.colors.surfaceHover,
              color: theme.colors.textSecondary,
            }}
          >
            <ArrowLeft size={14} aria-hidden="true" />
            Dashboard
          </button>
          <span
            style={{
              flex: 1,
              textAlign: 'center',
              fontSize: 11,
              color: theme.colors.textTertiary,
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
            aria-label={demoLoading ? 'Demo running' : 'Run demo simulation'}
            className="btn-pill"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 14px',
              fontSize: 12,
              fontWeight: 700,
              background: alpha(theme.colors.accentRed, 0.12),
              color: theme.colors.accentRed,
            }}
          >
            <Play size={14} aria-hidden="true" />
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
              {NODES.map((n) => {
                const color = getNodeColor(n.id)
                return (
                  <filter
                    key={n.id}
                    id={`glow-${n.id}`}
                    x="-80%"
                    y="-80%"
                    width="260%"
                    height="260%"
                  >
                    <feGaussianBlur stdDeviation="8" result="b" />
                    <feFlood floodColor={color} floodOpacity="0.35" />
                    <feComposite in2="b" operator="in" />
                    <feMerge>
                      <feMergeNode />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                )
              })}
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
                  stroke={theme.colors.border}
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
              fill={theme.colors.surface}
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
              fill={theme.colors.surface}
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
              const fromColor = getNodeColor(from)

              return (
                <g key={`${from}-${to}`}>
                  {/* Base line */}
                  <line
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke={active ? theme.colors.surfaceActive : theme.colors.border}
                    strokeWidth={active ? 1.5 : 0.8}
                  />
                  {/* Animated flow */}
                  {active && (
                    <line
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      stroke={fromColor}
                      strokeWidth="2"
                      strokeDasharray="6 14"
                      opacity="0.8"
                    >
                      <animate
                        attributeName="stroke-dashoffset"
                        from="0"
                        to="-20"
                        dur="1.2s"
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
                      fill={theme.colors.textTertiary}
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
              const color = getNodeColor(n.id)
              const label = getNodeLabel(n.id)
              return (
                <g key={n.id}>
                  {/* Pulsing outer ring when active */}
                  {active && (
                    <circle
                      cx={n.cx}
                      cy={n.cy}
                      r={R + 14}
                      fill="none"
                      stroke={color}
                      strokeWidth="1"
                    >
                      <animate
                        attributeName="r"
                        values={`${R + 10};${R + 16};${R + 10}`}
                        dur="3s"
                        repeatCount="indefinite"
                      />
                      <animate
                        attributeName="opacity"
                        values="0.25;0.06;0.25"
                        dur="3s"
                        repeatCount="indefinite"
                      />
                    </circle>
                  )}

                  {/* Node circle */}
                  <circle
                    cx={n.cx}
                    cy={n.cy}
                    r={R}
                    fill={active ? alpha(color, 0.09) : theme.colors.surface}
                    stroke={color}
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
                    fill={color}
                    fontSize="18"
                    fontWeight="bold"
                    fontFamily="monospace"
                    opacity={active ? 1 : 0.5}
                  >
                    {label.charAt(0)}
                  </text>

                  {/* Label */}
                  <text
                    x={n.cx}
                    y={n.cy + R + 16}
                    textAnchor="middle"
                    fill={active ? theme.colors.text : theme.colors.textTertiary}
                    fontSize="10"
                    fontWeight="700"
                    letterSpacing="1.5"
                  >
                    {label}
                  </text>

                  {/* Sub-label */}
                  <text
                    x={n.cx}
                    y={n.cy + R + 28}
                    textAnchor="middle"
                    fill={theme.colors.textTertiary}
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
                      fill={color}
                    >
                      <animate
                        attributeName="opacity"
                        values="1;0.5;1"
                        dur="2s"
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
          display: 'flex',
          flexDirection: 'column',
          background: theme.colors.surface,
        }}
      >
        {/* Feed header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '12px 16px',
            backgroundColor: alpha(theme.colors.surface, 0.8),
          }}
        >
          <Activity size={14} color={theme.colors.accentGreen} className="animate-pulse" aria-hidden="true" />
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: theme.colors.textTertiary,
              textTransform: 'uppercase',
              letterSpacing: 1.5,
            }}
          >
            Pipeline Activity
          </span>
          <span style={{ marginLeft: 'auto', fontSize: 10, color: theme.colors.surfaceActive }}>
            {events.length}
          </span>
        </div>

        {/* Event list */}
        <div
          ref={feedRef}
          role="log"
          aria-live="polite"
          aria-label="Pipeline activity feed"
          style={{ flex: 1, overflowY: 'auto', padding: 8 }}
        >
          {recentEvents.length === 0 && (
            <div
              style={{
                textAlign: 'center',
                color: theme.colors.surfaceActive,
                fontSize: 12,
                marginTop: 48,
              }}
            >
              Waiting for agent events...
            </div>
          )}
          {recentEvents.map((ev, i) => {
            const node = nodeMap[ev.agent]
            const color = node ? getNodeColor(node.id) : theme.colors.textTertiary
            const label = node ? getNodeLabel(node.id) : (ev.agent?.toUpperCase() || '?')
            const isHighSev =
              ev.severity === 'alert' || ev.severity === 'critical'
            const sevStyle = theme.severity[ev.severity]
            return (
              <div
                key={ev._uid || `${ev.id}-${i}`}
                className="event-card"
                style={{
                  padding: '6px 10px',
                  marginBottom: 4,
                  borderRadius: 6,
                  borderLeft: `2px solid ${color}`,
                  background: isHighSev ? alpha(theme.colors.accentRed, 0.07) : alpha(theme.colors.surface, 0.19),
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
                    {label}
                  </span>
                  {ev.severity && ev.severity !== 'info' && sevStyle && (
                    <span
                      style={{
                        fontSize: 8,
                        fontWeight: 700,
                        padding: '1px 5px',
                        borderRadius: 3,
                        textTransform: 'uppercase',
                        background: sevStyle.bg,
                        color: sevStyle.text,
                      }}
                    >
                      {ev.severity}
                    </span>
                  )}
                  <span
                    style={{
                      marginLeft: 'auto',
                      fontSize: 9,
                      color: theme.colors.surfaceActive,
                      fontFamily: 'monospace',
                    }}
                  >
                    {formatTime(ev.timestamp)}
                  </span>
                </div>
                <div
                  style={{ fontSize: 11, color: theme.colors.textSecondary, lineHeight: 1.4 }}
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
