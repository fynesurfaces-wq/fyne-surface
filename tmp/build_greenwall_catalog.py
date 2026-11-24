from pathlib import Path
import re
import shutil
import hashlib
from PIL import Image
from pypdf import PdfReader
from pypdf.generic import ContentStream

PDF = Path('C:/Users/Ashu/Downloads/FYN/(n)20x20inches - 2026 -Premium Greenwall Collection- FYNE Surfaces.pdf.pdf')
ZIP_ASSETS = Path('tmp/premium-greenwall-assets')
OUT = Path('fyne-backend/src/seed/assets/premium-greenwall')
CATALOG_OUT = Path('fyne-backend/src/seed/premium-greenwall-catalog.json')
OUT.mkdir(parents=True, exist_ok=True)
reader = PdfReader(str(PDF))
zip_images = {}
for path in ZIP_ASSETS.rglob('*'):
    if path.is_file():
        try:
            zip_images[path.name] = Image.open(path).convert('RGBA')
        except Exception:
            pass
zip_thumbs = {name: image.resize((32, 32)) for name, image in zip_images.items()}
zip_by_size = {}
zip_by_pixels = {}
for name, image in zip_images.items():
    zip_by_size.setdefault(image.size, []).append(name)
    zip_by_pixels.setdefault((image.size, hashlib.sha1(image.tobytes()).digest()), name)

def clean_sku_text(text):
    text = re.sub(r'\s+', '', text).replace('–', '-')
    return text

def cell_for(x, y):
    return ('left' if x < 1000 else 'right', 'top' if y < 2400 else 'bottom')

def find_source(image):
    key = (image.size, hashlib.sha1(image.tobytes()).digest())
    if key in zip_by_pixels:
        return (0.0, zip_by_pixels[key])
    thumb = image.convert('RGBA').resize((32, 32))
    best = (9999, None)
    candidates = zip_by_size.get(image.size) or list(zip_thumbs)
    for name in candidates:
        candidate = zip_thumbs[name]
        diff = ImageChops.difference(thumb, candidate)
        score = sum(ImageStat.Stat(diff).mean) / 4
        if score < best[0]:
            best = (score, name)
    return best

from PIL import ImageChops, ImageStat

def page_images(page):
    image_by_name = {}
    for extracted in page.images:
        key = extracted.name.split('.')[0]
        image_by_name[key] = extracted.image.convert('RGBA')
    found = []
    def walk(stream_object, resources):
        stream = ContentStream(stream_object, reader)
        matrix = None
        for operands, operator in stream.operations:
            if operator == b'cm':
                matrix = tuple(float(value) for value in operands)
            elif operator == b'Do':
                key = str(operands[0]).lstrip('/')
                xobj = resources['/XObject'][operands[0]].get_object()
                if xobj.get('/Subtype') == '/Form':
                    walk(xobj, xobj['/Resources'].get_object())
                elif xobj.get('/Subtype') == '/Image' and key in image_by_name:
                    image = image_by_name[key]
                    if image.width > 250 and image.height > 250:
                        source_score, source_name = find_source(image)
                        found.append({'cell': cell_for(matrix[4], matrix[5]) if matrix else None,
                                      'matrix': matrix, 'image': image, 'file': source_name,
                                      'score': source_score})
    walk(page.get_contents(), page['/Resources'].get_object())
    return found

def write_image(image, filename):
    image.thumbnail((1000, 1000), Image.Resampling.LANCZOS)
    image.save(OUT / filename, 'WEBP', quality=84, method=4)

def records_for_fyn_page(page_number):
    page = reader.pages[page_number - 1]
    codes, prices = [], []
    def visitor(text, cm, tm, font, size):
        x, y = float(cm[4]), float(cm[5])
        if abs(x) < 30 and abs(y - 850) < 10:
            return
        compact = clean_sku_text(text)
        for code in re.findall(r'FYN\d{4}E(?:-[A-Za-z]+)?', compact, flags=re.I):
            codes.append({'code': code.upper(), 'cell': cell_for(x, y)})
        for price in re.findall(r'(?<!\d)1\d{4}(?!\d)', compact):
            prices.append({'price': int(price), 'cell': cell_for(x, y)})
    page.extract_text(visitor_text=visitor)
    unique_codes = {}
    for item in codes:
        unique_codes[item['cell']] = item['code']
    unique_prices = {}
    for item in prices:
        unique_prices[item['cell']] = item['price']
    if len(unique_codes) != 4 or len(unique_prices) != 4:
        raise ValueError(f'Could not parse four FYN products and prices on PDF page {page_number}: {unique_codes}, {unique_prices}')

    images = page_images(page)
    by_cell = {item['cell']: item for item in images if item['cell']}
    products = []
    expected_cells = [('left', 'top'), ('right', 'top'), ('left', 'bottom'), ('right', 'bottom')]
    composites = [item for item in images if item['image'].width / item['image'].height > 1.5]
    four_up = next((item for item in images if item['file'] == '35.png'), None)

    crops = {}
    if four_up:
        image = four_up['image']
        mid_x, mid_y = image.width // 2, image.height // 2
        crops = {
            ('left', 'top'): image.crop((0, 0, mid_x, mid_y)),
            ('right', 'top'): image.crop((mid_x, 0, image.width, mid_y)),
            ('left', 'bottom'): image.crop((0, mid_y, mid_x, image.height)),
            ('right', 'bottom'): image.crop((mid_x, mid_y, image.width, image.height)),
        }
    elif composites:
        composite = composites[0]
        image = composite['image']
        mid_x = image.width // 2
        row = composite['cell'][1]
        crops = {('left', row): image.crop((0, 0, mid_x, image.height)),
                 ('right', row): image.crop((mid_x, 0, image.width, image.height))}

    for cell in expected_cells:
        code = unique_codes[cell]
        price = unique_prices[cell]
        source = crops.get(cell)
        if source is None:
            item = by_cell.get(cell)
            if not item:
                raise ValueError(f'Missing image for {code} on PDF page {page_number}; cells: {list(by_cell)}')
            source = zip_images[item['file']]

        original_code = code
        name_variant = ''
        suffix = ''
        if code == 'FYN9070E-DARKGREEN':
            original_code, name_variant, suffix = 'FYN9070E', ' - Dark Green', '-DARK-GREEN'
        elif code == 'FYN9070E-LEMONGREEN':
            original_code, name_variant, suffix = 'FYN9070E', ' - Lemon Green', '-LEMON-GREEN'
        elif code == 'FYN9079E-P':
            original_code, name_variant = 'FYN9079E-P', ' - P'
        elif code == 'FYN9057E-WHITE':
            original_code, name_variant, suffix = 'FYN9057E', ' - White', '-WHITE'
        elif code.endswith('-A'):
            original_code = code[:-2]
            name_variant = ' - A'
        database_sku = f'{original_code}{suffix}'
        filename = f'{re.sub(r"[^A-Z0-9-]", "", database_sku)}.webp'
        write_image(source.copy(), filename)
        application = 'Indoor and outdoor use'
        products.append({
            'sku': database_sku,
            'catalogCode': original_code,
            'name': f'Premium Greenwall Panel {original_code}{name_variant}',
            'price': price,
            'imageFile': filename,
            'size': '20 x 20 inches',
            'coverage': '2.7 sq ft per piece',
            'application': application,
            'sourcePage': page_number,
        })
    return products

pages_fyn = [3, 4, 6, 7, 8, 10, 11, 12, 13, 14, 16, 17, 18, 19, 20, 21]
products = []
for page_number in pages_fyn:
    products.extend(records_for_fyn_page(page_number))

gz_rows = {
    23: [('GZ-2002-A', 13750, '75.jpg'), ('GZ-2005', 13450, '76.jpg'), ('GZ-2015', 15500, '77.jpg')],
    24: [('GZ-2001', 13750, '78.png'), ('GZ-2016', 15500, '79.jpg'), ('GZ-2022-DG', 13000, '80.png')],
    25: [('GZ-2008', 14000, '81.png'), ('GZ-2006', 13500, '82.png'), ('GZ-2004', 13500, '83.jpg')],
    26: [('GZ-2007', 14100, '84.png'), ('GZ-2011', 15500, '85.png'), ('GZ-2002', 13450, '86.png')],
    27: [('GZ-2021', 13500, '87.png'), ('GZ-2019', 13500, '88.png'), ('GZ-2022', 13500, '89.jpg')],
    28: [('GZ-2017', 13500, '90.jpg'), ('GZ-2018', 13500, '91.jpg'), ('GZ-2020', 13500, '92.jpg')],
    29: [('GZ-2025', 14000, '93.jpg'), ('GZ-2003', 14000, '94.png'), ('GZ-2014', 14000, '95.png')],
}
for page_number, rows in gz_rows.items():
    for code, price, asset in rows:
        filename = f'{code}.webp'
        write_image(zip_images[asset].copy(), filename)
        semi = code in {'GZ-2022-DG', 'GZ-2017', 'GZ-2018', 'GZ-2020'}
        products.append({
            'sku': code,
            'catalogCode': code,
            'name': f'Premium Greenwall Tile {code}',
            'price': price,
            'imageFile': filename,
            'size': '20 x 20 inches',
            'coverage': '2.7 sq ft per tile',
            'application': 'Semi-outdoor and indoor use' if semi else 'Indoor and outdoor use',
            'sourcePage': page_number,
        })

if len(products) != 85 or len({item['sku'] for item in products}) != 85:
    raise ValueError(f'Unexpected catalog count or duplicate SKUs: {len(products)}, {len({item["sku"] for item in products})}')

import json
OUT.mkdir(parents=True, exist_ok=True)
CATALOG_OUT.write_text(json.dumps(products, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
print(f'generated {len(products)} products and {len(list(OUT.glob("*.webp")))} webp assets')
