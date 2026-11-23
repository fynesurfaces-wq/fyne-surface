from PIL import Image,ImageDraw
import glob,os
fs=sorted(glob.glob(r'tmp/bushes-extract/Bushes/*.jpg'))
tiles=[]
for f in fs:
 im=Image.open(f).convert('RGB'); w,h=im.size
 crop=im.crop((int(w*.56),0,w,int(h*.22))); crop.thumbnail((200,100)); tiles.append((f,crop.copy()))
out=Image.new('RGB',(1000,125*((len(tiles)+4)//5)),'white'); d=ImageDraw.Draw(out)
for i,(f,im) in enumerate(tiles):
 x=(i%5)*200; y=(i//5)*125; out.paste(im,(x,y)); d.text((x+3,y+102),os.path.basename(f)[-8:],fill='black')
out.save(r'tmp/bushes-labels.png')
print('images',len(fs),'source size',Image.open(fs[0]).size)
