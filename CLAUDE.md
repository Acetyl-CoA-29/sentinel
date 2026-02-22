# SENTINEL — CLAUDE.md

## What is SENTINEL
Autonomous community health surveillance system that turns any health worker with a phone into a full epidemiological surveillance team. 5 AI agents autonomously collect, analyze, investigate, and respond to emerging disease outbreaks in low-resource communities. Built for the Patient Safety track at Hacking Health 2026 (Columbia BMES). Zero literacy, zero smartphone, zero cost to patient.

## Tech Stack
- **Frontend**: React 18 + Tailwind CSS + Vite, Leaflet maps, lucide-react icons
- **Backend**: Python 3.11 + FastAPI, SQLite
- **LLM**: Claude API with tool use (function calling), one system prompt per agent
- **Voice**: Web Speech API (browser-native speech-to-text for demo)
- **Spatial**: DBSCAN clustering, GeoJSON for cluster boundaries

## File Structure
```
backend/
  main.py                    — FastAPI app, CORS, lifespan, WebSocket
  db.py                      — SQLite connection, schema creation
  seed.py                    — 80 synthetic encounters (Dhaka cholera outbreak pattern)
  clustering.py              — DBSCAN spatiotemporal clustering + anomaly scoring
  agents/
    intake.py                — NL text → structured encounter extraction (Claude)
    analyst.py               — Cluster detection + disease signature matching
    research.py              — Investigation agent (PubMed, disease DB, outbreak feeds)
    response.py              — SitRep generation, CHW alerts, community messaging
    accessibility.py         — Monitors interactions, adapts modality/pacing/language
    orchestrator.py          — Agent-to-agent handoffs, message passing, activity feed
  data/
    disease_signatures.json  — Symptom → disease probability mappings
    baseline_rates.json      — Endemic disease baseline rates by region

frontend/src/
  App.jsx                    — Main dashboard layout
  components/
    map/SurveillanceMap.jsx  — Leaflet map with encounter pins + cluster overlays
    feed/AgentFeed.jsx       — Real-time agent activity log (terminal style)
    alerts/AlertPanel.jsx    — Active cluster alert cards
    intake/IntakePanel.jsx   — Text + voice input for CHW encounter reports
    clusters/ClusterDetail.jsx — Expanded cluster view with disease probabilities
    sitrep/SitRepViewer.jsx  — Generated situation reports
```

## Data Model

### encounters table
```sql
id, patient_id, chw_id, symptoms TEXT, onset_date, severity INT(1-5),
lat REAL, lng REAL, location_name TEXT, timestamp DATETIME,
language TEXT, raw_input TEXT
```

### clusters table
```sql
id, center_lat REAL, center_lng REAL, radius_km REAL,
anomaly_score REAL, case_count INT, dominant_symptoms TEXT,
probable_disease TEXT, confidence REAL, detected_at DATETIME,
status TEXT (active/investigating/resolved)
```

### agent_events table
```sql
id, timestamp DATETIME, agent TEXT, message TEXT,
severity TEXT (info/warning/alert/critical), cluster_id INT NULL
```

## API Endpoints

### Core
- `POST /encounters` — create encounter directly (structured data)
- `GET /encounters` — list all encounters, optional `?since=` filter
- `POST /intake` — raw natural language text in, structured encounter out (Intake Agent)
- `GET /clusters` — list detected clusters with disease probabilities
- `GET /clusters/{id}` — cluster detail with linked encounters
- `WebSocket /ws/feed` — streams agent activity events as JSON

### Agent Triggers
- `POST /analyze` — manually trigger Analyst Agent (auto-runs on new encounters too)
- `GET /sitrep/{cluster_id}` — generate situation report for a cluster

## Architecture Decisions

### Multi-agent system (not a chatbot)
Each agent is a separate Claude API call with its own system prompt and toolset. The orchestrator manages handoffs. Agents run autonomously — no human clicking "analyze" buttons. New encounter → Intake extracts → Analyst clusters → Research investigates → Response generates alerts.

### Agent activity feed
Every agent action logs to agent_events and broadcasts via WebSocket. The frontend shows agent "thinking" in real-time. This is a core demo feature — judges should see the reasoning chains.

### Seed data tells a story
The 80 seeded encounters simulate a cholera outbreak in Dhaka over 5 days. Starts with scattered GI cases, builds into a clear cluster. Noise encounters (malaria, respiratory, injuries) are spread across other areas. The demo walks through this timeline.

### Clustering approach
DBSCAN on (lat, lng, days_since_epoch) with eps tuned for ~2km spatial and ~3 day temporal window. After clustering, check dominant symptom profile against disease_signatures.json. Anomaly score = (observed_rate - baseline_rate) / baseline_rate.

### Accessibility Orchestrator
Monitors interaction patterns from Intake Agent sessions. Detects confusion signals (repeated questions, long pauses, language switching). Dynamically adjusts: slower pacing, simpler questions, switch modality. This is the key patentable differentiator — feature prominently in demo.

### Voice input (demo)
Browser Web Speech API for speech-to-text. No Twilio — keep it simple for 48 hours. The text box and mic button simulate a CHW calling in or texting.

### WebSocket for real-time feel
Dashboard connects to /ws/feed on load. All agent events stream live. When new encounters come in, map updates, feed scrolls, clusters form. No manual refresh.

## Design Conventions
- Theme: dark, surveillance/medical aesthetic
- Agent colors: Intake=blue-400, Analyst=orange-400, Research=purple-400, Response=green-400, Accessibility=teal-400
- Severity colors: critical=red-500, alert=orange-500, warning=amber-500, info=slate-400
- Agent feed: monospace font, terminal-style scrolling log
- Map: dark tile layer, red markers for GI symptoms, blue for respiratory, gray for other, translucent red circles for clusters
- Cards: dark bg (slate-800/900), border-slate-700, rounded-lg

## Build Priorities (48-hour hackathon)

### Must-Have (MVP)
1. Working Intake Agent (NL text → structured encounter)
2. Working Analyst Agent (DBSCAN clustering + disease matching)
3. Dashboard with map showing encounters and clusters
4. Agent activity feed with real-time reasoning
5. Pre-seeded demo dataset (cholera outbreak story)
6. One complete end-to-end flow for demo

### Should-Have
7. Research Agent (investigation reports)
8. Response Agent (SitReps + CHW alerts)
9. Accessibility Orchestrator demo
10. Voice input widget
11. Multi-language support

### Stretch
12. Animated cluster visualization
13. Historical timeline playback
14. Multiple simultaneous outbreaks

## Demo Script
See [docs/DEMO_SCRIPT.md](docs/DEMO_SCRIPT.md). The demo should show:
1. Map with pre-seeded data, clusters already visible
2. Live intake: type/speak a new encounter, watch it appear on map
3. Agent feed shows Intake processing, Analyst detecting, reasoning visible
4. Cluster alert appears with disease probability
5. (If built) SitRep generated, CHW alert drafted

## Judging Alignment
- **Technical Design + Functionality (45%)**: Multi-agent architecture, autonomous operation, real-time dashboard
- **Pitch (45%)**: Outbreak narrative, team credibility (VA CRC + Columbia MPH), accessibility innovation
- **ClearIP Score (10%)**: Frame as "system and method for autonomous multi-agent epidemiological surveillance with adaptive accessibility orchestration"

## Patient Safety Track Constraints
- Must cost under $100: system requires only a phone call or SMS, zero hardware cost
- Must be affordable to low-income communities: no smartphone, no app, no training, no literacy required

## Environment Setup
```bash
# Backend
cd backend
python -m venv venv && source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env  # Add ANTHROPIC_API_KEY
python seed.py  # Load demo data
uvicorn main:app --reload --port 8111

# Frontend
cd frontend
npm install && npm run dev  # http://localhost:5175
```

Required env vars: `ANTHROPIC_API_KEY`

## Workflow Rules
- Plan mode for any non-trivial task (3+ steps)
- Never mark complete without verifying it works
- Commit after every major milestone
- Simplicity first — this is a 48-hour build, not production
- If something is taking too long, stub it and move on
- The demo is everything — every feature should be demo-visible
