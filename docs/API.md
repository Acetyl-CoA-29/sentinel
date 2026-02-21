# SENTINEL — API Reference

Base URL: `http://localhost:8000`

## Endpoints

### POST /encounters

Create a structured encounter directly.

**Request Body**:
```json
{
  "patient_id": "string",
  "chw_id": "string",
  "symptoms": ["string"],
  "onset_date": "YYYY-MM-DD",
  "severity": "mild | moderate | severe | critical",
  "lat": 0.0,
  "lng": 0.0,
  "location_name": "string",
  "language": "string"
}
```

**Response** `201 Created`:
```json
{
  "id": "string",
  "patient_id": "string",
  "chw_id": "string",
  "symptoms": ["string"],
  "onset_date": "2026-02-21",
  "severity": "moderate",
  "lat": 4.3167,
  "lng": -72.8833,
  "location_name": "Clinic B, District 4",
  "language": "es",
  "created_at": "2026-02-21T14:30:00Z"
}
```

---

### GET /encounters

Retrieve all encounters.

**Response** `200 OK`:
```json
[
  {
    "id": "string",
    "patient_id": "string",
    "chw_id": "string",
    "symptoms": ["fever", "headache"],
    "onset_date": "2026-02-19",
    "severity": "moderate",
    "lat": 4.3167,
    "lng": -72.8833,
    "location_name": "Clinic B, District 4",
    "language": "es",
    "created_at": "2026-02-21T14:30:00Z"
  }
]
```

---

### POST /intake

Accept raw natural language input and extract a structured encounter using the Intake Agent.

**Request Body**:
```json
{
  "text": "string",
  "chw_id": "string (optional)",
  "lat": 0.0,
  "lng": 0.0
}
```

**Response** `201 Created`:
```json
{
  "encounter": {
    "id": "string",
    "patient_id": "string",
    "chw_id": "string",
    "symptoms": ["fever", "rash", "joint pain"],
    "onset_date": "2026-02-18",
    "severity": "moderate",
    "lat": 4.3167,
    "lng": -72.8833,
    "location_name": "inferred from coordinates",
    "language": "en",
    "created_at": "2026-02-21T14:32:00Z"
  },
  "agent_reasoning": "Extracted 3 symptoms from free text. Onset date inferred from 'three days ago'. Severity assessed as moderate based on symptom combination."
}
```

---

### GET /clusters

Retrieve all detected clusters from the Epidemiological Analyst.

**Response** `200 OK`:
```json
[
  {
    "id": "string",
    "center_lat": 4.3200,
    "center_lng": -72.8800,
    "radius_km": 2.5,
    "anomaly_score": 0.87,
    "case_count": 14,
    "dominant_symptoms": ["fever", "rash", "joint pain"],
    "probable_disease": "dengue",
    "confidence": 0.82
  }
]
```

---

### WebSocket /ws/feed

Streams real-time agent activity events.

**Connection**: `ws://localhost:8000/ws/feed`

**Event Format** (JSON per message):
```json
{
  "timestamp": "2026-02-21T14:35:12Z",
  "agent": "intake | analyst | research | response | accessibility",
  "message": "Processed encounter from CHW-042. Extracted 3 symptoms.",
  "severity": "info | warning | alert | critical"
}
```

**Severity Levels**:
- `info` — Routine agent activity (encounter processed, cluster scan completed)
- `warning` — Anomaly detected, investigation started
- `alert` — Probable outbreak identified, SitRep generated
- `critical` — High-confidence outbreak requiring immediate action
