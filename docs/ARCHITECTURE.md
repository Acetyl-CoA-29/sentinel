# SENTINEL — Architecture

## System Overview

SENTINEL is a multi-agent system where 5 specialized AI agents collaborate to provide autonomous epidemiological surveillance. Each agent has a defined role, communicates through a shared data layer, and operates independently while contributing to the overall pipeline.

## Agent Flow

```
                          +--------------------------+
                          | Accessibility Orch. (A5) |
                          |  monitors all I/O for    |
                          |  language/literacy/a11y   |
                          +-----+----------+---------+
                                |          |
  Raw Input                     v          v
  (voice/SMS/text) ──> [ Agent 1: Intake ] ──> Structured Encounter ──> [ Database ]
                                                                             |
                                                                             v
                                                                  [ Agent 2: Analyst ]
                                                                    detects clusters
                                                                             |
                                                                             v
                                                                  [ Agent 3: Research ]
                                                                  investigates flagged
                                                                       clusters
                                                                             |
                                                                             v
                                                                  [ Agent 4: Response ]
                                                                  generates alerts &
                                                                   situation reports
                                                                             |
                                                                             v
                                                                    CHW Alerts / SitReps
```

```
Input → A5 monitors → A1 processes → data stored → A2 analyzes → A3 investigates → A4 responds
```

## Agent Descriptions

### Agent 1: Intake Agent

**Role**: Collects patient data from voice, SMS, or text input and extracts structured clinical encounters.

**Input**: Raw natural language from a CHW — could be a voice transcription, an SMS message, or typed text in any supported language.

**Output**: A structured encounter record with fields: patient_id, symptoms, onset_date, severity, location (lat/lng), and metadata.

**How it works**:
- Receives raw text via the `/intake` endpoint
- Uses Claude to parse the input into structured fields
- Handles ambiguity by inferring reasonable defaults (e.g., onset_date defaults to today if not mentioned)
- Passes output through Agent 5 (Accessibility Orchestrator) for language/literacy adaptation before responding to the CHW

### Agent 2: Epidemiological Analyst

**Role**: Runs spatiotemporal clustering on stored encounters to detect anomalous patterns that may indicate an outbreak.

**Input**: The full set of recent encounters from the database.

**Output**: A list of detected clusters, each with: center coordinates, radius, anomaly score, case count, dominant symptoms, probable disease, and confidence level.

**How it works**:
- Periodically scans encounters for spatial and temporal clustering
- Uses a combination of rule-based heuristics (symptom frequency, geographic density) and LLM reasoning to assess whether a cluster is anomalous
- Flags clusters that exceed configurable thresholds for investigation by Agent 3

### Agent 3: Research Agent

**Role**: Investigates flagged clusters against medical literature and known outbreak signatures.

**Input**: A flagged cluster from Agent 2 with its symptoms, location, and case metadata.

**Output**: An enriched assessment including: probable disease identification, known outbreak patterns, severity estimate, and recommended investigation steps.

**How it works**:
- Takes the cluster profile and queries Claude with medical/epidemiological context
- Cross-references symptoms and geography against known disease signatures
- Produces a structured risk assessment that feeds into Agent 4

### Agent 4: Response Agent

**Role**: Generates situation reports (SitReps) and CHW-facing alerts based on confirmed or probable outbreaks.

**Input**: Enriched cluster assessment from Agent 3.

**Output**: A situation report for public health authorities and plain-language alerts for CHWs in the affected area.

**How it works**:
- Generates a formal SitRep with: threat level, affected area, case summary, recommended actions
- Creates CHW alerts tailored to the local context and available resources
- Passes all outbound communications through Agent 5 for accessibility adaptation

### Agent 5: Accessibility Orchestrator

**Role**: Adapts all system interactions for disability, literacy level, and language.

**Input**: Any text being sent to or received from a CHW.

**Output**: The adapted version of that text, optimized for the CHW's language, literacy level, and accessibility needs.

**How it works**:
- Intercepts all I/O between the system and CHWs
- Detects or uses configured language/literacy preferences
- Translates, simplifies, or restructures text as needed
- Ensures no CHW is excluded from using SENTINEL due to language barriers or accessibility needs

## Data Flow Summary

1. CHW sends a message (voice/SMS/text)
2. **Agent 5** adapts the input if needed (language detection, normalization)
3. **Agent 1** extracts a structured encounter and stores it in the database
4. **Agent 2** periodically analyzes all encounters for clustering anomalies
5. When a cluster is flagged, **Agent 3** investigates it against medical knowledge
6. **Agent 4** generates alerts and situation reports
7. **Agent 5** adapts all outbound communications for the target CHW
