"""Orchestrator — agent event logging and WebSocket broadcasting."""

import asyncio
import json
from datetime import datetime, timezone

from db import get_conn

# Active WebSocket connections
ws_connections: list = []


def log_event(agent: str, message: str, severity: str = "info", cluster_id: int | None = None):
    """Log an agent event to DB and broadcast to all WebSocket clients (sync-safe)."""
    conn = get_conn()
    conn.execute(
        "INSERT INTO agent_events (agent, message, severity, cluster_id) VALUES (?, ?, ?, ?)",
        (agent, message, severity, cluster_id),
    )
    conn.commit()
    conn.close()

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
    """Async version of log_event for use in async endpoints."""
    conn = get_conn()
    conn.execute(
        "INSERT INTO agent_events (agent, message, severity, cluster_id) VALUES (?, ?, ?, ?)",
        (agent, message, severity, cluster_id),
    )
    conn.commit()
    conn.close()

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
