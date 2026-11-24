from pathlib import Path
import json

def alpha(index):
    label = ''
    value = index + 1
    while value:
        value, remainder = divmod(value - 1, 26)
        label = chr(65 + remainder) + label
    return label

files = [
    ('fyne-backend/src/seed/premium-greenwall-catalog.json', 'Premium Greenwall'),
    ('fyne-backend/src/seed/exclusive-greenwall-catalog.json', "X'clusive Greenwall"),
    ('fyne-backend/src/seed/economy-greenwall-catalog.json', 'Economy Greenwall'),
]
for relative, collection in files:
    path = Path(relative)
    rows = json.loads(path.read_text(encoding='utf-8'))
    by_kind = {}
    for row in rows:
        kind = 'Tile' if row['sku'].startswith('GZ-') else 'Panel'
        index = by_kind.get(kind, 0)
        row['name'] = f'{collection} {kind} - Design {alpha(index)}'
        by_kind[kind] = index + 1
    path.write_text(json.dumps(rows, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
    print(path, len(rows), by_kind)
