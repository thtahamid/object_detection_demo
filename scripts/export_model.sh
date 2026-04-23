#!/usr/bin/env bash
# Export ai_cv_project's best.pt -> public/models/best.onnx
set -euo pipefail

AI_PROJECT="${AI_PROJECT:-/Users/th/github/ai_cv_project}"
DEST="$(cd "$(dirname "$0")/.." && pwd)/public/models/best.onnx"
WEIGHTS="$AI_PROJECT/weights/best.pt"

if [[ ! -f "$WEIGHTS" ]]; then
  echo "error: $WEIGHTS not found — run notebook 04_model_training.ipynb first" >&2
  exit 1
fi

PY="$AI_PROJECT/.venv/bin/python"
if [[ ! -x "$PY" ]]; then PY="python3"; fi

"$PY" - <<PY
from ultralytics import YOLO
YOLO(r"$WEIGHTS").export(format="onnx", opset=12, dynamic=False, simplify=True, imgsz=640)
PY

cp "$AI_PROJECT/weights/best.onnx" "$DEST"
echo "exported -> $DEST"
