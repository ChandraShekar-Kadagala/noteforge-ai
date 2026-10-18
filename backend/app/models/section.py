import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Text, JSON, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

def generate_uuid():
    return uuid.uuid4().hex

class DocumentSection(Base):
    __tablename__ = "document_sections"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    document_id = Column(String(36), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False, index=True)
    stable_key = Column(String(100), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    section_type = Column(String(50), default="concept")  # concept, procedure, code_example, callout, comparison_table, revision_qa, summary
    order_index = Column(Integer, nullable=False, default=0, index=True)
    content_markdown = Column(Text, nullable=False, default="")
    structured_blocks = Column(JSON, default=list)  # list of typed blocks: {type: 'callout'|'code'|'table'|'markdown', data: {...}}
    raw_source = Column(Text, nullable=True)  # preserve source text
    ai_enriched = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    document = relationship("Document", back_populates="sections")
