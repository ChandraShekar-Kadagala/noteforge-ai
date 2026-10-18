import pytest
from app.services.document_intelligence import DocumentIntelligence

def test_document_intelligence_filters_sandbox_and_gutters():
    raw_snippet = """
freeCodeCamp - HTML Elements

1
2
3
4
5
6

Open Sandbox
Reset Code

## Understanding Div and Section
The <div> element is a generic container.
The <section> element represents a standalone section.

index.html
```html
<div>
  <h1>Hello NoteForge</h1>
</div>
```

Run Tests
    """
    res = DocumentIntelligence.clean_raw_content(raw_snippet)
    
    # Check that UI buttons were stripped
    assert "Open Sandbox" not in res.cleaned_content
    assert "Reset Code" not in res.cleaned_content
    assert "Run Tests" not in res.cleaned_content

    # Check that line gutter numbers were filtered
    for n in ["\n1\n", "\n2\n", "\n3\n", "\n4\n", "\n5\n", "\n6\n"]:
        assert n not in res.cleaned_content

    # Check that tab index.html was converted to metadata
    assert "<!-- Tab: index.html -->" in res.cleaned_content

    # Check title inference
    assert res.inferred_title is not None
    assert "Topic 1" not in res.inferred_title
    assert "HTML Elements" in res.inferred_title

    # Check artefacts log
    artefact_types = [a.artefact_type for a in res.detected_artefacts]
    assert "ui_button" in artefact_types
    assert "line_gutter" in artefact_types
    assert "editor_tab" in artefact_types

def test_document_intelligence_strips_oauth_scripts():
    raw_with_oauth = """
# Modern Web Authentication

<script async defer src="https://accounts.google.com/gsi/client"></script>
<div id="g_id_onload" data-client_id="dummy-google-client-id"></div>

JWT tokens are commonly used for stateless authentication.
    """
    res = DocumentIntelligence.clean_raw_content(raw_with_oauth)
    assert "accounts.google.com" not in res.cleaned_content
    assert "g_id_onload" not in res.cleaned_content
    assert "Modern Web Authentication" in res.cleaned_content
    assert any(a.artefact_type == "tracking_script" for a in res.detected_artefacts)

def test_document_intelligence_infer_section_title():
    # Never generic 'Topic N'
    title1 = DocumentIntelligence.infer_section_title("<div> and <section> Elements\nUse div for layout.", 0)
    assert "Topic" not in title1
    assert "div" in title1.lower()

    title2 = DocumentIntelligence.infer_section_title("def calculate_fibonacci(n):\n    return 0", 1)
    assert "calculate_fibonacci" in title2

    title3 = DocumentIntelligence.infer_section_title("### Asynchronous Programming in Python\nasync def main():", 2)
    assert title3 == "Asynchronous Programming in Python"
