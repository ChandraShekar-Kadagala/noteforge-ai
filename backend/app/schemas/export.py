from typing import Optional
from pydantic import BaseModel

class ExportResponse(BaseModel):
    document_id: str
    format: str  # docx or pdf
    filename: str
    download_url: Optional[str] = None
