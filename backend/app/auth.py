import uuid
import hashlib
import logging
from pydantic import BaseModel
from typing import Optional

logger = logging.getLogger("AuthService")


class LoginRequest(BaseModel):
    username: str
    password: str


class LoginResponse(BaseModel):
    success: bool
    token: str
    role: str
    username: str
    message: str


def authenticate_supervisor(req: LoginRequest) -> LoginResponse:
    # Prototype credential check (default supervisor: admin / admin123 or supervisor / supervisor123)
    if req.username in ["admin", "supervisor"] and req.password in ["admin123", "supervisor123", "password"]:
        token = f"SUP-TOKEN-{uuid.uuid4().hex[:12].upper()}"
        return LoginResponse(
            success=True,
            token=token,
            role="SUPERVISOR_ADMIN",
            username=req.username,
            message="Supervisor authentication successful."
        )
    
    return LoginResponse(
        success=False,
        token="",
        role="GUEST",
        username=req.username,
        message="Invalid supervisor credentials."
    )
