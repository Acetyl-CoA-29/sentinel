# SENTINEL — Autonomous Community Health Surveillance Agent

An AI multi-agent system that turns any community health worker with a phone into a full epidemiological surveillance team.

## Problem

Disease outbreaks in low-resource communities get caught weeks late because community health workers (CHWs) have no analysis layer. CHWs collect data on paper or basic apps, but nobody is connecting the dots across patients, regions, or time. By the time a pattern is recognized and escalated, the outbreak window has passed. Communities suffer preventable morbidity and mortality because surveillance infrastructure assumes resources that don't exist on the ground.

## Solution

SENTINEL deploys 5 autonomous AI agents that work together to collect, analyze, and respond to health threats in real time:

1. **Intake Agent** — Collects patient data from voice, SMS, or text input. Extracts structured clinical encounters from natural language in any format a CHW can provide.
2. **Epidemiological Analyst** — Runs spatiotemporal clustering on encounters, detects anomalous patterns, and flags potential outbreaks before they become crises.
3. **Research Agent** — Investigates flagged clusters against medical literature and known outbreak signatures to assess probability and severity.
4. **Response Agent** — Generates situation reports, CHW alerts, and recommended interventions tailored to available local resources.
5. **Accessibility Orchestrator** — Adapts all interactions for disability, literacy level, and language, ensuring no CHW is excluded from the system.

Together, these agents close the gap between data collection and actionable response — giving every CHW the analytical power of an epidemiological team.

## Tech Stack

- **Frontend**: React + Vite + Tailwind CSS — dashboard with Leaflet maps for spatial visualization
- **Backend**: Python + FastAPI — API server and agent orchestration
- **AI**: Claude API (Anthropic) — powers all 5 agents
- **Database**: SQLite — lightweight, portable, zero-config
- **Maps**: Leaflet — open-source interactive maps for cluster visualization

## Getting Started

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp ../.env.example .env   # Add your API keys
uvicorn main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev  # http://localhost:5173
```

## Team

_Team members go here._

---

Built at **Hacking Health 2026**, Columbia University BMES.
