"""Research Agent — Epidemiological investigation using Claude."""

import json
import os

from anthropic import Anthropic

client = Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

SYSTEM_PROMPT = """You are the Research Agent for SENTINEL, an autonomous epidemiological surveillance system operating in Dhaka, Bangladesh.

Your job: investigate disease clusters detected by the Analyst Agent. Given cluster data (symptoms, case count, location, temporal pattern, anomaly score), produce an epidemiological assessment.

Return valid JSON with these fields:
{
  "differential_diagnosis": [
    {"disease": "name", "probability": "percentage string", "reasoning": "brief 1-sentence explanation"}
  ],
  "primary_assessment": "1-2 sentence assessment of the most likely disease and its implications",
  "environmental_factors": ["List of 2-4 environmental factors contributing to this outbreak in this location"],
  "confirmatory_actions": ["2-3 lab tests or field actions to confirm the diagnosis"],
  "chw_followup_questions": ["2-3 targeted questions for CHWs to ask patients in the field — simple, low-literacy friendly"],
  "epidemiological_links": "1-2 sentence assessment of transmission patterns and links between cases",
  "risk_trajectory": "ESCALATING | STABLE | DECLINING — with brief justification"
}

Rules:
- Always return valid JSON, nothing else
- Differential should include 2-4 plausible diseases ranked by probability
- Be specific to the disease, location (Dhaka, Bangladesh), and local context
- Consider monsoon season, water infrastructure, population density
- Follow-up questions must be simple enough for CHWs with minimal medical training
- Environmental factors should reference specific local conditions (canals, slums, water sources)
"""


def investigate_cluster(cluster: dict, encounters: list[dict] | None = None) -> dict:
    """Use Claude to investigate a cluster and generate epidemiological assessment."""

    symptoms = cluster.get("dominant_symptoms", [])
    if isinstance(symptoms, str):
        try:
            symptoms = json.loads(symptoms)
        except Exception:
            symptoms = [symptoms]

    context = f"""Cluster under investigation:
- Probable disease (from symptom matching): {cluster.get('probable_disease', 'unknown')}
- Total cases: {cluster.get('case_count', 0)}
- Location: Dhaka, Bangladesh — center ({cluster.get('center_lat', 0):.4f}, {cluster.get('center_lng', 0):.4f})
- Cluster radius: {cluster.get('radius_km', 0)} km
- Anomaly score: {cluster.get('anomaly_score', 0)}x above baseline endemic rate
- Confidence from symptom matching: {(cluster.get('confidence', 0) * 100):.0f}%
- Dominant symptoms: {', '.join(symptoms)}
- Detection timestamp: {cluster.get('detected_at', 'unknown')}
"""

    if encounters:
        severity_counts = {}
        locations = set()
        dates = []
        for e in encounters[:20]:
            sev = e.get("severity", 3)
            severity_counts[sev] = severity_counts.get(sev, 0) + 1
            if e.get("location_name"):
                locations.add(e["location_name"])
            if e.get("onset_date"):
                dates.append(e["onset_date"])

        context += f"""
Encounter details ({len(encounters)} total cases):
- Severity distribution: {json.dumps(severity_counts)}
- Locations: {', '.join(locations) if locations else 'various neighborhoods'}
- Onset date range: {min(dates) if dates else '?'} to {max(dates) if dates else '?'}
- Temporal pattern: {'Cases increasing over time' if len(dates) > 2 else 'Concentrated burst'}
"""

    response = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=1500,
        system=SYSTEM_PROMPT,
        messages=[
            {
                "role": "user",
                "content": f"Investigate this disease cluster and provide your epidemiological assessment.\n\n{context}",
            }
        ],
    )

    text = response.content[0].text.strip()

    # Strip markdown fences
    if text.startswith("```"):
        text = text.split("\n", 1)[1] if "\n" in text else text[3:]
    if text.endswith("```"):
        text = text[:-3]
    text = text.strip()

    return json.loads(text)
