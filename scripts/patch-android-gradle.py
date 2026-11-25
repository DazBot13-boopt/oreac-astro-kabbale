#!/usr/bin/env python3
"""Patch Capacitor Android gradle: v1+v2 signing + version bump."""
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
        needle = "android {"
        inject = """android {
    signingConfigs {
        getByName("debug") {
            enableV1Signing = true
            enableV2Signing = true
        }
    }
"""
        if needle not in t:
            raise SystemExit("bloc android { introuvable")
        t = t.replace(needle, inject, 1)
    t = t.replace('versionName = "1.0"', 'versionName = "1.1.1"')
    t = t.replace("versionCode = 1", "versionCode = 3")
else:
    if "enableV1Signing" not in t:
        needle = "android {"
        inject = """android {
    signingConfigs {
        debug {
            enableV1Signing true
            enableV2Signing true
        }
    }
"""
        if needle not in t:
            raise SystemExit("bloc android { introuvable")
        t = t.replace(needle, inject, 1)
    t = t.replace('versionName "1.0"', 'versionName "1.1.1"')
    t = t.replace("versionCode 1", "versionCode 3")

p.write_text(t)
print("patched", p)
