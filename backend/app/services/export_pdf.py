import io
import html
import re
from xhtml2pdf import pisa
from app.models.document import Document
from fastapi import HTTPException, status
from app.utils.logger import logger
from app.services.media_resolver import resolve_image_data

PDF_HTML_TEMPLATE = """<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
    @page {
        size: letter portrait;
        margin: 1.8cm 1.8cm 2cm 1.8cm;
        @top-right {
            content: "NoteForge AI  |  Study Notes";
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
        font-size: 9.5pt;
        line-height: 1.5;
        color: #1e293b;
    }
    h1 {
        font-size: 20pt;
        color: #0f172a;
        margin-top: 0;
        margin-bottom: 4px;
        font-weight: bold;
        page-break-after: avoid;
    }
    .subtitle {
        font-size: 9pt;
        color: #64748b;
        margin-bottom: 12px;
    }
    .summary-box {
        background-color: #f8fafc;
        border-left: 3px solid #6366f1;
        padding: 8px 12px;
        margin-bottom: 16px;
        font-style: italic;
        color: #334155;
        page-break-inside: avoid;
    }
    .divider {
        border-bottom: 1px solid #e2e8f0;
        margin-bottom: 16px;
    }
    h2 {
        font-size: 13.5pt;
        color: #0f172a;
        margin-top: 16px;
        margin-bottom: 6px;
        border-bottom: 1px solid #e2e8f0;
        padding-bottom: 3px;
        page-break-after: avoid;
    }
    h3 {
        font-size: 11pt;
        color: #334155;
        margin-top: 10px;
        margin-bottom: 4px;
        page-break-after: avoid;
    }
    p {
        margin-top: 0;
        margin-bottom: 6px;
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
        margin: 8px 0;
        font-family: 'Courier New', Courier, monospace;
        font-size: 8pt;
        page-break-inside: avoid;
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
        margin: 8px 0;
        border-left: 4px solid #3b82f6;
        background-color: #eff6ff;
        page-break-inside: avoid;
    }
    .callout-warning {
        border-left-color: #ef4444;
        background-color: #fef2f2;
    }
    .callout-tip {
        border-left-color: #10b981;
        background-color: #f0fdf4;
    }
    .callout-info {
        border-left-color: #64748b;
        background-color: #f8fafc;
    }
    .callout-title {
        font-weight: bold;
        font-size: 8.5pt;
        margin-bottom: 2px;
    }
    .image-box {
        text-align: center;
        margin: 10px 0;
        page-break-inside: avoid;
    }
    .image-box img {
        max-width: 95%;
        max-height: 420px;
    }
    .image-caption {
        font-size: 7.5pt;
        color: #64748b;
        font-style: italic;
        margin-top: 4px;
    }
    table.data-table {
        width: 100%;
        border-collapse: collapse;
        margin: 8px 0;
        font-size: 8.5pt;
        page-break-inside: avoid;
    }
    table.data-table th {
        background-color: #f1f5f9;
        color: #1e293b;
        font-weight: bold;
        padding: 5px 8px;
        border: 1px solid #cbd5e1;
        text-align: left;
    }
    table.data-table td {
        padding: 4px 8px;
        border: 1px solid #e2e8f0;
    }
    blockquote {
        border-left: 3px solid #cbd5e1;
        margin: 6px 0;
        padding-left: 10px;
        color: #475569;
        font-style: italic;
        page-break-inside: avoid;
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

def render_markdown_table_html(table_lines: list) -> str:
    parsed_rows = []
    for line in table_lines:
        line_clean = line.strip().strip("|")
        if re.match(r"^[\s\-:|]+$", line_clean):
            continue
        cells = [c.strip() for c in line_clean.split("|")]
        parsed_rows.append(cells)

    if not parsed_rows:
        return ""

    num_cols = max(len(r) for r in parsed_rows)
    out = ['<table class="data-table"><thead><tr>']
    for c_idx in range(num_cols):
        cell_txt = parsed_rows[0][c_idx] if c_idx < len(parsed_rows[0]) else ""
        out.append(f"<th>{html.escape(cell_txt)}</th>")
    out.append("</tr></thead><tbody>")

    for r in parsed_rows[1:]:
        out.append("<tr>")
        for c_idx in range(num_cols):
            cell_txt = r[c_idx] if c_idx < len(r) else ""
            out.append(f"<td>{html.escape(cell_txt)}</td>")
        out.append("</tr>")
    out.append("</tbody></table>")
    return "".join(out)

def generate_pdf_stream(doc: Document) -> io.BytesIO:
    summary_html = ""
    if doc.summary:
        summary_html = f'<div class="summary-box">{html.escape(doc.summary)}</div>'

    sections_html = []
    for s_idx, sec in enumerate(doc.sections):
        sec_title = f"{s_idx + 1}. {html.escape(sec.title)}"
        sec_parts = [f"<h2>{sec_title}</h2>"]

        if sec.content_markdown:
            lines = sec.content_markdown.splitlines()
            in_ul = False
            in_ol = False
            table_buffer = []

            for line in lines:
                l_str = line.strip()

                # Table line check
                if l_str.startswith("|") and l_str.endswith("|"):
                    if in_ul:
                        sec_parts.append("</ul>")
                        in_ul = False
                    if in_ol:
                        sec_parts.append("</ol>")
                        in_ol = False
                    table_buffer.append(l_str)
                    continue
                else:
                    if table_buffer:
                        sec_parts.append(render_markdown_table_html(table_buffer))
                        table_buffer = []

                if not l_str:
                    if in_ul:
                        sec_parts.append("</ul>")
                        in_ul = False
                    if in_ol:
                        sec_parts.append("</ol>")
                        in_ol = False
                    continue

                # Markdown image: ![alt](url)
                img_match = re.match(r"^!\[(.*?)\]\((.*?)\)$", l_str)
                if img_match:
                    if in_ul:
                        sec_parts.append("</ul>")
                        in_ul = False
                    if in_ol:
                        sec_parts.append("</ol>")
                        in_ol = False
                    alt_text = img_match.group(1)
                    src_url = img_match.group(2)
                    img_data = resolve_image_data(src_url)
                    if img_data:
                        _, _, data_uri, _, _ = img_data
                        caption_html = f'<div class="image-caption">{html.escape(alt_text)}</div>' if alt_text else ""
                        sec_parts.append(f'<div class="image-box"><img src="{data_uri}" />{caption_html}</div>')
                        continue

                # Headings
                if l_str.startswith("#"):
                    if in_ul:
                        sec_parts.append("</ul>")
                        in_ul = False
                    if in_ol:
                        sec_parts.append("</ol>")
                        in_ol = False
                    sub_text = re.sub(r"^#+\s*", "", l_str)
                    sec_parts.append(f"<h3>{html.escape(sub_text)}</h3>")

                # Bullet list
                elif l_str.startswith("- ") or l_str.startswith("* "):
                    if in_ol:
                        sec_parts.append("</ol>")
                        in_ol = False
                    if not in_ul:
                        sec_parts.append("<ul>")
                        in_ul = True
                    sec_parts.append(f"<li>{html.escape(l_str[2:])}</li>")

                # Numbered list
                elif re.match(r"^\d+\.\s", l_str):
                    if in_ul:
                        sec_parts.append("</ul>")
                        in_ul = False
                    if not in_ol:
                        sec_parts.append("<ol>")
                        in_ol = True
                    num_text = re.sub(r"^\d+\.\s", "", l_str)
                    sec_parts.append(f"<li>{html.escape(num_text)}</li>")

                # Blockquote
                elif l_str.startswith("> "):
                    if in_ul:
                        sec_parts.append("</ul>")
                        in_ul = False
                    if in_ol:
                        sec_parts.append("</ol>")
                        in_ol = False
                    sec_parts.append(f"<blockquote>{html.escape(l_str[2:])}</blockquote>")

                # Normal paragraph
                else:
                    if in_ul:
                        sec_parts.append("</ul>")
                        in_ul = False
                    if in_ol:
                        sec_parts.append("</ol>")
                        in_ol = False
                    sec_parts.append(f"<p>{html.escape(l_str)}</p>")

            if in_ul:
                sec_parts.append("</ul>")
            if in_ol:
                sec_parts.append("</ol>")
            if table_buffer:
                sec_parts.append(render_markdown_table_html(table_buffer))

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

            elif b_type == "image":
                src_url = b_data.get("url", "")
                alt_text = b_data.get("caption", "")
                img_data = resolve_image_data(src_url)
                if img_data:
                    _, _, data_uri, _, _ = img_data
                    caption_html = f'<div class="image-caption">{html.escape(alt_text)}</div>' if alt_text else ""
                    sec_parts.append(f'<div class="image-box"><img src="{data_uri}" />{caption_html}</div>')

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
