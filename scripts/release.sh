#!/usr/bin/env bash
# Crea el siguiente release de MiONAT en GitHub, sin GitHub Actions.
set -euo pipefail
cd "$(dirname "$0")/.."

if ! command -v gh >/dev/null 2>&1; then
  echo "Instala GitHub CLI: https://cli.github.com/"
  exit 1
fi

LATEST=$(gh release list --limit 1 --json tagName -q '.[0].tagName' 2>/dev/null || true)
if [ -z "$LATEST" ] || [ "$LATEST" = "null" ]; then
  NEXT="v1.0.0"
  RANGE=""
else
  VER="${LATEST#v}"
  MAJOR=$(echo "$VER" | cut -d. -f1)
  MINOR=$(echo "$VER" | cut -d. -f2)
  PATCH=$(echo "$VER" | cut -d. -f3)
  PATCH=$((PATCH + 1))
  NEXT="v${MAJOR}.${MINOR}.${PATCH}"
  RANGE="${LATEST}..HEAD"
fi

if git rev-parse "$NEXT" >/dev/null 2>&1; then
  echo "El tag $NEXT ya existe."
  exit 0
fi

if [ -n "$RANGE" ]; then
  NOTES=$(git log "$RANGE" --pretty=format:'- %s' --no-merges)
else
  NOTES=$(git log -10 --pretty=format:'- %s' --no-merges)
fi

if [ -z "$NOTES" ]; then
  NOTES="- Sin cambios listados desde el release anterior"
fi

gh release create "$NEXT" \
  --target main \
  --title "MiONAT ${NEXT}" \
  --notes "$(printf '## MiONAT %s\n\nRelease creado desde la máquina local.\n\n### Cambios\n%s\n' "$NEXT" "$NOTES")"

echo "Release creado: $NEXT"
