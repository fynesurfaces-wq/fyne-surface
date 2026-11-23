from pathlib import Path
from PIL import Image
for p in Path('fyne-storefront/public/images/hero').iterdir(): print(p.name, Image.open(p).size)
