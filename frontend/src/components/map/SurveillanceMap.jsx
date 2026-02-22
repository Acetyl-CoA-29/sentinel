import { useEffect, useMemo } from 'react'
import { MapContainer, TileLayer, CircleMarker, Circle, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'

const DHAKA_CENTER = [23.71, 90.41]
const ZOOM = 13

const GI_KEYWORDS = ['diarrhea', 'vomiting', 'dehydration', 'nausea', 'cholera', 'watery']
const RESP_KEYWORDS = ['cough', 'respiratory', 'sore throat', 'shortness of breath', 'runny nose']

function classifySymptoms(symptomsStr) {
  if (!symptomsStr) return 'other'
  const lower = symptomsStr.toLowerCase()
  if (GI_KEYWORDS.some((k) => lower.includes(k))) return 'gi'
  if (RESP_KEYWORDS.some((k) => lower.includes(k))) return 'respiratory'
  return 'other'
}

const MARKER_COLORS = {
  gi: '#ef4444',
  respiratory: '#3b82f6',
  other: '#6b7280',
}

function createPulseIcon(isCritical) {
  const ringClass = isCritical ? '' : ' pulse-ring-orange'
  const dotClass = isCritical ? '' : ' pulse-dot-orange'
  return L.divIcon({
    className: 'cluster-pulse-marker',
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    html: `
      <div class="pulse-ring${ringClass}"></div>
      <div class="pulse-ring-2${ringClass}"></div>
      <div class="pulse-dot${dotClass}"></div>
    `,
  })
}

function MapUpdater({ encounters }) {
  const map = useMap()
  useEffect(() => {
    if (encounters.length > 0) {
      map.invalidateSize()
    }
  }, [encounters, map])
  return null
}

export default function SurveillanceMap({ encounters, clusters }) {
  const markers = useMemo(() => {
    return encounters
      .filter((e) => e.lat && e.lng)
      .map((e) => ({
        ...e,
        type: classifySymptoms(e.symptoms),
      }))
  }, [encounters])

  return (
    <div className="h-full w-full relative">
      <MapContainer
        center={DHAKA_CENTER}
        zoom={ZOOM}
        className="h-full w-full"
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        <MapUpdater encounters={encounters} />

        {/* Cluster overlay circles */}
        {clusters.map((cluster) => {
          const symptoms = Array.isArray(cluster.dominant_symptoms)
            ? cluster.dominant_symptoms
            : []
          const isCritical = cluster.anomaly_score > 100
          return (
            <Circle
              key={`cluster-${cluster.id}`}
              center={[cluster.center_lat, cluster.center_lng]}
              radius={cluster.radius_km * 1000}
              pathOptions={{
                color: isCritical ? '#ef4444' : '#f97316',
                fillColor: isCritical ? '#ef4444' : '#f97316',
                fillOpacity: 0.1,
                weight: 1.5,
                dashArray: '6 4',
              }}
            >
              <Popup>
                <div className="text-sm space-y-1">
                  <div className="font-bold text-red-400 text-base">
                    {cluster.probable_disease?.toUpperCase()}
                  </div>
                  <div><span className="text-slate-400">Cases:</span> {cluster.case_count}</div>
                  <div><span className="text-slate-400">Anomaly:</span> {cluster.anomaly_score}x baseline</div>
                  <div><span className="text-slate-400">Confidence:</span> {(cluster.confidence * 100).toFixed(0)}%</div>
                  <div><span className="text-slate-400">Radius:</span> {cluster.radius_km} km</div>
                  {symptoms.length > 0 && (
                    <div><span className="text-slate-400">Symptoms:</span> {symptoms.join(', ')}</div>
                  )}
                </div>
              </Popup>
            </Circle>
          )
        })}

        {/* Pulsing markers at cluster centers */}
        {clusters.map((cluster) => (
          <Marker
            key={`pulse-${cluster.id}`}
            position={[cluster.center_lat, cluster.center_lng]}
            icon={createPulseIcon(cluster.anomaly_score > 100)}
            interactive={false}
          />
        ))}

        {/* Encounter markers */}
        {markers.map((enc) => (
          <CircleMarker
            key={`enc-${enc.id}`}
            center={[enc.lat, enc.lng]}
            radius={enc.severity >= 4 ? 5 : 3.5}
            pathOptions={{
              color: MARKER_COLORS[enc.type],
              fillColor: MARKER_COLORS[enc.type],
              fillOpacity: 0.7,
              weight: 1,
            }}
          >
            <Popup>
              <div className="text-xs space-y-0.5">
                <div className="font-semibold">{enc.patient_id}</div>
                <div>{enc.symptoms}</div>
                <div><span className="text-slate-400">Severity:</span> {enc.severity}/5</div>
                <div><span className="text-slate-400">Location:</span> {enc.location_name || 'Unknown'}</div>
                <div className="text-slate-500">{enc.timestamp}</div>
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>

      {/* Map Legend */}
      <div className="absolute top-3 left-3 z-[1000] bg-slate-900/90 backdrop-blur border border-slate-700/50 rounded-lg px-3 py-2 space-y-1.5">
        <div className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Legend</div>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
          <span className="text-[10px] text-slate-400">GI / Cholera</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
          <span className="text-[10px] text-slate-400">Respiratory</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-gray-500" />
          <span className="text-[10px] text-slate-400">Other</span>
        </div>
        <div className="border-t border-slate-700/50 pt-1 flex items-center gap-2">
          <div className="w-4 h-3 rounded-full border border-dashed border-red-500/60" />
          <span className="text-[10px] text-slate-400">Cluster zone</span>
        </div>
      </div>
    </div>
  )
}
