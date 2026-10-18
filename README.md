# NoteForge AI

> **Personal AI-Powered Documentation Workspace**  
> Transform raw educational content into structured, syntax-highlighted study notes—and continue adding new lessons over subsequent days without losing previous notes.

[![Docker Compose](https://img.shields.io/badge/Docker%20Compose-Ready-blue.svg)](docker-compose.yml)
[![FastAPI](https://img.shields.io/badge/FastAPI-1.0-009688.svg)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18-61DAFB.svg)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-3178C6.svg)](https://www.typescriptlang.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-336791.svg)](https://www.postgresql.org)
[![Tests](https://img.shields.io/badge/Tests-14%20Passed-brightgreen.svg)](backend/tests)

---

## Key Features

- **Continuous Document Workflow**: Paste new lessons on subsequent days. The section merge engine detects duplicates and places new content without overwriting existing notes.
- **Provider-Independent AI**: Configured with Google Gemini API free-tier with an offline fallback parser for offline test resilience.
- **Structured Visual Design**: Custom definition callouts, warning boxes, comparison tables, and multi-language syntax highlighting (Python, JavaScript, HTML, CSS, SQL, Bash, C++, Java, etc.).
- **Authentic Word (.docx) & PDF Export**: Downloads clean, styled Word documents and PDF study guides with running headers, footers, and page numbers.
- **Strict Data Ownership**: Every document operation enforces cryptographic JWT ownership verification.
- **Version History & Rollback**: Browse previous snapshot revisions and restore earlier versions with one click.
- **Dockerized Environment**: Full multi-container stack (`db`, `backend`, `frontend`) with persistent database storage and health checks.

---

## Quick Start (Docker)

```bash
# Clone the repository
git clone <repo-url> noteforge-ai
cd noteforge-ai

# Configure environment
cp .env.example .env

# Start the stack
docker compose up --build -d
```

- **Frontend App**: [http://localhost:5173](http://localhost:5173)
- **Backend API & Swagger**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **API Health Check**: [http://localhost:8000/api/health](http://localhost:8000/api/health)

---

## Continuous Document Editing Workflow

1. **Initial Creation**:
   - Create a document named `"HTML Fundamentals"`.
   - Paste Lesson 1 (e.g. elements, tags, document structure).
   - Click **Organize Content** to preview and save Version 1.
2. **Next Day Addition**:
   - Reopen `"HTML Fundamentals"`.
   - Paste Lesson 2 (e.g. forms, inputs, submit buttons).
   - The merge engine identifies overlapping concepts, highlights duplicate warnings, and suggests topical placements.
   - Click **Confirm & Commit Merge** to save Version 2.
   - **All existing sections, code blocks, and callouts survive intact.**

---

## Automated Test Results

The backend test suite verifies authentication, ownership security, continuous document merge, and file exports:

```bash
backend\.venv\Scripts\python -m pytest backend/tests -v
```

```
backend/tests/test_ai_merge.py::test_initial_content_organization PASSED [  7%]
backend/tests/test_ai_merge.py::test_continuous_editing_workflow PASSED  [ 14%]
backend/tests/test_auth.py::test_register_success PASSED                 [ 21%]
backend/tests/test_auth.py::test_register_duplicate_email PASSED         [ 28%]
backend/tests/test_auth.py::test_login_success PASSED                    [ 35%]
backend/tests/test_auth.py::test_login_invalid_password PASSED           [ 42%]
backend/tests/test_auth.py::test_get_current_user_me PASSED              [ 50%]
backend/tests/test_auth.py::test_unauthorized_access PASSED              [ 57%]
backend/tests/test_auth.py::test_social_auth_login PASSED                [ 64%]
backend/tests/test_documents.py::test_create_and_get_document PASSED     [ 71%]
backend/tests/test_documents.py::test_document_ownership_enforcement PASSED [ 78%]
backend/tests/test_documents.py::test_update_and_duplicate_document PASSED [ 85%]
backend/tests/test_documents.py::test_delete_document PASSED             [ 92%]
backend/tests/test_export.py::test_export_docx_and_pdf PASSED            [100%]
======================== 14 passed in 7.01s ========================
```

---

## Documentation

- [Architecture & Overview](docs/architecture.md)
- [Database & Schema](docs/database.md)
- [Authentication & Ownership](docs/authentication.md)
- [AI Structuring & Merge Pipeline](docs/ai-pipeline.md)
- [DOCX & PDF Export Pipeline](docs/export-pipeline.md)
- [Local Development Guide](docs/development.md)
- [Production Deployment Guide](docs/deployment.md)

---

## License
MIT License.
