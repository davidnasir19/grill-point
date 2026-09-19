#!/usr/bin/env python3
"""Measure camera shake per clip. Phase correlation gives the translation between consecutive
frames; the JERK (change of that translation) separates a smooth dolly from a shaky one."""
import subprocess, sys, os, tempfile, math
import numpy as np
from PIL import Image

def frames(path, n=40, w=320):
    d = tempfile.mkdtemp()
    dur = float(subprocess.run(['ffprobe','-v','error','-show_entries','format=duration','-of','csv=p=0',path],
                               capture_output=True, text=True).stdout.strip())
    subprocess.run(['ffmpeg','-y','-loglevel','error','-i',path,'-vf',f'fps={n/dur:.4f},scale={w}:-2',
                    '-frames:v',str(n), f'{d}/%03d.png'], check=True)
    return [np.asarray(Image.open(os.path.join(d,f)).convert('L'), dtype=np.float64)
            for f in sorted(os.listdir(d))]

def shift(a, b):
    A, B = np.fft.fft2(a), np.fft.fft2(b)
    R = A * np.conj(B); m = np.abs(R); m[m == 0] = 1e-9
    r = np.fft.ifft2(R / m).real
    iy, ix = np.unravel_index(np.argmax(r), r.shape)
    if ix > a.shape[1] // 2: ix -= a.shape[1]
    if iy > a.shape[0] // 2: iy -= a.shape[0]
    return ix, iy

print(f"{'CLIP':<16} {'derive/img':>11} {'SECOUSSE':>9} {'pic':>7}   verdict")
print('-' * 64)
rows = []
for path in sys.argv[1:]:
    cid = os.path.basename(path).replace('-src.mp4', '').replace('-wide.mp4', '')
    fr = frames(path)
    d = [shift(fr[i-1], fr[i]) for i in range(1, len(fr))]
    jerk = [math.hypot(d[i][0]-d[i-1][0], d[i][1]-d[i-1][1]) for i in range(1, len(d))]
    drift = sum(math.hypot(*v) for v in d) / len(d)
    mj, pj = sum(jerk)/len(jerk), max(jerk)
    verdict = 'TREMBLE' if mj > 2.2 or pj > 9 else ('limite' if mj > 1.4 else 'fluide')
    rows.append((cid, mj, pj))
    print(f"{cid:<16} {drift:>9.2f}px {mj:>8.2f} {pj:>6.1f}   {verdict}")
print('\n(derive = mouvement voulu ; SECOUSSE = variation brusque de ce mouvement, en px sur 320 de large)')
w = max(rows, key=lambda r: r[1])
print(f"\nPlan le plus instable : {w[0]}  (secousse {w[1]:.2f}, pic {w[2]:.1f})")
