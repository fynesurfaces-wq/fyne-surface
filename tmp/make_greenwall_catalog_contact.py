from pathlib import Path
import json
from PIL import Image, ImageDraw

catalog = json.loads(Path('fyne-backend/src/seed/premium-greenwall-catalog.json').read_text(encoding='utf-8'))
cols, cell_w, cell_h = 8, 140, 145
sheet = Image.new('RGB', (cols * cell_w, ((len(catalog) + cols - 1) // cols) * cell_h), 'white')
draw = ImageDraw.Draw(sheet)
for i, item in enumerate(catalog):
    image = Image.open(Path('fyne-backend/src/seed/assets/premium-greenwall') / item['imageFile']).convert('RGBA')
    image.thumbnail((126, 112))
    x = (i % cols) * cell_w + (cell_w - image.width) // 2
    y = (i // cols) * cell_h + 3
    sheet.paste(image, (x, y), image)
    draw.text(((i % cols) * cell_w + 4, (i // cols) * cell_h + 117), item['sku'][:20], fill='black')
sheet.save('tmp/premium-greenwall-catalog-contact.jpg', quality=90)
print(f'{len(catalog)} product images; contact sheet {sheet.size}')
