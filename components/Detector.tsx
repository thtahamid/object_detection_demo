"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { YoloDetector, CLASSES, CLASS_COLORS, type Detection, type ClassName } from "@/lib/yolo";
import { MODELS, DEFAULT_MODEL_ID, modelUrl, type ModelId } from "@/lib/models";
import StatusBar from "@/components/StatusBar";
import ControlDock from "@/components/ControlDock";
import OverlayCanvas from "@/components/OverlayCanvas";
import ClassLegend from "@/components/ClassLegend";
import ModelGate from "@/components/ModelGate";
import { AlertIcon, CLASS_ICONS, SparkleIcon } from "@/components/Icons";

const MODEL_STORAGE_KEY = "yolo-vision:model-id";
const isModelId = (s: string): s is ModelId => MODELS.some((m) => m.id === s);

type Phase = "idle" | "loading-model" | "requesting-camera" | "running" | "error";

export default function Detector() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const detectorRef = useRef<YoloDetector | null>(null);
  const rafRef = useRef<number | null>(null);
  const runningRef = useRef(false);
  const lastStatsRef = useRef({ t: 0, frames: 0, infer: 0 });

  const [phase, setPhase] = useState<Phase>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [modelProgress, setModelProgress] = useState(0);
  const [detections, setDetections] = useState<Detection[]>([]);
  const [videoSize, setVideoSize] = useState({ w: 0, h: 0 });
  const [fps, setFps] = useState(0);
  const [inferMs, setInferMs] = useState(0);
  const [confidence, setConfidence] = useState(0.35);
  const [iou, setIou] = useState(0.45);
  const [counts, setCounts] = useState<Record<ClassName, number>>(() => emptyCounts());
  const [hasModel, setHasModel] = useState<boolean | null>(null);
  const [modelId, setModelId] = useState<ModelId>(DEFAULT_MODEL_ID);
  const loadedModelIdRef = useRef<ModelId | null>(null);

  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem(MODEL_STORAGE_KEY) : null;
    if (stored && isModelId(stored)) setModelId(stored);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(MODEL_STORAGE_KEY, modelId);
    } catch {
      /* ignore quota / private-mode errors */
    }
  }, [modelId]);

  useEffect(() => {
    fetch(modelUrl(modelId), { method: "HEAD" })
      .then((r) => setHasModel(r.ok))
      .catch(() => setHasModel(false));
  }, [modelId]);

  const stop = useCallback(() => {
    runningRef.current = false;
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    const v = videoRef.current;
    const s = v?.srcObject as MediaStream | null;
    s?.getTracks().forEach((t) => t.stop());
    if (v) v.srcObject = null;
    setPhase("idle");
    setDetections([]);
    setCounts(emptyCounts());
  }, []);

  const start = useCallback(async (overrideModelId?: ModelId) => {
    setErrorMsg(null);
    const id = overrideModelId ?? modelId;
    try {
      const stale = loadedModelIdRef.current !== id;
      if (!detectorRef.current?.ready || stale) {
        if (stale && detectorRef.current) {
          await detectorRef.current.dispose();
          detectorRef.current = null;
        }
        setPhase("loading-model");
        setModelProgress(0);
        const det = new YoloDetector();
        await det.load(modelUrl(id), (p) => setModelProgress(p));
        detectorRef.current = det;
        loadedModelIdRef.current = id;
      }

      setPhase("requesting-camera");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
      const v = videoRef.current!;
      v.srcObject = stream;
      v.setAttribute("playsinline", "true");
      await v.play();
      setVideoSize({ w: v.videoWidth, h: v.videoHeight });

      setPhase("running");
      runningRef.current = true;
      lastStatsRef.current = { t: performance.now(), frames: 0, infer: 0 };
      loop();
    } catch (err) {
      console.error(err);
      setErrorMsg(err instanceof Error ? err.message : String(err));
      setPhase("error");
      stop();
    }
  }, [modelId, stop]);

  const loop = useCallback(async () => {
    const v = videoRef.current;
    const det = detectorRef.current;
    if (!v || !det || !runningRef.current) return;
    if (v.readyState < 2) {
      rafRef.current = requestAnimationFrame(loop);
      return;
    }
    try {
      const { detections: out, stats } = await det.detect(
        v,
        v.videoWidth,
        v.videoHeight,
        confidence,
        iou,
      );
      if (!runningRef.current) return;
      setDetections(out);
      setCounts(countByClass(out));

      const s = lastStatsRef.current;
      s.frames += 1;
      s.infer += stats.inferMs;
      const now = performance.now();
      if (now - s.t >= 500) {
        setFps((s.frames * 1000) / (now - s.t));
        setInferMs(s.infer / s.frames);
        lastStatsRef.current = { t: now, frames: 0, infer: 0 };
      }
    } catch (err) {
      console.error(err);
    }
    rafRef.current = requestAnimationFrame(loop);
  }, [confidence, iou]);

  useEffect(() => () => stop(), [stop]);

  const switchModel = useCallback(
    (nextId: ModelId) => {
      if (nextId === modelId) return;
      const wasRunning = runningRef.current;
      if (wasRunning) stop();
      setModelId(nextId);
      if (wasRunning) setTimeout(() => start(nextId), 50);
    },
    [modelId, start, stop],
  );

  if (hasModel === false) {
    return <ModelGate />;
  }

  return (
    <main className="relative flex min-h-[100dvh] flex-col bg-bg text-fg">
      <StatusBar
        phase={phase}
        fps={fps}
        inferMs={inferMs}
        modelProgress={modelProgress}
        title={MODELS.find((m) => m.id === modelId)?.file ?? modelId}
      />

      <div className="hairline relative mx-3 flex-1 overflow-hidden rounded-card bg-bg2">
        <video
          ref={videoRef}
          className="absolute inset-0 h-full w-full object-cover"
          muted
          playsInline
        />

        <OverlayCanvas
          detections={detections}
          videoWidth={videoSize.w}
          videoHeight={videoSize.h}
        />

        {phase === "idle" && <IdleHero />}
        {phase === "loading-model" && <LoadingModel progress={modelProgress} />}
        {phase === "error" && errorMsg && <ErrorView message={errorMsg} onRetry={start} />}
        {phase === "running" && detections.length === 0 && <ScanHint />}
      </div>

      <ClassLegend counts={counts} />

      <ControlDock
        phase={phase}
        onToggle={phase === "running" ? stop : () => start()}
        confidence={confidence}
        onConfidenceChange={setConfidence}
        iou={iou}
        onIouChange={setIou}
        models={MODELS}
        modelId={modelId}
        onModelChange={switchModel}
      />
    </main>
  );
}

function emptyCounts(): Record<ClassName, number> {
  return CLASSES.reduce(
    (acc, c) => ({ ...acc, [c]: 0 }),
    {} as Record<ClassName, number>,
  );
}

function countByClass(dets: Detection[]): Record<ClassName, number> {
  const out = emptyCounts();
  for (const d of dets) out[d.className] = (out[d.className] ?? 0) + 1;
  return out;
}

function IdleHero() {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-8 bg-bg2 px-6 text-center">
      <div className="hairline grid h-14 w-14 place-items-center rounded-2xl bg-surface">
        <SparkleIcon className="h-6 w-6 text-fg" />
      </div>

      <div className="space-y-2">
        <h1 className="font-display text-[28px] font-semibold leading-tight tracking-tight text-fg">
          Campus Vision
        </h1>
        <p className="mx-auto max-w-[32ch] text-[13px] leading-relaxed text-muted">
          Real-time YOLOv11 detection. On-device, no uploads.
        </p>
      </div>

      <div className="w-full max-w-[280px] space-y-1.5">
        {CLASSES.map((c) => {
          const color = CLASS_COLORS[c];
          const Icon = CLASS_ICONS[c];
          return (
            <div
              key={c}
              className="hairline flex items-center gap-3 rounded-xl bg-surface/50 px-3 py-2.5"
            >
              <Icon className="h-4 w-4 shrink-0" style={{ color }} />
              <span className="text-left text-[13px] font-medium capitalize text-fg">
                {c.replace("_", " ")}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function LoadingModel({ progress }: { progress: number }) {
  const pct = Math.round(progress * 100);
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 bg-bg2 px-6">
      <div className="relative grid h-12 w-12 place-items-center">
        <div className="absolute inset-0 animate-spin rounded-full border-2 border-white/10 border-t-fg" />
      </div>
      <div className="space-y-1 text-center">
        <p className="text-sm font-medium text-fg">Loading model</p>
        <p className="tabular text-xs text-muted">{pct}%</p>
      </div>
      <div className="h-[2px] w-48 overflow-hidden rounded-full bg-white/8">
        <div
          className="h-full bg-fg transition-[width] duration-150"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function ScanHint() {
  return (
    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-3">
      <div className="relative h-52 w-52">
        <Corner className="absolute left-0 top-0" />
        <Corner className="absolute right-0 top-0 rotate-90" />
        <Corner className="absolute bottom-0 right-0 rotate-180" />
        <Corner className="absolute bottom-0 left-0 -rotate-90" />
      </div>
      <p className="text-[11px] uppercase tracking-[0.14em] text-muted">Scanning</p>
    </div>
  );
}

function Corner({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`h-5 w-5 text-fg/60 ${className ?? ""}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <path d="M3 9V3h6" />
    </svg>
  );
}

function ErrorView({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-bg2 px-6 text-center">
      <div className="hairline grid h-12 w-12 place-items-center rounded-2xl bg-surface">
        <AlertIcon className="h-6 w-6 text-danger" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium text-fg">Something went wrong</p>
        <p className="max-w-[32ch] text-xs text-muted">{message}</p>
      </div>
      <button
        onClick={onRetry}
        className="hairline rounded-full bg-surface px-4 py-2 text-xs font-semibold text-fg transition-colors active:bg-surface2"
      >
        Try again
      </button>
    </div>
  );
}
