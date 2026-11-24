from pathlib import Path
from pypdf import PdfReader
from PIL import Image,ImageChops,ImageStat
import hashlib,re
pdf='C:/Users/Ashu/Downloads/FYN/(c)16x24 Economy Greenwall 16x24 Collection 2025 - FYNE Surfaces.pdf'
assets=Path('tmp/economy-greenwall-assets'); zips={p.name:Image.open(p).convert('RGBA') for p in assets.iterdir() if p.suffix.lower() in ('.png','.jpg','.jpeg')}
thumbs={n:im.resize((32,32)) for n,im in zips.items()}; hashes={(im.size,hashlib.sha1(im.tobytes()).digest()):n for n,im in zips.items()}
r=PdfReader(pdf)
for n,p in enumerate(r.pages,1):
 print('\nPAGE',n)
 for x in p.images:
  im=x.image.convert('RGBA'); key=(im.size,hashlib.sha1(im.tobytes()).digest())
  if im.width<250 or im.height<250: continue
  if key in hashes: match=(0,hashes[key])
  else:
   t=im.resize((32,32)); match=min((sum(ImageStat.Stat(ImageChops.difference(t,zi)).mean)/4,name) for name,zi in thumbs.items())
  print(x.name, im.size, match)
