from abc import ABC, abstractmethod
import os
import io
import re
from typing import Optional
from app.config import settings
from app.utils.logger import logger

class BaseStorageService(ABC):
    @abstractmethod
    def save_file(self, contents: bytes, filename: str, content_type: str) -> str:
        """Saves file bytes and returns the stored filename."""
        pass

    @abstractmethod
    def get_file_bytes(self, filename: str) -> Optional[bytes]:
        """Retrieves raw file bytes."""
        pass

    @abstractmethod
    def get_local_path(self, filename: str) -> Optional[str]:
        """Returns local file path if available, or None."""
        pass

    @abstractmethod
    def file_exists(self, filename: str) -> bool:
        """Checks if file exists in storage."""
        pass

class LocalStorageService(BaseStorageService):
    def __init__(self, base_dir: Optional[str] = None):
        self.base_dir = base_dir or os.path.join(settings.UPLOAD_DIR, "images")
        os.makedirs(self.base_dir, exist_ok=True)

    def _sanitize_filename(self, filename: str) -> str:
        safe = os.path.basename(filename)
        return re.sub(r"[^a-zA-Z0-9_\-\.]", "_", safe)

    def save_file(self, contents: bytes, filename: str, content_type: str) -> str:
        safe_name = self._sanitize_filename(filename)
        dest_path = os.path.join(self.base_dir, safe_name)
        with open(dest_path, "wb") as f:
            f.write(contents)
        logger.info(f"LocalStorageService: saved {len(contents)} bytes to {dest_path}")
        return safe_name

    def get_file_bytes(self, filename: str) -> Optional[bytes]:
        safe_name = self._sanitize_filename(filename)
        file_path = os.path.join(self.base_dir, safe_name)
        if os.path.isfile(file_path):
            with open(file_path, "rb") as f:
                return f.read()
        return None

    def get_local_path(self, filename: str) -> Optional[str]:
        safe_name = self._sanitize_filename(filename)
        file_path = os.path.join(self.base_dir, safe_name)
        return file_path if os.path.isfile(file_path) else None

    def file_exists(self, filename: str) -> bool:
        safe_name = self._sanitize_filename(filename)
        file_path = os.path.join(self.base_dir, safe_name)
        return os.path.isfile(file_path)

class SupabaseStorageService(BaseStorageService):
    """
    Cloud object storage via Supabase Storage REST API for production deployment.
    Falls back to LocalStorageService if credentials are not configured.
    """
    def __init__(self):
        self.local_fallback = LocalStorageService()
        self.supabase_url = settings.SUPABASE_URL.rstrip("/") if settings.SUPABASE_URL else ""
        self.api_key = settings.SUPABASE_ANON_KEY or settings.SECRET_KEY
        self.bucket = settings.SUPABASE_STORAGE_BUCKET or "noteforge-media"

    def is_configured(self) -> bool:
        return bool(self.supabase_url and self.api_key)

    def save_file(self, contents: bytes, filename: str, content_type: str) -> str:
        # Save locally as primary cache
        saved_name = self.local_fallback.save_file(contents, filename, content_type)
        if not self.is_configured():
            return saved_name

        try:
            import httpx
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": content_type
            }
            url = f"{self.supabase_url}/storage/v1/object/{self.bucket}/{saved_name}"
            with httpx.Client(timeout=10.0) as client:
                res = client.post(url, headers=headers, content=contents)
                if res.status_code in [200, 201]:
                    logger.info(f"SupabaseStorageService: uploaded {saved_name} to {self.bucket}")
                else:
                    logger.warning(f"SupabaseStorageService upload status {res.status_code}: {res.text}")
        except Exception as e:
            logger.warning(f"SupabaseStorageService upload exception (using local copy): {e}")

        return saved_name

    def get_file_bytes(self, filename: str) -> Optional[bytes]:
        local_bytes = self.local_fallback.get_file_bytes(filename)
        if local_bytes:
            return local_bytes

        if not self.is_configured():
            return None

        try:
            import httpx
            headers = {"Authorization": f"Bearer {self.api_key}"}
            url = f"{self.supabase_url}/storage/v1/object/public/{self.bucket}/{filename}"
            with httpx.Client(timeout=10.0) as client:
                res = client.get(url, headers=headers)
                if res.status_code == 200:
                    # Cache locally
                    self.local_fallback.save_file(res.content, filename, res.headers.get("Content-Type", "image/png"))
                    return res.content
        except Exception as e:
            logger.warning(f"SupabaseStorageService fetch exception: {e}")

        return None

    def get_local_path(self, filename: str) -> Optional[str]:
        return self.local_fallback.get_local_path(filename)

    def file_exists(self, filename: str) -> bool:
        return self.local_fallback.file_exists(filename)

_storage_instance: Optional[BaseStorageService] = None

def get_storage_service() -> BaseStorageService:
    global _storage_instance
    if _storage_instance is None:
        if settings.STORAGE_BACKEND == "supabase" and settings.SUPABASE_URL:
            _storage_instance = SupabaseStorageService()
        else:
            _storage_instance = LocalStorageService()
    return _storage_instance
