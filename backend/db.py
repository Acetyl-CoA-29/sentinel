"""SQLite database connection and schema creation."""

import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "sentinel.db")


def get_conn() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    return conn


def init_db():
    conn = get_conn()
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS encounters (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            patient_id TEXT,
            chw_id TEXT,
            symptoms TEXT,
            onset_date TEXT,
            severity INTEGER CHECK(severity BETWEEN 1 AND 5),
            lat REAL,
            lng REAL,
            location_name TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            language TEXT DEFAULT 'en',
            raw_input TEXT
        );

        CREATE TABLE IF NOT EXISTS clusters (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            center_lat REAL,
            center_lng REAL,
            radius_km REAL,
            anomaly_score REAL,
            case_count INTEGER,
            dominant_symptoms TEXT,
            probable_disease TEXT,
            confidence REAL,
            detected_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            status TEXT DEFAULT 'active' CHECK(status IN ('active','investigating','resolved'))
        );

        CREATE TABLE IF NOT EXISTS agent_events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            agent TEXT,
            message TEXT,
            severity TEXT DEFAULT 'info' CHECK(severity IN ('info','warning','alert','critical')),
            cluster_id INTEGER,
            FOREIGN KEY (cluster_id) REFERENCES clusters(id)
        );
    """)
    conn.commit()
    conn.close()


if __name__ == "__main__":
    init_db()
    print("Database initialized at", DB_PATH)
