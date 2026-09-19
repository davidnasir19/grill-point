#!/usr/bin/env bash
# Regenerates the "public-site" branch: a single commit holding exactly the current working tree,
# with no history — so the audit (kept locally in docs/audit/) never reaches the public repository.
#
#   scripts/prepare-public.sh          then:  git push -f origin public-site:main
set -euo pipefail
cd "$(dirname "$0")/.."
SRC=$(git branch --show-current)
[ "$SRC" = "public-site" ] && { echo "Lancez ce script depuis votre branche de travail, pas depuis public-site." >&2; exit 1; }
[ -z "$(git status --porcelain)" ] || { echo "Validez ou remisez vos modifications avant de publier." >&2; exit 1; }
git branch -D public-site >/dev/null 2>&1 || true
git checkout --orphan public-site --quiet
git add -A
git commit -q -m "Grill Point — experience web cinematique

Site vitrine du restaurant Grill Point (Marlboro, New Jersey). Page unique
pilotee au defilement. Voir README.md."
N=$(git ls-files | wc -l | tr -d ' ')
A=$(git ls-files docs/audit | wc -l | tr -d ' ')
git checkout "$SRC" --quiet
echo "public-site regeneree : $N fichiers, $A fichier d'audit (doit etre 0), 1 commit"
echo "Publiez avec :  git push -f origin public-site:main"
