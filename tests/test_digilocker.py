import pytest
from app.services.digilocker_service import digilocker_service
from app.models import ConsentVerificationRequest
from app.agents.consent_agent import ConsentAgent


def test_digilocker_identity_verification():
    res = digilocker_service.verify_citizen_aadhaar("Ramesh Kumar", "4321")
    assert res["status"] == "VERIFIED_SUCCESS"
    assert "DL-AADHAAR-" in res["digilocker_uid"]
    assert "DIGILOCKER-VERIFIED-" in res["verification_token"]
    assert res["aadhaar_masked"] == "XXXX-XXXX-4321"


def test_digilocker_document_push():
    res = digilocker_service.push_document_to_digilocker(
        digilocker_token="DIGILOCKER-VERIFIED-12345",
        filing_id="FILING-DL-TEST",
        document_title="STATUTORY PETITION (RTI Act 2005)",
        pdf_path="generated_pdfs/Statutory_Petition_FILING-DL-TEST.pdf",
        receipt_hash="hash1234567890abcdef"
    )
    assert res["status"] == "PUSHED_TO_DIGILOCKER_SUCCESS"
    assert "in.gov.digilocker.civic.petition." in res["digilocker_doc_uri"]
    assert "DL-DOC-" in res["document_id"]


def test_consent_agent_with_digilocker_token():
    agent = ConsentAgent()
    req = ConsentVerificationRequest(
        draft_id="DRAFT-DL-001",
        citizen_signature_name="Ramesh Kumar",
        consent_acknowledged=True,
        privacy_hash="dummy_privacy_hash",
        digilocker_token="DIGILOCKER-VERIFIED-ABCDE12345"
    )
    resp = agent.verify_human_consent(req)
    assert resp.verified is True
    assert resp.digilocker_verified is True
    assert "IEEE7000-TOKEN-" in resp.consent_token
