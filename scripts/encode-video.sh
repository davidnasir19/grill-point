#!/usr/bin/env bash
# Usage: scripts/encode-video.sh <input.mp4> <CLIP_ID>
# Seamless-loop 1280px MP4 (H.264) + WebM (VP9 or AV1) + JPEG/WebP posters in public/assets/video.
set -euo pipefail
FFMPEG=""
for c in /opt/homebrew/bin/ffmpeg /usr/local/bin/ffmpeg /usr/bin/ffmpeg; do
  if "$c" -version >/dev/null 2>&1; then FFMPEG="$c"; break; fi
done
[ -n "$FFMPEG" ] || { echo "ffmpeg introuvable" >&2; exit 1; }
FFPROBE="${FFMPEG%ffmpeg}ffprobe"
IN="$1"; ID="$2"; OUT="public/assets/video"; TMP="scratch-video"
CFR="$TMP/${ID}-cfr.mp4"; LOOP="$TMP/${ID}-loop.mp4"; X=0.5
# 1) constant frame rate intermediate (xfade refuses variable-rate sources)
"$FFMPEG" -y -loglevel error -i "$IN" -r 24 -fps_mode cfr -an -c:v libx264 -crf 12 -preset fast -pix_fmt yuv420p "$CFR"
DUR=$("$FFPROBE" -v error -show_entries format=duration -of csv=p=0 "$CFR"); HEAD=$(python3 -c "print(max(0.5, $DUR - $X))")
# 2) the tail (last 0.5 s) crossfades into the head, so the clip ends where it begins
"$FFMPEG" -y -loglevel error -i "$CFR" -i "$CFR" -filter_complex \
  "[0:v]trim=start=${HEAD},setpts=PTS-STARTPTS,fps=24,settb=AVTB,format=yuv420p[t];[1:v]trim=end=${HEAD},setpts=PTS-STARTPTS,fps=24,settb=AVTB,format=yuv420p[h];[t][h]xfade=transition=fade:duration=${X}:offset=0[v]" \
  -map "[v]" -an -c:v libx264 -crf 12 -preset fast -pix_fmt yuv420p "$LOOP"
# 3) deliverables
"$FFMPEG" -y -loglevel error -i "$LOOP" -vf "scale='min(1280,iw)':-2" -c:v libx264 -crf 25 -preset slow -profile:v high -pix_fmt yuv420p -movflags +faststart -an "$OUT/$ID.mp4"
if "$FFMPEG" -hide_banner -encoders 2>/dev/null | grep -q libvpx-vp9; then
  "$FFMPEG" -y -loglevel error -i "$LOOP" -vf "scale='min(1280,iw)':-2" -c:v libvpx-vp9 -crf 33 -b:v 0 -row-mt 1 -deadline good -cpu-used 2 -an "$OUT/$ID.webm"
else
  "$FFMPEG" -y -loglevel error -i "$LOOP" -vf "scale='min(1280,iw)':-2" -c:v libsvtav1 -crf 36 -preset 6 -an "$OUT/$ID.webm" 2>/dev/null
fi
"$FFMPEG" -y -loglevel error -i "$LOOP" -vf "select=eq(n\,12),scale='min(1280,iw)':-2" -frames:v 1 -q:v 3 "$OUT/$ID-poster.jpg"
"$FFMPEG" -y -loglevel error -i "$OUT/$ID-poster.jpg" -c:v libwebp -q:v 80 "$OUT/$ID-poster.webp"
echo "== $ID =="; ls -la "$OUT" | grep "$ID" | awk '{printf "  %7.0f Ko  %s\n", $5/1024, $9}'
