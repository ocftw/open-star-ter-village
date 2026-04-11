#!/usr/bin/env bash
set -euo pipefail

# Usage: echo "<content>" | save-review-summary.sh <nnn>
# Writes stdin to rfc/NNN-progress/YYYY-MM-DD-review-summary.md

if [ $# -ne 1 ]; then
  echo "Usage: echo '<content>' | $0 <nnn>" >&2
  exit 1
fi

NNN="$1"
DATE=$(date +%Y-%m-%d)
PROGRESS_DIR="rfc/${NNN}-progress"
OUTPUT_FILE="${PROGRESS_DIR}/${DATE}-review-summary.md"

mkdir -p "${PROGRESS_DIR}"
cat > "${OUTPUT_FILE}"

echo "✓ Created ${OUTPUT_FILE}"
