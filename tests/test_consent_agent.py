import pytest
from app.models import ConsentVerificationRequest
from app.agents.consent_agent import ConsentAgent


def test_pii_redaction_aadhaar_and_phone():
    agent = ConsentAgent()
    sample_text = (
        "My name is Ramesh Kumar. My Aadhaar number is 5432 8765 4321 and my PAN is ABCDE1234F. "
        "You can reach me at +91 9876543210 or email ramesh.kumar@example.com."
    )
    result = agent.scan_and_redact(sample_text)
    assert result.has_pii is True
    assert "5432 8765 4321" not in result.redacted_text
    assert "XXXX-XXXX-4321" in result.redacted_text
    assert "ABXXX4F" in result.redacted_text
    assert "+91-XXXXX-43210" in result.redacted_text
    assert "ramesh.kumar@example.com" not in result.redacted_text
    assert len(result.detected_items) >= 4


def test_ieee_7000_consent_verification_pass():
    agent = ConsentAgent()
    req = ConsentVerificationRequest(
        draft_id="DRAFT-1234",
        citizen_signature_name="Ramesh Kumar",
        consent_acknowledged=True,
        privacy_hash="dummy_hash_123"
    )
    resp = agent.verify_human_consent(req)
    assert resp.verified is True
    assert "IEEE7000-TOKEN-" in resp.consent_token
    assert "IEEE7000-HASH-" in resp.ieee_7000_audit_stamp


def test_ieee_7000_consent_verification_reject():
    agent = ConsentAgent()
    req = ConsentVerificationRequest(
        draft_id="DRAFT-1234",
        citizen_signature_name="",
        consent_acknowledged=False,
        privacy_hash="dummy_hash_123"
    )
    resp = agent.verify_human_consent(req)
    assert resp.verified is False
    assert resp.consent_token == ""
