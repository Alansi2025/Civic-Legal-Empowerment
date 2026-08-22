import os
import logging
import hashlib
from datetime import datetime
from typing import Dict, Any, List, Optional
import pymongo
from pymongo import MongoClient
from app.config import settings

logger = logging.getLogger("MongoDBService")

# Initialize PyMongo Client
try:
    mongo_client = MongoClient(settings.MONGO_URI, serverSelectionTimeoutMS=2000)
    # Test ping
    mongo_client.admin.command('ping')
    db = mongo_client[settings.MONGO_DB_NAME]
    logger.info(f"Successfully connected to MongoDB server at {settings.MONGO_URI} (DB: {settings.MONGO_DB_NAME})")
    MONGO_AVAILABLE = True
except Exception as e:
    logger.warning(f"Could not connect to MongoDB server: {e}. Falling back to In-Memory MongoDB proxy.")
    MONGO_AVAILABLE = False
    mongo_client = None
    db = None

# Fallback in-memory database if MongoDB daemon is unreachable
fallback_users: Dict[str, Dict[str, Any]] = {}
fallback_sessions: Dict[str, Dict[str, Any]] = {}
fallback_filings: List[Dict[str, Any]] = []


def _hash_password(password: str) -> str:
    """Hash password using SHA-256 with salt."""
    salt = "legal_adviser_ai_salt_2026"
    return hashlib.sha256((password + salt).encode('utf-8')).hexdigest()


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify plain password against hashed password."""
    return _hash_password(plain_password) == hashed_password


# --- User Registration & Authentication (MongoDB) ---

def register_mongodb_user(username: str, email: str, password_raw: str, full_name: Optional[str] = None, role: str = "citizen") -> Dict[str, Any]:
    """Register a new user and save profile and hashed password to MongoDB."""
    password_hash = _hash_password(password_raw)
    user_doc = {
        "username": username,
        "email": email,
        "password_hash": password_hash,
        "full_name": full_name or username,
        "role": role,
        "created_at": datetime.utcnow().isoformat(),
        "last_login": datetime.utcnow().isoformat()
    }

    if MONGO_AVAILABLE and db is not None:
        # Check if username already exists
        existing = db.users.find_one({"username": username})
        if existing:
            raise ValueError(f"Username '{username}' is already registered in MongoDB.")
        
        existing_email = db.users.find_one({"email": email})
        if existing_email:
            raise ValueError(f"Email '{email}' is already registered in MongoDB.")
        
        db.users.insert_one(user_doc)
        logger.info(f"User '{username}' successfully created in MongoDB.")
    else:
        if username in fallback_users:
            raise ValueError(f"Username '{username}' is already registered.")
        fallback_users[username] = user_doc

    user_doc.pop("password_hash", None)
    user_doc.pop("_id", None)
    return user_doc


def authenticate_mongodb_user(username: str, password_raw: str) -> Dict[str, Any]:
    """Authenticate user against MongoDB users collection."""
    if MONGO_AVAILABLE and db is not None:
        user = db.users.find_one({"username": username})
        if not user:
            raise ValueError("Invalid username or password.")
        
        if not verify_password(password_raw, user.get("password_hash", "")):
            raise ValueError("Invalid username or password.")
        
        # Update last login timestamp
        db.users.update_one({"_id": user["_id"]}, {"$set": {"last_login": datetime.utcnow().isoformat()}})
        
        user.pop("password_hash", None)
        user.pop("_id", None)
        return user
    else:
        user = fallback_users.get(username)
        if not user or not verify_password(password_raw, user.get("password_hash", "")):
            raise ValueError("Invalid username or password.")
        
        user_copy = dict(user)
        user_copy.pop("password_hash", None)
        return user_copy


def get_user_profile(username: str) -> Optional[Dict[str, Any]]:
    """Retrieve user profile from MongoDB."""
    if MONGO_AVAILABLE and db is not None:
        user = db.users.find_one({"username": username}, {"password_hash": 0, "_id": 0})
        return user
    return fallback_users.get(username)


# --- Chat Conversation Session Persistence (MongoDB) ---

def save_mongodb_conversation(thread_id: str, user_id: str, title: str, messages: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Save or update chat session thread in MongoDB chat_sessions collection."""
    doc = {
        "thread_id": thread_id,
        "user_id": user_id,
        "title": title,
        "messages": messages,
        "updated_at": datetime.utcnow().isoformat()
    }

    if MONGO_AVAILABLE and db is not None:
        db.chat_sessions.update_one(
            {"thread_id": thread_id},
            {"$set": doc},
            upsert=True
        )
        logger.info(f"Saved conversation thread '{thread_id}' with {len(messages)} messages to MongoDB.")
    else:
        fallback_sessions[thread_id] = doc

    return doc


def get_user_conversations(user_id: str = "guest") -> List[Dict[str, Any]]:
    """Fetch all saved chat conversation threads for a user from MongoDB."""
    if MONGO_AVAILABLE and db is not None:
        cursor = db.chat_sessions.find(
            {"user_id": user_id},
            {"_id": 0}
        ).sort("updated_at", pymongo.DESCENDING)
        threads = list(cursor)
        return threads
    else:
        return [s for s in fallback_sessions.values() if s.get("user_id") == user_id]


def get_conversation_by_thread_id(thread_id: str) -> Optional[Dict[str, Any]]:
    """Fetch a specific conversation thread by thread_id from MongoDB."""
    if MONGO_AVAILABLE and db is not None:
        doc = db.chat_sessions.find_one({"thread_id": thread_id}, {"_id": 0})
        return doc
    return fallback_sessions.get(thread_id)


def delete_mongodb_conversation(thread_id: str) -> bool:
    """Delete a conversation thread from MongoDB."""
    if MONGO_AVAILABLE and db is not None:
        res = db.chat_sessions.delete_one({"thread_id": thread_id})
        return res.deleted_count > 0
    else:
        if thread_id in fallback_sessions:
            del fallback_sessions[thread_id]
            return True
        return False


# --- Grievance Filings & Draft Persistence (MongoDB) ---

def save_mongodb_filing(filing_data: Dict[str, Any]) -> Dict[str, Any]:
    """Save a statutory grievance filing / draft into MongoDB filings collection."""
    doc = dict(filing_data)
    doc["created_at"] = datetime.utcnow().isoformat()

    if MONGO_AVAILABLE and db is not None:
        db.filings.insert_one(doc)
        doc.pop("_id", None)
        logger.info(f"Saved statutory filing draft '{doc.get('draft_id')}' into MongoDB.")
    else:
        fallback_filings.append(doc)

    return doc


def get_all_mongodb_filings() -> List[Dict[str, Any]]:
    """Retrieve all statutory grievance filings from MongoDB."""
    if MONGO_AVAILABLE and db is not None:
        return list(db.filings.find({}, {"_id": 0}).sort("created_at", pymongo.DESCENDING))
    return fallback_filings
