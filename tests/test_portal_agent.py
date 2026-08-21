import pytest
import os
from app.models import PortalFilingRequest, StatutoryPathway
from app.agents.portal_agent import PortalAgent


@pytest.mark.asyncio
async def test_portal_automation_execution():
    agent = PortalAgent()
    req = PortalFilingRequest(
        draft_id="DRAFT-TEST-001",
        consent_token="IEEE7000-TOKEN-TEST1234",
        portal_type=StatutoryPathway.RTI_ACT_2005,
        target_authority="Public Works Department",
        redacted_content="Statement of facts redacted for testing portal execution."
    )
    result = await agent.execute_filing(req)
    assert result.status == "SUBMITTED_SUCCESS"
    assert "RTI-GOV-" in result.tracking_id
    assert "REF-" in result.application_ref_code
    assert len(result.receipt_hash) == 64
    assert len(result.execution_trace) >= 8
    # Assert PDF file was created
    from app.config import settings
    pdf_filename = os.path.join(settings.PDF_OUTPUT_DIR, f"Statutory_Petition_{result.filing_id}.pdf")
    assert os.path.exists(pdf_filename)

