"use client";

import { useState } from "react";
import { FlipIcon, PlayIcon, SlidersIcon, StopIcon } from "@/components/Icons";
import type { ModelId } from "@/lib/models";

interface ModelOption {
  id: ModelId;
  file: string;
}

interface Props {
  phase: "idle" | "loading-model" | "requesting-camera" | "running" | "error";
  onToggle: () => void;
  onFlip: () => void;
  confidence: number;
  onConfidenceChange: (v: number) => void;
  iou: number;
  onIouChange: (v: number) => void;
  models: readonly ModelOption[];
  modelId: ModelId;
  onModelChange: (id: ModelId) => void;
}

export default function ControlDock({
  phase,
  onToggle,
  onFlip,
  confidence,
  onConfidenceChange,
  iou,
  onIouChange,
  models,
  modelId,
  onModelChange,
}: Props) {
  const [open, setOpen] = useState(false);
  const running = phase === "running";
  const busy = phase === "loading-model" || phase === "requesting-camera";

  return (
    <div className="safe-bottom relative z-20 px-4 pt-2">
      {open && (
        <div className="hairline mb-3 space-y-4 rounded-card bg-surface/70 p-4">
          <label className="block">
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-xs font-medium text-muted">Model</span>
            </div>
            <select
              value={modelId}
              onChange={(e) => onModelChange(e.target.value as ModelId)}
              className="tabular hairline w-full appearance-none rounded-lg bg-surface px-3 py-2 text-xs font-medium text-fg outline-none focus:bg-surface2"
            >
              {models.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.file}
                </option>
              ))}
            </select>
          </label>
          <Slider
            label="Confidence"
            value={confidence}
            min={0.1}
            max={0.9}
            step={0.05}
            onChange={onConfidenceChange}
            format={(v) => `${Math.round(v * 100)}%`}
          />
          <Slider
            label="IoU"
            value={iou}
            min={0.2}
            max={0.9}
            step={0.05}
            onChange={onIouChange}
            format={(v) => v.toFixed(2)}
          />
        </div>
      )}

      <div className="flex items-center justify-between gap-3 pb-4">
        <IconButton onClick={() => setOpen((o) => !o)} aria-label="Settings" active={open}>
          <SlidersIcon className="h-5 w-5" />
        </IconButton>

        <CaptureButton running={running} busy={busy} onClick={onToggle} />

        <IconButton onClick={onFlip} aria-label="Flip camera">
          <FlipIcon className="h-5 w-5" />
        </IconButton>
      </div>
    </div>
  );
}

function CaptureButton({
  running,
  busy,
  onClick,
}: {
  running: boolean;
  busy: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={busy}
      aria-label={running ? "Stop" : "Start"}
      className={`grid h-16 w-16 place-items-center rounded-full border transition-transform duration-150 active:scale-95 disabled:opacity-60 ${
        running
          ? "border-danger/50 bg-danger text-white"
          : "border-accent/50 bg-accent text-bg"
      }`}
    >
      {running ? (
        <StopIcon className="h-6 w-6" />
      ) : busy ? (
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-current/30 border-t-current" />
      ) : (
        <PlayIcon className="ml-0.5 h-7 w-7" />
      )}
    </button>
  );
}

function IconButton({
  children,
  onClick,
  active,
  "aria-label": ariaLabel,
}: {
  children: React.ReactNode;
  onClick: () => void;
  active?: boolean;
  "aria-label": string;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      className={`hairline grid h-11 w-11 place-items-center rounded-full transition-colors duration-150 active:scale-95 ${
        active ? "bg-surface2 text-fg" : "bg-surface text-muted hover:text-fg"
      }`}
    >
      {children}
    </button>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  format,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  format: (v: number) => string;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <label className="block">
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-xs font-medium text-muted">{label}</span>
        <span className="tabular text-xs font-semibold text-fg">{format(value)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-1 w-full cursor-pointer appearance-none rounded-full outline-none"
        style={{
          background: `linear-gradient(to right, #EDEDEF 0%, #EDEDEF ${pct}%, rgba(255,255,255,0.08) ${pct}%, rgba(255,255,255,0.08) 100%)`,
        }}
      />
    </label>
  );
}
