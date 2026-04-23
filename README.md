# YOLO Vision — Mobile Web Detector

Mobile-first Next.js app that runs a custom-trained **YOLOv11** detector
entirely in the browser (WASM via `onnxruntime-web`) on the device's live
camera feed. No backend, no uploads.

Detects 4 campus classes:

| id | class |
| -- | ----- |
| 0 | projector |
| 1 | whiteboard |
| 2 | fire_extinguisher |
| 3 | door_sign |

## 1. Install

```bash
cd /Users/th/github/object_detection_demo
bun install
```

## 2. Add your trained model

This app expects `public/models/best.onnx`. Export it from the sibling
training project:

```bash
bash scripts/export_model.sh
```

(defaults to `AI_PROJECT=/Users/th/github/ai_cv_project`; override with
`AI_PROJECT=/other/path bash scripts/export_model.sh`.)

If `weights/best.pt` doesn't exist yet, run
`notebooks/04_model_training.ipynb` in `ai_cv_project` first.

## 3. Run

```bash
bun run dev
```

Open the printed `http://<your-lan-ip>:3000` on your phone (same Wi-Fi).
`getUserMedia` requires **HTTPS or localhost** — if you test on a phone
over LAN, either use an HTTPS tunnel (`ngrok http 3000`, `cloudflared`)
or run Chrome with `--unsafely-treat-insecure-origin-as-secure`.

## Tech

- Next.js 15 (app router) + React 19
- Tailwind CSS, Inter, dark-OLED design
- `onnxruntime-web` 1.20 (WASM backend, multi-threaded)
- Letterbox preprocessing + CPU-side NMS
