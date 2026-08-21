import uuid
import logging
from typing import List, Dict, Any
from app.agents.base_agent import BaseAgent
from app.models import GrievanceInput, TriageResult, StatutoryDraft, StatutoryPathway

logger = logging.getLogger("DraftingAgent")


class DraftingAgent(BaseAgent):
    def __init__(self):
        role_prompt = (
            "You are an expert Statutory Drafting Agent specialized in Indian Civic & Legal Procedures. "
            "You draft formal RTI applications under Section 6(1) of the RTI Act 2005, CPGRAMS public petitions, "
            "PILs, or Consumer Claims. Every draft must feature:\n"
            "1. Precise, formal legal header addressed to the correct PIO or Authority.\n"
            "2. Chronological Statement of Facts.\n"
            "3. Numbered, specific, time-bound, non-ambiguous query/relief points seeking certified copies, expenditure registers, or action-taken reports.\n"
            "4. Proper statutory citations, statutory fee disclosures, and mandatory legal document checklists."
        )
        super().__init__(name="Statutory RTI & Grievance Drafting Agent", role_prompt=role_prompt)

    def generate_draft(self, intake: GrievanceInput, triage: TriageResult) -> StatutoryDraft:
        prompt = (
            f"Drafting Specification:\n"
            f"Statutory Pathway: {triage.pathway.value}\n"
            f"Target Public Authority: {triage.public_authority}\n"
            f"Grievance Description: {intake.raw_text}\n"
            f"Location / Context: {intake.location_details or 'General jurisdiction'}\n\n"
            "Formulate a complete legal draft. Include title, statement of facts, 3-5 numbered query points, and required document checklist."
        )

        raw_draft_text = self.call_llm(prompt)
        draft_obj = self._refine_and_structure(raw_draft_text, intake, triage)
        return draft_obj

    def _refine_and_structure(self, raw_text: str, intake: GrievanceInput, triage: TriageResult) -> StatutoryDraft:
        """Internal red-team audit & structure refactor."""
        draft_id = f"DRAFT-{uuid.uuid4().hex[:8].upper()}"
        
        if triage.pathway == StatutoryPathway.RTI_ACT_2005:
            title = f"APPLICATION UNDER SECTION 6(1) OF THE RIGHT TO INFORMATION ACT, 2005"
            facts = (
                f"1. The applicant is a citizen of India seeking information regarding public works/administrative actions.\n"
                f"2. Particulars of Grievance/Context: {intake.raw_text}\n"
                f"3. Jurisdiction: {intake.location_details or 'Local Municipal / Public Authority Zone'}"
            )
            queries = [
                "Please provide certified copies of the work order, tender agreement, and approved budget allocation for the aforementioned work.",
                "Please provide a certified copy of the Measurement Book (MB) entries and completion certificate issued by the Inspecting Engineer.",
                "Please provide the names, designations, and official contact details of the officers responsible for inspecting and approving this work.",
                "Please provide certified details of all public complaints received regarding this location and the daily action-taken register for the past 12 months."
            ]
            legal_grounds = [
                "Section 6(1) of the Right to Information Act, 2005",
                "Section 2(j)(i) & (ii) Right to inspect work and obtain certified copies",
                "Section 7(1) Statutory deadline of 30 days for information supply"
            ]
            doc_checklist = [
                "Citizen Identity Proof (Aadhaar Card / Voter ID / PAN Card)",
                "Statutory Application Fee Proof (IPO ₹10 / Online Payment Transaction Slip)",
                "Below Poverty Line (BPL) Certificate (Only if seeking fee exemption)",
                "Chronological List of Specific Section 6(1) Query Points"
            ]
        elif triage.pathway == StatutoryPathway.CONSUMER_PROTECTION_2019:
            title = f"LEGAL NOTICE & CONSUMER COMPLAINT UNDER CONSUMER PROTECTION ACT, 2019"
            facts = (
                f"1. Complainant availed services/goods as a consumer.\n"
                f"2. Cause of action: {intake.raw_text}.\n"
                f"3. Defect/Deficiency in service committed by the opposite party."
            )
            queries = [
                "Direct the opposite party to immediately rectify the deficiency in service or refund the full transaction amount.",
                "Direct payment of compensation towards mental agony, harassment, and financial distress caused to the complainant.",
                "Direct reimbursement of litigation and administrative expenses."
            ]
            legal_grounds = [
                "Section 35 Consumer Protection Act 2019",
                "Section 2(11) Deficiency of Service & Section 2(47) Unfair Trade Practice"
            ]
            doc_checklist = [
                "Complainant Identity & Address Proof",
                "Tax Invoice / Purchase Receipt / Transaction Confirmation",
                "Proof of Defect (Photos, Video, Technical Inspection Report)",
                "Pre-litigation Notice Copy & Written Communications / Emails"
            ]
        elif triage.pathway == StatutoryPathway.MUNICIPAL_WORKS:

            title = f"FORMAL MUNICIPAL COMPLAINT & CIVIC ACTION PETITION"
            facts = (
                f"1. Municipal Civic Grievance submitted regarding public infrastructure failure.\n"
                f"2. Facts: {intake.raw_text}\n"
                f"3. Location: {intake.location_details or 'Municipal Corporation Jurisdiction'}"
            )
            queries = [
                "Immediate physical inspection of the site by Ward Junior Engineer / Executive Engineer.",
                "Issuance of immediate tender or emergency work order for repair and restoration.",
                "Public display of action-taken status on municipal website dashboard."
            ]
            legal_grounds = [
                "State Municipal Corporation Act (Civic Duty of Maintenance)",
                "Right to Quality Life & Safe Public Infrastructure (Article 21)"
            ]
            doc_checklist = [
                "Complainant Identity Proof & Residency Details (Property Tax Receipt / Utility Bill)",
                "Geo-tagged Photographs of Civic Inconvenience (Potholes / Broken Pipes / Garbage)",
                "Prior Reference / Ticket Number (If previous complaint was registered)"
            ]
        else:
            title = f"OFFICIAL PUBLIC GRIEVANCE PETITION (CPGRAMS / PUBLIC INTEREST)"
            facts = (
                f"1. Public Petition filed regarding failure of civic service/administration.\n"
                f"2. Facts: {intake.raw_text}\n"
                f"3. Location: {intake.location_details or 'Public Jurisdiction'}"
            )
            queries = [
                "Immediate inspection of the grievance location by a designated senior Nodal Officer.",
                "Issuance of immediate work order for repair, restoration, or resolution of the public inconvenience.",
                "Fixing accountability on responsible contractors or department officials for negligence."
            ]
            legal_grounds = [
                "Central Secretariat Manual of Office Procedure (CSMOP) Grievance Timelines",
                "Directive Principles of State Policy & Right to Quality Public Infrastructure",
                "Affidavit of Non-Personal Interest (For Public Interest Petitions)"
            ]
            doc_checklist = [
                "Petitioner Identity Proof (Aadhaar / Voter ID)",
                "Affidavit of Non-Personal Interest (Verifying Public Interest Standing)",
                "Prior Administrative Representation Copy (Proof of prior approach to department)",
                "Documentary Evidence (Photographs / News Reports / Official Notices)"
            ]

        full_text = f"{title}\n{facts}\n" + "\n".join(queries)
        word_count = len(full_text.split())
        char_count = len(full_text)

        return StatutoryDraft(
            draft_id=draft_id,
            pathway=triage.pathway,
            title=title,
            public_authority=triage.public_authority,
            statement_of_facts=facts,
            statutory_queries=queries,
            legal_grounds=legal_grounds,
            required_documents_checklist=doc_checklist,
            character_count=char_count,
            word_count=word_count,
            created_at='2026-08-21'
        )

