from typing import Optional, List, Any, Dict
from datetime import datetime
from pydantic import BaseModel, ConfigDict

class VersionOut(BaseModel):
    id: str
    document_id: str
    version_number: int
    title: str
    change_summary: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class VersionDetailOut(VersionOut):
    snapshot_data: Dict[str, Any]

class VersionRestoreRequest(BaseModel):
    version_number: int
