import pytest

def test_create_and_get_document(client, auth_headers):
    # 1. Create document
    create_res = client.post("/api/documents", headers=auth_headers, json={
        "title": "HTML Fundamentals",
        "subject": "Web Development",
        "summary": "Core structural markup for modern web apps",
        "tags": ["html", "frontend"]
    })
    assert create_res.status_code == 201
    doc_data = create_res.json()
    doc_id = doc_data["id"]
    assert doc_data["title"] == "HTML Fundamentals"
    assert doc_data["current_version"] == 1

    # 2. Get document detail
    get_res = client.get(f"/api/documents/{doc_id}", headers=auth_headers)
    assert get_res.status_code == 200
    detail = get_res.json()
    assert detail["id"] == doc_id
    assert detail["title"] == "HTML Fundamentals"
    assert detail["versions_count"] == 1

def test_document_ownership_enforcement(client, auth_headers, other_auth_headers):
    # User A creates a document
    create_res = client.post("/api/documents", headers=auth_headers, json={
        "title": "Alice Private Document",
        "subject": "Confidential Notes"
    })
    assert create_res.status_code == 201
    doc_id = create_res.json()["id"]

    # User B attempts to read User A's document -> Forbidden 403
    forbidden_get = client.get(f"/api/documents/{doc_id}", headers=other_auth_headers)
    assert forbidden_get.status_code == 403

    # User B attempts to update User A's document -> Forbidden 403
    forbidden_put = client.put(f"/api/documents/{doc_id}", headers=other_auth_headers, json={
        "title": "Hacked Title"
    })
    assert forbidden_put.status_code == 403

    # User B attempts to delete User A's document -> Forbidden 403
    forbidden_del = client.delete(f"/api/documents/{doc_id}", headers=other_auth_headers)
    assert forbidden_del.status_code == 403

def test_update_and_duplicate_document(client, auth_headers):
    # Create doc
    create_res = client.post("/api/documents", headers=auth_headers, json={
        "title": "JavaScript Basics",
        "subject": "Programming"
    })
    doc_id = create_res.json()["id"]

    # Update metadata
    update_res = client.put(f"/api/documents/{doc_id}", headers=auth_headers, json={
        "title": "Modern JavaScript ES6+",
        "subject": "Full-Stack Development"
    })
    assert update_res.status_code == 200
    assert update_res.json()["title"] == "Modern JavaScript ES6+"

    # Duplicate document
    dup_res = client.post(f"/api/documents/{doc_id}/duplicate", headers=auth_headers)
    assert dup_res.status_code == 200
    dup_data = dup_res.json()
    assert "Copy" in dup_data["title"]
    assert dup_data["id"] != doc_id

def test_delete_document(client, auth_headers):
    create_res = client.post("/api/documents", headers=auth_headers, json={
        "title": "Temporary Scratchpad",
        "subject": "Testing"
    })
    doc_id = create_res.json()["id"]

    # Delete
    del_res = client.delete(f"/api/documents/{doc_id}", headers=auth_headers)
    assert del_res.status_code == 204

    # Verify 404
    verify_res = client.get(f"/api/documents/{doc_id}", headers=auth_headers)
    assert verify_res.status_code == 404
