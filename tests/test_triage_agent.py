import pytest
from app.models import GrievanceInput, StatutoryPathway
from app.agents.triage_agent import TriageAgent


def test_triage_rti_classification():
    agent = TriageAgent()
    intake = GrievanceInput(
        citizen_id="test_01",
        language="English",
        raw_text="I want to file an RTI to get certified copies of tender expenditure and road construction budget for Ward 12."
    )
    result = agent.evaluate(intake)
    assert result.pathway == StatutoryPathway.RTI_ACT_2005
    assert any("RTI" in s or "6(1)" in s or "2(j)" in s for s in result.statutory_sections)
    assert result.confidence_score > 0.8


def test_triage_consumer_classification():
    agent = TriageAgent()
    intake = GrievanceInput(
        citizen_id="test_02",
        language="English",
        raw_text="I bought a defective refrigerator from an online store and they are refusing refund or warranty replacement."
    )
    result = agent.evaluate(intake)
    assert result.pathway == StatutoryPathway.CONSUMER_PROTECTION_2019
    assert result.confidence_score > 0.8


def test_triage_municipal_classification():
    agent = TriageAgent()
    intake = GrievanceInput(
        citizen_id="test_03",
        language="English",
        raw_text="There are open sewage potholes and overflowing garbage dump near Market Road Ward 45."
    )
    result = agent.evaluate(intake)
    assert result.pathway == StatutoryPathway.MUNICIPAL_WORKS
    assert result.confidence_score > 0.8
