#!/usr/bin/env bash
# Usage: scripts/extract-frames.sh <input.mp4> <CLIP_ID> [frames=48]
# Builds a scroll-scrub sequence: WebP frames at 1280 and 720 px in public/assets/seq/<ID>/<w>/NNN.webp
set -euo pipefail
FFMPEG=""
for c in /opt/homebrew/bin/ffmpeg /usr/local/bin/ffmpeg /usr/bin/ffmpeg; do
  if "$c" -version >/dev/null 2>&1; then FFMPEG="$c"; break; fi
done
[ -n "$FFMPEG" ] || { echo "ffmpeg introuvable" >&2; exit 1; }
FFPROBE="${FFMPEG%ffmpeg}ffprobe"
IN="$1"; ID="$2"; N="${3:-48}"; Q1="${4:-60}"; OUT="public/assets/seq/$ID"
DUR=$("$FFPROBE" -v error -show_entries format=duration -of csv=p=0 "$IN")
FPS=$(python3 -c "print(round($N/$DUR, 4))")
for W in 1280 720; do
  Q=$([ "$W" = 1280 ] && echo "$Q1" || echo $((Q1-6)))
  mkdir -p "$OUT/$W"; rm -f "$OUT/$W"/*.webp
  "$FFMPEG" -y -loglevel error -i "$IN" -vf "fps=${FPS},scale=${W}:-2:flags=lanczos" -frames:v "$N" \
    -c:v libwebp -quality "$Q" -compression_level 6 -preset picture -start_number 0 "$OUT/$W/%03d.webp"
done
A=$(ls "$OUT/1280" | wc -l | tr -d ' '); K1=$(du -sk "$OUT/1280" | cut -f1); K2=$(du -sk "$OUT/720" | cut -f1)
python3 -c "import json,sys; json.dump({'frames':int(sys.argv[1]),'widths':[1280,720]}, open(sys.argv[2]+'/index.json','w'))" "$A" "$OUT"
printf "%-16s %3s images | 1280: %4s Ko (%s Ko/img) | 720: %4s Ko\n" "$ID" "$A" "$K1" "$((K1/A))" "$K2"
