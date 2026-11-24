from pathlib import Path
from PIL import Image, ImageDraw

files = sorted(
    (p for p in Path('tmp/premium-greenwall-assets').rglob('*') if p.is_file()),
    key=lambda p: int(p.stem) if p.stem.isdigit() else -1,
)
cols, cell_w, cell_h = 8, 125, 140
sheet = Image.new('RGB', (cols * cell_w, ((len(files) + cols - 1) // cols) * cell_h), 'white')
draw = ImageDraw.Draw(sheet)
for i, path in enumerate(files):
    image = Image.open(path).convert('RGB')
    image.thumbnail((115, 112))
    x = (i % cols) * cell_w + (cell_w - image.width) // 2
    y = (i // cols) * cell_h + 3
    sheet.paste(image, (x, y))
    draw.text(((i % cols) * cell_w + 4, (i // cols) * cell_h + 116), path.name, fill='black')
sheet.save('tmp/premium-greenwall-contact.jpg', quality=90)
print(f'{len(files)} assets; contact sheet {sheet.size}')
