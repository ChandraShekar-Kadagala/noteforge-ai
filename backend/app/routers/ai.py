from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.schemas.ai import (
    OrganizeRequest,
    OrganizeResponse,
    MergePreviewRequest,
    MergePreviewResponse,
    MergeCommitRequest
)
from app.schemas.document import DocumentDetailOut
from app.services.auth_service import get_current_user, verify_document_ownership
from app.services.ai_service import get_ai_service
from app.services.merge_engine import generate_merge_preview
from app.services.document_service import save_document_sections

router = APIRouter(prefix="/api/ai", tags=["AI Engine"])

@router.post("/organize", response_model=OrganizeResponse)
async def organize_raw_notes(
    req: OrganizeRequest,
    current_user: User = Depends(get_current_user)
):
    ai_service = get_ai_service()
    return await ai_service.organize_content(
        raw_content=req.raw_content,
        subject=req.subject,
        preserve_source=req.preserve_source
    )

@router.post("/merge-preview", response_model=MergePreviewResponse)
async def preview_continuous_merge(
    req: MergePreviewRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    doc = verify_document_ownership(req.document_id, current_user, db)
    
    # Process only the newly pasted lesson
    ai_service = get_ai_service()
    organized_incoming = await ai_service.organize_content(
        raw_content=req.raw_content,
        subject=doc.subject,
        preserve_source=req.preserve_source
    )

    # Execute merge analysis against existing document sections
    return generate_merge_preview(
        document_id=doc.id,
        existing_sections=doc.sections,
        incoming_sections=organized_incoming.sections,
        incoming_title=organized_incoming.title
    )

@router.post("/merge-commit/{document_id}", response_model=DocumentDetailOut)
def commit_merged_document(
    document_id: str,
    commit_req: MergeCommitRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    doc = verify_document_ownership(document_id, current_user, db)
    
    updated_doc = save_document_sections(
        doc=doc,
        sections_data=commit_req.sections,
        version_title=commit_req.version_title,
        change_summary=commit_req.change_summary or f"Continuous edit added {len(commit_req.sections)} sections",
        db=db
    )

    return DocumentDetailOut(
        id=updated_doc.id,
        user_id=updated_doc.user_id,
        title=updated_doc.title,
        subject=updated_doc.subject,
        summary=updated_doc.summary,
        tags=updated_doc.tags or [],
        current_version=updated_doc.current_version,
        created_at=updated_doc.created_at,
        updated_at=updated_doc.updated_at,
        sections=updated_doc.sections,
        versions_count=len(updated_doc.versions)
    )
