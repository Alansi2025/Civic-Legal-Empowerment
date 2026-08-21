import os
import sys
import pytest

# Add backend directory to sys.path
backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'backend'))
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

from app.db import init_db


@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    os.environ["DATABASE_PATH"] = "test_civic_empowerment.db"
    os.environ["PDF_OUTPUT_DIR"] = "test_generated_pdfs"
    init_db()
    yield
    # Cleanup test files
    if os.path.exists("test_civic_empowerment.db"):
        os.remove("test_civic_empowerment.db")
