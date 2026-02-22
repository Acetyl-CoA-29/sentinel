"""Response Agent — SitRep generation and CHW alerts using Claude."""

import json
import os
from datetime import datetime

from anthropic import Anthropic

client = Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

SYSTEM_PROMPT = """You are the Response Agent for SENTINEL, an autonomous epidemiological surveillance system.
Your job: generate formal Situation Reports (SitReps) for disease clusters detected by the Analyst Agent.

You will receive cluster data including: probable disease, case count, location, symptoms, anomaly score, and linked encounter details.

Generate a structured SitRep as JSON with these exact fields:
{
  "title": "Short title e.g. 'Cholera Outbreak — Old Dhaka'",
  "threat_level": "CRITICAL | HIGH | MODERATE | LOW",
  "summary": "2-3 sentence executive summary of the situation",
  "affected_area": {
    "description": "Geographic area description",
    "center_lat": 0.0,
    "center_lng": 0.0,
    "radius_km": 0.0
  },
  "case_summary": {
    "total_cases": 0,
    "severity_breakdown": "Description of severity distribution",
    "trend": "Increasing | Stable | Decreasing",
    "date_range": "Start — End dates"
  },
  "disease_assessment": {
    "probable_disease": "name",
    "confidence": "percentage",
    "key_symptoms": ["list"],
    "transmission_route": "How the disease spreads",
    "incubation_period": "Typical range"
  },
  "recommended_interventions": [
    "Specific, actionable intervention steps"
  ],
  "resource_needs": [
    "Specific resources needed on the ground"
  ],
  "chw_alert": "Plain-language alert message for community health workers (simple, actionable, low-literacy friendly)",
  "generated_at": "ISO timestamp"
}

Rules:
- Always return valid JSON, nothing else
- Be specific to the disease and local context
- Interventions should be practical for low-resource settings
- CHW alert should be very simple — assume the CHW may have limited medical training
- Threat level: CRITICAL if anomaly > 100 and high case count, HIGH if anomaly > 50, MODERATE if anomaly > 10, LOW otherwise
"""


def generate_sitrep(cluster: dict, encounters: list[dict] | None = None) -> dict:
    """Use Claude to generate a situation report for a cluster."""

    # Build context for Claude
    symptoms = cluster.get("dominant_symptoms", [])
    if isinstance(symptoms, str):
        try:
            symptoms = json.loads(symptoms)
        except Exception:
            symptoms = [symptoms]

    context = f"""Cluster data:
- Probable disease: {cluster.get('probable_disease', 'unknown')}
- Case count: {cluster.get('case_count', 0)}
- Center: ({cluster.get('center_lat', 0)}, {cluster.get('center_lng', 0)})
- Radius: {cluster.get('radius_km', 0)} km
- Anomaly score: {cluster.get('anomaly_score', 0)}x baseline
- Confidence: {cluster.get('confidence', 0)}
- Dominant symptoms: {', '.join(symptoms)}
- Status: {cluster.get('status', 'active')}
- Detected at: {cluster.get('detected_at', 'unknown')}
"""

    if encounters:
        severity_counts = {}
        locations = set()
        dates = []
        for e in encounters[:20]:  # cap at 20 for context size
            sev = e.get("severity", 3)
            severity_counts[sev] = severity_counts.get(sev, 0) + 1
            if e.get("location_name"):
                locations.add(e["location_name"])
            if e.get("onset_date"):
                dates.append(e["onset_date"])

        context += f"""
Encounter details (sample of {len(encounters)} cases):
- Severity distribution: {json.dumps(severity_counts)}
- Locations: {', '.join(locations) if locations else 'various'}
- Date range: {min(dates) if dates else '?'} to {max(dates) if dates else '?'}
"""

    response = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=2048,
        system=SYSTEM_PROMPT,
        messages=[
            {
                "role": "user",
                "content": f"Generate a situation report for this cluster.\n\n{context}",
            }
        ],
    )

    text = response.content[0].text.strip()

    # Strip markdown fences if present
    if text.startswith("```"):
        text = text.split("\n", 1)[1] if "\n" in text else text[3:]
    if text.endswith("```"):
        text = text[:-3]
    text = text.strip()

    sitrep = json.loads(text)
    sitrep["generated_at"] = datetime.utcnow().isoformat() + "Z"
    sitrep["cluster_id"] = cluster.get("id")

    return sitrep
