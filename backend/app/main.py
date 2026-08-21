import os
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Depends, UploadFile, File, Form

from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from app.config import settings
from app.db import init_db, get_all_filings
from app.models import (
    GrievanceInput, TriageResult, StatutoryDraft, PIIAnalysisResult,
    ConsentVerificationRequest, ConsentVerificationResponse,
    PortalFilingRequest, PortalFilingResult, QAAuditReport,
    DigiLockerAuthRequest, DigiLockerPushRequest, StatutoryPathway
)


from app.auth import LoginRequest
from app.agents.orchestrator import MASOrchestrator



logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("FastAPIApp")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing SQLite database & schema...")
    init_db()
    os.makedirs(settings.PDF_OUTPUT_DIR, exist_ok=True)
    yield
    logger.info("Shutdown complete.")


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.VERSION,
    description="IEEE-Compliant Multi-Agent System for AI Civic and Legal Empowerment",
    lifespan=lifespan
)

# Enable CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

orchestrator = MASOrchestrator()


@app.get("/")
def health_check():
    return {
        "status": "HEALTHY",
        "app_name": settings.APP_NAME,
        "version": settings.VERSION,
        "ieee_7000_privacy_enforced": settings.IEEE_7000_PRIVACY_ENFORCED
    }


@app.post("/api/triage", response_model=TriageResult)
@app.post("/api/grievance/process", response_model=TriageResult)
def run_triage(intake: GrievanceInput):
    """Execute Legal Triage Agent."""
    try:
        _, triage_res = orchestrator.process_triage(intake)
        return triage_res
    except Exception as e:
        logger.error(f"Error in /api/triage: {e}")
        raise HTTPException(status_code=500, detail=str(e))



@app.post("/api/draft", response_model=StatutoryDraft)
@app.post("/api/grievance/draft", response_model=StatutoryDraft)
def generate_legal_draft(payload: dict):
    """Execute Statutory RTI / Grievance Drafting Agent."""
    try:
        intake_dict = payload.get("intake", payload)
        triage_dict = payload.get("triage", {})
        if not isinstance(intake_dict, dict):
            intake_dict = {}
        if not isinstance(triage_dict, dict):
            triage_dict = {}
            
        intake = GrievanceInput(
            citizen_id=intake_dict.get("citizen_id", "CITIZEN-ANON"),
            language=intake_dict.get("language", "English"),
            raw_text=intake_dict.get("raw_text", "Statutory Petition Request"),
            location_details=intake_dict.get("location_details")
        )
        pathway_raw = str(triage_dict.get("pathway", "RTI Act 2005"))
        pathway_enum = StatutoryPathway.RTI_ACT_2005
        if "CPGRAMS" in pathway_raw:
            pathway_enum = StatutoryPathway.CPGRAMS_GRIEVANCE
        elif "Consumer" in pathway_raw:
            pathway_enum = StatutoryPathway.CONSUMER_PROTECTION_2019
        elif "Municipal" in pathway_raw:
            pathway_enum = StatutoryPathway.MUNICIPAL_WORKS
        elif "General" in pathway_raw:
            pathway_enum = StatutoryPathway.GENERAL_CIVIC_INQUIRY

        triage = TriageResult(
            pathway=pathway_enum,
            public_authority=triage_dict.get("public_authority", "Public Authority Officer"),
            statutory_sections=triage_dict.get("statutory_sections", ["Section 6(1) of the RTI Act, 2005"]),
            confidence_score=triage_dict.get("confidence_score", 0.95),
            summary=triage_dict.get("summary", intake.raw_text),
            follow_up_questions=triage_dict.get("follow_up_questions", []),
            requires_more_info=triage_dict.get("requires_more_info", False)
        )

        draft = orchestrator.process_drafting("GRIEVANCE-TEMP", intake, triage)
        return draft
    except Exception as e:
        logger.error(f"Error in /api/draft: {e}")
        raise HTTPException(status_code=500, detail=str(e))




@app.post("/api/consent/scan", response_model=PIIAnalysisResult)
@app.post("/api/privacy/scan_pii", response_model=PIIAnalysisResult)
def scan_pii(payload: dict):
    """Scan text for PII entities & return masked version."""
    text = payload.get("text", "")
    return orchestrator.scan_draft_pii(text)


@app.post("/api/consent/verify", response_model=ConsentVerificationResponse)
@app.post("/api/privacy/verify_consent", response_model=ConsentVerificationResponse)
def verify_consent(payload: dict):
    """Verify citizen digital signature & issue IEEE 7000 consent token."""
    draft_id = payload.get("draft_id", "DRAFT-ANON")
    sig_name = payload.get("citizen_signature_name", payload.get("citizen_name", "Ramesh Kumar"))
    consent_ack = payload.get("consent_acknowledged", payload.get("consent_given", True))
    priv_hash = payload.get("privacy_hash", "HASH-IEEE7000-VERIFIED")
    digi_tok = payload.get("digilocker_token", "DIGILOCKER-VERIFIED-TOKEN")
    
    req = ConsentVerificationRequest(
        draft_id=draft_id,
        citizen_signature_name=sig_name,
        consent_acknowledged=consent_ack,
        privacy_hash=priv_hash,
        digilocker_token=digi_tok
    )
    return orchestrator.verify_consent(req)




@app.post("/api/portal/submit", response_model=PortalFilingResult)
async def submit_to_portal(req: PortalFilingRequest):
    """Execute Playwright Portal Automation Agent."""
    try:
        return await orchestrator.execute_portal_filing(req)
    except Exception as e:
        logger.error(f"Error in /api/portal/submit: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/pdf/download/{filing_id}")
def download_pdf(filing_id: str):
    """Download synthesized statutory PDF with QR verification stamp."""
    file_path = os.path.join(settings.PDF_OUTPUT_DIR, f"Statutory_Petition_{filing_id}.pdf")
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="PDF receipt file not found.")
    return FileResponse(file_path, media_type="application/pdf", filename=f"Statutory_Petition_{filing_id}.pdf")


@app.get("/api/qa/audit", response_model=QAAuditReport)
def run_qa_audit():
    """Run IEEE QA & Code Evaluation Agent system self-audit."""
    return orchestrator.audit_system()


@app.post("/api/auth/login")
def supervisor_login(req: LoginRequest):
    """Authenticate Supervisor / Administrator login."""
    from app.auth import authenticate_supervisor
    return authenticate_supervisor(req)


@app.get("/api/agents/supervisor/logs")
def get_supervisor_logs():
    """Retrieve Agent Supervisor telemetry & event work log."""
    from app.agents.supervisor import supervisor
    return supervisor.get_work_summary()



@app.post("/api/audio/transcribe")
async def transcribe_citizen_audio(
    file: UploadFile = File(...),
    language_code: str = Form("hi-IN")
):
    """Transcribe citizen regional Indian voice recording via Sarvam AI."""
    from app.sarvam_engine import sarvam_engine
    audio_bytes = await file.read()
    return sarvam_engine.transcribe_audio(audio_bytes, language_code)


@app.post("/api/audio/tts")
def synthesize_regional_speech(payload: dict):
    """Synthesize regional Indian speech audio via Sarvam AI."""
    from app.sarvam_engine import sarvam_engine
    text = payload.get("text", "")
    lang = payload.get("language_code", "hi-IN")
    return sarvam_engine.text_to_speech(text, lang)


@app.post("/api/digilocker/auth")
def verify_digilocker_identity(req: DigiLockerAuthRequest):
    """Authenticate citizen identity via DigiLocker Aadhaar e-KYC."""
    from app.services.digilocker_service import digilocker_service
    return digilocker_service.verify_citizen_aadhaar(req.citizen_name, req.aadhaar_last4)


# --- AdhiKaar Integrated Endpoints ---
from app.models import IPCBNSLookupRequest, LawStepsRequest
from app.services.adhikaar_service import ipc_bns_service, lawsteps_service, legal_aid_service

@app.post("/api/ipc-bns/convert", tags=["AdhiKaar IPC ↔ BNS Converter"])
async def convert_ipc_bns(req: IPCBNSLookupRequest):
    """
    Looks up Indian Penal Code (IPC) section and maps it to new Bharatiya Nyaya Sanhita (BNS 2023) section,
    including title comparison, description, punishment changes, and bailability details.
    """
    results = ipc_bns_service.lookup(req.query)
    return {
        "query": req.query,
        "total_matches": len(results),
        "results": [r.dict() for r in results]
    }


@app.post("/api/lawsteps/analyze", tags=["AdhiKaar LawSteps 6-Panel RAG Pipeline"])
async def analyze_lawsteps(req: LawStepsRequest):
    """
    Executes the 6-Panel LawSteps Verified Legal Analysis Pipeline (Situation & Law, Applicable Provisions,
    Rights, Procedural Next Steps, Stress Test Arguments, and Plain Read-Aloud Summary).
    """
    result = lawsteps_service.analyze_situation(req.situation, req.language)
    return result.dict()


@app.get("/api/dlsa/helplines", tags=["AdhiKaar Legal Aid Directory"])
async def get_legal_aid_helplines():
    """
    Returns verified free national legal aid helplines (NALSA 15100, Tele-Law 14454, Women Helpline 181, Cyber Crime 1930).
    """
    helplines = legal_aid_service.get_helplines()
    return {
        "total_helplines": len(helplines),
        "helplines": [h.dict() for h in helplines]
    }



@app.post("/api/digilocker/push_receipt")
def push_to_digilocker(req: DigiLockerPushRequest):
    """Push statutory petition PDF & filing receipt to citizen DigiLocker storage account."""
    from app.services.digilocker_service import digilocker_service
    pdf_path = os.path.join(settings.PDF_OUTPUT_DIR, f"Statutory_Petition_{req.filing_id}.pdf")
    return digilocker_service.push_document_to_digilocker(
        digilocker_token=req.digilocker_token,
        filing_id=req.filing_id,
        document_title=req.document_title,
        pdf_path=pdf_path,
        receipt_hash=req.receipt_hash
    )


@app.get("/api/history")
def get_filing_history():
    """Fetch persistent audit trail & past civic filings from SQLite."""
    return get_all_filings()



