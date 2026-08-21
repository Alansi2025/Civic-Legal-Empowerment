import time
import uuid
import logging
from typing import Dict, Any, Tuple, List
from app.models import (
    GrievanceInput, TriageResult, StatutoryDraft, PIIAnalysisResult,
    ConsentVerificationRequest, ConsentVerificationResponse,
    PortalFilingRequest, PortalFilingResult, QAAuditReport
)
from app.agents.triage_agent import TriageAgent
from app.agents.drafting_agent import DraftingAgent
from app.agents.consent_agent import ConsentAgent
from app.agents.portal_agent import PortalAgent
from app.agents.qa_audit_agent import QAAuditAgent
from app.agents.supervisor import supervisor
from app.db import save_grievance_triage, save_draft, save_consent_audit, save_filing

logger = logging.getLogger("MASOrchestrator")


class MASOrchestrator:
    def __init__(self):
        self.triage_agent = TriageAgent()
        self.drafting_agent = DraftingAgent()
        self.consent_agent = ConsentAgent()
        self.portal_agent = PortalAgent()
        self.qa_agent = QAAuditAgent()

    def process_triage(self, intake: GrievanceInput) -> Tuple[str, TriageResult]:
        t0 = time.time()
        supervisor.log_event(
            agent_name=self.triage_agent.name,
            action="EVALUATE_CIVIC_INTAKE",
            status="STARTED",
            details={"raw_text_snippet": intake.raw_text[:80]}
        )
        
        grievance_id = f"GRIEVANCE-{uuid.uuid4().hex[:8].upper()}"
        triage_res = self.triage_agent.evaluate(intake)
        
        save_grievance_triage(
            grievance_id=grievance_id,
            citizen_id=intake.citizen_id,
            raw_text=intake.raw_text,
            language=intake.language,
            triage_dict=triage_res.model_dump()
        )
        
        t1 = time.time()
        supervisor.log_event(
            agent_name=self.triage_agent.name,
            action="CLASSIFIED_STATUTORY_PATHWAY",
            status="COMPLETED",
            details={
                "grievance_id": grievance_id,
                "pathway": triage_res.pathway.value,
                "public_authority": triage_res.public_authority
            },
            execution_time_ms=(t1 - t0) * 1000
        )
        return grievance_id, triage_res

    def process_drafting(self, grievance_id: str, intake: GrievanceInput, triage: TriageResult) -> StatutoryDraft:
        t0 = time.time()
        supervisor.log_event(
            agent_name=self.drafting_agent.name,
            action="GENERATE_STATUTORY_DRAFT",
            status="STARTED",
            details={"pathway": triage.pathway.value}
        )

        draft = self.drafting_agent.generate_draft(intake, triage)
        
        # Scan PII
        pii_res = self.consent_agent.scan_and_redact(draft.statement_of_facts + "\n" + "\n".join(draft.statutory_queries))
        
        save_draft(
            draft_id=draft.draft_id,
            grievance_id=grievance_id,
            pathway=draft.pathway.value,
            public_authority=draft.public_authority,
            title=draft.title,
            unredacted=pii_res.original_text,
            redacted=pii_res.redacted_text
        )

        t1 = time.time()
        supervisor.log_event(
            agent_name=self.drafting_agent.name,
            action="DRAFT_GENERATED_AND_AUDITED",
            status="COMPLETED",
            details={
                "draft_id": draft.draft_id,
                "queries_count": len(draft.statutory_queries),
                "word_count": draft.word_count
            },
            execution_time_ms=(t1 - t0) * 1000
        )
        return draft

    def scan_draft_pii(self, text: str) -> PIIAnalysisResult:
        t0 = time.time()
        supervisor.log_event(
            agent_name=self.consent_agent.name,
            action="SCAN_PII_ENTITIES",
            status="STARTED",
            details={"text_length": len(text)}
        )
        
        res = self.consent_agent.scan_and_redact(text)
        
        t1 = time.time()
        supervisor.log_event(
            agent_name=self.consent_agent.name,
            action="PII_MASKED_AND_HASHED",
            status="COMPLETED",
            details={
                "has_pii": res.has_pii,
                "detected_count": len(res.detected_items),
                "privacy_hash": res.privacy_hash[:16]
            },
            execution_time_ms=(t1 - t0) * 1000
        )
        return res

    def verify_consent(self, req: ConsentVerificationRequest) -> ConsentVerificationResponse:
        t0 = time.time()
        supervisor.log_event(
            agent_name=self.consent_agent.name,
            action="VERIFY_IEEE7000_CONSENT",
            status="STARTED",
            details={"draft_id": req.draft_id}
        )

        res = self.consent_agent.verify_human_consent(req)
        if res.verified:
            save_consent_audit(
                consent_token=res.consent_token,
                draft_id=req.draft_id,
                signature=req.citizen_signature_name,
                privacy_hash=req.privacy_hash,
                stamp=res.ieee_7000_audit_stamp,
                verified=True
            )

        t1 = time.time()
        supervisor.log_event(
            agent_name=self.consent_agent.name,
            action="IEEE7000_CONSENT_SEALED",
            status="COMPLETED" if res.verified else "REJECTED",
            details={"verified": res.verified, "token": res.consent_token},
            execution_time_ms=(t1 - t0) * 1000
        )
        return res

    async def execute_portal_filing(self, req: PortalFilingRequest) -> PortalFilingResult:
        t0 = time.time()
        supervisor.log_event(
            agent_name=self.portal_agent.name,
            action="PLAYWRIGHT_PORTAL_SUBMISSION",
            status="STARTED",
            details={"portal_type": req.portal_type.value, "draft_id": req.draft_id}
        )

        res = await self.portal_agent.execute_filing(req)
        
        save_filing(
            filing_id=res.filing_id,
            draft_id=req.draft_id,
            tracking_id=res.tracking_id,
            ref_code=res.application_ref_code,
            portal_url=res.portal_url,
            receipt_hash=res.receipt_hash,
            pdf_path=f"generated_pdfs/Statutory_Petition_{res.filing_id}.pdf",
            status=res.status
        )

        t1 = time.time()
        supervisor.log_event(
            agent_name=self.portal_agent.name,
            action="PORTAL_FILING_SUCCESSFUL",
            status="COMPLETED",
            details={"tracking_id": res.tracking_id, "receipt_hash": res.receipt_hash[:16]},
            execution_time_ms=(t1 - t0) * 1000
        )
        return res

    def audit_system(self) -> QAAuditReport:
        t0 = time.time()
        supervisor.log_event(
            agent_name=self.qa_agent.name,
            action="IEEE_QA_SYSTEM_AUDIT",
            status="STARTED",
            details={}
        )

        report = self.qa_agent.run_system_audit()
        
        t1 = time.time()
        supervisor.log_event(
            agent_name=self.qa_agent.name,
            action="SYSTEM_AUDIT_VERIFIED",
            status="COMPLETED",
            details={
                "coverage": report.test_coverage_pct,
                "complexity_avg": report.cyclomatic_complexity_avg
            },
            execution_time_ms=(t1 - t0) * 1000
        )
        return report
