"""DBSCAN spatiotemporal clustering + anomaly scoring."""

import json
import math
import os
from datetime import datetime

import numpy as np
from sklearn.cluster import DBSCAN

from db import get_conn

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")

with open(os.path.join(DATA_DIR, "disease_signatures.json")) as f:
    DISEASE_SIGNATURES = json.load(f)

with open(os.path.join(DATA_DIR, "baseline_rates.json")) as f:
    BASELINE_RATES = json.load(f)

# --- Constants ---
KM_PER_DEG_LAT = 111.0  # approximate
SPATIAL_EPS_KM = 2.0
TEMPORAL_EPS_DAYS = 3.0
MIN_SAMPLES = 3

# Convert to feature-space units
SPATIAL_EPS_DEG = SPATIAL_EPS_KM / KM_PER_DEG_LAT
# We scale time so 1 day ≈ SPATIAL_EPS_DEG (making eps uniform)
TIME_SCALE = SPATIAL_EPS_DEG / TEMPORAL_EPS_DAYS


def _parse_symptoms(symptoms_str: str) -> list[str]:
    """Parse comma-separated or JSON symptom string."""
    if not symptoms_str:
        return []
    try:
        parsed = json.loads(symptoms_str)
        if isinstance(parsed, list):
            return [s.strip().lower() for s in parsed]
    except (json.JSONDecodeError, TypeError):
        pass
    return [s.strip().lower() for s in symptoms_str.split(",")]


def _match_disease(symptom_counts: dict[str, int], total_cases: int) -> tuple[str, float]:
    """Match symptom profile against disease signatures. Returns (disease, confidence)."""
    best_disease = "unknown"
    best_score = 0.0

    for disease, sig in DISEASE_SIGNATURES.items():
        score = 0.0
        weights = sig["probability_weights"]
        for symptom, weight in weights.items():
            # fuzzy match: check if any reported symptom contains the signature keyword
            for reported in symptom_counts:
                if symptom in reported or reported in symptom:
                    freq = symptom_counts[reported] / total_cases
                    score += weight * min(freq, 1.0)
                    break

        if total_cases >= sig.get("min_cluster_size", 3):
            score *= 1.2  # boost if cluster is large enough

        if score > best_score:
            best_score = score
            best_disease = disease

    confidence = min(best_score, 1.0)
    return best_disease, round(confidence, 3)


def _anomaly_score(disease: str, case_count: int, days_span: float, region: str = "dhaka") -> float:
    """Calculate anomaly score = (observed - baseline) / baseline."""
    rates = BASELINE_RATES.get(region, BASELINE_RATES["default"])
    baseline = rates.get(disease, 0.01)
    days = max(days_span, 1)
    observed_rate = case_count / days
    score = (observed_rate - baseline) / baseline if baseline > 0 else observed_rate
    return round(max(score, 0.0), 2)


def _haversine_km(lat1, lng1, lat2, lng2):
    """Great-circle distance between two points."""
    r = 6371
    dlat = math.radians(lat2 - lat1)
    dlng = math.radians(lng2 - lng1)
    a = math.sin(dlat / 2) ** 2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlng / 2) ** 2
    return r * 2 * math.asin(math.sqrt(a))


def run_clustering() -> list[dict]:
    """Run DBSCAN on encounters and return detected clusters."""
    conn = get_conn()
    rows = conn.execute(
        "SELECT id, symptoms, lat, lng, timestamp, severity FROM encounters ORDER BY timestamp"
    ).fetchall()
    conn.close()

    if len(rows) < MIN_SAMPLES:
        return []

    # Build feature matrix: [lat_scaled, lng_scaled, time_scaled]
    ref_time = datetime.fromisoformat(rows[0]["timestamp"])
    features = []
    encounter_data = []

    for row in rows:
        t = datetime.fromisoformat(row["timestamp"])
        days_since = (t - ref_time).total_seconds() / 86400.0
        features.append([
            row["lat"],
            row["lng"],
            days_since * TIME_SCALE,
        ])
        encounter_data.append(dict(row))

    X = np.array(features)

    db = DBSCAN(eps=SPATIAL_EPS_DEG, min_samples=MIN_SAMPLES, metric="euclidean")
    labels = db.fit_predict(X)

    clusters = []
    unique_labels = set(labels)
    unique_labels.discard(-1)  # noise

    for label in unique_labels:
        indices = [i for i, l in enumerate(labels) if l == label]
        cluster_encounters = [encounter_data[i] for i in indices]

        # Compute center
        lats = [e["lat"] for e in cluster_encounters]
        lngs = [e["lng"] for e in cluster_encounters]
        center_lat = sum(lats) / len(lats)
        center_lng = sum(lngs) / len(lngs)

        # Compute radius
        radius_km = max(
            _haversine_km(center_lat, center_lng, lat, lng)
            for lat, lng in zip(lats, lngs)
        )
        radius_km = max(radius_km, 0.1)  # minimum 100m

        # Symptom analysis
        symptom_counts: dict[str, int] = {}
        for e in cluster_encounters:
            for s in _parse_symptoms(e["symptoms"]):
                symptom_counts[s] = symptom_counts.get(s, 0) + 1

        # Sort by frequency
        dominant = sorted(symptom_counts.keys(), key=lambda s: symptom_counts[s], reverse=True)[:5]

        # Disease matching
        disease, confidence = _match_disease(symptom_counts, len(cluster_encounters))

        # Time span for anomaly score
        times = [datetime.fromisoformat(e["timestamp"]) for e in cluster_encounters]
        days_span = (max(times) - min(times)).total_seconds() / 86400.0

        anomaly = _anomaly_score(disease, len(cluster_encounters), days_span)

        clusters.append({
            "center_lat": round(center_lat, 6),
            "center_lng": round(center_lng, 6),
            "radius_km": round(radius_km, 2),
            "anomaly_score": anomaly,
            "case_count": len(cluster_encounters),
            "dominant_symptoms": json.dumps(dominant),
            "probable_disease": disease,
            "confidence": confidence,
            "encounter_ids": [e["id"] for e in cluster_encounters],
        })

    return clusters


def detect_and_store() -> list[dict]:
    """Run clustering, store results in DB, return clusters."""
    clusters = run_clustering()
    if not clusters:
        return []

    conn = get_conn()

    # Clear old active clusters — nullify FK references first to avoid constraint violation
    conn.execute("UPDATE agent_events SET cluster_id = NULL WHERE cluster_id IN (SELECT id FROM clusters WHERE status = 'active')")
    conn.execute("DELETE FROM clusters WHERE status = 'active'")

    stored = []
    for c in clusters:
        cur = conn.execute(
            """INSERT INTO clusters
               (center_lat, center_lng, radius_km, anomaly_score, case_count,
                dominant_symptoms, probable_disease, confidence, status)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active')""",
            (c["center_lat"], c["center_lng"], c["radius_km"], c["anomaly_score"],
             c["case_count"], c["dominant_symptoms"], c["probable_disease"], c["confidence"]),
        )
        c["id"] = cur.lastrowid
        stored.append(c)

    conn.commit()
    conn.close()
    return stored
