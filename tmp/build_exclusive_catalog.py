from pathlib import Path
from PIL import Image
import json,re

assets=Path('tmp/exclusive-greenwall-assets')
out=Path('fyne-backend/src/seed/assets/exclusive-greenwall')
out.mkdir(parents=True,exist_ok=True)
items=[]
fyn_rows=[
('FYN7017E-A',126500,'6.jpg','1 x 1 m','10.764 sq ft per panel'),('FYN7055E',127500,'7.jpg','1 x 1 m','10.764 sq ft per panel'),
('FYN7023E-A',124000,'9.jpg','1 x 1 m','10.764 sq ft per panel'),('FYN7056E',129500,'10.jpg','1 x 1 m','10.764 sq ft per panel'),
('FYN7022E',124000,'13.jpg','1 x 1 m','10.764 sq ft per panel'),('FYN7023E',121500,'14.jpg','1 x 1 m','10.764 sq ft per panel'),
('FYN7039E',139500,'15.jpg','1 x 1 m','10.764 sq ft per panel'),('FYN7038E',129500,'16.jpg','1 x 1 m','10.764 sq ft per panel'),
('FYN7030E',139500,'21.jpg','1 x 1 m','10.764 sq ft per panel'),('FYN7031E',139500,'24.jpg','1 x 1 m','10.764 sq ft per panel'),
('FYN7017E',124000,'25.jpg','1 x 1 m','10.764 sq ft per panel'),('FYN7011E',127500,'29.jpg','1 x 1 m','10.764 sq ft per panel'),
('FYN7024E',122500,'33.jpg','1 x 1 m','10.764 sq ft per panel'),('FYN7021E',121000,'34.jpg','1 x 1 m','10.764 sq ft per panel'),
('FYN7034E',124000,'36.jpg','1 x 1 m','10.764 sq ft per panel'),('FYN7035E',127500,'37.jpg','1 x 1 m','10.764 sq ft per panel'),
('FYN7029E',129500,'41.jpg','1 x 1 m','10.764 sq ft per panel'),('FYN9022E',135000,'42.jpg','1 x 1 m','10.764 sq ft per panel'),
('FYN7006E',127500,'44.png','1 x 1 m','10.764 sq ft per panel'),('FYN7016E',127500,'47.png','1 x 1 m','10.764 sq ft per panel'),
('FYN7028E',137000,'50.jpg','1 x 1 m','10.764 sq ft per panel'),('FYN7027E',137000,'51.jpg','1 x 1 m','10.764 sq ft per panel'),
('FYN7013E',125000,'56.png','1 x 1 m','10.764 sq ft per panel'),('FYN7014E',127500,'57.png','1 x 1 m','10.764 sq ft per panel'),
('FYN7020E',134000,'58.jpg','1.5 x 1 m','16.146 sq ft per panel'),('FYN7019E',127500,'59.jpg','1 x 1 m','10.764 sq ft per panel'),
('FYN7025E',129500,'64.png','1 x 1 m','10.764 sq ft per panel'),('FYN7052E',129500,'65.jpg','1 x 1 m','10.764 sq ft per panel'),
('FYN7012E',127500,'71.png','1 x 1 m','10.764 sq ft per panel'),('FYN7026E',127500,'72.png','1 x 1 m','10.764 sq ft per panel'),
('FYN9019E',124000,'76.png','1 x 1 m','10.764 sq ft per panel'),('FYN9050E',127500,'77.png','1 x 1 m','10.764 sq ft per panel'),
('FYN7018E',129500,'80.png','1 x 1 m','10.764 sq ft per panel'),('FYN7015E',127500,'82.png','1 x 1 m','10.764 sq ft per panel'),
('FYN6018E',119000,'83.jpg','2 x 1 m','21.52 sq ft per grill'),('FYN6017E',123000,'84.png','2 x 1 m','21.52 sq ft per grill'),
]
for sku,price,src,size,coverage in fyn_rows:
 image=f'{sku}.webp'; im=Image.open(assets/src).convert('RGB'); im.thumbnail((1000,1000),Image.Resampling.LANCZOS); im.save(out/image,'WEBP',quality=84,method=4)
 items.append({'sku':sku,'catalogCode':sku,'name':f'Xclusive Greenwall Panel {sku}','price':price,'imageFile':image,'size':size,'coverage':coverage,'application':'Indoor and outdoor use','sourcePage':'catalog'})
gz_rows=[
('GZ-1010',125000,'89.jpg','1 x 1 m','10.764 sq ft per tile'),('GZ-1038',125000,'90.jpg','1 x 1 m','10.764 sq ft per tile'),('GZ-3006',116000,'88.jpg','2 x 1 m','21.52 sq ft per grill'),
('GZ-1049',121000,'94.jpg','1 x 1 m','10.764 sq ft per tile'),('GZ-1047',121000,'95.jpg','1 x 1 m','10.764 sq ft per tile'),('GZ-1051',126250,'96.jpg','1 x 1 m','10.764 sq ft per tile'),
('GZ-1048',124000,'4.jpg','1 x 1 m','10.764 sq ft per tile'),('GZ-1043',123000,'100.jpg','1 x 1 m','10.764 sq ft per tile'),('GZ-1046',125000,'101.jpg','1 x 1 m','10.764 sq ft per tile'),
('GZ-1044',123000,'105.jpg','1 x 1 m','10.764 sq ft per tile'),('GZ-1045',125000,'106.jpg','1 x 1 m','10.764 sq ft per tile'),('GZ-1054',126250,'107.jpg','1 x 1 m','10.764 sq ft per tile'),
('GZ-1053',126250,'111.jpg','1 x 1 m','10.764 sq ft per tile'),('GZ-1050',126250,'112.jpg','1 x 1 m','10.764 sq ft per tile'),('GZ-1001',121000,'113.jpg','1 x 1 m','10.764 sq ft per tile'),
('GZ-1021',123000,'114.jpg','1 x 1 m','10.764 sq ft per tile'),('GZ-1008',124000,'115.jpg','1 x 1 m','10.764 sq ft per tile'),('GZ-1005',125000,'116.png','1 x 1 m','10.764 sq ft per tile'),
('GZ-1006',125000,'117.png','1 x 1 m','10.764 sq ft per tile'),('GZ-1004',121000,'118.png','1 x 1 m','10.764 sq ft per tile'),('GZ-1002',121000,'119.jpg','1 x 1 m','10.764 sq ft per tile'),
]
for sku,price,src,size,coverage in gz_rows:
 image=f'{sku}.webp'; im=Image.open(assets/src).convert('RGB'); im.thumbnail((1000,1000),Image.Resampling.LANCZOS); im.save(out/image,'WEBP',quality=84,method=4)
 items.append({'sku':sku,'catalogCode':sku,'name':f'Xclusive Greenwall Tile {sku}','price':price,'imageFile':image,'size':size,'coverage':coverage,'application':'Indoor and outdoor use','sourcePage':'catalog'})
if len(items)!=57 or len({p['sku'] for p in items})!=len(items): raise ValueError((len(items),len({p['sku'] for p in items})))
Path('fyne-backend/src/seed/exclusive-greenwall-catalog.json').write_text(json.dumps(items,indent=2)+'\n',encoding='utf-8')
print('generated',len(items),'assets',sum(p.stat().st_size for p in out.glob('*.webp'))/1_000_000,'MB')
