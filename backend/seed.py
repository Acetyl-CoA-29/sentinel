"""Generate 80 synthetic encounters simulating a cholera outbreak in Dhaka over 5 days."""

import json
import math
import random
from datetime import datetime, timedelta

from db import init_db, get_conn

random.seed(42)

# --- Verified on-land coordinates for Dhaka neighborhoods ---
# All confirmed residential/urban areas, NOT rivers or canals
DHAKA_LAND_POINTS = [
    # Mirpur area (main cholera cluster zone)
    {"lat": 23.8042, "lng": 90.3687, "area": "Mirpur-12"},
    {"lat": 23.8005, "lng": 90.3652, "area": "Mirpur-11"},
    {"lat": 23.7945, "lng": 90.3620, "area": "Mirpur-10"},
    {"lat": 23.7890, "lng": 90.3710, "area": "Mirpur-2"},
    {"lat": 23.7985, "lng": 90.3730, "area": "Mirpur-13"},
    {"lat": 23.8068, "lng": 90.3665, "area": "Mirpur-14"},
    {"lat": 23.7920, "lng": 90.3680, "area": "Pallabi"},
    {"lat": 23.7870, "lng": 90.3755, "area": "Kafrul"},
    # Nearby dense urban areas (noise encounters)
    {"lat": 23.7810, "lng": 90.3540, "area": "Mohammadpur"},
    {"lat": 23.7730, "lng": 90.3650, "area": "Dhanmondi"},
    {"lat": 23.7510, "lng": 90.3930, "area": "Motijheel"},
    {"lat": 23.7380, "lng": 90.3960, "area": "Old Dhaka"},
    {"lat": 23.7620, "lng": 90.3780, "area": "Shahbag"},
    {"lat": 23.7690, "lng": 90.4120, "area": "Badda"},
    {"lat": 23.7835, "lng": 90.4050, "area": "Banani"},
    {"lat": 23.7940, "lng": 90.4015, "area": "Gulshan"},
    {"lat": 23.8130, "lng": 90.4185, "area": "Uttara Sector-3"},
    {"lat": 23.8195, "lng": 90.4130, "area": "Uttara Sector-7"},
    {"lat": 23.7555, "lng": 90.3760, "area": "New Market"},
    {"lat": 23.7460, "lng": 90.3850, "area": "Wari"},
]

# First 8 points are the Mirpur cholera cluster zone
CHOLERA_POINTS = DHAKA_LAND_POINTS[:8]
NOISE_POINTS = DHAKA_LAND_POINTS[8:]

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


def _land_coord(is_cluster_case=False):
    """Generate a random coordinate guaranteed to be on land in Dhaka.

    is_cluster_case=True  → tight cluster within ~330m of Mirpur-12 center
    is_cluster_case=False → scattered background cases across other neighborhoods
    """
    if is_cluster_case:
        # TIGHT cluster: all within ±0.003° (~330m) of Mirpur-12 center
        lat = 23.8042 + random.uniform(-0.003, 0.003)
        lng = 90.3687 + random.uniform(-0.003, 0.003)
        return round(lat, 6), round(lng, 6), "Mirpur-12"
    else:
        # Background noise: spread across non-Mirpur neighborhoods
        base = random.choice(NOISE_POINTS)
        lat = base["lat"] + random.uniform(-0.001, 0.001)
        lng = base["lng"] + random.uniform(-0.001, 0.001)
        return round(lat, 6), round(lng, 6), base["area"]


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
            lat, lng, area = _land_coord(is_cluster_case=True)
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
                "location_name": area,
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
            lat, lng, area = _land_coord(is_cluster_case=False)
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
                "location_name": area,
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
    print(f"  Cholera cluster zone: Mirpur (8 anchor points, on-land)")
    print(f"  Date range: {BASE_DATE.date()} to {(BASE_DATE + timedelta(days=4)).date()}")


if __name__ == "__main__":
    seed()
