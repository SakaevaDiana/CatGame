import sys
from docx import Document
from docx.shared import Pt, Cm, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn

HEADER = 1
BODY = 2
CAPTION = 3
ENUM = 4
SOURCE = 5

CENTERED_HEADERS = {'ВВЕДЕНИЕ', 'ЗАКЛЮЧЕНИЕ', 'СПИСОК ИСПОЛЬЗОВАННЫХ ИСТОЧНИКОВ'}


def set_run_font(run, all_caps=False):
    run.font.name = 'Times New Roman'
    run.font.size = Pt(14)
    run.font.bold = False
    run.font.italic = False
    run.font.underline = False
    run.font.color.rgb = RGBColor(0, 0, 0)
    rPr = run._r.get_or_add_rPr()
    existing = rPr.findall(qn('w:caps'))
    for e in existing:
        rPr.remove(e)
    if all_caps:
        caps = OxmlElement('w:caps')
        caps.set(qn('w:val'), '1')
        rPr.append(caps)


def make_empty_paragraph():
    new_p = OxmlElement('w:p')
    pPr = OxmlElement('w:pPr')
    spacing = OxmlElement('w:spacing')
    spacing.set(qn('w:line'), '360')
    spacing.set(qn('w:lineRule'), 'auto')
    spacing.set(qn('w:before'), '0')
    spacing.set(qn('w:after'), '0')
    pPr.append(spacing)
    ind = OxmlElement('w:ind')
    ind.set(qn('w:firstLine'), '0')
    pPr.append(ind)
    new_p.append(pPr)
    return new_p


def paragraph_has_image(paragraph):
    for run in paragraph.runs:
        for child in run._r:
            tag = child.tag
            if 'drawing' in tag or 'pict' in tag or 'graphic' in tag:
                return True
    return False


def classify_paragraph(paragraph):
    text = paragraph.text.strip()
    if not text:
        return None
    if text in CENTERED_HEADERS:
        return HEADER
    if (text.startswith('1.') and 'АНАЛИЗ' in text.upper() or
            text.startswith('2.') and 'РАБОЧЕЕ' in text.upper()):
        return HEADER
    if text.startswith('Рисунок') or text.startswith('рисунок'):
        return CAPTION
    if '://' in text:
        return SOURCE
    if (text[0].isdigit() and '. ' in text[:4]) or text.startswith('- '):
        return ENUM
    return BODY


def format_paragraph(p, ptype, text):
    """Apply paragraph- and run-level formatting based on type."""

    if ptype == HEADER:
        centered = text in CENTERED_HEADERS
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER if centered else WD_ALIGN_PARAGRAPH.LEFT
        p.paragraph_format.first_line_indent = None if centered else Cm(1.25)
        for run in p.runs:
            set_run_font(run, all_caps=True)
            run.font.bold = True

    elif ptype == CAPTION:
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.first_line_indent = None
        for run in p.runs:
            set_run_font(run)

    elif ptype == SOURCE:
        p.alignment = WD_ALIGN_PARAGRAPH.LEFT
        p.paragraph_format.first_line_indent = Cm(1.25)
        for run in p.runs:
            set_run_font(run)

    elif ptype == ENUM:
        p.alignment = WD_ALIGN_PARAGRAPH.LEFT
        p.paragraph_format.first_line_indent = Cm(1.25)
        for run in p.runs:
            set_run_font(run)

    else:
        p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        p.paragraph_format.first_line_indent = Cm(1.25)
        for run in p.runs:
            set_run_font(run)

    p.paragraph_format.line_spacing = 1.5
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after = Pt(0)


def format_report(input_path, output_path):
    doc = Document(input_path)

    for section in doc.sections:
        section.top_margin = Cm(2)
        section.bottom_margin = Cm(2)
        section.left_margin = Cm(3)
        section.right_margin = Cm(1.5)

    paragraphs = list(doc.paragraphs)

    # --- pass 1: apply formatting to existing paragraphs ---
    for p in paragraphs:
        ptype = classify_paragraph(p)
        if ptype is None:
            continue
        format_paragraph(p, ptype, p.text.strip())

    # --- pass 2: insert empty lines (by object ref, not index) ---
    insert_after = []
    insert_before = []

    for i, p in enumerate(paragraphs):
        ptype = classify_paragraph(p)
        if ptype is None:
            continue
        if ptype == HEADER:
            insert_after.append(p)
        elif ptype == CAPTION:
            insert_after.append(p)
            has_img = i > 0 and paragraph_has_image(paragraphs[i - 1])
            if not has_img:
                insert_before.append(p)

    for p in reversed(insert_after):
        empty = make_empty_paragraph()
        p._p.addnext(empty)

    for p in insert_before:
        empty = make_empty_paragraph()
        p._p.addprevious(empty)

    doc.save(output_path)
    print(f'Saved: {output_path}')


if __name__ == '__main__':
    if len(sys.argv) != 3:
        print('Usage: python format_report.py <input> <output>')
        sys.exit(1)
    format_report(sys.argv[1], sys.argv[2])
