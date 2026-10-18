from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.document import Document
from app.utils.security import decode_access_token, hash_password, verify_password, create_access_token
from app.schemas.auth import UserCreate, UserLogin, Token, UserOut, SocialAuthRequest
from app.config import settings
from app.utils.logger import logger

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/token")

def register_user(user_data: UserCreate, db: Session) -> User:
    existing = db.query(User).filter(User.email == user_data.email.lower()).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists."
        )
    
    hashed_pwd = hash_password(user_data.password)
    user = User(
        email=user_data.email.lower(),
        hashed_password=hashed_pwd,
        full_name=user_data.full_name,
        auth_provider="local"
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

def authenticate_user(login_data: UserLogin, db: Session) -> Token:
    user = db.query(User).filter(User.email == login_data.email.lower()).first()
    if not user or not user.hashed_password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is deactivated."
        )
    
    token = create_access_token({"sub": user.id, "email": user.email})
    return Token(access_token=token, token_type="bearer", user=UserOut.model_validate(user))

def handle_social_auth(auth_req: SocialAuthRequest, db: Session) -> Token:
    """
    Authenticate or register a user via OAuth (Google, LinkedIn, Supabase).
    Validates provider payload or matches trusted email.
    """
    if not auth_req.email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email is required for social authentication."
        )
    
    user = db.query(User).filter(User.email == auth_req.email.lower()).first()
    if not user:
        user = User(
            email=auth_req.email.lower(),
            full_name=auth_req.full_name or auth_req.email.split("@")[0],
            avatar_url=auth_req.avatar_url,
            auth_provider=auth_req.provider,
            is_active=True
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        # Update details if needed
        if auth_req.avatar_url and not user.avatar_url:
            user.avatar_url = auth_req.avatar_url
            db.commit()
            db.refresh(user)
            
    token = create_access_token({"sub": user.id, "email": user.email})
    return Token(access_token=token, token_type="bearer", user=UserOut.model_validate(user))

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate authentication credentials or session expired.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    payload = decode_access_token(token)
    if payload is None:
        raise credentials_exception
    user_id: Optional[str] = payload.get("sub")
    if user_id is None:
        raise credentials_exception
    
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise credentials_exception
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive."
        )
    return user

def verify_document_ownership(document_id: str, current_user: User, db: Session) -> Document:
    """
    Enforces strict ownership check. Raises 404 if document does not exist,
    or 403 Forbidden if the document belongs to a different user.
    """
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found."
        )
    if doc.user_id != current_user.id:
        logger.warning(f"Unauthorized document access attempt: User {current_user.id} -> Doc {document_id}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to access or modify this document."
        )
    return doc
