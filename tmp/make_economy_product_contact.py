from pathlib import Path
from PIL import Image,ImageDraw
items=sorted(Path('fyne-backend/src/seed/assets/economy-greenwall').glob('*.webp'))
cols=6; w=150; h=176; sheet=Image.new('RGB',(cols*w,((len(items)+cols-1)//cols)*h),'#eee')
for i,p in enumerate(items):
 im=Image.open(p).convert('RGB'); im.thumbnail((138,140)); x=(i%cols)*w; y=(i//cols)*h; sheet.paste(im,(x+(w-im.width)//2,y+2)); ImageDraw.Draw(sheet).text((x+4,y+148),p.stem,fill='black')
sheet.save('tmp/economy-products-contact.jpg',quality=88)
