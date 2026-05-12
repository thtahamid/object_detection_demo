// Deep relative path bypasses the "exports" field, which Next 15 webpack
// interprets in a way that hides ./webgpu even though it is declared there.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error -- runtime values only; types come from the side import below.
import * as ortRaw from "../node_modules/onnxruntime-web/dist/ort.webgpu.bundle.min.mjs";
import type * as ort from "onnxruntime-web";
const ortRuntime = ortRaw as typeof ort;

export const CLASSES = ["projector", "whiteboard", "fire_extinguisher", "door_sign"] as const;
export type ClassName = (typeof CLASSES)[number];

export const CLASS_COLORS: Record<ClassName, string> = {
  projector: "#22C55E",
  whiteboard: "#3B82F6",
  fire_extinguisher: "#EF4444",
  door_sign: "#F59E0B",
};

export interface Detection {
  x: number;
  y: number;
  w: number;
  h: number;
  score: number;
  classId: number;
  className: ClassName;
}

export interface InferenceStats {
  preprocessMs: number;
  inferMs: number;
  postprocessMs: number;
  totalMs: number;
}

export class YoloDetector {
  private session: ort.InferenceSession | null = null;
  private inputName = "images";
  private inputSize = 640;

  async load(modelUrl: string, onProgress?: (pct: number) => void): Promise<void> {
    ortRuntime.env.wasm.wasmPaths = "/ort/";
    ortRuntime.env.wasm.numThreads = 1;

    const buf = await fetchWithProgress(modelUrl, onProgress);
    this.session = await ortRuntime.InferenceSession.create(buf, {
      executionProviders: ["webgpu", "wasm"],
      graphOptimizationLevel: "all",
    });
    this.inputName = this.session.inputNames[0] ?? "images";

    console.info("[ort]", {
      requestedEPs: ["webgpu", "wasm"],
      numThreads: ortRuntime.env.wasm.numThreads,
      crossOriginIsolated:
        typeof crossOriginIsolated !== "undefined" ? crossOriginIsolated : "unknown",
      hasWebGPU: typeof navigator !== "undefined" && "gpu" in navigator,
      inputNames: this.session.inputNames,
      outputNames: this.session.outputNames,
    });
  }

  get ready() {
    return this.session !== null;
  }

  get size() {
    return this.inputSize;
  }

  async detect(
    source: HTMLVideoElement | HTMLCanvasElement | HTMLImageElement,
    srcWidth: number,
    srcHeight: number,
    confThreshold: number,
    iouThreshold: number,
  ): Promise<{ detections: Detection[]; stats: InferenceStats }> {
    if (!this.session) throw new Error("Model not loaded");

    const t0 = performance.now();
    const { tensor, scale, padX, padY } = letterboxToTensor(source, this.inputSize);
    const t1 = performance.now();

    const feeds: Record<string, ort.Tensor> = { [this.inputName]: tensor };
    const output = await this.session.run(feeds);
    const outputTensor = output[this.session.outputNames[0]];
    const t2 = performance.now();

    const detections = postprocess(
      outputTensor.data as Float32Array,
      outputTensor.dims,
      confThreshold,
      iouThreshold,
      scale,
      padX,
      padY,
      srcWidth,
      srcHeight,
    );
    const t3 = performance.now();

    return {
      detections,
      stats: {
        preprocessMs: t1 - t0,
        inferMs: t2 - t1,
        postprocessMs: t3 - t2,
        totalMs: t3 - t0,
      },
    };
  }
}

async function fetchWithProgress(
  url: string,
  onProgress?: (pct: number) => void,
): Promise<ArrayBuffer> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Model fetch failed: ${res.status} ${res.statusText}`);
  const total = Number(res.headers.get("content-length")) || 0;
  if (!res.body || !total || !onProgress) return await res.arrayBuffer();
  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let loaded = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) {
      chunks.push(value);
      loaded += value.length;
      onProgress(Math.min(1, loaded / total));
    }
  }
  const buf = new Uint8Array(loaded);
  let offset = 0;
  for (const c of chunks) {
    buf.set(c, offset);
    offset += c.length;
  }
  return buf.buffer;
}

function letterboxToTensor(
  source: CanvasImageSource & { width?: number; height?: number },
  size: number,
): { tensor: ort.Tensor; scale: number; padX: number; padY: number } {
  const srcW =
    (source as HTMLVideoElement).videoWidth ||
    (source as HTMLCanvasElement).width ||
    (source as HTMLImageElement).naturalWidth;
  const srcH =
    (source as HTMLVideoElement).videoHeight ||
    (source as HTMLCanvasElement).height ||
    (source as HTMLImageElement).naturalHeight;

  const scale = Math.min(size / srcW, size / srcH);
  const newW = Math.round(srcW * scale);
  const newH = Math.round(srcH * scale);
  const padX = Math.floor((size - newW) / 2);
  const padY = Math.floor((size - newH) / 2);

  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  ctx.fillStyle = "rgb(114,114,114)";
  ctx.fillRect(0, 0, size, size);
  ctx.drawImage(source, padX, padY, newW, newH);
  const img = ctx.getImageData(0, 0, size, size).data;

  const plane = size * size;
  const data = new Float32Array(3 * plane);
  for (let i = 0, j = 0; i < img.length; i += 4, j++) {
    data[j] = img[i] / 255;
    data[j + plane] = img[i + 1] / 255;
    data[j + plane * 2] = img[i + 2] / 255;
  }

  return {
    tensor: new ortRuntime.Tensor("float32", data, [1, 3, size, size]),
    scale,
    padX,
    padY,
  };
}

function postprocess(
  data: Float32Array,
  dims: readonly number[],
  confThreshold: number,
  iouThreshold: number,
  scale: number,
  padX: number,
  padY: number,
  srcW: number,
  srcH: number,
): Detection[] {
  const channels = dims[1];
  const numBoxes = dims[2];
  const numClasses = channels - 4;

  const boxes: number[][] = [];
  const scores: number[] = [];
  const classIds: number[] = [];

  for (let i = 0; i < numBoxes; i++) {
    let bestScore = 0;
    let bestClass = -1;
    for (let c = 0; c < numClasses; c++) {
      const s = data[(4 + c) * numBoxes + i];
      if (s > bestScore) {
        bestScore = s;
        bestClass = c;
      }
    }
    if (bestScore < confThreshold || bestClass < 0) continue;

    const cx = data[0 * numBoxes + i];
    const cy = data[1 * numBoxes + i];
    const w = data[2 * numBoxes + i];
    const h = data[3 * numBoxes + i];

    const x1 = ((cx - w / 2 - padX) / scale) | 0;
    const y1 = ((cy - h / 2 - padY) / scale) | 0;
    const x2 = ((cx + w / 2 - padX) / scale) | 0;
    const y2 = ((cy + h / 2 - padY) / scale) | 0;

    const cx1 = Math.max(0, Math.min(srcW, x1));
    const cy1 = Math.max(0, Math.min(srcH, y1));
    const cx2 = Math.max(0, Math.min(srcW, x2));
    const cy2 = Math.max(0, Math.min(srcH, y2));
    if (cx2 <= cx1 || cy2 <= cy1) continue;

    boxes.push([cx1, cy1, cx2, cy2]);
    scores.push(bestScore);
    classIds.push(bestClass);
  }

  const keep = nms(boxes, scores, iouThreshold);
  return keep.map((idx) => {
    const [x1, y1, x2, y2] = boxes[idx];
    const classId = classIds[idx];
    const className = (CLASSES[classId] ?? "unknown") as ClassName;
    return {
      x: x1,
      y: y1,
      w: x2 - x1,
      h: y2 - y1,
      score: scores[idx],
      classId,
      className,
    };
  });
}

function nms(boxes: number[][], scores: number[], iouThreshold: number): number[] {
  const order = scores
    .map((s, i) => [s, i] as const)
    .sort((a, b) => b[0] - a[0])
    .map(([, i]) => i);
  const keep: number[] = [];
  const suppressed = new Set<number>();

  for (const i of order) {
    if (suppressed.has(i)) continue;
    keep.push(i);
    for (const j of order) {
      if (j === i || suppressed.has(j)) continue;
      if (iou(boxes[i], boxes[j]) > iouThreshold) suppressed.add(j);
    }
  }
  return keep;
}

function iou(a: number[], b: number[]): number {
  const x1 = Math.max(a[0], b[0]);
  const y1 = Math.max(a[1], b[1]);
  const x2 = Math.min(a[2], b[2]);
  const y2 = Math.min(a[3], b[3]);
  const inter = Math.max(0, x2 - x1) * Math.max(0, y2 - y1);
  const aArea = (a[2] - a[0]) * (a[3] - a[1]);
  const bArea = (b[2] - b[0]) * (b[3] - b[1]);
  const union = aArea + bArea - inter;
  return union > 0 ? inter / union : 0;
}
