import re
import io
from docx import Document as DocxDocument
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

from app.models.document import Document

def set_cell_background(cell, color_hex: str):
    """Sets background shading of a docx table cell."""
    shading_elm = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{color_hex}"/>')
    cell._tc.get_or_add_tcPr().append(shading_elm)

def set_cell_left_border(cell, color_hex: str, size: int = 24):
    """Sets a left border on a cell for callouts."""
    tcPr = cell._tc.get_or_add_tcPr()
    tcBorders = parse_xml(
        f'<w:tcBorders {nsdecls("w")}>\n'
        f'  <w:left w:val="single" w:sz="{size}" w:space="0" w:color="{color_hex}"/>\n'
        f'  <w:top w:val="none"/>\n'
        f'  <w:right w:val="none"/>\n'
        f'  <w:bottom w:val="none"/>\n'
        f'</w:tcBorders>'
    )
    tcPr.append(tcBorders)

def generate_docx_stream(doc: Document) -> io.BytesIO:
    docx = DocxDocument()

    # Set page margins (1 inch all sides)
    for section in docx.sections:
        section.top_margin = Inches(1.0)
        section.bottom_margin = Inches(1.0)
        section.left_margin = Inches(1.0)
        section.right_margin = Inches(1.0)
        
        # Add running header
        header = section.header
        hp = header.paragraphs[0]
        hp.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        hrun = hp.add_run(f"NoteForge AI  |  {doc.title}")
        hrun.font.name = "Arial"
        hrun.font.size = Pt(8.5)
        hrun.font.color.rgb = RGBColor(128, 128, 128)

        # Add running footer
        footer = section.footer
        fp = footer.paragraphs[0]
        fp.alignment = WD_ALIGN_PARAGRAPH.CENTER
        frun = fp.add_run(f"Version {doc.current_version}  •  Study Notes Documentation")
        frun.font.name = "Arial"
        frun.font.size = Pt(8.5)
        frun.font.color.rgb = RGBColor(128, 128, 128)

    # Document Title
    title_p = docx.add_paragraph()
    title_p.paragraph_format.space_before = Pt(12)
    title_p.paragraph_format.space_after = Pt(4)
    run_title = title_p.add_run(doc.title)
    run_title.font.name = "Arial"
    run_title.font.size = Pt(24)
    run_title.font.bold = True
    run_title.font.color.rgb = RGBColor(30, 41, 59)  # Slate 800

    # Subject & Metadata Subtitle
    sub_p = docx.add_paragraph()
    sub_p.paragraph_format.space_after = Pt(16)
    sub_run = sub_p.add_run(f"Subject: {doc.subject or 'General'}   •   Version: {doc.current_version}")
    sub_run.font.name = "Arial"
    sub_run.font.size = Pt(11)
    sub_run.font.color.rgb = RGBColor(100, 116, 139)  # Slate 500

    # Summary
    if doc.summary:
        sum_p = docx.add_paragraph()
        sum_p.paragraph_format.space_after = Pt(18)
        sum_run = sum_p.add_run(doc.summary)
        sum_run.font.name = "Arial"
        sum_run.font.size = Pt(10.5)
        sum_run.font.italic = True
        sum_run.font.color.rgb = RGBColor(71, 85, 105)

    # Divider line
    divider = docx.add_paragraph()
    divider.paragraph_format.space_after = Pt(16)
    d_run = divider.add_run("____________________________________________________________________")
    d_run.font.color.rgb = RGBColor(226, 232, 240)

    # Document Sections
    for s_idx, section in enumerate(doc.sections):
        # Section Heading
        h2 = docx.add_paragraph()
        h2.paragraph_format.space_before = Pt(18)
        h2.paragraph_format.space_after = Pt(6)
        h2_run = h2.add_run(f"{s_idx + 1}. {section.title}")
        h2_run.font.name = "Arial"
        h2_run.font.size = Pt(16)
        h2_run.font.bold = True
        h2_run.font.color.rgb = RGBColor(15, 23, 42)

        # Markdown body
        if section.content_markdown:
            # Simple markdown lines rendering
            lines = section.content_markdown.splitlines()
            for line in lines:
                line_str = line.strip()
                if not line_str:
                    continue
                if line_str.startswith("#"):
                    # Sub-heading
                    subh = docx.add_paragraph()
                    subh.paragraph_format.space_before = Pt(10)
                    subh.paragraph_format.space_after = Pt(4)
                    subh_run = subh.add_run(re.sub(r"^#+\s*", "", line_str))
                    subh_run.font.name = "Arial"
                    subh_run.font.size = Pt(12.5)
                    subh_run.font.bold = True
                    subh_run.font.color.rgb = RGBColor(51, 65, 85)
                elif line_str.startswith("- ") or line_str.startswith("* "):
                    bp = docx.add_paragraph(style='List Bullet')
                    bp.paragraph_format.space_after = Pt(3)
                    brun = bp.add_run(line_str[2:])
                    brun.font.name = "Arial"
                    brun.font.size = Pt(10)
                elif re.match(r"^\d+\.\s", line_str):
                    np = docx.add_paragraph(style='List Number')
                    np.paragraph_format.space_after = Pt(3)
                    nrun = np.add_run(re.sub(r"^\d+\.\s", "", line_str))
                    nrun.font.name = "Arial"
                    nrun.font.size = Pt(10)
                else:
                    p = docx.add_paragraph()
                    p.paragraph_format.space_after = Pt(6)
                    prun = p.add_run(line_str)
                    prun.font.name = "Arial"
                    prun.font.size = Pt(10)
                    prun.font.color.rgb = RGBColor(30, 41, 59)

        # Structured Blocks (Code blocks, callouts, tables)
        for block in (section.structured_blocks or []):
            b_type = block.get("type") if isinstance(block, dict) else block.type
            b_data = block.get("data", {}) if isinstance(block, dict) else getattr(block, "data", {})

            if b_type == "code":
                lang = b_data.get("language", "code").upper()
                code_text = b_data.get("code", "")
                
                tbl = docx.add_table(rows=1, cols=1)
                tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
                cell = tbl.cell(0, 0)
                set_cell_background(cell, "F1F5F9")  # Slate 100
                set_cell_left_border(cell, "6366F1", size=18)  # Indigo 500 border

                cp = cell.paragraphs[0]
                cp.paragraph_format.space_before = Pt(4)
                cp.paragraph_format.space_after = Pt(4)
                
                lang_run = cp.add_run(f"[{lang}]\n")
                lang_run.font.name = "Courier New"
                lang_run.font.size = Pt(8.5)
                lang_run.font.bold = True
                lang_run.font.color.rgb = RGBColor(99, 102, 241)

                c_run = cp.add_run(code_text)
                c_run.font.name = "Courier New"
                c_run.font.size = Pt(9.5)
                c_run.font.color.rgb = RGBColor(15, 23, 42)

                docx.add_paragraph().paragraph_format.space_after = Pt(6)

            elif b_type == "callout":
                c_type = b_data.get("callout_type", "important")
                c_title = b_data.get("title", "Note")
                c_body = b_data.get("body", "")

                color_map = {
                    "warning": ("FEF2F2", "EF4444"),  # Red
                    "important": ("EFF6FF", "3B82F6"), # Blue
                    "tip": ("F0FDF4", "10B981"),       # Green
                    "info": ("F8FAFC", "64748B")       # Gray
                }
                bg_color, border_color = color_map.get(c_type, ("EFF6FF", "3B82F6"))

                tbl = docx.add_table(rows=1, cols=1)
                tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
                cell = tbl.cell(0, 0)
                set_cell_background(cell, bg_color)
                set_cell_left_border(cell, border_color, size=24)

                cp = cell.paragraphs[0]
                cp.paragraph_format.space_before = Pt(6)
                cp.paragraph_format.space_after = Pt(6)

                trun = cp.add_run(f"{c_title.upper()}: ")
                trun.font.name = "Arial"
                trun.font.size = Pt(9.5)
                trun.font.bold = True
                
                brun = cp.add_run(c_body)
                brun.font.name = "Arial"
                brun.font.size = Pt(9.5)

                docx.add_paragraph().paragraph_format.space_after = Pt(6)

            elif b_type == "table":
                headers = b_data.get("headers", [])
                rows = b_data.get("rows", [])
                if headers and rows:
                    tbl = docx.add_table(rows=len(rows) + 1, cols=len(headers))
                    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
                    for c_i, header_txt in enumerate(headers):
                        c = tbl.cell(0, c_i)
                        set_cell_background(c, "E2E8F0")
                        p = c.paragraphs[0]
                        p.paragraph_format.space_before = Pt(3)
                        p.paragraph_format.space_after = Pt(3)
                        r = p.add_run(str(header_txt))
                        r.font.name = "Arial"
                        r.font.size = Pt(9.5)
                        r.font.bold = True

                    for r_i, row in enumerate(rows):
                        for c_i, val in enumerate(row):
                            c = tbl.cell(r_i + 1, c_i)
                            if r_i % 2 == 1:
                                set_cell_background(c, "F8FAFC")
                            p = c.paragraphs[0]
                            p.paragraph_format.space_before = Pt(3)
                            p.paragraph_format.space_after = Pt(3)
                            r = p.add_run(str(val))
                            r.font.name = "Arial"
                            r.font.size = Pt(9.5)

                    docx.add_paragraph().paragraph_format.space_after = Pt(6)

    # Save to memory stream
    output_stream = io.BytesIO()
    docx.save(output_stream)
    output_stream.seek(0)
    return output_stream
