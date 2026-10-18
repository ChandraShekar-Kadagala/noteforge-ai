import io
import os
import re
import base64
from typing import Optional, Tuple
from PIL import Image

from app.config import settings
from app.services.storage_service import get_storage_service
from app.utils.logger import logger

def resolve_image_data(src: str) -> Optional[Tuple[str, bytes, str, int, int]]:
    """
    Resolves an image source (relative media path, base64 data URI, or file path)
    into:
      - mime_type (e.g. 'image/png')
      - raw_bytes
      - base64_uri (e.g. 'data:image/png;base64,...')
      - width (int)
      - height (int)
    Returns None if the image cannot be found or decoded safely.
    """
    if not src:
        return None

    try:
        # Case 1: Base64 data URI
        if src.startswith("data:image/"):
            match = re.match(r"^data:(image\/[a-zA-Z0-9\+\-\.]+);base64,(.+)$", src)
            if match:
                mime_type = match.group(1).lower()
                b64_data = match.group(2)
                raw_bytes = base64.b64decode(b64_data)
                img = Image.open(io.BytesIO(raw_bytes))
                w, h = img.size
                return mime_type, raw_bytes, src, w, h

        # Case 2: Media URL /api/media/{filename} or /uploads/{filename}
        if "/api/media/" in src or "/uploads/" in src:
            if "/api/media/" in src:
                filename = src.split("/api/media/")[-1].split("?")[0]
            else:
                filename = src.split("/uploads/")[-1].split("?")[0]
            safe_filename = os.path.basename(filename)
            storage = get_storage_service()
            raw_bytes = storage.get_file_bytes(safe_filename)
            if raw_bytes:
                img = Image.open(io.BytesIO(raw_bytes))
                w, h = img.size
                fmt = (img.format or "PNG").lower()
                mime_type = f"image/{fmt}"
                b64 = base64.b64encode(raw_bytes).decode("ascii")
                data_uri = f"data:{mime_type};base64,{b64}"
                return mime_type, raw_bytes, data_uri, w, h

        # Case 3: Remote URL (http:// or https://)
        if src.startswith("http://") or src.startswith("https://"):
            try:
                import httpx
                resp = httpx.get(src, timeout=6.0, follow_redirects=True)
                if resp.status_code == 200 and resp.content:
                    raw_bytes = resp.content
                    img = Image.open(io.BytesIO(raw_bytes))
                    w, h = img.size
                    fmt = (img.format or "PNG").lower()
                    mime_type = f"image/{fmt}"
                    b64 = base64.b64encode(raw_bytes).decode("ascii")
                    data_uri = f"data:{mime_type};base64,{b64}"
                    return mime_type, raw_bytes, data_uri, w, h
            except Exception as net_err:
                logger.warning(f"Failed to fetch remote image '{src}': {net_err}")

        # Case 4: Direct local file path
        if os.path.isfile(src):
            with open(src, "rb") as f:
                raw_bytes = f.read()
            img = Image.open(io.BytesIO(raw_bytes))
            w, h = img.size
            fmt = (img.format or "PNG").lower()
            mime_type = f"image/{fmt}"
            b64 = base64.b64encode(raw_bytes).decode("ascii")
            data_uri = f"data:{mime_type};base64,{b64}"
            return mime_type, raw_bytes, data_uri, w, h

    except Exception as e:
        logger.warning(f"Failed to resolve image '{src}': {e}")

    return None
