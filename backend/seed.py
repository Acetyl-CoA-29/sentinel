"""Generate 80 synthetic encounters simulating a cholera outbreak in Dhaka over 5 days."""

import json
import random
from datetime import datetime, timedelta

from db import init_db, get_conn

random.seed(42)

# --- Dhaka cholera cluster center (Old Dhaka / Sadarghat area) ---
CHOLERA_CENTER = (23.7104, 90.4074)
CHOLERA_RADIUS_DEG = 0.012  # ~1.3 km

# --- Noise locations spread across Dhaka ---
NOISE_CENTERS = [
    (23.7500, 90.3750, "Mirpur"),
    (23.7900, 90.4100, "Uttara"),
    (23.7350, 90.3930, "Dhanmondi"),
    (23.6850, 90.3560, "Keraniganj"),
    (23.7600, 90.4300, "Badda"),
]

# --- Symptom pools ---
CHOLERA_SYMPTOMS = [
    ["watery diarrhea", "vomiting", "dehydration"],
    ["watery diarrhea", "vomiting", "leg cramps"],
    ["watery diarrhea", "dehydration", "nausea"],
    ["vomiting", "watery diarrhea", "dehydration", "fever"],
    ["watery diarrhea", "vomiting"],
    ["watery diarrhea", "nausea", "dehydration", "leg cramps"],
]

MALARIA_SYMPTOMS = [
    ["cyclic fever", "chills", "sweating"],
    ["fever", "chills", "headache", "fatigue"],
    ["cyclic fever", "sweating", "nausea"],
]

RESPIRATORY_SYMPTOMS = [
    ["cough", "fever", "sore throat"],
    ["cough", "runny nose", "body aches"],
    ["fever", "shortness of breath", "cough"],
]

INJURY_SYMPTOMS = [
    ["laceration", "pain"],
    ["fracture", "swelling"],
    ["burn", "pain", "blistering"],
]

MISC_SYMPTOMS = [
    ["headache", "fatigue"],
    ["abdominal pain", "nausea"],
    ["rash", "itching"],
    ["eye pain", "blurred vision"],
]

# --- CHW IDs ---
CHW_IDS = [f"CHW-{i:03d}" for i in range(1, 16)]

# --- Time window: 5 days ending today-ish ---
BASE_DATE = datetime(2026, 2, 17, 6, 0, 0)


def _jitter(center_lat, center_lng, radius_deg):
    """Add random jitter within a circle."""
    angle = random.uniform(0, 360)
    r = radius_deg * random.uniform(0, 1) ** 0.5
    import math
    lat = center_lat + r * math.cos(math.radians(angle))
    lng = center_lng + r * math.sin(math.radians(angle))
    return round(lat, 6), round(lng, 6)


def _random_time(day_offset, hour_range=(6, 22)):
    """Random timestamp on a given day offset from BASE_DATE."""
    dt = BASE_DATE + timedelta(days=day_offset)
    dt = dt.replace(
        hour=random.randint(*hour_range),
        minute=random.randint(0, 59),
        second=random.randint(0, 59),
    )
    return dt.isoformat()


def generate_cholera_encounters():
    """Generate cholera cluster encounters — ramps up over 5 days."""
    encounters = []
    # Day 0: 3 cases, Day 1: 5, Day 2: 10, Day 3: 15, Day 4: 12
    daily_counts = [3, 5, 10, 15, 12]

    for day, count in enumerate(daily_counts):
        for _ in range(count):
            lat, lng = _jitter(CHOLERA_CENTER[0], CHOLERA_CENTER[1], CHOLERA_RADIUS_DEG)
            symptoms = random.choice(CHOLERA_SYMPTOMS)
            severity = random.choices([3, 4, 5], weights=[30, 50, 20])[0]
            onset_offset = random.randint(0, 2)
            onset = (BASE_DATE + timedelta(days=max(0, day - onset_offset))).strftime("%Y-%m-%d")

            encounters.append({
                "patient_id": f"P-{random.randint(1000, 9999)}",
                "chw_id": random.choice(CHW_IDS[:5]),  # 5 CHWs in the cholera area
                "symptoms": json.dumps(symptoms),
                "onset_date": onset,
                "severity": severity,
                "lat": lat,
                "lng": lng,
                "location_name": random.choice([
                    "Sadarghat Ward", "Lalbagh", "Chawkbazar", "Kotwali", "Bangshal"
                ]),
                "timestamp": _random_time(day),
                "language": random.choice(["bn", "bn", "bn", "en"]),  # mostly Bangla
                "raw_input": None,
            })

    return encounters


def generate_noise_encounters():
    """Generate 35 noise encounters: malaria, respiratory, injury, misc."""
    encounters = []
    noise_types = [
        (MALARIA_SYMPTOMS, 8, [2, 3, 4]),
        (RESPIRATORY_SYMPTOMS, 10, [1, 2, 3]),
        (INJURY_SYMPTOMS, 7, [1, 2, 3]),
        (MISC_SYMPTOMS, 10, [1, 2]),
    ]

    for symptom_pool, count, severities in noise_types:
        for _ in range(count):
            center = random.choice(NOISE_CENTERS)
            lat, lng = _jitter(center[0], center[1], 0.015)
            symptoms = random.choice(symptom_pool)
            day = random.randint(0, 4)

            encounters.append({
                "patient_id": f"P-{random.randint(1000, 9999)}",
                "chw_id": random.choice(CHW_IDS[5:]),  # different CHWs
                "symptoms": json.dumps(symptoms),
                "onset_date": (BASE_DATE + timedelta(days=day)).strftime("%Y-%m-%d"),
                "severity": random.choice(severities),
                "lat": lat,
                "lng": lng,
                "location_name": center[2],
                "timestamp": _random_time(day),
                "language": random.choice(["bn", "en"]),
                "raw_input": None,
            })

    return encounters


def seed():
    init_db()
    conn = get_conn()

    # Clear existing data
    conn.execute("DELETE FROM agent_events")
    conn.execute("DELETE FROM clusters")
    conn.execute("DELETE FROM encounters")

    cholera = generate_cholera_encounters()
    noise = generate_noise_encounters()
    all_encounters = cholera + noise
    random.shuffle(all_encounters)

    for e in all_encounters:
        conn.execute(
            """INSERT INTO encounters
               (patient_id, chw_id, symptoms, onset_date, severity,
                lat, lng, location_name, timestamp, language, raw_input)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (e["patient_id"], e["chw_id"], e["symptoms"], e["onset_date"],
             e["severity"], e["lat"], e["lng"], e["location_name"],
             e["timestamp"], e["language"], e["raw_input"]),
        )

    conn.commit()

    total = conn.execute("SELECT COUNT(*) FROM encounters").fetchone()[0]
    conn.close()

    print(f"Seeded {total} encounters ({len(cholera)} cholera + {len(noise)} noise)")
    print(f"  Cholera cluster center: {CHOLERA_CENTER}")
    print(f"  Date range: {BASE_DATE.date()} to {(BASE_DATE + timedelta(days=4)).date()}")


if __name__ == "__main__":
    seed()
