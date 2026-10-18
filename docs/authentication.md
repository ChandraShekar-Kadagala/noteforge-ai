# NoteForge AI — Authentication & Security Architecture

## Overview
NoteForge AI enforces strict multi-tenant isolation and security. A document ID alone never grants access to a document. Every read, update, delete, merge, or export operation verifies the user's cryptographic token and matches their `user_id` against the document owner.

---

## Authentication Mechanisms

### 1. Local Registration & Password Security
- Passwords are salted and hashed using `bcrypt` (12 rounds) via `app/utils/security.py`.
- Plaintext passwords are never logged or stored.
- Email addresses are normalized to lowercase and validated with `email-validator`.
- Session tokens are issued as cryptographically signed HS256 JSON Web Tokens (JWT) with configurable expiry (`ACCESS_TOKEN_EXPIRE_MINUTES`).

### 2. Social Authentication (Google, LinkedIn, Supabase)
- The backend provides a unified social authentication route `/api/auth/social`.
- Supports OAuth provider integration for Google, LinkedIn, and Supabase Auth.
- Provider secrets are read exclusively from server-side environment variables (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET`, `SUPABASE_JWT_SECRET`).
- Tokens are exchanged for an authenticated NoteForge AI session JWT.

---

## Authorization & Ownership Enforcement

In `app/services/auth_service.py`:
```python
def verify_document_ownership(document_id: str, current_user: User, db: Session) -> Document:
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")
    if doc.user_id != current_user.id:
        logger.warning(f"Unauthorized document access attempt: User {current_user.id} -> Doc {document_id}")
        raise HTTPException(status_code=403, detail="You do not have permission to access or modify this document.")
    return doc
```

### Security Guarantees:
- **No Cross-User Access**: Verified by automated test `test_document_ownership_enforcement` in `test_documents.py`.
- **Protected Endpoints**: Verified by `test_unauthorized_access` in `test_auth.py`.
- **CORS Protection**: Explicit origin whitelist (`http://localhost:5173`, `http://localhost:3000`).
- **No Secrets in Frontend**: API keys, database credentials, and JWT signing keys are kept strictly on the backend.
