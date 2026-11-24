from pathlib import Path
from PIL import Image, ImageDraw
items=sorted(Path('fyne-backend/src/seed/assets/exclusive-greenwall').glob('*.webp'))
cols=7; w=150; h=176; sheet=Image.new('RGB',(cols*w,((len(items)+cols-1)//cols)*h),'#f1f1f1')
for i,p in enumerate(items):
 im=Image.open(p).convert('RGB'); im.thumbnail((138,140)); x=(i%cols)*w; y=(i//cols)*h
 sheet.paste(im,(x+(w-im.width)//2,y+3)); ImageDraw.Draw(sheet).text((x+5,y+147),p.stem,fill='black')
sheet.save('tmp/exclusive-product-contact.jpg',quality=88)
