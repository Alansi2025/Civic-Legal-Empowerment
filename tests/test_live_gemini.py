import pytest
import os
from app.config import settings
from app.agents.triage_agent import TriageAgent
from app.agents.drafting_agent import DraftingAgent
from app.agents.consent_agent import ConsentAgent
from app.agents.portal_agent import PortalAgent
from app.agents.qa_audit_agent import QAAuditAgent
from app.models import GrievanceInput, StatutoryPathway

def test_live_gemini_api_key_triage():
    """Case 1: Test Live Gemini API Key for Legal Triage Agent."""
    agent = TriageAgent()
    intake = GrievanceInput(
        citizen_id="live_test_01",
        language="English",
        raw_text="I want to file an RTI application to inspect public road works expenditure and certified tender copies in Ward 42.",
        location_details="Ward 42, Delhi"
    )
    triage = agent.evaluate(intake)
    print("\n[LIVE GEMINI TRIAGE OUTPUT]:", triage)
    assert triage.pathway == StatutoryPathway.RTI_ACT_2005
    assert triage.confidence_score > 0.8

def test_live_gemini_api_key_drafting():
    """Case 2: Test Live Gemini API Key for Statutory Drafting Agent."""
    triage_agent = TriageAgent()
    drafting_agent = DraftingAgent()
    
    intake = GrievanceInput(
        citizen_id="live_test_02",
        language="English",
        raw_text="File a CPGRAMS public grievance petition for central pension payment delayed for over 8 months.",
        location_details="New Delhi"
    )
    triage = triage_agent.evaluate(intake)
    draft = drafting_agent.generate_draft(intake, triage)
    print("\n[LIVE GEMINI DRAFT TITLE]:", draft.title)
    print("[LIVE GEMINI STATEMENT OF FACTS]:", draft.statement_of_facts[:150])
    assert draft.draft_id.startswith("DRAFT-")
    assert len(draft.statutory_queries) >= 3
    assert len(draft.required_documents_checklist) >= 3

def test_live_gemini_api_key_consent_and_pii():
    """Case 3: Test PII Guardrail & Consent Agent."""
    agent = ConsentAgent()
    raw_text = "My name is Ramesh Kumar, Aadhaar 4321 8899 1012, phone 9876543210. Requesting road budget info."
    analysis = agent.scan_and_redact(raw_text)
    print("\n[LIVE PII REDACTED TEXT]:", analysis.redacted_text)
    assert "XXXX" in analysis.redacted_text
    assert analysis.privacy_hash != ""


if __name__ == "__main__":
    test_live_gemini_api_key_triage()
    test_live_gemini_api_key_drafting()
    test_live_gemini_api_key_consent_and_pii()
    print("\nALL LIVE GEMINI TEST CASES PASSED SUCCESSFULLY!")
