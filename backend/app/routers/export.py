import re
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.services.auth_service import get_current_user, verify_document_ownership
from app.services.export_docx import generate_docx_stream
from app.services.export_pdf import generate_pdf_stream

router = APIRouter(prefix="/api/export", tags=["Export"])

def sanitize_filename(title: str, version: int, ext: str) -> str:
    clean = re.sub(r"[^a-zA-Z0-9_\-]+", "_", title).strip("_")
    return f"{clean}_v{version}.{ext}"

@router.get("/{document_id}/docx")
def export_document_as_docx(
    document_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    doc = verify_document_ownership(document_id, current_user, db)
    docx_stream = generate_docx_stream(doc)
    filename = sanitize_filename(doc.title, doc.current_version, "docx")

    headers = {
        "Content-Disposition": f'attachment; filename="{filename}"'
    }
    return StreamingResponse(
        docx_stream,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers=headers
    )

@router.get("/{document_id}/pdf")
def export_document_as_pdf(
    document_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    doc = verify_document_ownership(document_id, current_user, db)
    pdf_stream = generate_pdf_stream(doc)
    filename = sanitize_filename(doc.title, doc.current_version, "pdf")

    headers = {
        "Content-Disposition": f'attachment; filename="{filename}"'
    }
    return StreamingResponse(
        pdf_stream,
        media_type="application/pdf",
        headers=headers
    )
