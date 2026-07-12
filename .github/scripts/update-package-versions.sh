#!/usr/bin/env bash

set -euo pipefail

: "${BASE_SHA:?BASE_SHA is required}"
: "${HEAD_SHA:?HEAD_SHA is required}"
: "${VERSION_TYPE:?VERSION_TYPE is required}"

shopt -s nullglob
package_manifests=(packages/*/package.json)

if (( ${#package_manifests[@]} == 0 )); then
  echo "No packages found under packages/" >&2
  exit 1
fi

for package_manifest in "${package_manifests[@]}"; do
  package_dir=$(dirname "$package_manifest")

  if git diff --quiet "$BASE_SHA...$HEAD_SHA" -- "$package_dir"; then
    echo "$package_dir has no changes; skipping"
    continue
  fi

  npm --prefix "$package_dir" version "$VERSION_TYPE" \
    --no-git-tag-version \
    --ignore-scripts
done
