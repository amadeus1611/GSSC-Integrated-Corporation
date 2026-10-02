#!/usr/bin/env bash
# One-time setup for the LAYA gate: a local venv with CPU torch and laya (~1 GB with the model, cached by Hugging Face).
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
VENV="${LAYA_VENV:-$HERE/.venv}"
python3 -m venv "$VENV"
"$VENV/bin/pip" install -q torch --index-url https://download.pytorch.org/whl/cpu
"$VENV/bin/pip" install -q "laya>=0.3.20"
"$VENV/bin/python" "$HERE/laya_gate.py" route "Price forty rooms of blackout drapery" >/dev/null
echo "LAYA gate ready: $VENV/bin/python $HERE/laya_gate.py"
