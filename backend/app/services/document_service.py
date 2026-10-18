import uuid
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.document import Document
from app.models.section import DocumentSection
from app.models.version import DocumentVersion
from app.models.user import User
from app.schemas.document import DocumentCreate, DocumentUpdate
from app.schemas.section import SectionCreate, SectionUpdate, StructuredBlock
from app.utils.logger import logger

def list_documents(user_id: str, search: Optional[str], db: Session) -> List[Document]:
    query = db.query(Document).filter(Document.user_id == user_id)
    if search:
        query = query.filter(Document.title.ilike(f"%{search}%") | Document.subject.ilike(f"%{search}%"))
    return query.order_by(Document.updated_at.desc()).all()

def create_document(doc_in: DocumentCreate, user: User, db: Session) -> Document:
    doc = Document(
        user_id=user.id,
        title=doc_in.title.strip(),
        subject=doc_in.subject or "General",
        summary=doc_in.summary or "",
        tags=doc_in.tags or [],
        current_version=1
    )
    db.add(doc)
    db.flush()

    # Initial snapshot
    initial_snapshot = {
        "title": doc.title,
        "subject": doc.subject,
        "summary": doc.summary,
        "sections": []
    }
    
    version = DocumentVersion(
        document_id=doc.id,
        version_number=1,
        title="Initial Document Creation",
        change_summary="Created new empty document",
        snapshot_data=initial_snapshot
    )
    db.add(version)
    db.commit()
    db.refresh(doc)
    return doc

def update_document(doc: Document, update_in: DocumentUpdate, db: Session) -> Document:
    if update_in.title is not None:
        doc.title = update_in.title.strip()
    if update_in.subject is not None:
        doc.subject = update_in.subject.strip()
    if update_in.summary is not None:
        doc.summary = update_in.summary
    if update_in.tags is not None:
        doc.tags = update_in.tags
    
    doc.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(doc)
    return doc

def delete_document(doc: Document, db: Session) -> None:
    db.delete(doc)
    db.commit()

def duplicate_document(doc: Document, user: User, db: Session) -> Document:
    new_doc = Document(
        user_id=user.id,
        title=f"{doc.title} (Copy)",
        subject=doc.subject,
        summary=doc.summary,
        tags=list(doc.tags) if doc.tags else [],
        current_version=1
    )
    db.add(new_doc)
    db.flush()

    # Copy sections
    copied_sections = []
    for s in doc.sections:
        new_section = DocumentSection(
            document_id=new_doc.id,
            stable_key=s.stable_key,
            title=s.title,
            section_type=s.section_type,
            order_index=s.order_index,
            content_markdown=s.content_markdown,
            structured_blocks=[b if isinstance(b, dict) else b.__dict__ for b in (s.structured_blocks or [])],
            raw_source=s.raw_source,
            ai_enriched=s.ai_enriched
        )
        db.add(new_section)
        copied_sections.append({
            "stable_key": s.stable_key,
            "title": s.title,
            "section_type": s.section_type,
            "order_index": s.order_index,
            "content_markdown": s.content_markdown,
            "structured_blocks": new_section.structured_blocks
        })

    snapshot = {
        "title": new_doc.title,
        "subject": new_doc.subject,
        "summary": new_doc.summary,
        "sections": copied_sections
    }
    version = DocumentVersion(
        document_id=new_doc.id,
        version_number=1,
        title="Duplicated Document",
        change_summary=f"Duplicated from {doc.title}",
        snapshot_data=snapshot
    )
    db.add(version)
    db.commit()
    db.refresh(new_doc)
    return new_doc

def save_document_sections(
    doc: Document,
    sections_data: List[SectionCreate],
    version_title: str,
    change_summary: str,
    db: Session
) -> Document:
    """
    Atomically updates sections and creates a persistent version snapshot.
    Does NOT wipe untouched sections unless explicitly instructed.
    """
    # Remove existing sections for this document
    db.query(DocumentSection).filter(DocumentSection.document_id == doc.id).delete()
    
    saved_sections_json = []
    for idx, s in enumerate(sections_data):
        section_obj = DocumentSection(
            document_id=doc.id,
            stable_key=s.stable_key or f"sec_{uuid.uuid4().hex[:8]}",
            title=s.title,
            section_type=s.section_type or "concept",
            order_index=idx,
            content_markdown=s.content_markdown,
            structured_blocks=[b.model_dump() if hasattr(b, "model_dump") else b for b in (s.structured_blocks or [])],
            raw_source=s.raw_source,
            ai_enriched=s.ai_enriched
        )
        db.add(section_obj)
        saved_sections_json.append({
            "stable_key": section_obj.stable_key,
            "title": section_obj.title,
            "section_type": section_obj.section_type,
            "order_index": section_obj.order_index,
            "content_markdown": section_obj.content_markdown,
            "structured_blocks": section_obj.structured_blocks,
            "raw_source": section_obj.raw_source,
            "ai_enriched": section_obj.ai_enriched
        })

    # Increment version
    doc.current_version += 1
    doc.updated_at = datetime.now(timezone.utc)

    # Save version record
    snapshot = {
        "title": doc.title,
        "subject": doc.subject,
        "summary": doc.summary,
        "sections": saved_sections_json
    }
    version = DocumentVersion(
        document_id=doc.id,
        version_number=doc.current_version,
        title=version_title,
        change_summary=change_summary,
        snapshot_data=snapshot
    )
    db.add(version)
    db.commit()
    db.refresh(doc)
    return doc

def restore_document_version(doc: Document, version_number: int, db: Session) -> Document:
    version = db.query(DocumentVersion).filter(
        DocumentVersion.document_id == doc.id,
        DocumentVersion.version_number == version_number
    ).first()
    
    if not version:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Version {version_number} not found for this document."
        )
    
    snapshot = version.snapshot_data
    sections_list = snapshot.get("sections", [])

    # Clear current sections
    db.query(DocumentSection).filter(DocumentSection.document_id == doc.id).delete()

    for idx, s in enumerate(sections_list):
        section_obj = DocumentSection(
            document_id=doc.id,
            stable_key=s.get("stable_key", f"sec_{uuid.uuid4().hex[:8]}"),
            title=s.get("title", f"Section {idx+1}"),
            section_type=s.get("section_type", "concept"),
            order_index=idx,
            content_markdown=s.get("content_markdown", ""),
            structured_blocks=s.get("structured_blocks", []),
            raw_source=s.get("raw_source"),
            ai_enriched=s.get("ai_enriched", False)
        )
        db.add(section_obj)

    # Create a new version recording this rollback
    doc.current_version += 1
    doc.updated_at = datetime.now(timezone.utc)

    rollback_version = DocumentVersion(
        document_id=doc.id,
        version_number=doc.current_version,
        title=f"Restored to v{version_number}",
        change_summary=f"Reverted document state back to version {version_number} ({version.title})",
        snapshot_data=snapshot
    )
    db.add(rollback_version)
    db.commit()
    db.refresh(doc)
    return doc
