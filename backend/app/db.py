import sqlite3
import json
import os
from typing import Dict, Any, List, Optional
from datetime import datetime
from app.config import settings
from app.security_vault import vault


def get_db_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(settings.DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    return conn



def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Grievances & Triage table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS grievances (
            id TEXT PRIMARY KEY,
            citizen_id TEXT NOT NULL,
            raw_text TEXT NOT NULL,
            language TEXT NOT NULL,
            pathway TEXT NOT NULL,
            public_authority TEXT NOT NULL,
            triage_data TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)
    
    # Statutory Drafts table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS drafts (
            draft_id TEXT PRIMARY KEY,
            grievance_id TEXT NOT NULL,
            pathway TEXT NOT NULL,
            public_authority TEXT NOT NULL,
            title TEXT NOT NULL,
            unredacted_content TEXT NOT NULL,
            redacted_content TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (grievance_id) REFERENCES grievances(id)
        );
    """)
    
    # IEEE 7000 Consent Audit table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS consent_audit (
            consent_token TEXT PRIMARY KEY,
            draft_id TEXT NOT NULL,
            citizen_signature TEXT NOT NULL,
            privacy_hash TEXT NOT NULL,
            ieee_stamp TEXT NOT NULL,
            verified INTEGER NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)
    
    # Portal Submissions & Receipts table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS filings (
            filing_id TEXT PRIMARY KEY,
            draft_id TEXT NOT NULL,
            tracking_id TEXT NOT NULL,
            application_ref_code TEXT NOT NULL,
            portal_url TEXT NOT NULL,
            receipt_hash TEXT NOT NULL,
            pdf_path TEXT NOT NULL,
            status TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)
    
    # System QA Audit Trails
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS qa_audits (
            audit_id TEXT PRIMARY KEY,
            coverage_pct REAL NOT NULL,
            complexity_avg REAL NOT NULL,
            ieee_829_pass INTEGER NOT NULL,
            ieee_730_pass INTEGER NOT NULL,
            summary TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)
    
    conn.commit()
    conn.close()


def save_grievance_triage(grievance_id: str, citizen_id: str, raw_text: str, language: str, triage_dict: Dict[str, Any]):
    conn = get_db_connection()
    cursor = conn.cursor()
    encrypted_text = vault.encrypt(raw_text)
    cursor.execute(
        """
        INSERT OR REPLACE INTO grievances (id, citizen_id, raw_text, language, pathway, public_authority, triage_data)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """,
        (
            grievance_id,
            citizen_id,
            encrypted_text,
            language,
            triage_dict.get("pathway", "UNKNOWN"),
            triage_dict.get("public_authority", "General"),
            json.dumps(triage_dict)
        )
    )
    conn.commit()
    conn.close()


def save_draft(draft_id: str, grievance_id: str, pathway: str, public_authority: str, title: str, unredacted: str, redacted: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    encrypted_unredacted = vault.encrypt(unredacted)
    cursor.execute(
        """
        INSERT OR REPLACE INTO drafts (draft_id, grievance_id, pathway, public_authority, title, unredacted_content, redacted_content)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """,
        (draft_id, grievance_id, pathway, public_authority, title, encrypted_unredacted, redacted)
    )
    conn.commit()
    conn.close()



def save_consent_audit(consent_token: str, draft_id: str, signature: str, privacy_hash: str, stamp: str, verified: bool):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        """
        INSERT OR REPLACE INTO consent_audit (consent_token, draft_id, citizen_signature, privacy_hash, ieee_stamp, verified)
        VALUES (?, ?, ?, ?, ?, ?)
        """,
        (consent_token, draft_id, signature, privacy_hash, stamp, 1 if verified else 0)
    )
    conn.commit()
    conn.close()


def save_filing(filing_id: str, draft_id: str, tracking_id: str, ref_code: str, portal_url: str, receipt_hash: str, pdf_path: str, status: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        """
        INSERT OR REPLACE INTO filings (filing_id, draft_id, tracking_id, application_ref_code, portal_url, receipt_hash, pdf_path, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (filing_id, draft_id, tracking_id, ref_code, portal_url, receipt_hash, pdf_path, status)
    )
    conn.commit()
    conn.close()


def get_all_filings() -> List[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM filings ORDER BY created_at DESC")
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]
