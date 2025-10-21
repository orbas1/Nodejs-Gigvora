#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")"/../../../.. && pwd)"
FLUTTER_DIR="$ROOT_DIR/gigvora-flutter-phoneapp"

pushd "$FLUTTER_DIR" >/dev/null
melos bootstrap
melos run test:user_unit
melos run test:user_widget
melos run test:user_integration
melos run test:provider_unit
melos run test:provider_widget
melos run test:provider_integration
popd >/dev/null

echo "Flutter user/provider app tests completed."
