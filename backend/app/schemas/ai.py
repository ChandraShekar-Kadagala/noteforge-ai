from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from app.schemas.section import SectionOut, SectionCreate, StructuredBlock

class OrganizeRequest(BaseModel):
    raw_content: str = Field(..., min_length=10, description="Raw educational notes or article content to organize")
    subject: Optional[str] = "General"
    preserve_source: bool = Field(default=False, description="Whether to strictly preserve verbatim source text")

class ProposedSection(BaseModel):
    stable_key: str
    title: str
    section_type: str = "concept"
    order_index: int = 0
    content_markdown: str = ""
    structured_blocks: List[StructuredBlock] = Field(default_factory=list)
    raw_source: Optional[str] = None
    ai_enriched: bool = False
    
    # Merge & analysis metadata
    placement_suggestion: Optional[str] = None
    duplicate_status: str = Field(default="new", description="new, duplicate, or partial_update")
    duplicate_of_key: Optional[str] = None
    similarity_score: Optional[float] = 0.0
    explanation: Optional[str] = None

class OrganizeResponse(BaseModel):
    title: str
    subject: str
    summary: str
    sections: List[ProposedSection]
    learning_objectives: List[str] = Field(default_factory=list)
    suggested_follow_ups: List[str] = Field(default_factory=list)
    provider_used: str = "mock"

class MergePreviewRequest(BaseModel):
    document_id: str
    raw_content: str = Field(..., min_length=10)
    preserve_source: bool = False

class MergePreviewResponse(BaseModel):
    document_id: str
    existing_sections: List[SectionOut]
    proposed_sections: List[ProposedSection]
    potential_duplicates_count: int = 0
    summary_of_changes: str
    suggested_version_title: str

class MergeCommitRequest(BaseModel):
    version_title: str = Field(..., min_length=1)
    change_summary: Optional[str] = None
    sections: List[SectionCreate]
