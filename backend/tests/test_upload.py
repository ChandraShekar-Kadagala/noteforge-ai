import io
import pytest
from PIL import Image

def generate_test_image_bytes(format="PNG", width=120, height=80, color=(66, 133, 244)) -> bytes:
    img = Image.new("RGB", (width, height), color=color)
    buf = io.BytesIO()
    img.save(buf, format=format)
    return buf.getvalue()

def test_upload_image_unauthorized(client):
    png_bytes = generate_test_image_bytes()
    resp = client.post(
        "/api/upload/image",
        files={"file": ("test.png", png_bytes, "image/png")}
    )
    assert resp.status_code == 401

def test_upload_invalid_mime_type(client, auth_headers):
    resp = client.post(
        "/api/upload/image",
        files={"file": ("script.sh", b"#!/bin/bash\necho hack", "text/plain")},
        headers=auth_headers
    )
    assert resp.status_code == 400
    assert "Unsupported file type" in resp.json()["detail"]

def test_upload_corrupt_image(client, auth_headers):
    resp = client.post(
        "/api/upload/image",
        files={"file": ("fake.png", b"\x89PNG\r\n\x1a\ncorruptpayloadhere", "image/png")},
        headers=auth_headers
    )
    assert resp.status_code == 400
    assert "not a valid or readable image" in resp.json()["detail"]

def test_successful_image_upload_and_retrieval(client, auth_headers):
    png_bytes = generate_test_image_bytes(format="PNG", width=200, height=150)
    
    upload_resp = client.post(
        "/api/upload/image",
        files={"file": ("architecture_diagram.png", png_bytes, "image/png")},
        headers=auth_headers
    )
    assert upload_resp.status_code == 200
    data = upload_resp.json()
    assert data["url"].startswith("/api/media/")
    assert data["width"] == 200
    assert data["height"] == 150
    assert data["format"] == "png"
    assert data["size_bytes"] == len(png_bytes)

    # Now retrieve media
    filename = data["filename"]
    get_resp = client.get(f"/api/media/{filename}")
    assert get_resp.status_code == 200
    assert get_resp.headers["content-type"] == "image/png"
    assert "Cache-Control" in get_resp.headers
    assert len(get_resp.content) == len(png_bytes)

def test_media_path_traversal_protection(client):
    resp = client.get("/api/media/../../etc/passwd")
    assert resp.status_code in [400, 404]

def test_media_nonexistent_returns_404(client):
    resp = client.get("/api/media/nonexistent_file_99999.png")
    assert resp.status_code == 404
