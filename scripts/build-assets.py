#!/usr/bin/env python3
"""Responsive image pipeline: real Grill Point photos -> AVIF/WebP/JPEG at 480/1024/2048.
Sources are the originals downloaded during the audit. Writes public/assets/img/manifest.json."""
import json, os, random

import shutil, subprocess
_ENC = None
if shutil.which("ffmpeg"):
    _e = subprocess.run(["ffmpeg", "-hide_banner", "-encoders"], capture_output=True, text=True).stdout
    _ENC = next((c for c in ("libsvtav1", "libaom-av1") if c in _e), None)
def save_avif(im, path, quality=58):
    """AVIF via ffmpeg (Pillow's libavif here has no encoder). Returns False when no AV1 encoder exists."""
    if not _ENC:
        return False
    tmp = path + ".tmp.png"; im.save(tmp)
    crf = str(max(10, int(63 - quality * 0.55)))
    args = ["ffmpeg", "-y", "-loglevel", "error", "-i", tmp, "-frames:v", "1", "-c:v", _ENC, "-pix_fmt", "yuv420p"]
    args += ["-still-picture", "1", "-crf", crf, "-b:v", "0", "-cpu-used", "6"] if _ENC == "libaom-av1" else ["-crf", crf, "-preset", "6"]
    ok = subprocess.run(args + [path], stderr=subprocess.DEVNULL).returncode == 0
    os.remove(tmp)
    return ok

from PIL import Image, ImageFilter, ImageEnhance

SRC = "/private/tmp/claude-501/-Users-loucoufamille-orca-workspaces-APP-App/3f948001-58c7-41b2-be91-12568ef6926f/scratchpad/assets"
OUT = os.path.join(os.path.dirname(__file__), "..", "public", "assets", "img")
WIDTHS = [480, 1024, 2048]

# id: (source file, max output width, treatment)
ASSETS = {
    "facade":        ("2026__03__27__entrance.jpg", 1600, "upscale-grain"),
    "interior-a":    ("2026__03__27__about3.jpg",   1400, "warm"),
    "interior-b":    ("lunch__12.jpg",              1400, "warm"),
    "adana":         ("2026__03__31__1.jpg",        1200, None),
    "falafel":       ("2026__03__31__2.jpg",        1200, None),
    "chicken-shish": ("2026__03__31__3.jpg",        1200, None),
    "mixed-grill":   ("2026__03__31__4.jpg",        1200, None),
    "shawarma-wrap": ("2026__03__31__5.jpg",        1200, None),
    "cat-salads":    ("2026__04__01__salad-2.jpg",        800, None),
    "cat-cold":      ("2026__04__01__cold-appetizers.jpeg", 800, None),
    "cat-hot":       ("2026__04__01__hot-appetizers.jpeg", 800, None),
    "cat-veg":       ("2026__04__01__vegetable-kebab.jpg", 800, None),
    "cat-sides":     ("2026__04__01__side.jpg",           800, None),
    "cat-entrees":   ("2026__04__01__entrees.jpeg",       800, None),
    "cat-wraps":     ("2026__04__01__pita.jpg",           800, None),
    "cat-kids":      ("2026__04__01__kids.jpg",           800, None),
    "cat-sweets":    ("2026__04__01__sweet-corner.jpg",   800, None),
    "cat-drinks":    ("2026__04__01__beverages.jpg",      800, None),
    "mezze":         ("gallery__17.jpg",            1600, None),
    "adana-table":   ("gallery__7.jpg",             1000, None),
    "wrap-table":    ("gallery__13.jpg",             800, None),
}
# macro crops (fractions of source) used as "detail shots" in S06
CROPS = {
    "macro-bulgur": ("2026__03__31__1.jpg", (0.52, 0.18, 0.90, 0.56)),
    "macro-meat":   ("2026__03__31__1.jpg", (0.28, 0.30, 0.66, 0.78)),
    "macro-pepper": ("2026__03__31__1.jpg", (0.10, 0.58, 0.46, 0.94)),
    "macro-chicken":("2026__03__31__3.jpg", (0.42, 0.28, 0.82, 0.68)),
    "macro-rice":   ("2026__03__31__3.jpg", (0.50, 0.55, 0.92, 0.95)),
}

def grain(im, amount=6):
    px = im.load(); w, h = im.size; rnd = random.Random(7)
    for y in range(0, h, 1):
        for x in range(0, w, 1):
            n = rnd.randint(-amount, amount)
            r, g, b = px[x, y]; px[x, y] = (max(0, min(255, r + n)), max(0, min(255, g + n)), max(0, min(255, b + n)))
    return im

def treat(im, mode):
    if mode == "warm":
        r, g, b = im.split(); r = r.point(lambda v: min(255, int(v * 1.04))); b = b.point(lambda v: int(v * 0.96))
        im = Image.merge("RGB", (r, g, b)); im = ImageEnhance.Contrast(im).enhance(1.05)
    return im

def save_variants(im, aid, max_w):
    out = {"variants": [], "aspect": round(im.width / im.height, 4)}
    widths = sorted({w for w in WIDTHS if w <= max_w} | {min(max_w, im.width if im.width >= max_w else max_w)})
    for w in widths:
        h = round(im.height * w / im.width)
        v = im.resize((w, h), Image.LANCZOS)
        if w > im.width * 1.05:  # upscaled -> re-sharpen
            v = v.filter(ImageFilter.UnsharpMask(radius=1.6, percent=90, threshold=2))
        save_avif(v, f"{OUT}/{aid}-{w}.avif", 58)
        v.save(f"{OUT}/{aid}-{w}.webp", quality=80, method=6)
        v.save(f"{OUT}/{aid}-{w}.jpg", quality=84, optimize=True, progressive=True)
        out["variants"].append({"w": w, "h": h})
    return out

os.makedirs(OUT, exist_ok=True)
manifest = {}
for aid, (src, max_w, mode) in ASSETS.items():
    im = Image.open(f"{SRC}/{src}").convert("RGB")
    im = treat(im, mode)
    if mode == "upscale-grain":
        im = im.resize((max_w, round(im.height * max_w / im.width)), Image.LANCZOS)
        im = im.filter(ImageFilter.UnsharpMask(radius=2, percent=110, threshold=2))
        im = grain(im, 5)
    manifest[aid] = save_variants(im, aid, max_w); manifest[aid]["source"] = src
    print(f"{aid:<15} {im.width}x{im.height} -> {[v['w'] for v in manifest[aid]['variants']]}")
for aid, (src, box) in CROPS.items():
    im = Image.open(f"{SRC}/{src}").convert("RGB"); w, h = im.size
    c = im.crop((int(box[0]*w), int(box[1]*h), int(box[2]*w), int(box[3]*h)))
    c = c.resize((1024, round(c.height * 1024 / c.width)), Image.LANCZOS).filter(ImageFilter.UnsharpMask(1.4, 80, 2))
    manifest[aid] = save_variants(c, aid, 1024); manifest[aid]["source"] = src
    print(f"{aid:<15} crop -> 1024")

# signature cut-out: keep dark ink, drop the grey-mauve/white backing
sig = Image.open(f"{SRC}/2026__03__27__signature.png").convert("RGBA")
px = sig.load()
for y in range(sig.height):
    for x in range(sig.width):
        r, g, b, a = px[x, y]; lum = 0.2126*r + 0.7152*g + 0.0722*b
        alpha = 255 if lum < 95 else (0 if lum > 175 else int(255 * (175 - lum) / 80))
        px[x, y] = (46, 30, 22, min(a, alpha))
sig = sig.resize((1200, round(sig.height * 1200 / sig.width)), Image.LANCZOS)
sig.save(f"{OUT}/signature-1200.png", optimize=True); sig.save(f"{OUT}/signature-1200.webp", quality=90, method=6)
manifest["signature"] = {"variants": [{"w": 1200, "h": sig.height}], "aspect": round(1200 / sig.height, 4), "source": "signature.png", "alpha": True}
json.dump(manifest, open(f"{OUT}/manifest.json", "w"), indent=1)
total = sum(os.path.getsize(os.path.join(OUT, f)) for f in os.listdir(OUT))
print(f"\n{len(os.listdir(OUT))} fichiers, {total/1048576:.1f} Mo au total (toutes variantes/formats)")
