from pathlib import Path
import re
from pypdf import PdfReader
from pypdf.generic import ContentStream
from PIL import Image, ImageChops, ImageStat

reader = PdfReader('C:/Users/Ashu/Downloads/FYN/(n)20x20inches - 2026 -Premium Greenwall Collection- FYNE Surfaces.pdf.pdf')
asset_root = Path('tmp/premium-greenwall-assets')
asset_paths = [p for p in asset_root.rglob('*') if p.is_file()]
asset_images = [(p.name, Image.open(p).convert('RGBA')) for p in asset_paths]

def collect_images(stream_obj, resources, out):
    stream = ContentStream(stream_obj, reader)
    last_cm = None
    for operands, operator in stream.operations:
        if operator == b'cm':
            last_cm = tuple(float(v) for v in operands)
        elif operator == b'Do':
            name = str(operands[0])
            xobj = resources['/XObject'][operands[0]].get_object()
            if xobj.get('/Subtype') == '/Form':
                collect_images(xobj, xobj['/Resources'].get_object(), out)
            elif xobj.get('/Subtype') == '/Image':
                out.append((name, last_cm))

def find_zip_image(pdf_image):
    source = pdf_image.image.convert('RGBA').resize((24, 24))
    matches = []
    for name, candidate in asset_images:
        test = candidate.resize((24, 24))
        difference = ImageChops.difference(source, test)
        score = sum(ImageStat.Stat(difference).mean) / 4
        matches.append((score, name))
    return min(matches)

for number in list(range(3, 22)) + list(range(23, 30)):
    page = reader.pages[number - 1]
    texts = []
    def visit(text, cm, tm, font, size):
        if text.strip() and text not in ('\n',):
            codes = re.findall(r'F\s*Y\s*N\s*\d[\d\s]*?\s*E(?:\s*[-–]\s*[A-Za-z\s]+)?', text)
            nums = re.findall(r'(?<!\w)(?:\d\s){3,}\d(?!\w)', text)
            for code in codes:
                clean = re.sub(r'\s+', '', code).replace('–','-')
                texts.append(('CODE', clean, float(cm[4]), float(cm[5])))
            for num in nums:
                clean = re.sub(r'\s+', '', num)
                if 4 <= len(clean) <= 6:
                    texts.append(('NUM', clean, float(cm[4]), float(cm[5])))
    page.extract_text(visitor_text=visit)
    image_objects = []
    collect_images(page.get_contents(), page['/Resources'].get_object(), image_objects)
    print(f'PAGE {number}')
    print('TEXT', texts)
    print('IMAGES', [(name, (round(cm[4]), round(cm[5])) if cm else None, find_zip_image(next(im for im in page.images if im.name.startswith(name.strip('/'))))) for name, cm in image_objects if cm and abs(cm[4]) < 4000 and abs(cm[5]) < 3600])
