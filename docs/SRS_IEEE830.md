# IEEE 830 Software Requirements Specification (SRS)
## AI for Civic and Legal Empowerment System (IEEE MAS Architecture)

---

## 1. Introduction

### 1.1 Purpose
This document specifies the software requirements for the **AI for Civic and Legal Empowerment System** adhering to **IEEE Std 830-1998** (Software Requirements Specifications), **IEEE Std 7000-2021** (Ethical AI & Privacy Systems), and **IEEE Std 829/1012** (Verification and Validation).

### 1.2 Scope
The system provides Indian citizens with an autonomous, multi-agent legal interface that:
1. Evaluates plain-language grievances in any Indian language.
2. Dynamically routes requests to statutory pathways (Right to Information Act 2005, CPGRAMS Public Grievance, Consumer Protection Act 2019, Municipal Infrastructure Acts).
3. Automatically drafts legally grounded Section 6(1) RTI applications or petitions.
4. Redacts sensitive PII (Aadhaar, PAN, contact info) and enforces explicit human-in-the-loop consent gates.
5. Simulates portal submissions via Playwright browser automation and produces printable PDF petitions with QR code verification stamps.

---

## 2. Overall Description

### 2.1 Multi-Agent System Architecture
```
                     +---------------------------------------+
                     |        Citizen Intake Interface       |
                     +---------------------------------------+
                                         |
                                         v
                     +---------------------------------------+
                     |    1. Legal Triage & Routing Agent    |
                     +---------------------------------------+
                                         |
                                         v
                     +---------------------------------------+
                     |   2. Statutory RTI Drafting Agent     |
                     +---------------------------------------+
                                         |
                                         v
                     +---------------------------------------+
                     | 3. PII & IEEE 7000 Consent Guardrail  |
                     +---------------------------------------+
                                         |
                                         v
                     +---------------------------------------+
                     |    4. Playwright Portal Agent         |
                     +---------------------------------------+
                                         |
                                         v
                     +---------------------------------------+
                     |  5. IEEE QA & Code Evaluation Agent   |
                     +---------------------------------------+
```

### 2.2 Functional Requirements

| Req ID | Component | Description | IEEE Standard |
|---|---|---|---|
| **FR-01** | Triage Agent | Parse intake text, classify into RTI Act 2005 / CPGRAMS / Consumer / Municipal. | IEEE 830 3.2 |
| **FR-02** | Drafting Agent | Formulate formal legal application with PIO targeting, facts, and numbered queries. | IEEE 830 3.2 |
| **FR-03** | Consent Agent | RegEx + LLM PII entity extraction and masking (Aadhaar, PAN, phone, address). | IEEE 7000 |
| **FR-04** | Consent Gate | Enforce cryptographic human consent signature token before filing. | IEEE 7000 |
| **FR-05** | Portal Agent | Playwright browser automation simulating filing and dynamic DOM extraction. | IEEE 1012 |
| **FR-06** | PDF Engine | Synthesize ReportLab A4 printable petition with embedded QR code stamp. | IEEE 830 3.2 |
| **FR-07** | QA Agent | Perform AST static cyclomatic complexity audit and test coverage verification. | IEEE 829 / 730 |

### 2.3 Non-Functional Requirements

- **Performance**: Agent responses under 2.5 seconds per pipeline node.
- **Privacy & Security**: Zero transmission of unmasked Aadhaar or PAN to external LLMs.
- **Reliability**: Fallback heuristic modes guaranteeing 100% operational uptime.
- **Compliance**: IEEE 7000 Ethical AI Principles (Transparency, Human Autonomy, Accountability).

---

## 3. Data Dictionary

```
GrievanceInput = {
    citizen_id: String,
    language: String,
    raw_text: String,
    location_details: Optional[String]
}

TriageResult = {
    pathway: StatutoryPathway (Enum),
    public_authority: String,
    statutory_sections: List[String],
    confidence_score: Float,
    summary: String,
    follow_up_questions: List[String]
}

StatutoryDraft = {
    draft_id: String,
    pathway: StatutoryPathway,
    title: String,
    public_authority: String,
    statement_of_facts: String,
    statutory_queries: List[String],
    legal_grounds: List[String]
}
```

---

## 4. Traceability Matrix

| Requirement | Design Module | Code File | Test Case | Status |
|---|---|---|---|---|
| FR-01 | Triage System | `app/agents/triage_agent.py` | `test_triage_agent.py` | VERIFIED |
| FR-02 | Drafting Engine | `app/agents/drafting_agent.py` | `test_drafting_agent.py` | VERIFIED |
| FR-03/04 | Consent Guardrail | `app/agents/consent_agent.py` | `test_consent_agent.py` | VERIFIED |
| FR-05 | Portal Automation | `app/agents/portal_agent.py` | `test_portal_agent.py` | VERIFIED |
| FR-06 | PDF Synthesis | `app/pdf_generator.py` | `test_pdf_generator.py` | VERIFIED |
| FR-07 | Quality Auditor | `app/agents/qa_audit_agent.py` | `test_qa_audit_agent.py` | VERIFIED |
