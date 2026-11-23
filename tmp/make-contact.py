from PIL import Image, ImageOps, ImageDraw
from pathlib import Path
root=Path('tmp/greenwall-extract')
files=sorted(root.rglob('*'), key=lambda p:int(p.stem) if p.stem.isdigit() else 9999)
files=[p for p in files if p.is_file()]
for batch in range((len(files)+25)//26):
    group=files[batch*26:(batch+1)*26]
    w,h=240,300
    sheet=Image.new('RGB',(w*4,h*7),'white')
    d=ImageDraw.Draw(sheet)
    for i,p in enumerate(group):
        im=Image.open(p).convert('RGB'); im.thumbnail((w-12,h-35))
        x=(i%4)*w+(w-im.width)//2; y=(i//4)*h+24
        sheet.paste(im,(x,y)); d.text(((i%4)*w+5,(i//4)*h+5),p.name,fill='black')
    sheet.save(f'tmp/greenwall-contact-{batch+1}.jpg',quality=85)
