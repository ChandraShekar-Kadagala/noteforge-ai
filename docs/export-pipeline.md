# NoteForge AI — Export Pipeline (DOCX & PDF)

## Overview
NoteForge AI provides authentic, publication-quality downloads of the active saved document in both Microsoft Word (.docx) and Portable Document Format (.pdf).

---

## 1. Word (.docx) Export Pipeline (`app/services/export_docx.py`)

Generated using `python-docx` directly in memory without writing temporary files to disk.

### Features:
- **Consistent Page Layout**: Standard 1.0-inch margins on all sides.
- **Running Headers & Footers**: Header displays document title; footer displays version number and page metadata.
- **Typographic Hierarchy**: Bold Title (24pt Arial), Subtitle (11pt Slate), Section Headings (16pt Bold Arial), and Sub-headings (12.5pt Bold Arial).
- **Code Blocks**: Formatted inside single-cell tables with light slate background shading (`#F1F5F9`), left indigo accent border (`#6366F1`), and monospaced Courier New font preserving indentation.
- **Visual Callouts**: Single-cell tables with color-coded left borders (Red for warnings, Blue for important concepts, Green for tips) and soft tinted background shading.
- **Comparison Tables**: Multi-column tables with bold header row and alternating zebra striping (`#F8FAFC`).

---

## 2. PDF Export Pipeline (`app/services/export_pdf.py`)

Rendered using `xhtml2pdf` (pisa) for 100% pure-Python cross-platform rendering (no system-level GTK dependencies or headless browser overhead).

### Features:
- **Print CSS Layout**: Clean `@page` rules defining Letter portrait dimensions and 2cm margins.
- **Dynamic Running Counters**: `@bottom-center { content: "Page " counter(page) " of " counter(pages); }`.
- **Syntax Styling**: Dark theme terminal boxes (`#0F172A`) with uppercase language badges (`#818CF8`) and white-space preservation.
- **Page Break Hygiene**: Prevents overflowing tables and ensures graceful handling of long conceptual chapters.

---

## Verification & Downloads
- **Streaming Response**: Endpoints stream the document directly using `StreamingResponse` with appropriate `Content-Type` and sanitized `Content-Disposition: attachment; filename="{Title}_v{Version}.{ext}"` headers.
- **Ownership Check**: Export routes verify the authenticated user's ownership of the requested document before generating any file bytes.
