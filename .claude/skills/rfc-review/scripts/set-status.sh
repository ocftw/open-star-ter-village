#!/usr/bin/env bash
set -euo pipefail

# Usage: set-status.sh <rfc-file> <new-status>
# Updates the **Status:** field in an RFC file, commits, and pushes.

if [ $# -ne 2 ]; then
  echo "Usage: $0 <rfc-file> <new-status>" >&2
  exit 1
fi

RFC_FILE="$1"
NEW_STATUS="$2"

if [ ! -f "${RFC_FILE}" ]; then
  echo "Error: File not found: ${RFC_FILE}" >&2
  exit 1
fi

CURRENT_STATUS=$(grep -m1 '^\*\*Status:\*\*' "${RFC_FILE}" | sed 's/\*\*Status:\*\* //')

if [ -z "${CURRENT_STATUS}" ]; then
  echo "Error: No **Status:** field found in ${RFC_FILE}" >&2
  exit 1
fi

RFC_NUM=$(basename "${RFC_FILE}" | grep -o '^[0-9]*')
RFC_SLUG=$(basename "${RFC_FILE}" .md | sed 's/^[0-9]*-//')

case "${NEW_STATUS}" in
  "Draft"|"In Review"|"Accepted"|"In Progress"|"Complete"|"Abandoned") ;;
  *) echo "Error: '${NEW_STATUS}' is not a valid RFC status." >&2
     echo "Valid statuses: Draft, In Review, Accepted, In Progress, Complete, Abandoned" >&2
     exit 1 ;;
esac

case "${NEW_STATUS}" in
  "In Review") COMMIT_MSG="docs(rfc): move RFC ${RFC_NUM} to In Review" ;;
  "Accepted")  COMMIT_MSG="docs(rfc): accept RFC ${RFC_NUM} ${RFC_SLUG}" ;;
  "Abandoned") COMMIT_MSG="docs(rfc): abandon RFC ${RFC_NUM} ${RFC_SLUG}" ;;
  *)           COMMIT_MSG="docs(rfc): update RFC ${RFC_NUM} status to ${NEW_STATUS}" ;;
esac

# macOS-compatible in-place sed
sed -i '' "s/^\*\*Status:\*\* .*/**Status:** ${NEW_STATUS}/" "${RFC_FILE}"

git add "${RFC_FILE}"
git commit -m "${COMMIT_MSG}"

# Push — set upstream if none is configured yet
if git rev-parse --abbrev-ref --symbolic-full-name @{u} &>/dev/null; then
  git push
else
  BRANCH=$(git rev-parse --abbrev-ref HEAD)
  REMOTES=$(git remote)
  REMOTE_COUNT=$(echo "${REMOTES}" | grep -c .)
  if [ "${REMOTE_COUNT}" -eq 1 ]; then
    git push -u "${REMOTES}" "${BRANCH}"
  else
    echo "Error: branch '${BRANCH}' has no upstream and multiple remotes exist." >&2
    echo "Run: git push -u <remote> ${BRANCH}" >&2
    exit 1
  fi
fi

echo "✓ Updated status: ${CURRENT_STATUS} → ${NEW_STATUS}"
echo "✓ Committed: ${COMMIT_MSG}"
echo "✓ Pushed to origin"
