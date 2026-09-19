#!/usr/bin/env bash
# Usage: scripts/stabilize.sh <in.mp4> <out.mp4> [smoothing=40] [zoom=4]
# Two-pass vidstab: removes the wobble while keeping the intended camera move.
set -euo pipefail
FFMPEG=""
for c in /opt/homebrew/bin/ffmpeg /usr/local/bin/ffmpeg /usr/bin/ffmpeg; do
  if "$c" -version >/dev/null 2>&1; then FFMPEG="$c"; break; fi
done
[ -n "$FFMPEG" ] || { echo "ffmpeg introuvable" >&2; exit 1; }
FFPROBE="${FFMPEG%ffmpeg}ffprobe"
IN="$1"; OUT="$2"; SM="${3:-40}"; ZOOM="${4:-4}"
TRF=$(mktemp -t trf).trf
"$FFMPEG" -y -loglevel error -i "$IN" -vf "vidstabdetect=shakiness=10:accuracy=15:stepsize=6:result=$TRF" -f null -
"$FFMPEG" -y -loglevel error -i "$IN" \
  -vf "vidstabtransform=input=$TRF:smoothing=$SM:zoom=$ZOOM:optzoom=0:interpol=bicubic:crop=black,unsharp=5:5:0.6:3:3:0.4" \
  -c:v libx264 -crf 14 -preset slow -pix_fmt yuv420p -an "$OUT"
rm -f "$TRF"
