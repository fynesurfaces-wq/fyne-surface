from pathlib import Path
from PIL import Image
for base in [Path('fyne-backend/src/seed/assets'),Path('fyne-storefront/public'),Path('tmp/greenwall-extract')]:
 print('\n',base)
 files=[]
 for p in base.rglob('*'):
  if p.suffix.lower() in ('.jpg','.jpeg','.png','.webp'):
   try:
    w,h=Image.open(p).size
    if w>=600 or h>=600: files.append((w*h,w,h,p))
   except Exception: pass
 for _,w,h,p in sorted(files,reverse=True)[:15]: print(f'{w}x{h}\t{p}')
 print('count>=600:',len(files))
