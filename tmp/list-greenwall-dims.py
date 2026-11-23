from pathlib import Path
from PIL import Image
root=Path('tmp/greenwall-extract')
for p in root.rglob('*'):
 if p.is_file():
  try:
   w,h=Image.open(p).size
   print(f'{p.stem}\t{w}x{h}\t{p.name}')
  except: pass
