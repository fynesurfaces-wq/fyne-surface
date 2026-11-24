from pathlib import Path
from PIL import Image,ImageDraw
files=sorted(Path('tmp').glob('economy-page-*.jpg'),key=lambda p:int(p.stem.split('-')[-1])); tiles=[]
for p in files:
 im=Image.open(p).convert('RGB'); im.thumbnail((180,250)); t=Image.new('RGB',(200,280),'white'); t.paste(im,((200-im.width)//2,4)); ImageDraw.Draw(t).text((3,258),p.stem,fill='black'); tiles.append(t)
s=Image.new('RGB',(1000,((len(tiles)+4)//5)*280),'#ddd')
for i,t in enumerate(tiles):s.paste(t,((i%5)*200,(i//5)*280))
s.save('tmp/economy-pdf-contact.jpg',quality=85)
