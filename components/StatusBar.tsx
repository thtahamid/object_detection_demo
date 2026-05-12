"use client";

interface Props {
  phase: "idle" | "loading-model" | "requesting-camera" | "running" | "error";
  fps: number;
  inferMs: number;
  modelProgress: number;
  title: string;
}

const PHASE = {
  idle: { label: "Ready", color: "#8A93A6" },
  "loading-model": { label: "Loading", color: "#F59E0B" },
  "requesting-camera": { label: "Camera", color: "#8A93A6" },
  running: { label: "Live", color: "#10B981" },
  error: { label: "Error", color: "#F43F5E" },
} as const;

export default function StatusBar({ phase, fps, inferMs, title }: Props) {
  const p = PHASE[phase];
  const live = phase === "running";

  return (
    <header className="safe-top relative z-20 px-4 pb-3 pt-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span
            className={`h-1.5 w-1.5 rounded-full ${live ? "" : "pulse-soft"}`}
            style={{ background: p.color }}
            aria-hidden
          />
          <p className="tabular truncate font-display text-sm font-semibold tracking-tight">
            {title}
          </p>
          <span
            className="text-[11px] font-medium uppercase tracking-wider"
            style={{ color: p.color }}
          >
            {p.label}
          </span>
        </div>

        <div className="flex items-center gap-4 text-right">
          <Metric label="FPS" value={live ? fps.toFixed(1) : "—"} />
          <Metric label="ms" value={live ? inferMs.toFixed(0) : "—"} />
        </div>
      </div>
    </header>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-1.5">
      <span className="tabular text-sm font-semibold text-fg">{value}</span>
      <span className="text-[10px] uppercase tracking-wider text-muted">{label}</span>
    </div>
  );
}
