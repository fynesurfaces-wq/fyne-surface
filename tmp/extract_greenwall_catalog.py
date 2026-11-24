from pathlib import Path
import re
from pypdf import PdfReader

pdf = Path('C:/Users/Ashu/Downloads/FYN/(n)20x20inches - 2026 -Premium Greenwall Collection- FYNE Surfaces.pdf.pdf')
reader = PdfReader(str(pdf))
for number, page in enumerate(reader.pages, 1):
    raw = page.extract_text() or ''
    clean = re.sub(r'(?<!\w)(?:[A-Za-z0-9]\s){2,}[A-Za-z0-9](?!\w)', lambda m: re.sub(r'\s+', '', m.group()), raw)
    print(f'--- PAGE {number} ---')
    print(clean)
