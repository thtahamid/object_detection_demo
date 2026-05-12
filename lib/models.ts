export const MODELS = [
  { id: "yolov11n_batch04", file: "yolov11n_batch04.onnx" },
  { id: "yolov11n_batch05", file: "yolov11n_batch05.onnx" },
  { id: "yolov11s_batch06", file: "yolov11s_batch06.onnx" },
] as const;

export type ModelId = (typeof MODELS)[number]["id"];

export const DEFAULT_MODEL_ID: ModelId = MODELS[0].id;

export function modelUrl(id: ModelId): string {
  const m = MODELS.find((x) => x.id === id);
  return `/models/${(m ?? MODELS[0]).file}`;
}
