import io
import html
import re
from xhtml2pdf import pisa
from app.models.document import Document
from fastapi import HTTPException, status
from app.utils.logger import logger

PDF_HTML_TEMPLATE = """<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
    @page {
        size: letter portrait;
        margin: 2cm;
        @top-right {
            content: "NoteForge AI";
            font-family: Helvetica, Arial, sans-serif;
            font-size: 8pt;
            color: #64748b;
        }
        @bottom-center {
            content: "Page " counter(page) " of " counter(pages);
            font-family: Helvetica, Arial, sans-serif;
            font-size: 8pt;
            color: #64748b;
        }
    }
    body {
        font-family: Helvetica, Arial, sans-serif;
        font-size: 10pt;
        line-height: 1.5;
        color: #1e293b;
    }
    h1 {
        font-size: 22pt;
        color: #0f172a;
        margin-bottom: 4px;
        font-weight: bold;
    }
    .subtitle {
        font-size: 10pt;
        color: #64748b;
        margin-bottom: 15px;
    }
    .summary-box {
        background-color: #f8fafc;
        border-left: 3px solid #6366f1;
        padding: 8px 12px;
        margin-bottom: 20px;
        font-style: italic;
        color: #334155;
    }
    .divider {
        border-bottom: 1px solid #e2e8f0;
        margin-bottom: 20px;
    }
    h2 {
        font-size: 14pt;
        color: #1e293b;
        margin-top: 18px;
        margin-bottom: 6px;
        border-bottom: 1px solid #f1f5f9;
        padding-bottom: 4px;
    }
    h3 {
        font-size: 11.5pt;
        color: #334155;
        margin-top: 10px;
        margin-bottom: 4px;
    }
    p {
        margin-top: 0;
        margin-bottom: 8px;
    }
    ul, ol {
        margin-top: 2px;
        margin-bottom: 8px;
        padding-left: 20px;
    }
    li {
        margin-bottom: 3px;
    }
    .code-container {
        background-color: #0f172a;
        color: #e2e8f0;
        border-radius: 4px;
        padding: 8px 12px;
        margin: 10px 0;
        font-family: 'Courier New', Courier, monospace;
        font-size: 8.5pt;
    }
    .code-badge {
        color: #818cf8;
        font-weight: bold;
        font-size: 7.5pt;
        text-transform: uppercase;
        margin-bottom: 4px;
    }
    pre {
        margin: 0;
        white-space: pre-wrap;
        word-break: break-all;
    }
    .callout {
        padding: 8px 12px;
        margin: 10px 0;
        border-left: 4px solid #3b82f6;
        background-color: #eff6ff;
    }
    .callout-warning {
        border-left-color: #ef4444;
        background-color: #fef2f2;
    }
    .callout-tip {
        border-left-color: #10b981;
        background-color: #f0fdf4;
    }
    .callout-title {
        font-weight: bold;
        font-size: 9pt;
        margin-bottom: 2px;
    }
    table.data-table {
        width: 100%;
        border-collapse: collapse;
        margin: 10px 0;
        font-size: 9pt;
    }
    table.data-table th {
        background-color: #f1f5f9;
        color: #1e293b;
        font-weight: bold;
        padding: 6px 8px;
        border: 1px solid #cbd5e1;
        text-align: left;
    }
    table.data-table td {
        padding: 5px 8px;
        border: 1px solid #e2e8f0;
    }
</style>
</head>
<body>
    <h1>{{TITLE}}</h1>
    <div class="subtitle">Subject: {{SUBJECT}} &nbsp;&bull;&nbsp; Version: {{VERSION}} &nbsp;&bull;&nbsp; NoteForge AI</div>
    {{SUMMARY_HTML}}
    <div class="divider"></div>
    {{SECTIONS_HTML}}
</body>
</html>
"""

def generate_pdf_stream(doc: Document) -> io.BytesIO:
    summary_html = ""
    if doc.summary:
        summary_html = f'<div class="summary-box">{html.escape(doc.summary)}</div>'

    sections_html = []
    for s_idx, sec in enumerate(doc.sections):
        sec_title = f"{s_idx + 1}. {html.escape(sec.title)}"
        sec_parts = [f"<h2>{sec_title}</h2>"]

        if sec.content_markdown:
            for line in sec.content_markdown.splitlines():
                l_str = line.strip()
                if not l_str:
                    continue
                if l_str.startswith("#"):
                    sub_text = re.sub(r"^#+\s*", "", l_str)
                    sec_parts.append(f"<h3>{html.escape(sub_text)}</h3>")
                elif l_str.startswith("- ") or l_str.startswith("* "):
                    sec_parts.append(f"<ul><li>{html.escape(l_str[2:])}</li></ul>")
                elif re.match(r"^\d+\.\s", l_str):
                    num_text = re.sub(r"^\d+\.\s", "", l_str)
                    sec_parts.append(f"<ol><li>{html.escape(num_text)}</li></ol>")
                else:
                    sec_parts.append(f"<p>{html.escape(l_str)}</p>")

        for block in (sec.structured_blocks or []):
            b_type = block.get("type") if isinstance(block, dict) else block.type
            b_data = block.get("data", {}) if isinstance(block, dict) else getattr(block, "data", {})

            if b_type == "code":
                lang = html.escape(b_data.get("language", "code"))
                code = html.escape(b_data.get("code", ""))
                sec_parts.append(f"""
                <div class="code-container">
                    <div class="code-badge">{lang}</div>
                    <pre>{code}</pre>
                </div>
                """)

            elif b_type == "callout":
                c_type = b_data.get("callout_type", "important")
                c_title = html.escape(b_data.get("title", "Note"))
                c_body = html.escape(b_data.get("body", ""))
                css_class = "callout callout-" + ("warning" if c_type == "warning" else ("tip" if c_type == "tip" else "info"))
                sec_parts.append(f"""
                <div class="{css_class}">
                    <div class="callout-title">{c_title.upper()}</div>
                    <div>{c_body}</div>
                </div>
                """)

            elif b_type == "table":
                headers = b_data.get("headers", [])
                rows = b_data.get("rows", [])
                if headers and rows:
                    tbl_html = ['<table class="data-table"><thead><tr>']
                    for h in headers:
                        tbl_html.append(f"<th>{html.escape(str(h))}</th>")
                    tbl_html.append("</tr></thead><tbody>")
                    for r in rows:
                        tbl_html.append("<tr>")
                        for cell in r:
                            tbl_html.append(f"<td>{html.escape(str(cell))}</td>")
                        tbl_html.append("</tr>")
                    tbl_html.append("</tbody></table>")
                    sec_parts.append("".join(tbl_html))

        sections_html.append("\n".join(sec_parts))

    rendered_html = (
        PDF_HTML_TEMPLATE
        .replace("{{TITLE}}", html.escape(doc.title))
        .replace("{{SUBJECT}}", html.escape(doc.subject or "General"))
        .replace("{{VERSION}}", str(doc.current_version))
        .replace("{{SUMMARY_HTML}}", summary_html)
        .replace("{{SECTIONS_HTML}}", "\n".join(sections_html))
    )

    output_stream = io.BytesIO()
    pisa_status = pisa.CreatePDF(rendered_html, dest=output_stream)

    if pisa_status.err:
        logger.error(f"xhtml2pdf error generating PDF: {pisa_status.err}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to render document to PDF."
        )

    output_stream.seek(0)
    return output_stream
