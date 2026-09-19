#!/usr/bin/env python3
"""Compose dark basemap crops centred on Grill Point for the S02 descent scene.
Tiles: CARTO dark_all (© OpenStreetMap contributors © CARTO). Built once, committed as images."""
import io, math, os, time, urllib.request

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

from PIL import Image

LAT, LON = 40.3316166, -74.3065493
ZOOMS = [7, 10, 12, 14, 16]
OUT = os.path.join(os.path.dirname(__file__), "..", "public", "assets", "map")
TILE, R, SIZE = 256, 4, 1536
# Esri World Dark Gray Canvas: free with attribution, no key. Fallback: OSM standard tiles, inverted to a night palette.
ESRI = "https://services.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}"
OSM = "https://tile.openstreetmap.org/{z}/{x}/{y}.png"

def frac(lat, lon, z):
    n = 2 ** z
    lr = math.radians(lat)
    return (lon + 180) / 360 * n, (1 - math.log(math.tan(lr) + 1 / math.cos(lr)) / math.pi) / 2 * n

os.makedirs(OUT, exist_ok=True)
for z in ZOOMS:
    fx, fy = frac(LAT, LON, z)
    cx, cy = int(fx), int(fy)
    mosaic = Image.new("RGB", (TILE * (2 * R + 1),) * 2, (9, 9, 11))
    fails = 0
    for dy in range(-R, R + 1):
        for dx in range(-R, R + 1):
            tx, ty, n = cx + dx, cy + dy, 2 ** z
            if not 0 <= ty < n:
                continue
            tx %= n
            tile = None
            for src in (ESRI, OSM):
                req = urllib.request.Request(src.format(z=z, x=tx, y=ty), headers={"User-Agent": "GrillPointExperience/0.1 (one-time asset build; contact: grillpointnj@gmail.com)"})
                try:
                    tile = Image.open(io.BytesIO(urllib.request.urlopen(req, timeout=30).read())).convert("RGB")
                    if src is OSM:  # daylight tiles -> night palette
                        from PIL import ImageOps, ImageEnhance
                        tile = ImageEnhance.Color(ImageOps.invert(tile)).enhance(0.25)
                        tile = ImageEnhance.Brightness(tile).enhance(0.55)
                    break
                except Exception:
                    continue
            if tile is None:
                fails += 1
            else:
                mosaic.paste(tile, ((dx + R) * TILE, (dy + R) * TILE))
            time.sleep(0.04)
    px, py = (fx - cx + R) * TILE, (fy - cy + R) * TILE
    crop = mosaic.crop((int(px - SIZE / 2), int(py - SIZE / 2), int(px + SIZE / 2), int(py + SIZE / 2)))
    save_avif(crop, f"{OUT}/map-z{z}.avif", 55)
    crop.save(f"{OUT}/map-z{z}.webp", quality=78, method=6)
    crop.save(f"{OUT}/map-z{z}.jpg", quality=84, optimize=True)
    print(f"z{z:<3} tuiles manquantes={fails}  -> map-z{z}.{{avif,webp,jpg}}")
