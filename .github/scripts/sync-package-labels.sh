#!/usr/bin/env bash

set -euo pipefail

: "${GITHUB_REPOSITORY:?GITHUB_REPOSITORY is required}"
: "${GH_TOKEN:?GH_TOKEN is required}"
: "${PR_NUMBER:?PR_NUMBER is required}"

changed_files=$(gh api \
  --paginate \
  "repos/$GITHUB_REPOSITORY/pulls/$PR_NUMBER/files" \
  --jq '.[].filename')
current_labels=$(gh api \
  --paginate \
  "repos/$GITHUB_REPOSITORY/issues/$PR_NUMBER/labels" \
  --jq '.[].name')
managed_labels=$(gh api \
  --paginate \
  "repos/$GITHUB_REPOSITORY/labels" \
  --jq '.[] | select((.description // "") | startswith("Package changes: packages/")) | .name')

# Bash 3.2 treats an empty array as unset under `set -u`.
package_labels=('')
shopt -s nullglob

add_package_label() {
  local candidate=$1
  local current

  for current in "${package_labels[@]}"; do
    if [[ "$current" == "$candidate" ]]; then
      return
    fi
  done

  package_labels+=("$candidate")
}

for package_manifest in packages/*/package.json; do
  package_dir=$(dirname "$package_manifest")
  add_package_label "$(basename "$package_dir")"
done

while IFS= read -r file; do
  if [[ "$file" =~ ^packages/([^/]+)/ ]]; then
    add_package_label "${BASH_REMATCH[1]}"
  fi
done <<< "$changed_files"

while IFS= read -r label; do
  if [[ -n "$label" ]]; then
    add_package_label "$label"
  fi
done <<< "$managed_labels"

has_line() {
  local lines=$1
  local expected=$2

  while IFS= read -r line; do
    if [[ "$line" == "$expected" ]]; then
      return 0
    fi
  done <<< "$lines"

  return 1
}

package_changed() {
  local package_name=$1

  while IFS= read -r file; do
    if [[ "$file" == "packages/$package_name/"* ]]; then
      return 0
    fi
  done <<< "$changed_files"

  return 1
}

ensure_label_exists() {
  local label=$1

  if gh api "repos/$GITHUB_REPOSITORY/labels/$label" >/dev/null 2>&1; then
    return
  fi

  gh api \
    --method POST \
    "repos/$GITHUB_REPOSITORY/labels" \
    -f "name=$label" \
    -f 'color=0E8A16' \
    -f "description=Package changes: packages/$label"
}

for label in "${package_labels[@]}"; do
  if [[ -z "$label" ]]; then
    continue
  fi

  if package_changed "$label"; then
    ensure_label_exists "$label"

    if ! has_line "$current_labels" "$label"; then
      gh api \
        --method POST \
        "repos/$GITHUB_REPOSITORY/issues/$PR_NUMBER/labels" \
        -f "labels[]=$label"
      echo "Added $label label"
    fi
  elif has_line "$current_labels" "$label"; then
    gh api \
      --method DELETE \
      "repos/$GITHUB_REPOSITORY/issues/$PR_NUMBER/labels/$label"
    echo "Removed $label label"
  fi
done
