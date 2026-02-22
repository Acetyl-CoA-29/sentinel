# SENTINEL — 5-Minute Demo Script

> Hacking Health 2026 | Columbia BMES | Patient Safety Track

---

## Pre-Demo Checklist

- [ ] Backend running: `uvicorn main:app --reload --port 8111`
- [ ] Frontend running: `npm run dev` (http://localhost:5175)
- [ ] Database seeded (80 encounters auto-seed on startup)
- [ ] `.env` configured with `ANTHROPIC_API_KEY`
- [ ] Browser open to http://localhost:5175 (fullscreen recommended)
- [ ] Agent feed visible with startup events

---

## 0:00 – 0:45 | Opening — The Problem (45s)

**What to say:**

> "Every year, disease outbreaks in low-resource communities get caught weeks too late.
> Community health workers collect data — but nobody connects the dots.
> By the time a pattern is recognized, the outbreak window has closed.
> SENTINEL changes that."

**What to show:** Point to the dashboard — the dark map of Dhaka with encounter markers, the agent feed showing startup activity, the metrics bar showing 80 encounters and active clusters.

> "This is Dhaka, Bangladesh. 80 patient encounters have been reported by community health workers over the last 5 days. SENTINEL's AI agents have already detected something."

---

## 0:45 – 1:30 | The Dashboard (45s)

**What to show:** Walk through each panel:

1. **Map** — "Each dot is a patient encounter. Red dots are GI symptoms. Blue are respiratory. Notice the cluster of red dots in Old Dhaka."
2. **Pulsing markers** — "These pulsing circles show where SENTINEL's Analyst Agent detected anomalous disease clusters using DBSCAN spatiotemporal analysis."
3. **Alert Panel** — "The alert panel shows the primary cluster: cholera — 45 cases, anomaly score over 100x the baseline endemic rate."
4. **Epidemic Curve** — "This epidemic curve shows cases per day, colored by symptom type. You can see the spike in GI cases over the last 3 days."
5. **Agent Feed** — "This feed shows every autonomous agent action in real time. Each agent has a role — intake, analyst, research, response, accessibility."

---

## 1:30 – 3:00 | Live Demo — Full Pipeline (90s)

**What to say:**

> "Let me show you what happens when a new report comes in from the field."

**Action:** Click the **RUN FULL DEMO** button in the header.

**What happens (narrate as events appear in the feed):**

- **t+0s — Intake Agent** (blue): "A community health worker named Fatima in Mirpur-12 just reported 6 patients with severe watery diarrhea and vomiting. Three are children under 5. SENTINEL's Intake Agent uses Claude to extract structured clinical data from her natural language report — patient IDs, symptoms, severity scores, geolocation."

- **t+1.5s — Intake commits**: "The encounter is stored in the surveillance database. The Intake Agent notifies the Analyst."

- **t+3s — Analyst Agent** (orange): "The Analyst Agent re-runs DBSCAN clustering across all encounters. It detects spatial and temporal patterns humans would miss."

- **t+4.5s — Cluster update**: "The cluster has grown. The anomaly score is updating. Watch the map — the pulsing circle may expand."

- **t+6.5s — Research Agent** (purple): "Now the Research Agent kicks in. It's calling Claude to run an epidemiological investigation — differential diagnosis, environmental risk factors, confirmatory lab tests."

- **t+8s — Research findings**: "The Research Agent confirms cholera as the primary diagnosis. It identifies proximity to the Bhashantek canal, monsoon flooding, and population density as environmental factors. It recommends stool culture and rapid diagnostic tests."

- **t+9.5s — Response Agent** (green): "The Response Agent generates WHO-style situation reports and CHW alert messages."

- **t+11s — Accessibility Agent** (teal): "The Accessibility Agent adapts alerts for the local context — translating to Bangla, simplifying for low-literacy CHWs, formatting for SMS delivery to feature phones."

- **t+12.5s — Pipeline complete**: "The entire pipeline — from raw field report to multilingual public health response — completed autonomously in under 15 seconds."

---

## 3:00 – 3:45 | SitRep Generation (45s)

**What to say:**

> "Any cluster can generate a full situation report powered by Claude."

**Action:** In the Alert Panel, click **Generate SitRep** on the cholera cluster.

**What to show:** The SitRep modal appears with:
- Threat level badge (CRITICAL or HIGH)
- Disease assessment with confidence score
- Recommended interventions specific to Dhaka
- Resource needs
- CHW alert message ready for field distribution

> "This is a WHO-style situation report generated in seconds. It includes disease assessment, recommended interventions, resource needs, and a CHW alert message — all tailored to the local context."

---

## 3:45 – 4:15 | Voice Input (30s)

**What to say:**

> "CHWs in the field don't type reports. They talk."

**Action:** Click the microphone button in the bottom-left Intake Panel. Speak a brief report:

> "I have a patient with high fever, severe headache, and body aches for 3 days."

**What to show:** The speech-to-text converts to structured text, then the pipeline processes it the same way.

> "SENTINEL accepts voice, text, or SMS in any language. The Intake Agent handles the translation."

---

## 4:15 – 4:45 | Accessibility Demo (30s)

**What to say:**

> "Our fifth agent ensures no health worker is left behind."

**Action:** Click the **Accessibility Demo** button in the metrics bar.

**What to show:** Watch the agent feed as the Accessibility Agent simulates:
- Device capability detection (feature phones, smartphones, tablets)
- Language detection and multilingual alert generation
- Low-literacy adaptation with plain-language clinical terms
- SMS template in Bangla
- Voice alert for IVR systems
- Dispatch to 14 CHW devices covering 12,000 community members

---

## 4:45 – 5:00 | Closing (15s)

**What to say:**

> "SENTINEL turns any community health worker with a phone into a full epidemiological surveillance team.
> Five AI agents working autonomously — intake, analysis, research, response, and accessibility.
> From raw field report to actionable public health response in under 15 seconds.
> No training required. No infrastructure needed. Just a phone and a connection."

---

## Backup: Judge Q&A Talking Points

- **"Is this real data?"** — Synthetic but modeled on real Dhaka cholera outbreak patterns. Disease signatures from WHO reference data.
- **"How does clustering work?"** — DBSCAN with spatiotemporal distance (lat/lng + onset date). Eps=0.018 degrees (~2km), min_samples=3.
- **"What model?"** — Claude Sonnet (claude-sonnet-4-20250514) for all 5 agents. Each has a specialized system prompt.
- **"What about privacy?"** — Patient IDs are anonymized. No PII stored. Designed for aggregate surveillance, not individual tracking.
- **"Could this scale?"** — SQLite for hackathon; production would use PostgreSQL + PostGIS. WebSocket architecture supports thousands of concurrent CHW connections.
- **"What's novel?"** — Multi-agent autonomy. Most health surveillance systems are passive databases. SENTINEL actively investigates, diagnoses, and responds without human intervention.
