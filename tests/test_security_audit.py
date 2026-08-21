import pytest
import sqlite3
from app.config import settings
from app.db import get_db_connection, save_grievance_triage, save_draft
from app.security_vault import vault
from app.agents.consent_agent import ConsentAgent


def test_aes_256_vault_encryption():
    secret_text = "Citizen Aadhaar: 9876 5432 1098. Address: 12 MG Road."
    encrypted = vault.encrypt(secret_text)
    assert encrypted != secret_text
    assert len(encrypted) > 20
    
    decrypted = vault.decrypt(encrypted)
    assert decrypted == secret_text


def test_database_pii_encryption_at_rest():
    grievance_id = "GRIEVANCE-SEC-TEST"
    citizen_id = "citizen_sec"
    raw_text = "Confidential facts containing Aadhaar 9876 5432 1098"
    
    triage_dict = {
        "pathway": "RTI Act 2005",
        "public_authority": "PWD"
    }
    save_grievance_triage(grievance_id, citizen_id, raw_text, "English", triage_dict)
    
    # Inspect raw SQLite database row
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT raw_text FROM grievances WHERE id = ?", (grievance_id,))
    stored_val = cursor.fetchone()[0]
    conn.close()
    
    # Assert raw plain text is NOT stored in database in cleartext
    assert raw_text not in stored_val
    # Assert decrypting stored val recovers original input
    assert vault.decrypt(stored_val) == raw_text


def test_pii_guardrail_masking_comprehensive():
    agent = ConsentAgent()
    input_text = "Name: Rajesh. Aadhaar: 4321 8765 9876. PAN: ABCDE1234F. Phone: +91 9123456789. Email: rajesh@example.com."
    res = agent.scan_and_redact(input_text)
    
    assert res.has_pii is True
    assert "4321 8765 9876" not in res.redacted_text
    assert "ABCDE1234F" not in res.redacted_text
    assert "+91 9123456789" not in res.redacted_text
    assert "rajesh@example.com" not in res.redacted_text
    assert "XXXX-XXXX-9876" in res.redacted_text
    assert "ABXXX4F" in res.redacted_text
