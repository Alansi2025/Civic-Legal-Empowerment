import pytest
from app.agents.qa_audit_agent import QAAuditAgent


def test_qa_audit_execution():
    agent = QAAuditAgent()
    report = agent.run_system_audit(backend_dir="app")
    assert report.total_agents_verified == 5
    assert report.test_coverage_pct >= 85.0
    assert report.cyclomatic_complexity_max >= 1.0
    assert report.ieee_829_compliance is True
    assert report.ieee_730_quality_gate is True
