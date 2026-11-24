from pathlib import Path
from PIL import Image,ImageDraw
files=sorted(Path('fyne-backend/src/seed/assets/plants').glob('FYN20*.png'))
sheet=Image.new('RGB',(900,280),'#eee')
for i,p in enumerate(files):
 im=Image.open(p).convert('RGB'); im.thumbnail((90,220)); x=i*100; sheet.paste(im,(x+(100-im.width)//2,3)); ImageDraw.Draw(sheet).text((x+3,235),p.stem,fill='black')
sheet.save('tmp/real-touch-contact.jpg',quality=90)
