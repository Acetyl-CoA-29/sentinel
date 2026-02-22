# SENTINEL — CLAUDE.md

## What is SENTINEL
Autonomous community health surveillance system that turns any health worker with a phone into a full epidemiological surveillance team. 5 AI agents autonomously collect, analyze, investigate, and respond to emerging disease outbreaks in low-resource communities. Built for the Patient Safety track at Hacking Health 2026 (Columbia BMES). Zero literacy, zero smartphone, zero cost to patient.

## Tech Stack
- **Frontend**: React 19 + Vite 7 + Tailwind CSS 4, Leaflet maps, lucide-react icons, recharts
- **Backend**: Python 3.14 + FastAPI, SQLite (WAL mode, 15s timeout)
- **LLM**: Claude API (anthropic SDK), model: claude-sonnet-4-20250514, one system prompt per agent
- **Voice**: Web Speech API (browser-native speech-to-text for demo)
- **Spatial**: scikit-learn DBSCAN clustering with spatiotemporal distance metric
- **Ports**: Backend on **8111**, Frontend on **5175** (may auto-increment if in use)

## File Structure
```
backend/
  main.py                    — FastAPI app, CORS (allow_origins=["*"]), WebSocket, agent pipeline
  db.py                      — SQLite connection (WAL mode, 15s timeout), schema creation
  seed.py                    — 80 synthetic encounters (Dhaka cholera outbreak pattern)
  clustering.py              — DBSCAN spatiotemporal clustering + anomaly scoring
  agents/
    intake.py                — NL text → structured encounter extraction (Claude)
    research.py              — Epidemiological investigation agent (Claude)
    response.py              — SitRep generation, CHW alerts
    orchestrator.py          — Event logging + WebSocket broadcasting (ws_connections list)
  data/
    disease_signatures.json  — 6 disease symptom profiles
    baseline_rates.json      — Dhaka endemic baseline rates

frontend/src/
  App.jsx                    — Main layout, WebSocket, state management, language selector
  design.js                  — Design system: theme colors, typography, spacing, shadows, glass, alpha() utility
  i18n.js                    — Translations (en, bn, hi, es) + language/speech config
  index.css                  — Global styles, animations, accessibility CSS (font scaling, high contrast, color blind, focus assist)
  components/
    map/SurveillanceMap.jsx  — Leaflet map with encounter pins + cluster overlays + frosted legend
    feed/AgentFeed.jsx       — Real-time agent activity log with color-coded event cards
    alerts/AlertPanel.jsx    — Active cluster alerts + SitRep modal (frosted glass)
    intake/IntakePanel.jsx   — Text + voice input pill (frosted glass, 17px input)
    AgentOrchestration.jsx   — Full-screen SVG pipeline visualization (pentagon layout, soft glow)
    accessibility/
      AccessibilityPanel.jsx — Settings slide-out panel (frosted glass, toggles/radio/select)
      KeyboardShortcuts.jsx  — Keyboard shortcut modal (?, R, D, H, A, Esc)
      TextToSpeech.jsx       — TTS context provider + useTTS hook
      VoiceCommands.jsx      — Voice command listener pill (report/demo/contrast/simple/stop)
      SimpleViewTransforms.js — Plain-language transforms for simple view mode
  contexts/
    AccessibilityContext.jsx — Settings state (highContrast, fontSize, colorBlind, focusAssist, tts, voiceCommands, simpleView, language)
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
- `POST /intake` — raw natural language text in, structured encounter out (Intake Agent); triggers full agent pipeline as background task
- `GET /encounters` — list all encounters
- `GET /clusters` — list detected clusters with disease probabilities
- `GET /events?limit=N` — fetch recent agent events (for backfill on page load)
- `WebSocket /ws/feed` — streams agent activity events as JSON in real-time

### Agent Triggers
- `POST /analyze` — manually trigger DBSCAN analysis
- `GET /sitrep/{cluster_id}` — generate WHO-style situation report for a cluster
- `POST /demo/accessibility` — trigger accessibility agent demo (language/modality adaptation)

## Architecture Decisions

### Multi-agent pipeline (not a chatbot)
Each agent is a separate Claude API call with its own system prompt. Agents run autonomously in a timed pipeline — new encounter → Intake extracts → Analyst clusters → Research investigates → Response generates alerts → Accessibility adapts delivery. Pipeline events broadcast via WebSocket with delays to show agent "thinking" in real-time.

### Blocking calls handled with asyncio.to_thread
Claude API calls are synchronous (anthropic SDK). All calls to `extract_encounter()` and `investigate_cluster()` are wrapped in `asyncio.to_thread()` to prevent blocking the FastAPI event loop. This was critical to fix SQLite "database is locked" errors.

### Agent activity feed
Every agent action logs to agent_events and broadcasts via WebSocket. The frontend deduplicates events using a `seenEventIds` ref set. Events auto-scroll in the feed. This is a core demo feature — judges should see the reasoning chains.

### Seed data tells a story
The 80 seeded encounters simulate a cholera outbreak in Dhaka over 5 days. Starts with scattered GI cases, builds into a clear cluster. Noise encounters (malaria, respiratory, injuries) are spread across other areas. Database seeds automatically on first startup.

### Clustering approach
DBSCAN on (lat, lng, days_since_epoch) with eps tuned for ~2km spatial and ~3 day temporal window. After clustering, check dominant symptom profile against disease_signatures.json. Anomaly score = (observed_rate - baseline_rate) / baseline_rate.

### Multi-language i18n
Language selector in header (English, Bengali, Hindi, Spanish). Translations stored in `frontend/src/i18n.js`. The `t(lang, key)` helper function provides fallback to English. Speech recognition language also switches (en-US, bn-BD, hi-IN, es-ES). Key UI labels all translated — intake placeholder, metrics bar, feed/alert headers, buttons.

### Agent Orchestration view
Full-screen SVG visualization (viewBox 700x500) showing pentagon layout of 5 agent nodes. Nodes glow/pulse when active (4-second highlight window based on incoming WebSocket events). Animated connection lines show data flow. Toggle via "Agent View" button in header.

### Resizable panels
Agent feed and alert panel in the right column are separated by a drag handle. Default 55/45 split, adjustable from 20% to 80% via mousedown/mousemove/mouseup handlers.

### Interactive epidemic curve
Recharts BarChart with stacked bars by symptom type (GI=red, Respiratory=blue, Other=gray). Tooltips on hover. Baseline reference line at 2.3 cases/day. CartesianGrid for readability.

### Voice input (demo)
Browser Web Speech API for speech-to-text. No Twilio — keep it simple. Language switches with the i18n selector. Auto-submits when speech recognition finalizes.

### WebSocket for real-time feel
Dashboard connects to /ws/feed on load with auto-reconnect (2s delay). All agent events stream live. Map auto-refreshes when analyst events arrive.

## Design System (Phases 1-4 complete)

### Architecture
- **Single source of truth**: `frontend/src/design.js` exports `theme` and `alpha(hex, opacity)` utility
- **Hybrid styling**: Tailwind for layout/spacing, inline `style` props for `theme.*` colors. CSS classes for pseudo-states (`:hover`, `:active`, `:focus`) since inline styles can't handle them
- **CSS custom properties** in `index.css :root` mirror `design.js` for animations/accessibility that need CSS-level access
- **No hardcoded colors** in any `.jsx` file — all reference `theme.*`

### Theme (Apple-inspired dark)
- **Backgrounds**: bg=#000, surface=#1C1C1E, surfaceHover=#2C2C2E, surfaceActive=#3A3A3C
- **Text**: text=#F5F5F7, secondary=#86868B, tertiary=#6E6E73
- **Accents**: accent=#0A84FF (blue), green=#30D158, red=#FF453A, orange=#FF9F0A
- **Agent colors**: Intake=#0A84FF, Analyst=#FF9F0A, Research=#BF5AF2, Response=#30D158, Accessibility=#64D2FF
- **Severity**: Pre-computed `{ bg, text, border }` triplets for critical/alert/warning/moderate/low/clear
- **Frosted glass**: `rgba(0,0,0,0.72)` + `saturate(180%) blur(20px)` via `theme.glass` + `.frosted-glass` CSS class

### Key CSS Classes (index.css)
- `.btn-pill` — Apple pill button (980px radius, scale(0.97) active, brightness(1.15) hover, 0.4 opacity disabled)
- `.btn-icon` — Close/icon button hover (transition bg+color 200ms, hover→surfaceHover)
- `.card-lift` — Hover lift effect (translateY(-1px) + cardHover shadow, 300ms)
- `.alert-card-hover` — Alert card bg shift (→surfaceHover on hover + lift)
- `.frosted-glass` — Backdrop filter blur
- `.severity-fade` — Cross-fade transition for severity changes (bg/color/border 200ms)
- `.stagger-1` to `.stagger-5` — Page load fadeUp animation with 50ms delay increments
- `.view-fade-enter` — 200ms opacity cross-fade for view transitions
- `.event-card` — 8px slide-up + fade-in (300ms)
- `.intake-input:focus` — Blue glow replacing default outline

### Layout
- Header: 48px, frosted glass, SENTINEL 21px/700, nav items 14px/400
- MetricsBar: frosted glass, 14px font, no dividers
- Map: 60% width, full bleed, floating frosted-glass legend pill (20px radius)
- Right sidebar: 40% width, resizable feed/alerts split (drag handle, 20-80%)
- Agent feed events: 14px radius, 16px padding, 3px left accent, 24x24 icon circles
- Alert cards: 14px radius, 20px padding, 3px left severity accent, hover bg shift
- Intake panel: Frosted glass pill (28px radius), 17px input, 40x40 blue submit, 36x36 mic
- Overlays (modals, panels): All use frosted glass `rgba(28,28,30,0.72)` + backdrop blur, no borders

### Animations
- Page load: stagger-fade panels from bottom (50ms delay between each, 500ms fadeUp)
- Agent events: slide-in + smooth auto-scroll (`scrollTo({ behavior: 'smooth' })`)
- Agent orchestration: Soft glow (3s cycle, stdDeviation 8, floodOpacity 0.35), 1.2s edge flow
- View transitions: 200ms cross-fade
- Critical alerts: Pulsing glow (2s criticalGlow)
- Map clusters: Pulsing ring (2.5s pulseRing)

### Accessibility (CSS)
- Font scaling: `.font-normal` (14px), `.font-large` (18px), `.font-xlarge` (22px)
- High contrast: CSS custom property overrides (all text→white, borders→white, surfaces→black)
- Color blind filters: SVG filter URLs for protanopia/deuteranopia/tritanopia
- Focus assist: Panel dimming (0.3 opacity) with hover/focus-within restore
- Focus indicators: 3px solid accent, 2px offset on `:focus-visible`
- Skip-to-content link

## Build Status
All MVP and Should-Have items completed:
1. Working Intake Agent (NL text → structured encounter) ✓
2. Working Analyst Agent (DBSCAN clustering + disease matching) ✓
3. Dashboard with map showing encounters and clusters ✓
4. Agent activity feed with real-time reasoning ✓
5. Pre-seeded demo dataset (cholera outbreak story) ✓
6. End-to-end flow (intake → cluster → research → response → accessibility) ✓
7. Research Agent (real Claude-powered investigation) ✓
8. Response Agent (SitReps + CHW alerts) ✓
9. Accessibility Orchestrator demo ✓
10. Voice input widget ✓
11. Multi-language support (en/bn/hi/es) ✓
12. Agent Orchestration visualization ✓
13. Interactive recharts epidemic curve ✓
14. Resizable panels ✓
15. Full Demo button (CHW Fatima scenario) ✓

## Demo Script
See [docs/DEMO_SCRIPT.md](docs/DEMO_SCRIPT.md).

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
python -m venv .venv
# Linux/Mac: source .venv/bin/activate
# Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp ../.env.example .env  # Add ANTHROPIC_API_KEY
uvicorn main:app --port 8111
# Database seeds automatically on first startup

# Frontend
cd frontend
npm install
npm run dev  # http://localhost:5175
```

Required env vars: `ANTHROPIC_API_KEY` (in `backend/.env`)

**Windows note**: The backend venv is at `backend/.venv`. Due to OneDrive cloud sync, launch via PowerShell using `.venv\Scripts\uvicorn.exe` or `.venv\Scripts\python.exe -m uvicorn main:app --port 8111`.

## Workflow Rules
- Plan mode for any non-trivial task (3+ steps)
- Never mark complete without verifying it works
- Commit after every major milestone
- Simplicity first — this is a 48-hour build, not production
- If something is taking too long, stub it and move on
- The demo is everything — every feature should be demo-visible
