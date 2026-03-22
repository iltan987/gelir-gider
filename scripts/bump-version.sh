#!/usr/bin/env bash
set -euo pipefail

if [ -z "${1:-}" ]; then
  echo "Usage: $0 <version>"
  echo "Example: $0 0.2.0"
  exit 1
fi

VERSION="$1"
ROOT="$(git rev-parse --show-toplevel)"

# Validate semver format
if ! [[ "$VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo "Error: Version must be in semver format (e.g., 1.2.3)"
  exit 1
fi

# Bump package.json (top-level "version" field only, using node for safe JSON editing)
node -e "
  const fs = require('fs');
  const path = '$ROOT/package.json';
  const pkg = JSON.parse(fs.readFileSync(path, 'utf8'));
  pkg.version = '$VERSION';
  fs.writeFileSync(path, JSON.stringify(pkg, null, 2) + '\n');
"
echo "Updated package.json -> $VERSION"

# Bump tauri.conf.json (top-level "version" field only)
node -e "
  const fs = require('fs');
  const path = '$ROOT/src-tauri/tauri.conf.json';
  const conf = JSON.parse(fs.readFileSync(path, 'utf8'));
  conf.version = '$VERSION';
  fs.writeFileSync(path, JSON.stringify(conf, null, 2) + '\n');
"
echo "Updated tauri.conf.json -> $VERSION"

# Bump Cargo.toml ([package] section version only)
sed -i "/^\[package\]/,/^\[/{s/^version = \"[^\"]*\"/version = \"$VERSION\"/}" "$ROOT/src-tauri/Cargo.toml"
echo "Updated Cargo.toml -> $VERSION"

echo ""
echo "Version bumped to $VERSION"
echo "Next: git add -A && git commit -m \"chore: bump version to $VERSION\" && git tag v$VERSION"
