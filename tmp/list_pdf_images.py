from pypdf import PdfReader

reader = PdfReader('C:/Users/Ashu/Downloads/FYN/(n)20x20inches - 2026 -Premium Greenwall Collection- FYNE Surfaces.pdf.pdf')
for number in [3, 4, 6, 7, 8, 10, 11, 23, 24, 29]:
    page = reader.pages[number - 1]
    print('PAGE', number, [(image.name, image.image.size, image.image.mode) for image in page.images])
