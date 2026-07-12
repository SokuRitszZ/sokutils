#!/usr/bin/env bash

set -euo pipefail

: "${BRANCH_NAME:?BRANCH_NAME is required}"
: "${VERSION_TYPE:?VERSION_TYPE is required}"

shopt -s nullglob
package_manifests=(packages/*/package.json)

if (( ${#package_manifests[@]} == 0 )); then
  echo "No packages found under packages/" >&2
  exit 1
fi

if git diff --quiet -- "${package_manifests[@]}"; then
  echo "No package versions changed"
  exit 0
fi

git config user.name "github-actions[bot]"
git config user.email "41898282+github-actions[bot]@users.noreply.github.com"
git add "${package_manifests[@]}"
git commit --message "chore(release): bump package versions ($VERSION_TYPE)"
git push origin "HEAD:$BRANCH_NAME"
