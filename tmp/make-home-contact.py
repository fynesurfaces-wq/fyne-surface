from PIL import Image,ImageDraw
from pathlib import Path
files=sorted([p for p in Path('tmp/home-images').rglob('*') if p.is_file()])
w,h=340,300
sheet=Image.new('RGB',(w*3,h*((len(files)+2)//3)),'white'); d=ImageDraw.Draw(sheet)
for i,p in enumerate(files):
 im=Image.open(p).convert('RGBA'); im.thumbnail((w-15,h-40))
 bg=Image.new('RGBA',im.size,'#cccccc'); bg.alpha_composite(im)
 x=(i%3)*w+(w-im.width)//2; y=(i//3)*h+28
 sheet.paste(bg.convert('RGB'),(x,y)); d.text(((i%3)*w+5,(i//3)*h+5),p.name,fill='black')
sheet.save('tmp/home-contact.jpg',quality=90)
