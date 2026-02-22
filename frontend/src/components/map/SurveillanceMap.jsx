import { useEffect, useMemo } from 'react'
import { MapContainer, TileLayer, CircleMarker, Circle, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import { theme, alpha } from '../../design'

const DHAKA_CENTER = [23.7850, 90.3800]
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

function SmoothZoomControl() {
  const map = useMap()
  const zoomIn = () => map.setZoom(map.getZoom() + 0.5, { animate: true, duration: 0.3 })
  const zoomOut = () => map.setZoom(map.getZoom() - 0.5, { animate: true, duration: 0.3 })

  const btnStyle = {
    width: 36,
    height: 36,
    borderRadius: 10,
    background: 'rgba(28,28,30,0.85)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    border: 'none',
    color: '#F5F5F7',
    fontSize: 18,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  }

  return (
    <div style={{ position: 'absolute', top: 68, right: 12, zIndex: 1000, display: 'flex', flexDirection: 'column', gap: 4 }}>
      <button onClick={zoomIn} style={btnStyle} aria-label="Zoom in">+</button>
      <button onClick={zoomOut} style={btnStyle} aria-label="Zoom out">&minus;</button>
    </div>
  )
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
    <div className="h-full w-full relative" aria-label="Disease surveillance map of Dhaka" role="region">
      <MapContainer
        center={DHAKA_CENTER}
        zoom={ZOOM}
        className="h-full w-full"
        zoomControl={false}
        zoomSnap={0.25}
        zoomDelta={0.5}
        wheelDebounceTime={80}
        wheelPxPerZoomLevel={120}
        zoomAnimation={true}
        markerZoomAnimation={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        <MapUpdater encounters={encounters} />
        <SmoothZoomControl />

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
                color: isCritical ? theme.markers.clusterCritical : theme.markers.clusterWarning,
                fillColor: isCritical ? theme.markers.clusterCritical : theme.markers.clusterWarning,
                fillOpacity: 0.1,
                weight: 1.5,
                dashArray: '6 4',
              }}
            >
              <Popup>
                <div className="text-sm space-y-1">
                  <div className="font-bold text-base" style={{ color: theme.colors.accentRed }}>
                    {cluster.probable_disease?.toUpperCase()}
                  </div>
                  <div><span style={{ color: theme.colors.textSecondary }}>Cases:</span> {cluster.case_count}</div>
                  <div><span style={{ color: theme.colors.textSecondary }}>Anomaly:</span> {cluster.anomaly_score}x baseline</div>
                  <div><span style={{ color: theme.colors.textSecondary }}>Confidence:</span> {(cluster.confidence * 100).toFixed(0)}%</div>
                  <div><span style={{ color: theme.colors.textSecondary }}>Radius:</span> {cluster.radius_km} km</div>
                  {symptoms.length > 0 && (
                    <div><span style={{ color: theme.colors.textSecondary }}>Symptoms:</span> {symptoms.join(', ')}</div>
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
              color: theme.markers[enc.type],
              fillColor: theme.markers[enc.type],
              fillOpacity: 0.7,
              weight: 1,
            }}
          >
            <Popup>
              <div className="text-xs space-y-0.5">
                <div className="font-semibold">{enc.patient_id}</div>
                <div>{enc.symptoms}</div>
                <div><span style={{ color: theme.colors.textSecondary }}>Severity:</span> {enc.severity}/5</div>
                <div><span style={{ color: theme.colors.textSecondary }}>Location:</span> {enc.location_name || 'Unknown'}</div>
                <div style={{ color: theme.colors.textTertiary }}>{enc.timestamp}</div>
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>

      {/* Map Legend — frosted glass pill */}
      <div
        className="absolute top-16 left-4 z-[1000] frosted-glass space-y-2"
        style={{
          backgroundColor: theme.glass.background,
          borderRadius: theme.radius.lg,
          padding: '16px',
        }}
      >
        <div className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: theme.colors.textSecondary }}>Legend</div>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: theme.markers.gi }} />
          <span className="text-xs" style={{ color: theme.colors.textSecondary }}>GI / Cholera</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: theme.markers.respiratory }} />
          <span className="text-xs" style={{ color: theme.colors.textSecondary }}>Respiratory</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: theme.markers.other }} />
          <span className="text-xs" style={{ color: theme.colors.textSecondary }}>Other</span>
        </div>
        <div className="mt-2 pt-2 flex items-center gap-2">
          <div
            className="w-4 h-3 rounded-full border border-dashed"
            style={{ borderColor: alpha(theme.markers.clusterCritical, 0.6) }}
          />
          <span className="text-xs" style={{ color: theme.colors.textSecondary }}>Cluster zone</span>
        </div>
      </div>
    </div>
  )
}
