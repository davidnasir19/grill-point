#!/usr/bin/env python3
"""Collect every scroll-scrub sequence into src/data/sequences.json."""
import json, os
ROOT = os.path.join(os.path.dirname(__file__), "..", "public", "assets", "seq")
OUT = os.path.join(os.path.dirname(__file__), "..", "src", "data", "sequences.json")
m = {}
for sid in sorted(os.listdir(ROOT)) if os.path.isdir(ROOT) else []:
    d = os.path.join(ROOT, sid)
    if not os.path.isdir(d):
        continue
    n = len([f for f in os.listdir(os.path.join(d, "1280")) if f.endswith(".webp")])
    kb = sum(os.path.getsize(os.path.join(d, w, f)) for w in ("1280", "720") for f in os.listdir(os.path.join(d, w))) // 1024
    m[sid] = {"frames": n, "kb": kb}
    print(f"  {sid:<16} {n:>3} images  {kb:>5} Ko (deux largeurs)")
json.dump(m, open(OUT, "w"), indent=1)
print(f"\n{len(m)} sequences -> src/data/sequences.json")
