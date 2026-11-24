from pathlib import Path
from pypdf import PdfReader
from PIL import Image, ImageChops, ImageStat
import hashlib,re

pdf=Path("C:/Users/Ashu/Downloads/FYN/(n)1x1mtr & 2x1mtr - 2026- X'clusive Greenwall Collection 2026- FYNE Surfaces.pdf (4).pdf")
assets=Path('tmp/exclusive-greenwall-assets')
zips={p.name:Image.open(p).convert('RGBA') for p in assets.iterdir() if p.suffix.lower() in ('.png','.jpg','.jpeg')}
hashes={(im.size,hashlib.sha1(im.tobytes()).digest()):name for name,im in zips.items()}
thumbs={name:im.resize((32,32)) for name,im in zips.items()}
reader=PdfReader(str(pdf))
def norm(s):
 s=s.replace('\u00a0',' ')
 s=re.sub(r'(?<=\w) (?=\w)','',s)
 return s
for pn in list(range(4,35))+list(range(36,58)):
 p=reader.pages[pn-1]; chunks=[]
 def visit(text,cm,tm,font,size):
  s=norm(text)
  if s.strip(): chunks.append((round(float(cm[4])),round(float(cm[5])),s.strip()))
 p.extract_text(visitor_text=visit)
 cells={'L':[],'R':[]}
 for x,y,s in chunks:
  if abs(x)<30 or abs(y-850)<10: continue
  cell='L' if x<1000 else 'R'
  cells[cell].append((y,s))
 print('\nPAGE',pn,'TEXT', {k: sorted(v,reverse=True) for k,v in cells.items()})
 for ext in p.images:
  im=ext.image.convert('RGBA'); key=(im.size,hashlib.sha1(im.tobytes()).digest())
  if key in hashes: match=(0,hashes[key])
  else:
   thumb=im.resize((32,32)); diffs=[]
   for name,zthumb in thumbs.items():
    diff=ImageChops.difference(thumb,zthumb)
    diffs.append((sum(ImageStat.Stat(diff).mean)/4,name))
   match=min(diffs)
  if im.width>250 and im.height>250: print(' IMG',ext.name,im.size,'MATCH',match)
