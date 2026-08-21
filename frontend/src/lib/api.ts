import axios from 'axios';
import {
  GrievanceInput, TriageResult, StatutoryDraft, PIIAnalysisResult,
  ConsentVerificationResponse, PortalFilingResult, QAAuditReport, SupervisorSummary
} from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const api = {
  getHealth: async () => {
    const res = await client.get('/');
    return res.data;
  },

  postTriage: async (input: GrievanceInput): Promise<TriageResult> => {
    const res = await client.post('/api/triage', input);
    return res.data;
  },

  postDraft: async (intake: GrievanceInput, triage: TriageResult): Promise<StatutoryDraft> => {
    const res = await client.post('/api/draft', { intake, triage });
    return res.data;
  },

  scanPII: async (text: string): Promise<PIIAnalysisResult> => {
    const res = await client.post('/api/consent/scan', { text });
    return res.data;
  },

  verifyConsent: async (
    draftId: string,
    signature: string,
    acknowledged: boolean,
    privacyHash: string
  ): Promise<ConsentVerificationResponse> => {
    const res = await client.post('/api/consent/verify', {
      draft_id: draftId,
      citizen_signature_name: signature,
      consent_acknowledged: acknowledged,
      privacy_hash: privacyHash,
    });
    return res.data;
  },

  submitPortal: async (
    draftId: string,
    consentToken: string,
    portalType: string,
    targetAuthority: string,
    redactedContent: string
  ): Promise<PortalFilingResult> => {
    const res = await client.post('/api/portal/submit', {
      draft_id: draftId,
      consent_token: consentToken,
      portal_type: portalType,
      target_authority: targetAuthority,
      redacted_content: redactedContent,
    });
    return res.data;
  },

  getQAAudit: async (): Promise<QAAuditReport> => {
    const res = await client.get('/api/qa/audit');
    return res.data;
  },

  getSupervisorLogs: async (): Promise<SupervisorSummary> => {
    const res = await client.get('/api/agents/supervisor/logs');
    return res.data;
  },

  loginSupervisor: async (username: string, password: string) => {
    const res = await client.post('/api/auth/login', {
      username,
      password
    });
    return res.data;
  },

  authDigiLocker: async (citizenName: string, aadhaarLast4: string) => {
    const res = await client.post('/api/digilocker/auth', {
      citizen_name: citizenName,
      aadhaar_last4: aadhaarLast4
    });
    return res.data;
  },


  pushToDigiLocker: async (digilockerToken: string, filingId: string, documentTitle: string, receiptHash: string) => {
    const res = await client.post('/api/digilocker/push_receipt', {
      digilocker_token: digilockerToken,
      filing_id: filingId,
      document_title: documentTitle,
      receipt_hash: receiptHash
    });
    return res.data;
  },

  getHistory: async () => {
    const res = await client.get('/api/history');
    return res.data;
  }
};

