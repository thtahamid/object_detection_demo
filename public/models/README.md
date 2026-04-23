# Place `best.onnx` here

The app loads its weights from `/models/best.onnx` (i.e. this folder).

## Export from the trained PyTorch checkpoint

```bash
cd /Users/th/github/ai_cv_project
source .venv/bin/activate

python - <<'PY'
from ultralytics import YOLO
YOLO('weights/best.pt').export(
    format='onnx',
    opset=12,
    dynamic=False,
    simplify=True,
    imgsz=640,
)
PY

cp weights/best.onnx /Users/th/github/object_detection_demo/public/models/best.onnx
```

If `weights/best.pt` does not exist yet, run `notebooks/04_model_training.ipynb`
first — it produces that file.

## Class order (must match)

```
0 projector
1 whiteboard
2 fire_extinguisher
3 door_sign
```

This order is hard-coded in `lib/yolo.ts` and must match the order the model was
trained with.
