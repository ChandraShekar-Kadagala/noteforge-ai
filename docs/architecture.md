# NoteForge AI — System Architecture

## Overview
NoteForge AI is a high-performance personal documentation workspace built for continuous educational learning. Users paste raw educational text, challenges, or tutorials (such as from freeCodeCamp, documentation, or blog articles), which NoteForge AI transforms into structured, syntax-highlighted, callout-rich study documents. Most importantly, users can append subsequent lessons day after day without losing previous notes through a non-destructive continuous merge engine.

---

## High-Level Topology

```
+-------------------------------------------------------------+
|                      Client Browser                         |
|   React 18 + TypeScript + Vite + Tailwind CSS + PrismJS     |
|   LandingPage / Auth / Dashboard / 3-Panel Workspace        |
+------------------------------+------------------------------+
                               |
                        HTTP / JSON APIs
                               |
+------------------------------v------------------------------+
|                    FastAPI Backend Service                  |
|                                                             |
|  [/api/auth]      - JWT authentication & OAuth handling    |
|  [/api/documents] - Strict document CRUD & versions         |
|  [/api/ai]        - AI structuring & continuous merge       |
|  [/api/export]    - Microsoft Word (.docx) & PDF generation|
|                                                             |
|  Internal Engines:                                          |
|  - Continuous Section Merge Engine (Jaccard & Slug matching)|
|  - BaseAIService Interface (Gemini + Offline Mock Fallback) |
|  - DOCX Engine (python-docx with XML custom cell styling)   |
|  - PDF Engine (xhtml2pdf with @page layout & CSS styling)   |
+------------------------------+------------------------------+
                               |
                        PostgreSQL 15
                               |
+------------------------------v------------------------------+
|                    Relational Database                      |
|  - users: User profiles & auth providers                   |
|  - documents: Document root records & ownership metadata    |
|  - document_sections: Stable-key sections & rich blocks     |
|  - document_versions: Immutable full-history snapshots      |
|  - processing_jobs: Async and batch job tracking            |
+-------------------------------------------------------------+
```

---

## Key Subsystems

### 1. Continuous Merge Engine (`app/services/merge_engine.py`)
- **Stable Keying**: Each section receives a stable slug identifier (e.g. `html_elements_intro`, `py_functions_scope`).
- **Duplicate Detection**: Calculates Jaccard similarity and token overlap between incoming raw lessons and existing sections. Sections exceeding 70% similarity trigger duplicate warnings.
- **Topical Placement**: Suggests optimal insertion locations (e.g., directly after a related topic, or before the summary takeaways).
- **Non-Destructive Persistence**: Existing sections remain unchanged unless explicitly overwritten by user decision.

### 2. Provider-Independent AI Architecture (`app/services/ai_service.py`)
- Standardized `BaseAIService` abstract interface.
- `GeminiAIService`: Calls Google Gemini REST API using structured JSON mode.
- `MockAIService`: Offline parser extracting headings, code snippets, definitions, and practice callouts with zero cost or internet dependency.

### 3. Dual-Format Document Export (`app/services/export_docx.py`, `app/services/export_pdf.py`)
- Word (.docx): Generated with `python-docx` using custom XML shading (`w:shd`) and borders (`w:tcBorders`) for callouts and monospace code boxes.
- PDF: Pure-Python HTML-to-PDF rendering using `xhtml2pdf` with `@page` running headers, footers, and page numbers.
