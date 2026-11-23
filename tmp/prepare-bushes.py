from pathlib import Path
import json,shutil
manifest=Path('fyne-backend/src/seed/bushes-catalog.json')
rows=json.loads(manifest.read_text(encoding='utf-8'))
src=Path('tmp/bushes-extract/Bushes')
out=Path('fyne-backend/src/seed/assets/bushes')
out.mkdir(parents=True,exist_ok=True)
for row in rows:
    matches=list(src.glob(f'*{row["sourceImage"]}'))
    if len(matches)!=1: raise ValueError(f'Expected one source for {row["sku"]}, got {len(matches)}')
    shutil.copyfile(matches[0],out/row['imageFile'])
print(f'Prepared {len(rows)} SKU-matched bush photos')
