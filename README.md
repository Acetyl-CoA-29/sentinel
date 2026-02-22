# SENTINEL

**Autonomous Community Health Surveillance System**

An AI multi-agent system that turns any community health worker with a phone into a full epidemiological surveillance team. Built for the Hacking Health 2026 hackathon at Columbia University BMES (Patient Safety track).

## The Problem

Disease outbreaks in low-resource communities get caught weeks late. Community health workers (CHWs) collect data on paper or basic apps, but nobody connects the dots across patients, locations, or time. By the time a pattern is recognized and escalated, the outbreak window has closed. Communities suffer preventable morbidity and mortality because surveillance infrastructure assumes resources that don't exist on the ground.

## How SENTINEL Works

SENTINEL deploys 5 autonomous AI agents that work together in a closed-loop pipeline:

| Agent | Role | How it works |
|-------|------|-------------|
| **Intake** | Data collection | Extracts structured clinical encounters from natural language voice, text, or SMS input using Claude NLP |
| **Analyst** | Pattern detection | Runs DBSCAN spatiotemporal clustering on encounters, calculates anomaly scores against baseline endemic rates |
| **Research** | Investigation | Calls Claude to generate differential diagnoses, environmental risk analysis, and confirmatory action plans |
| **Response** | Action generation | Produces WHO-style situation reports, CHW alerts, and resource recommendations |
| **Accessibility** | Inclusive delivery | Adapts all outputs for language (Bangla, English), literacy level, device type (SMS, app, IVR), and disability |

From raw field report to actionable public health response in **under 15 seconds** — fully autonomous.

## Demo Scenario

The dashboard shows Dhaka, Bangladesh with 80 patient encounters reported over 5 days. SENTINEL has detected a cholera outbreak cluster in Old Dhaka (45 cases, anomaly score >100x baseline). A live demo button triggers a new CHW field report that activates the full agent pipeline in real time.

## Tech Stack

- **Frontend**: React 19 + Vite 7 + Tailwind CSS 4 — real-time dashboard with Leaflet maps
- **Backend**: Python + FastAPI — API server, agent orchestration, WebSocket streaming
- **AI**: Claude API (Anthropic) — claude-sonnet-4-20250514 powers all 5 agents
- **Database**: SQLite — lightweight, portable, zero-config
- **Clustering**: scikit-learn DBSCAN with spatiotemporal distance metric
- **Maps**: Leaflet + CARTO dark tiles — interactive cluster visualization with pulsing markers

## Getting Started

### Prerequisites

- Python 3.11+
- Node.js 18+
- Anthropic API key

### Backend

```bash
cd backend
python -m venv .venv
# Linux/Mac: source .venv/bin/activate
# Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp ../.env.example .env  # Add your ANTHROPIC_API_KEY
uvicorn main:app --reload --port 8111
```

The database seeds automatically on first startup with 80 encounters and runs DBSCAN clustering.

### Frontend

```bash
cd frontend
npm install
npm run dev  # http://localhost:5175
```

### Environment Variables

Create `backend/.env`:

```
ANTHROPIC_API_KEY=your-key-here
```

## Architecture

```
sentinel/
  backend/
    main.py              # FastAPI app, REST + WebSocket endpoints
    db.py                # SQLite schema and connection
    seed.py              # 80 synthetic encounters (cholera outbreak)
    clustering.py        # DBSCAN + disease signature matching
    agents/
      intake.py          # Claude NLP extraction
      orchestrator.py    # Event logging + WebSocket broadcasting
      research.py        # Epidemiological investigation
      response.py        # SitRep generation
    data/
      disease_signatures.json   # 6 disease symptom profiles
      baseline_rates.json       # Dhaka endemic baseline rates
  frontend/
    src/
      App.jsx                          # Main layout + WebSocket + state
      components/
        map/SurveillanceMap.jsx        # Leaflet map with clusters
        feed/AgentFeed.jsx             # Real-time agent activity feed
        alerts/AlertPanel.jsx          # Cluster alerts + epidemic curve
        intake/IntakePanel.jsx         # Text + voice intake form
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/intake` | Submit natural language field report |
| GET | `/encounters` | List all encounters |
| GET | `/clusters` | List detected clusters |
| GET | `/sitrep/{id}` | Generate situation report for cluster |
| POST | `/analyze` | Trigger manual DBSCAN analysis |
| WS | `/ws/feed` | Real-time agent event stream |

## Team

Built by the SENTINEL team at Hacking Health 2026, Columbia University.

---

Built with Claude (Anthropic) at **Hacking Health 2026**, Columbia University BMES.
