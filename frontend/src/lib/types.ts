export type StatutoryPathway = 
  | 'RTI Act 2005'
  | 'CPGRAMS Public Grievance'
  | 'Consumer Protection Act 2019'
  | 'Municipal Public Works Grievance'
  | 'General Civic Inquiry'
  | 'Unknown';


export interface GrievanceInput {
  citizen_id: string;
  language: string;
  raw_text: string;
  location_details?: string;
  conversation_history?: Array<{ sender: string; text: string }>;
}


export interface NLMExtractedInfo {
  user_intent: string;
  key_entities: Record<string, any>;
  actionable_summary: string;
  suggested_next_actions: string[];
  is_grievance_ready: boolean;
  sentiment_urgency: string;
}

export interface TriageResult {
  pathway: StatutoryPathway;
  public_authority: string;
  statutory_sections: string[];
  confidence_score: number;
  summary: string;
  follow_up_questions: string[];
  requires_more_info: boolean;
  is_conversational?: boolean;
  conversational_reply?: string;
  nlm_info?: NLMExtractedInfo;
}



export interface StatutoryDraft {
  draft_id: string;
  pathway: StatutoryPathway;
  title: string;
  public_authority: string;
  pio_designation?: string;
  statement_of_facts: string;
  statutory_queries: string[];
  citations?: string[];
  legal_grounds?: string[];
  required_documents_checklist?: string[];
  character_count?: number;
  word_count?: number;
  created_at: string;
}


export interface PIIDetectionItem {
  entity_type: string;
  original_value: string;
  masked_value: string;
  start_pos: number;
  end_pos: number;
}

export interface PIIAnalysisResult {
  has_pii: boolean;
  detected_items: PIIDetectionItem[];
  original_text: string;
  redacted_text: string;
  privacy_hash: string;
  ieee_7000_compliant: boolean;
}

export interface ConsentVerificationResponse {
  verified: boolean;
  consent_token: string;
  timestamp: string;
  ieee_7000_audit_stamp: string;
  message: string;
}

export interface PortalFilingResult {
  filing_id: string;
  status: string;
  tracking_id: string;
  application_ref_code: string;
  portal_url: string;
  submission_timestamp: string;
  pdf_download_url: string;
  receipt_hash: string;
  execution_trace: string[];
}

export interface QAAuditReport {
  audit_timestamp: string;
  cyclomatic_complexity_max: number;
  cyclomatic_complexity_avg: number;
  test_coverage_pct: number;
  memory_safety_pass: boolean;
  ieee_829_compliance: boolean;
  ieee_730_quality_gate: boolean;
  total_agents_verified: number;
  open_defects_count: number;
  audit_summary: string;
}

export interface AgentEventLog {
  event_id: string;
  timestamp: string;
  agent_name: string;
  action: string;
  status: string;
  details: Record<string, any>;
  execution_time_ms: number;
}

export interface SupervisorSummary {
  supervisor_status: string;
  total_events_logged: number;
  agent_activity_counts: Record<string, number>;
  recent_events: AgentEventLog[];
}
