import os
import pytest
from app.pdf_generator import create_statutory_pdf


def test_create_statutory_pdf_generation():
    pdf_path = create_statutory_pdf(
        filing_id="FILING-PDF-TEST",
        pathway="RTI Act 2005",
        public_authority="Public Works Department",
        title="APPLICATION UNDER SECTION 6(1) RTI ACT 2005",
        redacted_content="This is line 1 of petition content.\n\nThis is line 2 of petition content.",
        tracking_id="RTI-2026-TEST",
        application_ref_code="REF-TEST-99",
        receipt_hash="1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
        output_directory="test_generated_pdfs"
    )
    assert os.path.exists(pdf_path)
    assert os.path.getsize(pdf_path) > 1000
