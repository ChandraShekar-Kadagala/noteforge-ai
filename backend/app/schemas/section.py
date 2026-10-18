from typing import Optional, List, Any, Dict
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict

class StructuredBlock(BaseModel):
    id: Optional[str] = None
    type: str = Field(..., description="callout, code, table, procedure, markdown")
    data: Dict[str, Any] = Field(default_factory=dict)

class SectionBase(BaseModel):
    stable_key: str
    title: str
    section_type: str = "concept"
    order_index: int = 0
    content_markdown: str = ""
    structured_blocks: List[StructuredBlock] = Field(default_factory=list)
    raw_source: Optional[str] = None
    ai_enriched: bool = False

class SectionCreate(SectionBase):
    pass

class SectionUpdate(BaseModel):
    title: Optional[str] = None
    section_type: Optional[str] = None
    order_index: Optional[int] = None
    content_markdown: Optional[str] = None
    structured_blocks: Optional[List[StructuredBlock]] = None
    raw_source: Optional[str] = None
    ai_enriched: Optional[bool] = None

class SectionOut(SectionBase):
    id: str
    document_id: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
