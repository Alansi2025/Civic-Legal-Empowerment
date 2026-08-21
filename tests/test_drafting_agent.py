import pytest
from app.models import GrievanceInput, TriageResult, StatutoryPathway
from app.agents.drafting_agent import DraftingAgent


def test_drafting_rti_application():
    agent = DraftingAgent()
    intake = GrievanceInput(
        citizen_id="test_01",
        language="English",
        raw_text="Request for expenditure budget details on Road construction."
    )
    triage = TriageResult(
        pathway=StatutoryPathway.RTI_ACT_2005,
        public_authority="Public Information Officer, PWD",
        statutory_sections=["Section 6(1) Right to Information Act 2005"],
        confidence_score=0.95,
        summary="RTI query for budget",
        follow_up_questions=[],
        requires_more_info=False
    )
    draft = agent.generate_draft(intake, triage)
    assert draft.pathway == StatutoryPathway.RTI_ACT_2005
    assert "SECTION 6(1)" in draft.title
    assert len(draft.statutory_queries) >= 3
    assert draft.word_count > 50
    assert "Section 6(1)" in draft.legal_grounds[0]
