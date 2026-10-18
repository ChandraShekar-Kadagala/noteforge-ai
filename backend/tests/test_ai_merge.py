import pytest

def test_initial_content_organization(client, auth_headers):
    raw_lesson = """
# Introduction to HTML Elements
HTML elements are the building blocks of web pages. An element usually consists of a start tag and an end tag.

```html
<!DOCTYPE html>
<html>
<head>
  <title>My First Page</title>
</head>
<body>
  <h1>Hello World</h1>
  <p>This is a paragraph.</p>
</body>
</html>
```

Important: Remember that empty elements like <img> and <br> do not have closing tags!
"""
    res = client.post("/api/ai/organize", headers=auth_headers, json={
        "raw_content": raw_lesson,
        "subject": "Web Development",
        "preserve_source": True
    })
    assert res.status_code == 200
    data = res.json()
    assert len(data["sections"]) > 0
    # Check that code block was detected
    has_code = any(
        any(b["type"] == "code" for b in sec["structured_blocks"])
        for sec in data["sections"]
    )
    assert has_code

def test_continuous_editing_workflow(client, auth_headers):
    """
    Simulates Section 4:
    Day 1: Create doc, commit Day 1 lesson.
    Day 2: Paste Day 2 lesson, preview continuous merge, commit merged sections.
    Verify: Day 1 sections survived intact! Version incremented!
    """
    # 1. Day 1: Create 'HTML Fundamentals' document
    create_res = client.post("/api/documents", headers=auth_headers, json={
        "title": "HTML Fundamentals",
        "subject": "Web Development"
    })
    assert create_res.status_code == 201
    doc_id = create_res.json()["id"]

    # Commit Day 1 lesson sections
    day1_sections = [
        {
            "stable_key": "html_elements_intro",
            "title": "HTML Elements & Structure",
            "section_type": "concept",
            "order_index": 0,
            "content_markdown": "HTML elements define the document structure.",
            "structured_blocks": [
                {
                    "type": "code",
                    "data": {
                        "language": "html",
                        "code": "<p>Sample Paragraph</p>"
                    }
                }
            ],
            "ai_enriched": True
        }
    ]

    commit_day1 = client.post(f"/api/ai/merge-commit/{doc_id}", headers=auth_headers, json={
        "version_title": "Lesson 1: HTML Structure",
        "change_summary": "Added initial HTML elements foundation",
        "sections": day1_sections
    })
    assert commit_day1.status_code == 200
    doc_day1 = commit_day1.json()
    assert doc_day1["current_version"] == 2
    assert len(doc_day1["sections"]) == 1
    assert doc_day1["sections"][0]["stable_key"] == "html_elements_intro"

    # 2. Day 2: User pastes another lesson (HTML Forms)
    day2_raw = """
# HTML Forms and Inputs
HTML forms collect user inputs on web applications.

```html
<form action="/submit" method="POST">
  <label for="username">Username:</label>
  <input type="text" id="username" name="username">
  <button type="submit">Submit</button>
</form>
```

Note: Always associate labels with inputs using matching for and id attributes for accessibility.
"""
    preview_res = client.post("/api/ai/merge-preview", headers=auth_headers, json={
        "document_id": doc_id,
        "raw_content": day2_raw,
        "preserve_source": False
    })
    assert preview_res.status_code == 200
    preview_data = preview_res.json()
    assert len(preview_data["existing_sections"]) == 1
    assert len(preview_data["proposed_sections"]) > 0

    # 3. Commit the merged document with both Day 1 and Day 2 sections
    merged_sections = [
        # Preserved Day 1 section
        day1_sections[0],
        # Appended Day 2 section
        {
            "stable_key": "html_forms_inputs",
            "title": "HTML Forms and Inputs",
            "section_type": "concept",
            "order_index": 1,
            "content_markdown": "Forms collect user data and handle submissions.",
            "structured_blocks": [
                {
                    "type": "code",
                    "data": {
                        "language": "html",
                        "code": "<form><input type='text'></form>"
                    }
                }
            ],
            "ai_enriched": True
        }
    ]

    commit_day2 = client.post(f"/api/ai/merge-commit/{doc_id}", headers=auth_headers, json={
        "version_title": "Lesson 2: HTML Forms",
        "change_summary": "Appended Forms and Inputs while preserving HTML Structure",
        "sections": merged_sections
    })
    assert commit_day2.status_code == 200
    doc_day2 = commit_day2.json()
    
    # 4. CRITICAL VERIFICATION:
    # Version incremented to 3
    assert doc_day2["current_version"] == 3
    # BOTH Day 1 and Day 2 sections are present!
    assert len(doc_day2["sections"]) == 2
    sec_keys = [s["stable_key"] for s in doc_day2["sections"]]
    assert "html_elements_intro" in sec_keys
    assert "html_forms_inputs" in sec_keys

    # Check version history
    versions_res = client.get(f"/api/documents/{doc_id}/versions", headers=auth_headers)
    assert versions_res.status_code == 200
    versions = versions_res.json()
    assert len(versions) == 3

    # Test restoring Version 2 (rolls back to Day 1 only)
    restore_res = client.post(f"/api/documents/{doc_id}/versions/restore", headers=auth_headers, json={
        "version_number": 2
    })
    assert restore_res.status_code == 200
    restored_doc = restore_res.json()
    assert restored_doc["current_version"] == 4
    assert len(restored_doc["sections"]) == 1
    assert restored_doc["sections"][0]["stable_key"] == "html_elements_intro"
