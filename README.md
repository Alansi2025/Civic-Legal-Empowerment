# AI for Civic and Legal Empowerment Platform
### IEEE-Compliant Multi-Agent System (MAS) Architecture

> **Problem Statement 3**: Autonomous civic & legal empowerment platform powered by **Google GenAI SDK (Gemini 3.7 / 2.5)**, Playwright browser automation, ReportLab PDF synthesis, and IEEE standards (IEEE 830, IEEE 7000, IEEE 829, IEEE 730, IEEE 1012).

---

## 🏛️ Multi-Agent Architecture Topology

```
+-----------------------------------------------------------------------------------+
|                           AUTONOMOUS RE-ACT SUPERVISOR                            |
+-----------------------------------------------------------------------------------+
                                          |
    +-------------------+                 |                 +------------------+
    | 1. Triage Agent   | <---------------+---------------> | 2. Drafting Agent|
    +-------------------+                                   +------------------+
              |                                                      |
              v                                                      v
    +-------------------+                                   +------------------+
    | 3. Consent Agent  | <---------------------------------| 4. Portal Agent  |
    +-------------------+                                   +------------------+
              |                                                      |
              +--------------------------+---------------------------+
                                         |
                                         v
                            +--------------------------+
                            | 5. IEEE QA Audit Agent   |
                            +--------------------------+
```

### Agents Overview
1. **Legal Triage & Routing Agent (`backend/app/agents/triage_agent.py`)**: Classifies plain-language civic grievances into statutory pathways (RTI Act 2005, CPGRAMS Public Grievances, Consumer Protection Act 2019, Municipal Works).
2. **Statutory RTI Drafting Agent (`backend/app/agents/drafting_agent.py`)**: Converts intake into legally grounded Section 6(1) query points and chronological petitions with statutory citations.
3. **PII & IEEE 7000 Consent Guardrail Agent (`backend/app/agents/consent_agent.py`)**: RegEx + LLM PII entity scanner (Aadhaar 12-digit, PAN, phone, address). Hashes data and enforces explicit citizen digital consent signature gates.
4. **Browser & Portal Automation Agent (`backend/app/agents/portal_agent.py`)**: Playwright headless browser wrapper navigating dynamic portal form fields, extracting DOM selectors, and returning verifiable receipts with printable PDF documents.
5. **IEEE QA & Code Evaluation Agent (`backend/app/agents/qa_audit_agent.py`)**: Performs static AST cyclomatic complexity audits, memory safety verification, and checks IEEE 829/730 compliance.
6. **Agent Supervisor Engine (`backend/app/agents/supervisor.py`)**: Tracks work telemetry, records event logs, and monitors agent state transitions.

---

## ⚡ Quick Start & Setup Guide

### 1. Environment Requirements
- **Python**: 3.11+ (Python 3.14 recommended)
- **Node.js**: v18+ (Node v26 recommended)
- **API Key**: `GEMINI_API_KEY` (Google GenAI SDK)

### 2. Start FastAPI Backend Server
```bash
cd backend
./start_backend.sh
```
*Runs on `http://localhost:8000`. OpenAPI 3.1 documentation available at `http://localhost:8000/docs`.*

### 3. Start Next.js Frontend App
```bash
cd frontend
./start_frontend.sh
```
*Runs on `http://localhost:3000`.*

### 4. Run Pytest Test Suite & IEEE Audit
```bash
backend/.venv/bin/pytest tests/ -v --cov=backend/app
```

---

## 📄 IEEE Standards Compliance Documentation

- **`docs/SRS_IEEE830.md`**: Software Requirements Specification, System Data Dictionary, Functional Requirements, and Traceability Matrix.
- **`docs/IEEE_7000_ETHICS.md`**: Ethical AI Principles, Data Minimization, and Cryptographic Consent Verification Tokens.
