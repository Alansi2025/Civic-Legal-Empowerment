import pytest
from app.services.adhikaar_service import ipc_bns_service, lawsteps_service, legal_aid_service


def test_ipc_bns_lookup_302():
    """Test IPC 302 -> BNS 103(1) Murder mapping."""
    res = ipc_bns_service.lookup("302")
    assert len(res) > 0
    match = res[0]
    assert match.ipc_section == "302"
    assert "103" in match.bns_section

    assert "Murder" in match.offence or "Murder" in match.ipc_title


def test_ipc_bns_lookup_420():
    """Test IPC 420 -> BNS 318(4) Cheating mapping."""
    res = ipc_bns_service.lookup("420")
    assert len(res) > 0
    match = res[0]
    assert match.ipc_section == "420"
    assert "318" in match.bns_section
    assert "Cheating" in match.offence or "Cheating" in match.ipc_title


def test_lawsteps_analysis_pipeline():
    """Test LawSteps 6-Panel analysis execution."""
    situation = "My neighbor illegally encroached on public municipal road land and threatened me when questioned."
    result = lawsteps_service.analyze_situation(situation, language="English")
    assert result.situation_and_law != ""
    assert len(result.applicable_law) > 0
    assert len(result.rights) > 0
    assert len(result.next_steps) > 0
    assert "for" in result.stress_test
    assert result.explain_simply != ""


def test_legal_aid_helplines():
    """Test NALSA / Tele-Law / Women Helpline directory lookup."""
    helplines = legal_aid_service.get_helplines()
    assert len(helplines) >= 5
    nalsa = next((h for h in helplines if "NALSA" in h.name), None)
    assert nalsa is not None
    assert nalsa.number == "15100"
