"""
Sample Corpus Generator for SiteSafe Ingestion Test Suite.

Generates 5 test files under backend/sample_corpus/:
1. ibc_2021_sec705.pdf - Valid PDF with building code text.
2. project_spec_concrete.md - Markdown specification document.
3. zoning_bylaws.html - Municipal zoning HTML export.
4. corrupt_spec.pdf - Corrupt PDF binary payload (for error handling tests).
5. unsupported_cad.dwg - Unsupported DWG binary CAD file (for format filter tests).
"""

import os
import sys
from pypdf import PdfWriter

CORPUS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "sample_corpus")


def create_minimal_pdf(filepath: str, text_content: str):
    """Creates a minimal valid PDF containing text using pypdf object streams."""
    # Write a standard valid PDF 1.4 stream directly for maximum reliability
    pdf_bytes = f"""%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /Resources << /Font << /F1 4 0 R >> >> /MediaBox [0 0 612 792] /Contents 5 0 R >>
endobj
4 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
5 0 obj
<< /Length {len(text_content) + 50} >>
stream
BT
/F1 12 Tf
50 700 Td
({text_content}) Tj
ET
endstream
endobj
xref
0 6
0000000000 65535 f 
0000000010 00000 n 
0000000060 00000 n 
0000000117 00000 n 
0000000244 00000 n 
0000000318 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
420
%%EOF
""".encode("latin-1")

    with open(filepath, "wb") as f:
        f.write(pdf_bytes)


def generate_sample_corpus():
    os.makedirs(CORPUS_DIR, exist_ok=True)
    print(f"Generating sample corpus in: {CORPUS_DIR}")

    # 1. Valid PDF
    pdf_path = os.path.join(CORPUS_DIR, "ibc_2021_sec705.pdf")
    pdf_text = "IBC 2021 Section 705.8: Exterior walls of Type V construction located less than 5 feet from the lot line shall have a minimum fire-resistance rating of 1 hour and 0% unprotected openings."
    create_minimal_pdf(pdf_path, pdf_text)
    print(f"Created: {pdf_path}")

    # 2. Markdown Specification
    md_path = os.path.join(CORPUS_DIR, "project_spec_concrete.md")
    md_content = """# SECTION 03 30 00 - CAST-IN-PLACE CONCRETE

## 1. PERFORMANCE REQUIREMENTS & CODES
A. Structural concrete footings and foundation walls shall achieve a specified compressive strength f'c of 4,000 psi at 28 days.
B. Maximum water-cementitious materials ratio (w/cm) shall not exceed 0.45.
C. Slump range at placement: 4 inches +/- 1 inch in accordance with ASTM C143.
"""
    with open(md_path, "w", encoding="utf-8") as f:
        f.write(md_content)
    print(f"Created: {md_path}")

    # 3. HTML Zoning Bylaws
    html_path = os.path.join(CORPUS_DIR, "zoning_bylaws.html")
    html_content = """<!DOCTYPE html>
<html>
<head>
    <title>Municipal Zoning Bylaws Section 4.2</title>
    <style>body { color: #333; font-family: sans-serif; }</style>
    <script>console.log("analytics");</script>
</head>
<body>
    <nav><a href="/index">Home</a> | <a href="/search">Search</a></nav>
    <div class="main-content">
        <h1>Municipal Zoning Setback & Height Restrictions</h1>
        <p>All commercial structures built within Zone C-2 must maintain a minimum front setback distance of 15 feet from the primary property line and a rear setback of 10 feet.</p>
        <table border="1">
            <tr><th>Zone Category</th><th>Side Setback (ft)</th><th>Max Height (ft)</th></tr>
            <tr><td>C-2 Commercial</td><td>5.0 ft</td><td>45.0 ft</td></tr>
        </table>
    </div>
</body>
</html>
"""
    with open(html_path, "w", encoding="utf-8") as f:
        f.write(html_content)
    print(f"Created: {html_path}")

    # 4. Corrupt PDF Binary
    corrupt_pdf_path = os.path.join(CORPUS_DIR, "corrupt_spec.pdf")
    with open(corrupt_pdf_path, "wb") as f:
        f.write(b"%PDF-1.4\nNOT_A_VALID_PDF_STREAM_UNTERMINATED_CORRUPTED_BYTES_XXXXX")
    print(f"Created: {corrupt_pdf_path}")

    # 5. Unsupported CAD File
    cad_path = os.path.join(CORPUS_DIR, "unsupported_cad.dwg")
    with open(cad_path, "wb") as f:
        f.write(b"AC1015_AUTOCAD_BINARY_DUMMY_HEADER_BYTES_DO_NOT_PARSE")
    print(f"Created: {cad_path}")

    print("Sample corpus generation complete!")


if __name__ == "__main__":
    generate_sample_corpus()
