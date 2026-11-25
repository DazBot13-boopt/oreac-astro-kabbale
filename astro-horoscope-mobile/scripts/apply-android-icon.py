#!/usr/bin/env python3
"""Copy app icon into Android mipmap folders."""
from pathlib import Path
try:
    from PIL import Image
except ImportError:
    raise SystemExit("Pillow requis pour l'icône Android")

root = Path(__file__).resolve().parents[1]
src = root / "icon.png"
if not src.exists():
    raise SystemExit("icon.png manquant")

im = Image.open(src).convert("RGBA")
android_res = root / "android" / "app" / "src" / "main" / "res"
sizes = {
    "mipmap-mdpi": 48,
    "mipmap-hdpi": 72,
    "mipmap-xhdpi": 96,
    "mipmap-xxhdpi": 144,
    "mipmap-xxxhdpi": 192,
}
names = ["ic_launcher.png", "ic_launcher_round.png", "ic_launcher_foreground.png"]
for folder, size in sizes.items():
    dest_dir = android_res / folder
    dest_dir.mkdir(parents=True, exist_ok=True)
    resized = im.resize((size, size), Image.Resampling.LANCZOS)
    for name in names:
        resized.save(dest_dir / name)
print("icônes Android appliquées")
