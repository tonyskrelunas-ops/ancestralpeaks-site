#!/usr/bin/env bash
# Publishes the REVIEW COPY (ancestralpeaks.com/next.html and the pages beside it) and nothing else.
#
# The live site is the branch "launch". The business-plan build lives on the work branch. The review copy is a set of
# files that sit beside the live pages (next.html, shared/site.next.js, shared/site.next.css, js/peaks-capture.next.js,
# css/plan.css, films/media/long/). This script rebuilds those files from the work branch and puts ONLY them on top of
# launch. It refuses to run if anything outside that set would change.
#
#   tools/publish-review-copy.sh          shows what would change, publishes nothing
#   tools/publish-review-copy.sh --push   publishes, then merges launch back so this branch stays ahead of it
set -euo pipefail
cd "$(dirname "$0")/.."
SET='(^|/)next\.html$|^shared/site\.next\.(js|css)$|^js/peaks-capture\.next\.js$|^css/plan\.css$|^films/media/long/'
SKIP='^versions/|^home-next/|^play/next/'
python3 tools/build-review-copy.py
if ! git diff --quiet || ! git diff --cached --quiet || [ -n "$(git ls-files --others --exclude-standard)" ]; then
  echo "The review files were rebuilt and differ from the last commit. Commit on the work branch first, then run this again."; exit 1
fi
git fetch -q origin launch
LIVE=$(git rev-parse FETCH_HEAD)
IDX=$(mktemp); rm -f "$IDX"
GIT_INDEX_FILE="$IDX" git read-tree "$LIVE"
for f in $(git ls-tree -r --name-only HEAD | grep -E "$SET" | grep -v -E "$SKIP"); do
  GIT_INDEX_FILE="$IDX" git update-index --add --cacheinfo 100644,"$(git rev-parse "HEAD:$f")","$f"
done
TREE=$(GIT_INDEX_FILE="$IDX" git write-tree); rm -f "$IDX"
if [ "$(git rev-parse "$LIVE^{tree}")" = "$TREE" ]; then echo "The review copy on the live site is already up to date."; exit 0; fi
OUTSIDE=$(git diff --name-only "$LIVE" "$TREE" | grep -v -E "$SET" || true)
if [ -n "$OUTSIDE" ]; then echo "Stopping: this would change files that are not review files:"; echo "$OUTSIDE"; exit 1; fi
echo "Review files that would change on the live site:"; git diff --name-status "$LIVE" "$TREE"
if [ "${1:-}" != "--push" ]; then echo "Dry run. Nothing published. Run with --push to publish."; exit 0; fi
C=$(git commit-tree "$TREE" -p "$LIVE" -m "The review copy, updated (only review files change; no live page is touched)")
git push origin "$C:refs/heads/launch"
git fetch -q origin launch
git merge --no-edit -m "Merge the review copy as it stands on the live site" FETCH_HEAD
echo "Published. Push this branch too. GitHub Pages takes two to five minutes; check with ?cb=<anything> on the address."
