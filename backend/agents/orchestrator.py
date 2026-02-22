"""Orchestrator — agent event logging and WebSocket broadcasting."""

import asyncio
import json
import time
from datetime import datetime, timezone

from db import get_conn

# Active WebSocket connections
ws_connections: list = []


def _db_insert_event(agent: str, message: str, severity: str, cluster_id: int | None):
    """Insert event into DB with retry for SQLite lock contention."""
    for attempt in range(5):
        try:
            conn = get_conn()
            conn.execute(
                "INSERT INTO agent_events (agent, message, severity, cluster_id) VALUES (?, ?, ?, ?)",
                (agent, message, severity, cluster_id),
            )
            conn.commit()
            conn.close()
            return
        except Exception:
            if attempt < 4:
                time.sleep(0.3 * (attempt + 1))
            # Last attempt failed — skip DB insert, event still broadcasts


def log_event(agent: str, message: str, severity: str = "info", cluster_id: int | None = None):
    """Log an agent event to DB and broadcast to all WebSocket clients (sync-safe)."""
    _db_insert_event(agent, message, severity, cluster_id)

    event = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "agent": agent,
        "message": message,
        "severity": severity,
        "cluster_id": cluster_id,
    }

    # Schedule async broadcast from sync context
    try:
        loop = asyncio.get_running_loop()
        loop.create_task(_broadcast_async(event))
    except RuntimeError:
        pass  # No event loop running (e.g., during seed.py)


async def log_event_async(agent: str, message: str, severity: str = "info", cluster_id: int | None = None):
    """Async version — runs DB insert in thread pool to avoid blocking event loop."""
    try:
        await asyncio.to_thread(_db_insert_event, agent, message, severity, cluster_id)
    except Exception:
        pass  # Don't crash pipeline if logging fails

    event = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "agent": agent,
        "message": message,
        "severity": severity,
        "cluster_id": cluster_id,
    }

    await _broadcast_async(event)


async def _broadcast_async(event: dict):
    """Send event to all connected WebSocket clients."""
    if not ws_connections:
        return
    msg = json.dumps(event)
    dead = []
    for ws in ws_connections:
        try:
            await ws.send_text(msg)
        except Exception:
            dead.append(ws)
    for ws in dead:
        if ws in ws_connections:
            ws_connections.remove(ws)
