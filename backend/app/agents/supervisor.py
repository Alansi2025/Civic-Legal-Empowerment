import time
import uuid
import logging
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
from datetime import datetime, timezone

logger = logging.getLogger("SupervisorEngine")


class AgentEventLog(BaseModel):
    event_id: str = Field(default_factory=lambda: f"EVT-{uuid.uuid4().hex[:8].upper()}")
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

    agent_name: str
    action: str
    status: str  # "STARTED", "COMPLETED", "SELF_REFINED", "FAILED"
    details: Dict[str, Any] = Field(default_factory=dict)
    execution_time_ms: float = 0.0


class SupervisorEngine:
    """
    Autonomous Re-ACT Supervisor:
    Monitors all 5 agents, tracks their event logs, work telemetry,
    and maintains audit record in memory & SQLite database.
    """
    def __init__(self):
        self.event_logs: List[AgentEventLog] = []

    def log_event(self, agent_name: str, action: str, status: str, details: Dict[str, Any], execution_time_ms: float = 0.0) -> AgentEventLog:
        event = AgentEventLog(
            agent_name=agent_name,
            action=action,
            status=status,
            details=details,
            execution_time_ms=execution_time_ms
        )
        self.event_logs.append(event)
        logger.info(f"SUPERVISOR [{agent_name}] -> {action} | Status: {status} ({execution_time_ms:.1f}ms)")
        return event

    def get_work_summary(self) -> Dict[str, Any]:
        total_events = len(self.event_logs)
        agent_counts: Dict[str, int] = {}
        for ev in self.event_logs:
            agent_counts[ev.agent_name] = agent_counts.get(ev.agent_name, 0) + 1

        return {
            "supervisor_status": "ACTIVE_SUPERVISION",
            "total_events_logged": total_events,
            "agent_activity_counts": agent_counts,
            "recent_events": [ev.model_dump() for ev in self.event_logs[-15:]]
        }


# Global Supervisor Instance
supervisor = SupervisorEngine()
