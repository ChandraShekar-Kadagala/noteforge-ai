# NoteForge AI — Database Design & Schema

## Overview
NoteForge AI uses PostgreSQL 15 for relational consistency, data integrity, and strict ownership enforcement across documents and version history.

---

## Entity Relationship Diagram

```
+------------------------------------------------------------+
|                          users                             |
+------------------------------------------------------------+
| id: VARCHAR(36) [PK]                                       |
| email: VARCHAR(255) [UNIQUE, INDEX]                        |
| hashed_password: VARCHAR(255) [NULLABLE]                   |
| full_name: VARCHAR(255)                                    |
| avatar_url: VARCHAR(512)                                   |
| auth_provider: VARCHAR(50)                                 |
| is_active: BOOLEAN                                         |
| created_at: TIMESTAMP WITH TIME ZONE                       |
| updated_at: TIMESTAMP WITH TIME ZONE                       |
+-----------------------------+------------------------------+
                              | 1
                              |
                              | N (CASCADE DELETE)
+-----------------------------v------------------------------+
|                        documents                           |
+------------------------------------------------------------+
| id: VARCHAR(36) [PK]                                       |
| user_id: VARCHAR(36) [FK -> users.id, INDEX]               |
| title: VARCHAR(255) [INDEX]                                |
| subject: VARCHAR(100)                                      |
| summary: TEXT                                              |
| tags: JSON                                                 |
| current_version: INTEGER                                   |
| created_at: TIMESTAMP WITH TIME ZONE                       |
| updated_at: TIMESTAMP WITH TIME ZONE                       |
+----------------------+-----------------------------+-------+
                       | 1                           | 1
                       |                             |
                       | N (CASCADE DELETE)          | N (CASCADE DELETE)
+----------------------v-------+      +--------------v---------------+
|      document_sections       |      |      document_versions       |
+------------------------------+      +------------------------------+
| id: VARCHAR(36) [PK]         |      | id: VARCHAR(36) [PK]         |
| document_id: VARCHAR(36) [FK]|      | document_id: VARCHAR(36) [FK]|
| stable_key: VARCHAR(100)     |      | version_number: INTEGER      |
| title: VARCHAR(255)          |      | title: VARCHAR(255)          |
| section_type: VARCHAR(50)    |      | change_summary: TEXT         |
| order_index: INTEGER         |      | snapshot_data: JSON          |
| content_markdown: TEXT       |      | created_at: TIMESTAMP        |
| structured_blocks: JSON      |      +------------------------------+
| raw_source: TEXT             |
| ai_enriched: BOOLEAN         |
| created_at: TIMESTAMP        |
| updated_at: TIMESTAMP        |
+------------------------------+
```

---

## Schema Highlights

1. **Strict User Ownership**:
   Every document has an indexed `user_id` foreign key with `ON DELETE CASCADE`. Backend routes verify `doc.user_id == current_user.id` on every query.
2. **Stable Section Keys (`stable_key`)**:
   Enables the continuous merge engine to track sections across multiple days and versions without relying on fragile auto-incrementing integer IDs.
3. **Structured Blocks JSON**:
   Sections store high-fidelity presentation blocks (code samples with language labels, callout types, comparison table rows) while retaining `content_markdown` for plain text accessibility.
4. **Version Snapshots (`document_versions`)**:
   Stores an immutable JSON representation of the entire document at that version, allowing users to restore previous revisions cleanly.
5. **Database Migrations (`alembic`)**:
   Managed via Alembic in `backend/alembic/versions/`. Migrations apply automatically during startup or with `alembic upgrade head`.
