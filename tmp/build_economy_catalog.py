from pathlib import Path
from PIL import Image
import json

assets=Path('tmp/economy-greenwall-assets')
out=Path('fyne-backend/src/seed/assets/economy-greenwall')
out.mkdir(parents=True,exist_ok=True)
rows=[
('FYN8041E',11750,'3.png'),('FYN8002E',11750,'2.png'),('FYN8001E',11050,'4.png'),
('FYN8063E',11750,'5.png'),('FYN8064E',11750,'6.png'),('FYN8062E',11750,'7.png'),
('FYN8065E',11750,'10.png'),('FYN8066E-WHITE',14250,'8.png','FYN8066E','White'),('FYN8066E-RED',14250,'9.png','FYN8066E','Red'),
('FYN8050E',13750,'12.png'),('FYN8027E',13250,'13.png'),('FYN8049E',13750,'14.png'),
('FYN8037E',14000,'20.png'),('FYN8024E',12340,'19.png'),('FYN8036E',14000,'18.png'),
('FYN8061E',14000,'21.png'),('FYN8038E',11550,'22.png'),('FYN8060E',12080,'23.jpg'),
('FYN8057E',14500,'26.png'),('FYN8056E',13950,'27.jpg'),('FYN8043E',12950,'28.png'),
('FYN8011E',13500,'31.png'),('FYN8044E',12950,'32.png'),('FYN8012E',13750,'33.png'),
('FYN8045E',12950,'34.png'),('FYN8035E',13250,'35.png'),('FYN8028E',13750,'36.png'),
('FYN8015E',13750,'39.jpg'),('FYN8005E',13750,'37.png'),('FYN8006E',13750,'38.png'),
]
items=[]
for row in rows:
 sku,price,source,*variant=row
 catalog_code=variant[0] if variant else sku
 variant_name=variant[1] if variant else ''
 filename=f'{sku}.webp'
 image=Image.open(assets/source).convert('RGB')
 image.thumbnail((1000,1000),Image.Resampling.LANCZOS)
 image.save(out/filename,'WEBP',quality=84,method=4)
 items.append({'sku':sku,'catalogCode':catalog_code,'name':f'Economy Greenwall Panel {catalog_code}'+(f' - {variant_name}' if variant_name else ''),'variant':variant_name or None,'price':price,'imageFile':filename,'size':'16 x 24 inches','coverage':'2.6 sq ft per piece','application':'Indoor use'})
if len(items)!=30 or len({item['sku'] for item in items})!=len(items): raise ValueError(f'Unexpected item list {len(items)}')
Path('fyne-backend/src/seed/economy-greenwall-catalog.json').write_text(json.dumps(items,indent=2)+'\n',encoding='utf-8')
print('generated',len(items),'assets',round(sum(p.stat().st_size for p in out.glob('*.webp'))/1_000_000,2),'MB')
