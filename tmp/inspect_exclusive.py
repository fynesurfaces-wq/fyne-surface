from pathlib import Path
from zipfile import ZipFile
from pypdf import PdfReader

pdf = Path("C:/Users/Ashu/Downloads/FYN/(n)1x1mtr & 2x1mtr - 2026- X'clusive Greenwall Collection 2026- FYNE Surfaces.pdf (4).pdf")
archive = Path("C:/Users/Ashu/OneDrive/Pictures/FYN/(n)1x1mtr & 2x1mtr - 2026- X'clusive Greenwall Collection 2026- FYNE Surfaces.pdf (4).zip")
reader = PdfReader(str(pdf))
print("PAGE_COUNT", len(reader.pages))
for index, page in enumerate(reader.pages, 1):
    text = " ".join((page.extract_text() or "").split())
    print(f"PAGE {index}: {text[:600]}")
with ZipFile(archive) as zf:
    entries = [entry for entry in zf.infolist() if not entry.is_dir()]
    print("ZIP_COUNT", len(entries))
    for entry in entries[:200]:
        print(f"ZIP {entry.filename} {entry.file_size}")
