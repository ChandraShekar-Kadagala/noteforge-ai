from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict
from app.schemas.section import SectionOut, SectionCreate

class DocumentBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    subject: Optional[str] = "General"
    summary: Optional[str] = None
    tags: List[str] = Field(default_factory=list)

class DocumentCreate(DocumentBase):
    initial_raw_content: Optional[str] = None

class DocumentUpdate(BaseModel):
    title: Optional[str] = None
    subject: Optional[str] = None
    summary: Optional[str] = None
    tags: Optional[List[str]] = None

class DocumentOut(DocumentBase):
    id: str
    user_id: str
    current_version: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class DocumentDetailOut(DocumentOut):
    sections: List[SectionOut] = Field(default_factory=list)
    versions_count: int = 1
