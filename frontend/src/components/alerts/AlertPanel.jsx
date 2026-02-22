import { useState, useMemo } from 'react'
import { AlertTriangle, TrendingUp, FileText, X, Loader2 } from 'lucide-react'

const API = 'http://localhost:8111'

function SeverityBadge({ anomalyScore }) {
  if (anomalyScore > 100) {
    return (
      <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
        Critical
      </span>
    )
  }
  return (
    <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
      Warning
    </span>
  )
}

function ThreatBadge({ level }) {
  const colors = {
    CRITICAL: 'bg-red-500/20 text-red-400 border-red-500/30',
    HIGH: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    MODERATE: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    LOW: 'bg-green-500/20 text-green-400 border-green-500/30',
  }
  return (
    <span className={`px-2 py-0.5 text-xs font-bold uppercase rounded border ${colors[level] || colors.MODERATE}`}>
      {level}
    </span>
  )
}

function SitRepModal({ sitrep, onClose }) {
  if (!sitrep) return null

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700/50 rounded-xl shadow-2xl w-[600px] max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-700/50 shrink-0">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-green-400" />
            <div>
              <h2 className="text-sm font-bold text-slate-100">{sitrep.title}</h2>
              <p className="text-[10px] text-slate-500">{sitrep.generated_at}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThreatBadge level={sitrep.threat_level} />
            <button
              onClick={onClose}
              className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 text-sm">
          {/* Summary */}
          <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Summary</h3>
            <p className="text-slate-200">{sitrep.summary}</p>
          </div>

          {/* Case Summary */}
          {sitrep.case_summary && (
            <div>
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Case Summary</h3>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-slate-800/50 rounded p-2">
                  <span className="text-slate-500">Total cases:</span>{' '}
                  <span className="text-slate-200 font-bold">{sitrep.case_summary.total_cases}</span>
                </div>
                <div className="bg-slate-800/50 rounded p-2">
                  <span className="text-slate-500">Trend:</span>{' '}
                  <span className="text-slate-200 font-bold">{sitrep.case_summary.trend}</span>
                </div>
              </div>
              {sitrep.case_summary.severity_breakdown && (
                <p className="text-xs text-slate-400 mt-1">{sitrep.case_summary.severity_breakdown}</p>
              )}
              {sitrep.case_summary.date_range && (
                <p className="text-xs text-slate-500 mt-0.5">{sitrep.case_summary.date_range}</p>
              )}
            </div>
          )}

          {/* Disease Assessment */}
          {sitrep.disease_assessment && (
            <div>
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Disease Assessment</h3>
              <div className="space-y-1 text-xs">
                <p>
                  <span className="text-slate-500">Probable disease:</span>{' '}
                  <span className="text-slate-200 font-semibold uppercase">{sitrep.disease_assessment.probable_disease}</span>
                  {sitrep.disease_assessment.confidence && (
                    <span className="text-slate-400"> ({sitrep.disease_assessment.confidence})</span>
                  )}
                </p>
                {sitrep.disease_assessment.transmission_route && (
                  <p><span className="text-slate-500">Transmission:</span> <span className="text-slate-300">{sitrep.disease_assessment.transmission_route}</span></p>
                )}
                {sitrep.disease_assessment.incubation_period && (
                  <p><span className="text-slate-500">Incubation:</span> <span className="text-slate-300">{sitrep.disease_assessment.incubation_period}</span></p>
                )}
                {sitrep.disease_assessment.key_symptoms?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {sitrep.disease_assessment.key_symptoms.map((s) => (
                      <span key={s} className="px-1.5 py-0.5 text-[10px] bg-slate-800 text-slate-400 rounded border border-slate-700/50">{s}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Recommended Interventions */}
          {sitrep.recommended_interventions?.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Recommended Interventions</h3>
              <ul className="space-y-1">
                {sitrep.recommended_interventions.map((item, i) => (
                  <li key={i} className="flex gap-2 text-xs text-slate-300">
                    <span className="text-green-500 shrink-0 mt-0.5">&#x2022;</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Resource Needs */}
          {sitrep.resource_needs?.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Resource Needs</h3>
              <ul className="space-y-1">
                {sitrep.resource_needs.map((item, i) => (
                  <li key={i} className="flex gap-2 text-xs text-slate-300">
                    <span className="text-orange-500 shrink-0 mt-0.5">&#x2022;</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* CHW Alert */}
          {sitrep.chw_alert && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
              <h3 className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-1">CHW Alert Message</h3>
              <p className="text-sm text-amber-200">{sitrep.chw_alert}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const GI_KEYWORDS = ['diarrhea', 'vomiting', 'dehydration', 'nausea', 'cholera', 'watery']
const RESP_KEYWORDS = ['cough', 'respiratory', 'sore throat', 'shortness of breath', 'runny nose']

function classifyForCurve(symptomsStr) {
  if (!symptomsStr) return 'other'
  const lower = symptomsStr.toLowerCase()
  if (GI_KEYWORDS.some((k) => lower.includes(k))) return 'gi'
  if (RESP_KEYWORDS.some((k) => lower.includes(k))) return 'respiratory'
  return 'other'
}

function EpiCurve({ encounters }) {
  const data = useMemo(() => {
    const byDate = {}
    encounters.forEach((enc) => {
      const date = enc.onset_date || (enc.timestamp ? enc.timestamp.split('T')[0] : null)
      if (!date) return
      if (!byDate[date]) byDate[date] = { gi: 0, respiratory: 0, other: 0 }
      const type = classifyForCurve(enc.symptoms)
      byDate[date][type]++
    })
    return Object.entries(byDate)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, counts]) => ({
        date,
        ...counts,
        total: counts.gi + counts.respiratory + counts.other,
      }))
  }, [encounters])

  if (data.length === 0) return null

  const maxTotal = Math.max(...data.map((d) => d.total), 1)
  const chartH = 64

  return (
    <div className="px-3 py-2 border-b border-slate-700/50 shrink-0">
      <h4 className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
        Epidemic Curve — Cases by Day
      </h4>
      <div className="flex items-end gap-[2px]" style={{ height: chartH }}>
        {data.map((d) => {
          const giH = (d.gi / maxTotal) * chartH
          const respH = (d.respiratory / maxTotal) * chartH
          const otherH = (d.other / maxTotal) * chartH
          return (
            <div
              key={d.date}
              className="flex-1 flex flex-col justify-end min-w-0"
              title={`${d.date}: ${d.total} cases (GI: ${d.gi}, Resp: ${d.respiratory}, Other: ${d.other})`}
            >
              {d.other > 0 && (
                <div className="w-full bg-gray-500/70" style={{ height: otherH }} />
              )}
              {d.respiratory > 0 && (
                <div className="w-full bg-blue-500/70" style={{ height: respH }} />
              )}
              {d.gi > 0 && (
                <div className="w-full bg-red-500/70" style={{ height: giH }} />
              )}
            </div>
          )
        })}
      </div>
      <div className="flex gap-[2px] mt-0.5">
        {data.map((d) => (
          <div key={d.date} className="flex-1 min-w-0 text-center">
            <span className="text-[7px] text-slate-600 truncate block">{d.date.slice(5)}</span>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-3 mt-1 text-[9px] text-slate-500">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-red-500/70 rounded-sm" />
          <span>GI / Cholera</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-blue-500/70 rounded-sm" />
          <span>Respiratory</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-gray-500/70 rounded-sm" />
          <span>Other</span>
        </div>
      </div>
    </div>
  )
}

export default function AlertPanel({ clusters, encounters = [] }) {
  const [sitrep, setSitrep] = useState(null)
  const [loadingId, setLoadingId] = useState(null)

  const activeClusters = clusters.filter((c) => c.status === 'active')

  const handleGenerateSitrep = async (clusterId) => {
    setLoadingId(clusterId)
    try {
      const res = await fetch(`${API}/sitrep/${clusterId}`)
      if (res.ok) {
        const data = await res.json()
        if (!data.error) {
          setSitrep(data)
        }
      }
    } catch (err) {
      console.error('SitRep fetch failed:', err)
    } finally {
      setLoadingId(null)
    }
  }

  return (
    <div className="h-full flex flex-col bg-slate-950">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 bg-slate-900/80 border-b border-slate-700/50 shrink-0">
        <AlertTriangle className="w-3.5 h-3.5 text-orange-500" />
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Active Alerts
        </span>
        {activeClusters.length > 0 && (
          <span className="ml-auto px-1.5 py-0.5 text-[10px] font-bold rounded bg-red-500/20 text-red-400">
            {activeClusters.length}
          </span>
        )}
      </div>

      {/* Epidemic Curve */}
      <EpiCurve encounters={encounters} />

      {/* Alert cards */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {activeClusters.length === 0 && (
          <div className="text-slate-600 text-center text-xs mt-6">
            No active clusters detected
          </div>
        )}
        {activeClusters.map((cluster) => {
          const symptoms = Array.isArray(cluster.dominant_symptoms)
            ? cluster.dominant_symptoms
            : []
          return (
            <div
              key={cluster.id}
              className="bg-slate-900 border border-slate-700/50 rounded-lg p-3 space-y-2"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-100 uppercase">
                  {cluster.probable_disease || 'Unknown'}
                </h3>
                <SeverityBadge anomalyScore={cluster.anomaly_score} />
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <div className="text-slate-500">Cases</div>
                  <div className="text-lg font-bold text-slate-200">{cluster.case_count}</div>
                </div>
                <div>
                  <div className="text-slate-500">Anomaly</div>
                  <div className="text-lg font-bold text-orange-400 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    {cluster.anomaly_score}x
                  </div>
                </div>
                <div>
                  <div className="text-slate-500">Confidence</div>
                  <div className="text-lg font-bold text-slate-200">
                    {(cluster.confidence * 100).toFixed(0)}%
                  </div>
                </div>
              </div>

              {symptoms.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {symptoms.slice(0, 4).map((s) => (
                    <span
                      key={s}
                      className="px-1.5 py-0.5 text-[10px] bg-slate-800 text-slate-400 rounded border border-slate-700/50"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="text-[10px] text-slate-600">
                  Radius: {cluster.radius_km} km
                </div>
                <button
                  onClick={() => handleGenerateSitrep(cluster.id)}
                  disabled={loadingId === cluster.id}
                  className="flex items-center gap-1 px-2 py-1 text-[10px] font-semibold rounded bg-green-600/20 text-green-400 border border-green-600/30 hover:bg-green-600/30 disabled:opacity-50 cursor-pointer transition-colors"
                >
                  {loadingId === cluster.id ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <FileText className="w-3 h-3" />
                  )}
                  Generate SitRep
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* SitRep Modal */}
      <SitRepModal sitrep={sitrep} onClose={() => setSitrep(null)} />
    </div>
  )
}
