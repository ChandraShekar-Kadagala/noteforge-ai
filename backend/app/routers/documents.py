from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.document import Document
from app.schemas.document import DocumentCreate, DocumentUpdate, DocumentOut, DocumentDetailOut
from app.schemas.version import VersionOut, VersionRestoreRequest
from app.services.auth_service import get_current_user, verify_document_ownership
from app.services.document_service import (
    list_documents,
    create_document,
    update_document,
    delete_document,
    duplicate_document,
    restore_document_version
)

router = APIRouter(prefix="/api/documents", tags=["Documents"])

@router.get("", response_model=List[DocumentOut])
def get_documents(
    search: Optional[str] = Query(None, description="Search documents by title or subject"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return list_documents(current_user.id, search, db)

@router.post("", response_model=DocumentOut, status_code=status.HTTP_201_CREATED)
def create_new_document(
    doc_in: DocumentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return create_document(doc_in, current_user, db)

@router.get("/{document_id}", response_model=DocumentDetailOut)
def get_document(
    document_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    doc = verify_document_ownership(document_id, current_user, db)
    return DocumentDetailOut(
        id=doc.id,
        user_id=doc.user_id,
        title=doc.title,
        subject=doc.subject,
        summary=doc.summary,
        tags=doc.tags or [],
        current_version=doc.current_version,
        created_at=doc.created_at,
        updated_at=doc.updated_at,
        sections=doc.sections,
        versions_count=len(doc.versions)
    )

@router.put("/{document_id}", response_model=DocumentOut)
def update_document_metadata(
    document_id: str,
    update_in: DocumentUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    doc = verify_document_ownership(document_id, current_user, db)
    return update_document(doc, update_in, db)

@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_document(
    document_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    doc = verify_document_ownership(document_id, current_user, db)
    delete_document(doc, db)
    return None

@router.post("/{document_id}/duplicate", response_model=DocumentOut)
def duplicate_existing_document(
    document_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    doc = verify_document_ownership(document_id, current_user, db)
    return duplicate_document(doc, current_user, db)

@router.get("/{document_id}/versions", response_model=List[VersionOut])
def get_document_version_history(
    document_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    doc = verify_document_ownership(document_id, current_user, db)
    return doc.versions

@router.post("/{document_id}/versions/restore", response_model=DocumentDetailOut)
def restore_version(
    document_id: str,
    restore_req: VersionRestoreRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    doc = verify_document_ownership(document_id, current_user, db)
    restored_doc = restore_document_version(doc, restore_req.version_number, db)
    return DocumentDetailOut(
        id=restored_doc.id,
        user_id=restored_doc.user_id,
        title=restored_doc.title,
        subject=restored_doc.subject,
        summary=restored_doc.summary,
        tags=restored_doc.tags or [],
        current_version=restored_doc.current_version,
        created_at=restored_doc.created_at,
        updated_at=restored_doc.updated_at,
        sections=restored_doc.sections,
        versions_count=len(restored_doc.versions)
    )
