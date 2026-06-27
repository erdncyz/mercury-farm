#!/usr/bin/env bash
#
# Commit and push UI changes to BOTH repositories in one step:
#   1. the private UI submodule (./ui -> github.com/erdncyz/mercury-ui)
#   2. the updated submodule pointer in this (public) repository
#
# Usage:
#   npm run ui:commit -- "your commit message"
#
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

MSG="${*:-}"
if [ -z "$MSG" ]; then
  echo "Usage: npm run ui:commit -- \"commit message\"" >&2
  exit 1
fi

if [ ! -f ui/.git ] && [ ! -d ui/.git ]; then
  echo "Error: ./ui is not an initialized submodule. Run: git submodule update --init ui" >&2
  exit 1
fi

# 1) Commit + push the private UI submodule.
git -C ui add -A
if git -C ui diff --cached --quiet; then
  echo "No UI source changes to commit."
else
  git -C ui commit -m "$MSG"
  git -C ui push
  echo "Pushed UI changes to private repo."
fi

# 2) Update the submodule pointer in the public repo (if it moved).
git add ui
if git diff --cached --quiet -- ui; then
  echo "Submodule pointer unchanged; nothing to commit in public repo."
else
  git commit -m "chore(ui): update UI submodule

$MSG"
  git push
  echo "Pushed submodule pointer to public repo."
fi
