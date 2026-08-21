import axios from 'axios';
import { GrievanceInput, TriageResult, StatutoryDraft, PIIAnalysisResult, ConsentVerificationResponse, PortalFilingResult } from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const api = {
  // Existing API methods
  submitGrievanceIntake: async (data: GrievanceInput): Promise<TriageResult> => {
    const res = await client.post('/api/grievance/process', data);
    return res.data;
  },

  postTriage: async (data: GrievanceInput): Promise<TriageResult> => {
    const res = await client.post('/api/grievance/process', data);
    return res.data;
  },


  generateDraft: async (intake: GrievanceInput, triage: TriageResult): Promise<StatutoryDraft> => {
    const res = await client.post('/api/grievance/draft', { intake, triage });
    return res.data;
  },

  postDraft: async (intake: GrievanceInput, triage: TriageResult): Promise<StatutoryDraft> => {
    const res = await client.post('/api/grievance/draft', { intake, triage });
    return res.data;
  },


  scanPII: async (text: string): Promise<PIIAnalysisResult> => {
    const res = await client.post('/api/privacy/scan_pii', { text });
    return res.data;
  },

  verifyConsent: async (draft_id: string, citizen_name: string = 'Ramesh Kumar', consent_given: boolean = true, redacted_text: string = ''): Promise<ConsentVerificationResponse> => {
    const res = await client.post('/api/privacy/verify_consent', {
      citizen_name,
      aadhaar_last4: "4321",
      consent_given,
      pathway: "CPGRAMS",
      redacted_text
    });
    return res.data;
  },


  submitPortal: async (draft_id: string, consent_token: string, portal_type: string, target_authority: string, redacted_content: string): Promise<PortalFilingResult> => {
    const res = await client.post('/api/portal/submit', {
      draft_id,
      consent_token,
      portal_type,
      target_authority,
      redacted_content,
    });
    return res.data;
  },

  submitGrievance: async (data: { citizen_id: string; language: string; raw_text: string; location_details?: string }) => {
    const res = await fetch(`${API_BASE_URL}/api/grievance/process`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return res.json();
  },

  async loginSupervisor(username: string, password: string) {
    const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return res.json();
  },

  async getSupervisorLogs() {
    const res = await fetch(`${API_BASE_URL}/api/agents/supervisor/logs`);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return res.json();
  },

  async getQAAudit() {
    const res = await fetch(`${API_BASE_URL}/api/qa/audit_system`, { method: 'POST' });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return res.json();
  },

  // --- AdhiKaar Integrated Feature API Methods ---



  async convertIPCBNS(query: string) {
    const res = await fetch(`${API_BASE_URL}/api/ipc-bns/convert`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return res.json();
  },

  async analyzeLawSteps(situation: string, language: string = 'English') {
    const res = await fetch(`${API_BASE_URL}/api/lawsteps/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ situation, language }),
    });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return res.json();
  },

  async fetchLegalAidHelplines() {
    const res = await fetch(`${API_BASE_URL}/api/dlsa/helplines`);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return res.json();
  },

  getHistory: async () => {
    const res = await client.get('/api/history');
    return res.data;
  }
};
