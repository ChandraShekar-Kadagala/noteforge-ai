import io
import os
import re
import uuid
from typing import Optional
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from fastapi.responses import FileResponse
from pydantic import BaseModel, HttpUrl
import httpx
from PIL import Image

from app.config import settings
from app.models.user import User
from app.services.auth_service import get_current_user
from app.utils.logger import logger

router = APIRouter(tags=["Media & Uploads"])

ALLOWED_MIME_TYPES = {
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/webp": "webp",
    "image/gif": "gif"
}

def get_images_dir() -> str:
    images_dir = os.path.join(settings.UPLOAD_DIR, "images")
    os.makedirs(images_dir, exist_ok=True)
    return images_dir

class ImageUploadResponse(BaseModel):
    url: str
    filename: str
    width: int
    height: int
    format: str
    size_bytes: int

class FetchExternalImageRequest(BaseModel):
    url: str

@router.post("/api/upload/image", response_model=ImageUploadResponse)
async def upload_image(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    if not file.content_type or file.content_type.lower() not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file type. Allowed formats: PNG, JPEG, WebP, GIF."
        )

    # Read bytes with size protection
    contents = await file.read()
    if len(contents) > settings.MAX_UPLOAD_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File exceeds maximum allowed size of {settings.MAX_UPLOAD_SIZE_BYTES // (1024 * 1024)}MB."
        )

    # Verify image integrity using Pillow
    try:
        raw_io = io.BytesIO(contents)
        img = Image.open(raw_io)
        img.verify()
        
        # Re-open for metadata inspection
        img = Image.open(io.BytesIO(contents))
        width, height = img.size
        img_format = (img.format or "PNG").lower()
    except Exception as e:
        logger.warning(f"Corrupt or invalid image uploaded by {current_user.email}: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The uploaded file is not a valid or readable image."
        )

    # Generate secure, collision-free filename
    ext = ALLOWED_MIME_TYPES.get(file.content_type.lower(), img_format)
    token = uuid.uuid4().hex[:12]
    original_stem = os.path.splitext(file.filename or "image")[0]
    safe_stem = re.sub(r"[^a-zA-Z0-9_\-]", "", original_stem)[:24] or "img"
    filename = f"{token}_{safe_stem}.{ext}"

    # Persist to disk
    dest_path = os.path.join(get_images_dir(), filename)
    with open(dest_path, "wb") as f:
        f.write(contents)

    logger.info(f"Image uploaded successfully: {filename} ({len(contents)} bytes) by {current_user.email}")

    return ImageUploadResponse(
        url=f"/api/media/{filename}",
        filename=filename,
        width=width,
        height=height,
        format=img_format,
        size_bytes=len(contents)
    )

@router.post("/api/upload/fetch-external", response_model=ImageUploadResponse)
async def fetch_external_image(
    req: FetchExternalImageRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Downloads an external image from a public URL and caches it locally
    for high reliability and offline export support.
    """
    try:
        async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as client:
            resp = await client.get(req.url)
            if resp.status_code != 200:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Failed to fetch image from external URL (status {resp.status_code})."
                )
            contents = resp.content
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error downloading image from URL: {str(e)}"
        )

    if len(contents) > settings.MAX_UPLOAD_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="External image exceeds 5MB size limit."
        )

    try:
        img = Image.open(io.BytesIO(contents))
        img.verify()
        img = Image.open(io.BytesIO(contents))
        width, height = img.size
        img_format = (img.format or "PNG").lower()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The downloaded content is not a valid image."
        )

    ext = "jpg" if img_format == "jpeg" else img_format
    token = uuid.uuid4().hex[:12]
    filename = f"ext_{token}.{ext}"
    dest_path = os.path.join(get_images_dir(), filename)
    with open(dest_path, "wb") as f:
        f.write(contents)

    return ImageUploadResponse(
        url=f"/api/media/{filename}",
        filename=filename,
        width=width,
        height=height,
        format=img_format,
        size_bytes=len(contents)
    )

@router.get("/api/media/{filename}")
async def get_media_file(filename: str):
    # Guard against directory traversal attacks
    if os.path.basename(filename) != filename or ".." in filename:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid filename.")

    file_path = os.path.join(get_images_dir(), filename)
    if not os.path.isfile(file_path):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Image not found.")

    ext = os.path.splitext(filename)[1].lower().lstrip(".")
    mime_type = "image/png"
    if ext in ["jpg", "jpeg"]:
        mime_type = "image/jpeg"
    elif ext == "webp":
        mime_type = "image/webp"
    elif ext == "gif":
        mime_type = "image/gif"

    return FileResponse(
        path=file_path,
        media_type=mime_type,
        headers={"Cache-Control": "public, max-age=86400"}
    )
