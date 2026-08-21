from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from enum import Enum
from datetime import datetime, timezone


class StatutoryPathway(str, Enum):

    RTI_ACT_2005 = "RTI Act 2005"
    CPGRAMS_GRIEVANCE = "CPGRAMS Public Grievance"
    CONSUMER_PROTECTION_2019 = "Consumer Protection Act 2019"
    MUNICIPAL_WORKS = "Municipal Public Works Grievance"
    UNKNOWN = "General Civic Inquiry"


class PIIEntityType(str, Enum):
    AADHAAR = "Aadhaar Number (12-Digit)"
    PAN = "PAN Card Number"
    PHONE = "Phone Number"
    EMAIL = "Email Address"
    ADDRESS = "Physical Address"
    NAME = "Full Name"


class GrievanceInput(BaseModel):
    citizen_id: str = Field(default="citizen_anon", description="Unique token representing citizen")
    language: str = Field(default="English", description="Input language (e.g., English, Hindi, Tamil)")
    raw_text: str = Field(..., description="Plain-language description of civic issue or grievance")
    location_details: Optional[str] = Field(default=None, description="Ward, district, or municipality info")


class NLMExtractedInfo(BaseModel):
    user_intent: str = Field(default="General Inquiry", description="High-level extracted user intent")
    key_entities: Dict[str, Any] = Field(default_factory=dict, description="Extracted NLM entities (Location, Dept, Dates, Grievance)")
    actionable_summary: str = Field(default="", description="Normalized actionable summary")
    suggested_next_actions: List[str] = Field(default_factory=list, description="Concrete next statutory or general steps")
    is_grievance_ready: bool = Field(default=False, description="True if structured enough for legal drafting")
    sentiment_urgency: str = Field(default="Normal", description="Low / Normal / High / Emergency")


class TriageResult(BaseModel):
    pathway: StatutoryPathway = Field(..., description="Identified legal statutory pathway")
    public_authority: str = Field(..., description="Target Public Body, PIO, or Department")
    statutory_sections: List[str] = Field(default_factory=list, description="Relevant statutory sections (e.g., Sec 6(1) RTI)")
    confidence_score: float = Field(..., ge=0.0, le=1.0, description="Routing confidence score")
    summary: str = Field(..., description="Structured summary of the civic grievance")
    follow_up_questions: List[str] = Field(default_factory=list, description="Clarifying questions if intake is incomplete")
    requires_more_info: bool = Field(default=False, description="True if vital details are missing")
    is_conversational: bool = Field(default=False, description="True if prompt is a general chat greeting/question")
    conversational_reply: Optional[str] = Field(default=None, description="Natural chat reply from Gemini AI")
    nlm_info: Optional[NLMExtractedInfo] = Field(default=None, description="Structured NLM extracted actionable facts")




class StatutoryDraft(BaseModel):
    draft_id: str = Field(..., description="Unique draft identifier")
    pathway: StatutoryPathway = Field(..., description="Target statutory pathway")
    title: str = Field(..., description="Formal legal title of application/petition")
    public_authority: str = Field(..., description="Target Public Authority / Department")
    pio_designation: str = Field(default="Public Information Officer", description="PIO / Nodal Officer Title")
    statement_of_facts: str = Field(..., description="Chronological summary of facts")
    statutory_queries: List[str] = Field(..., description="Numbered, concise inquiry or relief points")
    legal_grounds: List[str] = Field(default_factory=list, description="Statutory sections, rules, and precedents invoked")
    required_documents_checklist: List[str] = Field(default_factory=list, description="Mandatory legal document requirements")
    character_count: int = Field(default=0, description="Total character length")
    word_count: int = Field(default=0, description="Total word count")
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())



class PIIDetectionItem(BaseModel):
    entity_type: PIIEntityType
    original_value: str
    masked_value: str
    start_pos: int
    end_pos: int


class PIIAnalysisResult(BaseModel):
    has_pii: bool
    detected_items: List[PIIDetectionItem] = Field(default_factory=list)
    original_text: str
    redacted_text: str
    privacy_hash: str
    ieee_7000_compliant: bool = True


class ConsentVerificationRequest(BaseModel):
    draft_id: str
    citizen_signature_name: str
    consent_acknowledged: bool
    privacy_hash: str
    digilocker_token: Optional[str] = Field(default=None, description="Optional DigiLocker e-Verification token")


class ConsentVerificationResponse(BaseModel):
    verified: bool
    consent_token: str
    timestamp: str
    ieee_7000_audit_stamp: str
    digilocker_verified: bool = False
    message: str


class DigiLockerAuthRequest(BaseModel):
    citizen_name: str
    aadhaar_last4: str = Field(..., min_length=4, max_length=4)


class DigiLockerPushRequest(BaseModel):
    digilocker_token: str
    filing_id: str
    document_title: str
    receipt_hash: str



class PortalFilingRequest(BaseModel):
    draft_id: str
    consent_token: str
    portal_type: StatutoryPathway
    target_authority: str
    redacted_content: str


class PortalFilingResult(BaseModel):
    filing_id: str
    status: str  # e.g., "SUBMITTED_SUCCESS", "SIMULATED_SUCCESS", "FAILED"
    tracking_id: str
    application_ref_code: str
    portal_url: str
    submission_timestamp: str
    pdf_download_url: str
    receipt_hash: str
    execution_trace: List[str] = Field(default_factory=list)


class QAAuditReport(BaseModel):
    audit_timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

    cyclomatic_complexity_max: float
    cyclomatic_complexity_avg: float
    test_coverage_pct: float
    memory_safety_pass: bool
    ieee_829_compliance: bool
    ieee_730_quality_gate: bool
    total_agents_verified: int
    open_defects_count: int
    audit_summary: str
