from pypdf import PdfReader

reader = PdfReader('C:/Users/Ashu/Downloads/FYN/(n)20x20inches - 2026 -Premium Greenwall Collection- FYNE Surfaces.pdf.pdf')
for n in [3, 4, 7, 23, 24]:
    print('PAGE', n)
    def visitor(text, cm, tm, font, size):
        if text.strip():
            print(repr(text), tuple(round(float(v), 1) for v in tm[4:6]), 'cm', tuple(round(float(v), 1) for v in cm[4:6]))
    reader.pages[n - 1].extract_text(visitor_text=visitor)
