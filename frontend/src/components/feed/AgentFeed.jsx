import { useEffect, useRef } from 'react'
import {
  Activity,
  ClipboardList,
  BarChart3,
  Search,
  FileText,
  Globe,
} from 'lucide-react'
import { t } from '../../i18n'

const AGENT_CONFIG = {
  intake: {
    icon: ClipboardList,
    label: 'INTAKE',
    borderColor: 'border-l-blue-500',
    bgColor: 'bg-blue-500/10',
    textColor: 'text-blue-400',
    dotColor: 'bg-blue-400',
  },
  analyst: {
    icon: BarChart3,
    label: 'ANALYST',
    borderColor: 'border-l-orange-500',
    bgColor: 'bg-orange-500/10',
    textColor: 'text-orange-400',
    dotColor: 'bg-orange-400',
  },
  research: {
    icon: Search,
    label: 'RESEARCH',
    borderColor: 'border-l-purple-500',
    bgColor: 'bg-purple-500/10',
    textColor: 'text-purple-400',
    dotColor: 'bg-purple-400',
  },
  response: {
    icon: FileText,
    label: 'RESPONSE',
    borderColor: 'border-l-green-500',
    bgColor: 'bg-green-500/10',
    textColor: 'text-green-400',
    dotColor: 'bg-green-400',
  },
  accessibility: {
    icon: Globe,
    label: 'ACCESS',
    borderColor: 'border-l-teal-500',
    bgColor: 'bg-teal-500/10',
    textColor: 'text-teal-400',
    dotColor: 'bg-teal-400',
  },
}

const SEVERITY_BADGE = {
  warning: {
    label: 'WARNING',
    cls: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  },
  alert: {
    label: 'ALERT',
    cls: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  },
  critical: {
    label: 'CRITICAL',
    cls: 'bg-red-500/20 text-red-400 border-red-500/30',
  },
}

function formatTime(ts) {
  if (!ts) return '--:--:--'
  try {
    const d = new Date(ts)
    return d.toLocaleTimeString('en-US', { hour12: false })
  } catch {
    return '--:--:--'
  }
}

function EventCard({ event }) {
  const agent = AGENT_CONFIG[event.agent] || AGENT_CONFIG.intake
  const badge = SEVERITY_BADGE[event.severity]
  const Icon = agent.icon
  const isHigh = event.severity === 'alert' || event.severity === 'critical'
  const isWarn = event.severity === 'warning'

  return (
    <div
      className={`
        event-card border-l-2 ${agent.borderColor} rounded-r-lg px-3 py-2
        bg-slate-900/50 hover:bg-slate-800/60 transition-colors duration-150
        ${isHigh ? 'event-critical' : ''}
        ${isWarn ? 'event-warning' : ''}
      `}
    >
      <div className="flex items-center gap-2 mb-0.5">
        <div className={`p-1 rounded ${agent.bgColor}`}>
          <Icon className={`w-3 h-3 ${agent.textColor}`} />
        </div>
        <span className={`text-[10px] font-bold tracking-wider ${agent.textColor}`}>
          {agent.label}
        </span>
        {badge && (
          <span
            className={`px-1.5 text-[9px] font-bold uppercase rounded border ${badge.cls}`}
          >
            {badge.label}
          </span>
        )}
        <span className="ml-auto text-[10px] text-slate-600 font-mono tabular-nums">
          {formatTime(event.timestamp)}
        </span>
      </div>
      <p className="text-[12px] text-slate-300 leading-relaxed pl-7">
        {event.message}
      </p>
    </div>
  )
}

export default function AgentFeed({ events, language = 'en' }) {
  const scrollRef = useRef(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [events])

  return (
    <div className="h-full flex flex-col bg-slate-950">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 bg-slate-900/80 border-b border-slate-700/50 shrink-0">
        <Activity className="w-3.5 h-3.5 text-green-500 animate-pulse" />
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          {t(language, 'agentActivity')}
        </span>
        <div className="ml-auto flex items-center gap-1.5">
          {Object.entries(AGENT_CONFIG).map(([key, cfg]) => (
            <div
              key={key}
              className={`w-1.5 h-1.5 rounded-full ${cfg.dotColor}`}
              title={cfg.label}
            />
          ))}
          <span className="text-[10px] text-slate-600 ml-1">{events.length}</span>
        </div>
      </div>

      {/* Feed */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-2 space-y-1.5"
      >
        {events.length === 0 && (
          <div className="text-slate-600 text-center text-xs mt-8 space-y-2">
            <Activity className="w-6 h-6 mx-auto text-slate-700 animate-pulse" />
            <p>{t(language, 'waitingForActivity')}</p>
          </div>
        )}
        {events.map((event, i) => (
          <EventCard key={event.id || i} event={event} />
        ))}
      </div>
    </div>
  )
}
