#!/usr/bin/env python3
"""Importe une traduction FR vers data/interpretations.json

Usage:
  1) Traduis interpretations-EN.json (garde les clés) → sauvegarde interpretations-FR.json ici
     OU traduis les .txt en gardant les balises <<<KEY ...>>> / <<<END>>>
  2) python3 importer-traduction-fr.py
"""
import json, re
from pathlib import Path
from datetime import datetime, timezone

here = Path(__file__).resolve().parent
app = here.parent / 'interpretations.json'

fr_json = here / 'interpretations-FR.json'
en_json = here / 'interpretations-EN.json'

def parse_txt_blocks(path):
    if not path.exists(): return {}
    text = path.read_text(encoding='utf-8')
    out = {}
    for m in re.finditer(r'<<<KEY\s+(\S+)(?:\s+.*?)?>>>\s*(.*?)\s*<<<END>>>', text, re.S):
        out[m.group(1)] = m.group(2).strip()
    return out

data = json.loads(app.read_text(encoding='utf-8')) if app.exists() else {}
base = {
  'version': 1,
  'updatedAt': datetime.now(timezone.utc).isoformat().replace('+00:00','Z'),
  'note': 'Traduction FR importée manuellement',
  'evo': data.get('evo',''), 'inv': data.get('inv',''),
  'bloqueIntro': data.get('bloqueIntro',''), 'fluxOk': data.get('fluxOk',''),
  'sephira': data.get('sephira', {}),
  'planete': {k:'' for k in ['a','b','c','d','e','f','g','h','i','j','Asc']},
  'planeteSeph': data.get('planeteSeph', {}),
  'sentier': data.get('sentier', {}),
  'planeteSigne': {},
  'sabian': {},
}

if fr_json.exists():
    src = json.loads(fr_json.read_text(encoding='utf-8'))
    base['planete'].update({k: v for k,v in (src.get('planete') or {}).items() if v})
    base['planeteSigne'] = src.get('planeteSigne') or {}
    base['sabian'] = src.get('sabian') or {}
else:
    # from txt packs
    for k,v in parse_txt_blocks(here/'01-planetes-FR.txt').items():
        if k.startswith('planete.'):
            base['planete'][k.split('.',1)[1]] = v
    for k,v in parse_txt_blocks(here/'02-planete-signe-FR.txt').items():
        if k.startswith('planeteSigne.'):
            base['planeteSigne'][k.split('.',1)[1]] = v
    for k,v in parse_txt_blocks(here/'03-sabian-FR.txt').items():
        if k.startswith('sabian.'):
            base['sabian'][k.split('.',1)[1]] = v

app.write_text(json.dumps(base, ensure_ascii=False, indent=2), encoding='utf-8')
print('Importé →', app)
print('planetes', sum(1 for v in base['planete'].values() if v))
print('signes', len(base['planeteSigne']))
print('sabian', len(base['sabian']))
