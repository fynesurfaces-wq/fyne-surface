from pypdf import PdfReader
pdf="C:/Users/Ashu/Downloads/FYN/(n)1x1mtr & 2x1mtr - 2026- X'clusive Greenwall Collection 2026- FYNE Surfaces.pdf (4).pdf"
r=PdfReader(pdf)
for n in list(range(4,35))+list(range(36,57)):
 print('PAGE',n,repr(r.pages[n-1].extract_text()))
