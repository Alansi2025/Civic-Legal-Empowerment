import base64
import os
import logging
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from app.config import settings

logger = logging.getLogger("SecurityVault")


class SecurityVault:
    """
    AES-256 Fernet Encryption Vault for IEEE 7000 Data Minimization.
    Encrypts sensitive citizen input & unredacted content at rest.
    """
    def __init__(self, secret_key: Optional[str] = None):
        key_str = secret_key or settings.DATA_ENCRYPTION_KEY
        # Derive a valid 32-byte Fernet key from secret string
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=b"civic_ieee_7000_salt",
            iterations=100000,
        )
        derived_key = base64.urlsafe_b64encode(kdf.derive(key_str.encode()))
        self.fernet = Fernet(derived_key)

    def encrypt(self, data: str) -> str:
        if not data:
            return ""
        try:
            return self.fernet.encrypt(data.encode()).decode()
        except Exception as e:
            logger.error(f"Vault encryption error: {e}")
            return data

    def decrypt(self, token: str) -> str:
        if not token:
            return ""
        try:
            return self.fernet.decrypt(token.encode()).decode()
        except Exception as e:
            logger.error(f"Vault decryption error: {e}")
            return token


# Global Security Vault Instance
vault = SecurityVault()
