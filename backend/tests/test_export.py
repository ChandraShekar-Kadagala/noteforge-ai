import pytest

def test_export_docx_and_pdf(client, auth_headers, other_auth_headers):
    # 1. Create document with rich sections and code blocks
    create_res = client.post("/api/documents", headers=auth_headers, json={
        "title": "Python Data Structures",
        "subject": "Computer Science"
    })
    doc_id = create_res.json()["id"]

    sections = [
        {
            "stable_key": "py_lists_dicts",
            "title": "Lists and Dictionaries",
            "section_type": "concept",
            "order_index": 0,
            "content_markdown": "Python lists are ordered, mutable sequences. Dictionaries store key-value pairs.",
            "structured_blocks": [
                {
                    "type": "code",
                    "data": {
                        "language": "python",
                        "code": "users = [{'name': 'Alice'}, {'name': 'Bob'}]\nprint(f'Total users: {len(users)}')"
                    }
                },
                {
                    "type": "callout",
                    "data": {
                        "callout_type": "important",
                        "title": "Complexity Note",
                        "body": "Dictionary lookups have O(1) average time complexity."
                    }
                },
                {
                    "type": "table",
                    "data": {
                        "headers": ["Type", "Mutability", "Syntax"],
                        "rows": [
                            ["List", "Mutable", "[1, 2, 3]"],
                            ["Tuple", "Immutable", "(1, 2, 3)"],
                            ["Dict", "Mutable", "{'k': 'v'}"]
                        ]
                    }
                }
            ],
            "ai_enriched": True
        }
    ]

    client.post(f"/api/ai/merge-commit/{doc_id}", headers=auth_headers, json={
        "version_title": "Lesson 1: Collections",
        "sections": sections
    })

    # 2. Test DOCX Export
    docx_res = client.get(f"/api/export/{doc_id}/docx", headers=auth_headers)
    assert docx_res.status_code == 200
    assert "application/vnd.openxmlformats-officedocument.wordprocessingml.document" in docx_res.headers["content-type"]
    assert len(docx_res.content) > 1000  # valid docx file has meaningful size
    assert "Python_Data_Structures_v2.docx" in docx_res.headers["content-disposition"]

    # 3. Test PDF Export
    pdf_res = client.get(f"/api/export/{doc_id}/pdf", headers=auth_headers)
    assert pdf_res.status_code == 200
    assert "application/pdf" in pdf_res.headers["content-type"]
    assert len(pdf_res.content) > 1000
    assert pdf_res.content.startswith(b"%PDF")  # Valid PDF header
    assert "Python_Data_Structures_v2.pdf" in pdf_res.headers["content-disposition"]

    # 4. Ownership check: User B cannot export User A's document
    forbidden_docx = client.get(f"/api/export/{doc_id}/docx", headers=other_auth_headers)
    assert forbidden_docx.status_code == 403

    forbidden_pdf = client.get(f"/api/export/{doc_id}/pdf", headers=other_auth_headers)
    assert forbidden_pdf.status_code == 403

def test_export_with_images_and_markdown_tables(client, auth_headers):
    # Upload test image
    from tests.test_upload import generate_test_image_bytes
    img_bytes = generate_test_image_bytes(format="PNG", width=160, height=90)
    upload_res = client.post(
        "/api/upload/image",
        files={"file": ("diagram.png", img_bytes, "image/png")},
        headers=auth_headers
    )
    assert upload_res.status_code == 200
    media_url = upload_res.json()["url"]

    # Create document
    create_res = client.post("/api/documents", headers=auth_headers, json={
        "title": "HTML5 Semantic Elements",
        "subject": "Web Development"
    })
    doc_id = create_res.json()["id"]

    # Markdown content containing markdown tables, images, and lists
    markdown_content = f"""
Here is the architecture overview of semantic HTML:

![HTML5 Architecture]({media_url})

### Element Comparison
| Tag | Purpose | Semantic Meaning |
|---|---|---|
| `<main>` | Core body | Unique content of document |
| `<section>` | Topic section | Thematic grouping of content |
| `<div>` | Generic container | Stylistic wrapper with no semantics |

Key points:
- Use section when heading applies
- Do not use section as a styling wrapper
- Ensure every section has a descriptive title
"""

    sections = [
        {
            "stable_key": "html_semantics",
            "title": "Semantic Layout",
            "section_type": "concept",
            "order_index": 0,
            "content_markdown": markdown_content.strip(),
            "structured_blocks": [
                {
                    "type": "image",
                    "data": {
                        "url": media_url,
                        "caption": "Figure 1: Document Tree Diagram"
                    }
                }
            ],
            "ai_enriched": True
        }
    ]

    client.post(f"/api/ai/merge-commit/{doc_id}", headers=auth_headers, json={
        "version_title": "Lesson: HTML5 Semantics",
        "sections": sections
    })

    # Test DOCX Export
    docx_res = client.get(f"/api/export/{doc_id}/docx", headers=auth_headers)
    assert docx_res.status_code == 200
    assert len(docx_res.content) > 2000

    # Test PDF Export
    pdf_res = client.get(f"/api/export/{doc_id}/pdf", headers=auth_headers)
    assert pdf_res.status_code == 200
    assert pdf_res.content.startswith(b"%PDF")
    assert len(pdf_res.content) > 2000
