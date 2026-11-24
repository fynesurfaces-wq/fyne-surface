from pathlib import Path
from PIL import Image, ImageChops, ImageStat
from pypdf import PdfReader

reader = PdfReader('C:/Users/Ashu/Downloads/FYN/(n)20x20inches - 2026 -Premium Greenwall Collection- FYNE Surfaces.pdf.pdf')
zip_root = Path('tmp/premium-greenwall-assets')
zip_images = []
for path in zip_root.rglob('*'):
    if path.is_file():
        try:
            image = Image.open(path).convert('RGBA')
            zip_images.append((path.name, image))
        except Exception:
            pass

for page_no in [3, 4, 6, 7, 8, 10, 11, 12, 13, 14, 16, 17, 18, 19, 20, 21, 23, 24, 25, 26, 27, 28, 29]:
    page = reader.pages[page_no - 1]
    products = []
    for image in page.images:
        im = image.image.convert('RGBA')
        if im.width > 250 and im.height > 250:
            products.append(im)
    print('PAGE', page_no)
    for im in products:
        candidates = []
        for name, source in zip_images:
            thumb_a = im.resize((32, 32))
            thumb_b = source.resize((32, 32))
            diff = ImageChops.difference(thumb_a, thumb_b)
            score = sum(ImageStat.Stat(diff).mean) / 4
            candidates.append((score, name, source.size))
        print(im.size, sorted(candidates)[:3])
