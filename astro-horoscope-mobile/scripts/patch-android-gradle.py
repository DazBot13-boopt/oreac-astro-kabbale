#!/usr/bin/env python3
from pathlib import Path

candidates = [
    Path("android/app/build.gradle"),
    Path("android/app/build.gradle.kts"),
]
p = next((c for c in candidates if c.exists()), None)
if not p:
    raise SystemExit("build.gradle introuvable")

t = p.read_text()
if p.suffix == ".kts":
    if "enableV1Signing" not in t:
        t = t.replace(
            "android {",
            """android {
    signingConfigs {
        getByName("debug") {
            enableV1Signing = true
            enableV2Signing = true
        }
    }
""",
            1,
        )
    t = t.replace('versionName = "1.0"', 'versionName = "1.0.0"')
    t = t.replace("versionCode = 1", "versionCode = 1")
else:
    if "enableV1Signing" not in t:
        t = t.replace(
            "android {",
            """android {
    signingConfigs {
        debug {
            enableV1Signing true
            enableV2Signing true
        }
    }
""",
            1,
        )
    t = t.replace('versionName "1.0"', 'versionName "1.0.0"')

p.write_text(t)
print("patched", p)
