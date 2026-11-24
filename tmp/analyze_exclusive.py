from pathlib import Path
from zipfile import ZipFile
from pypdf import PdfReader
from PIL import Image, ImageOps, ImageDraw
import re

pdf = Path("C:/Users/Ashu/Downloads/FYN/(n)1x1mtr & 2x1mtr - 2026- X'clusive Greenwall Collection 2026- FYNE Surfaces.pdf (4).pdf")
archive = Path("C:/Users/Ashu/OneDrive/Pictures/FYN/(n)1x1mtr & 2x1mtr - 2026- X'clusive Greenwall Collection 2026- FYNE Surfaces.pdf (4).zip")
out = Path('tmp/exclusive-greenwall-assets')
out.mkdir(parents=True, exist_ok=True)
with ZipFile(archive) as zf:
    root = zf.namelist()[0].split('/')[0]
    for name in zf.namelist():
        if name.endswith('/'):
            continue
        data = zf.read(name)
        (out / Path(name).name).write_bytes(data)
reader = PdfReader(str(pdf))
for number in list(range(4, 35)) + list(range(36, 58)):
    page = reader.pages[number - 1]
    texts = []
    def visitor(text, cm, tm, font, size):
        s = ' '.join(text.split())
        if s:
            texts.append((round(float(cm[4]), 1), round(float(cm[5]), 1), s))
    page.extract_text(visitor_text=visitor)
    print(f'\nPAGE {number}')
    print('TEXT', sorted(texts, key=lambda item: (-item[1], item[0])))
    print('IMAGES', [(img.name, img.image.size) for img in page.images])

thumbs = []
for p in sorted(out.glob('*'), key=lambda p: int(re.search(r'\d+', p.stem).group())):
    try:
        im = Image.open(p).convert('RGB')
        im.thumbnail((100, 75))
        tile = Image.new('RGB', (120, 105), 'white')
        tile.paste(im, ((120-im.width)//2, 2))
        ImageDraw.Draw(tile).text((4, 80), p.name, fill='black')
        thumbs.append(tile)
    except Exception:
        continue
cols = 8
sheet = Image.new('RGB', (cols*120, ((len(thumbs)+cols-1)//cols)*105), '#ddd')
for i, tile in enumerate(thumbs): sheet.paste(tile, ((i%cols)*120, (i//cols)*105))
sheet.save('tmp/exclusive-greenwall-contact.jpg', quality=85)
