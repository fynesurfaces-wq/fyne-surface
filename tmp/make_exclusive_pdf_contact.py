from pathlib import Path
from PIL import Image, ImageDraw
files = sorted(Path('tmp').glob('exclusive-page-*.jpg'), key=lambda p: int(p.stem.split('-')[-1]))
tiles = []
for path in files:
    image = Image.open(path).convert('RGB')
    image.thumbnail((180, 250))
    tile = Image.new('RGB', (200, 280), 'white')
    tile.paste(image, ((200-image.width)//2, 4))
    ImageDraw.Draw(tile).text((4, 258), path.stem, fill='black')
    tiles.append(tile)
sheet = Image.new('RGB', (1000, ((len(tiles)+4)//5)*280), '#ddd')
for index, tile in enumerate(tiles):
    sheet.paste(tile, ((index%5)*200, (index//5)*280))
sheet.save('tmp/exclusive-pdf-contact.jpg', quality=85)
