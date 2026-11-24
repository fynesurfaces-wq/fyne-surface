from pathlib import Path
from zipfile import ZipFile
from pypdf import PdfReader
from PIL import Image,ImageDraw
import re
pdf=Path('C:/Users/Ashu/Downloads/FYN/(c)16x24 Economy Greenwall 16x24 Collection 2025 - FYNE Surfaces.pdf')
archive=Path('C:/Users/Ashu/OneDrive/Pictures/FYN/(c)16x24 Economy Greenwall 16x24 Collection 2025 - FYNE Surfaces.zip')
out=Path('tmp/economy-greenwall-assets'); out.mkdir(parents=True,exist_ok=True)
with ZipFile(archive) as zf:
 for name in zf.namelist():
  if name.endswith('/'): continue
  dest=out/Path(name).name
  if dest.exists(): dest=out/(Path(name).stem+'_'+str(len(list(out.iterdir())))+Path(name).suffix)
  dest.write_bytes(zf.read(name))
r=PdfReader(str(pdf)); print('PAGE_COUNT',len(r.pages))
for i,p in enumerate(r.pages,1):
 text=' '.join((p.extract_text() or '').split())
 print(f'PAGE {i}: {text[:900]}')
thumbs=[]
for path in sorted(out.iterdir(),key=lambda p:(int(re.search(r'\d+',p.stem).group()) if re.search(r'\d+',p.stem) else 999999,p.name)):
 try:
  im=Image.open(path).convert('RGB'); im.thumbnail((100,75)); tile=Image.new('RGB',(120,105),'white'); tile.paste(im,((120-im.width)//2,2)); ImageDraw.Draw(tile).text((3,80),path.name[:18],fill='black'); thumbs.append(tile)
 except: pass
cols=8; sheet=Image.new('RGB',(cols*120,((len(thumbs)+cols-1)//cols)*105),'#ddd')
for i,tile in enumerate(thumbs): sheet.paste(tile,((i%cols)*120,(i//cols)*105))
sheet.save('tmp/economy-greenwall-zip-contact.jpg',quality=85)
