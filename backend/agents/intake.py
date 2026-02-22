"""Intake Agent — NL text → structured encounter extraction using Claude."""

import json
import os
from datetime import date

from anthropic import Anthropic

client = Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

SYSTEM_PROMPT = """You are the Intake Agent for SENTINEL, an epidemiological surveillance system.
Your job: extract structured medical encounter data from raw natural language input provided by community health workers (CHWs).

CHW input may be:
- Informal, misspelled, in mixed languages (Bangla/English)
- Voice transcriptions with errors
- Very brief (e.g., "3 patients vomiting near river today")

Extract the following fields as JSON:
{
  "patient_id": "generate as P-XXXX if not mentioned",
  "symptoms": ["list", "of", "symptoms"],
  "onset_date": "YYYY-MM-DD (default to today if unclear)",
  "severity": 1-5 integer (1=mild, 5=critical; infer from description),
  "location_name": "place name if mentioned, else null",
  "language": "detected language code (en, bn, etc.)",
  "notes": "any extra context from the input"
}

Rules:
- Always return valid JSON, nothing else
- Normalize symptom names to standard terms (e.g., "loose motion" → "watery diarrhea")
- If multiple patients are mentioned, create one encounter for the most detailed case
- Severity guide: mild complaints=1-2, moderate GI/fever=3, severe dehydration/high fever=4, life-threatening=5
- Default onset_date to today if not specified
"""


def extract_encounter(raw_text: str, chw_id: str | None = None, lat: float | None = None, lng: float | None = None) -> dict:
    """Use Claude to extract a structured encounter from raw text."""
    today = date.today().isoformat()

    response = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=1024,
        system=SYSTEM_PROMPT,
        messages=[
            {
                "role": "user",
                "content": f"Today's date: {today}\nCHW report:\n{raw_text}",
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

    extracted = json.loads(text)

    # Merge in caller-provided fields
    if chw_id:
        extracted["chw_id"] = chw_id
    if lat is not None:
        extracted["lat"] = lat
    if lng is not None:
        extracted["lng"] = lng

    # Ensure symptoms is a JSON string for DB storage
    if isinstance(extracted.get("symptoms"), list):
        extracted["symptoms_list"] = extracted["symptoms"]
        extracted["symptoms"] = json.dumps(extracted["symptoms"])

    # Ensure severity is int
    extracted["severity"] = int(extracted.get("severity", 3))

    return extracted
