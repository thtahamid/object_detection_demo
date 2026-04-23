"use client";

import { CLASSES, CLASS_COLORS } from "@/lib/yolo";
import { CLASS_ICONS, DownloadIcon } from "@/components/Icons";

export default function ModelGate() {
  return (
    <main className="safe-top safe-bottom mx-auto flex min-h-[100dvh] max-w-md flex-col gap-7 px-5 py-8">
      <div className="flex items-center gap-2">
        <span className="h-1.5 w-1.5 rounded-full bg-loading pulse-soft" />
        <p className="font-display text-sm font-semibold tracking-tight">YOLO·Vision</p>
        <span className="text-[11px] uppercase tracking-wider text-loading">Setup</span>
      </div>

      <div className="space-y-2">
        <h1 className="font-display text-[26px] font-semibold leading-tight tracking-tight">
          Add your trained model
        </h1>
        <p className="text-[13px] leading-relaxed text-muted">
          The app loads YOLOv11 weights from{" "}
          <code className="tabular rounded bg-surface px-1.5 py-0.5 text-[11px] text-fg">
            public/models/best.onnx
          </code>{" "}
          and runs every frame on-device.
        </p>
      </div>

      <div className="space-y-1.5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
          Detects
        </p>
        {CLASSES.map((c) => {
          const color = CLASS_COLORS[c];
          const Icon = CLASS_ICONS[c];
          return (
            <div
              key={c}
              className="hairline flex items-center gap-3 rounded-xl bg-surface/50 px-3 py-2.5"
            >
              <Icon className="h-4 w-4 shrink-0" style={{ color }} />
              <span className="text-[13px] font-medium capitalize text-fg">
                {c.replace("_", " ")}
              </span>
            </div>
          );
        })}
      </div>

      <div className="space-y-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
          Steps
        </p>
        <Step n={1} title="Train the model">
          Run <code className="tabular text-fg">notebooks/04_model_training.ipynb</code> in
          ai_cv_project to produce <code className="tabular text-fg">weights/best.pt</code>.
        </Step>
        <Step n={2} title="Export to ONNX">
          <pre className="tabular mt-1.5 overflow-x-auto rounded-lg bg-bg p-2.5 text-[10.5px] leading-relaxed text-muted">
{`bash scripts/export_model.sh`}
          </pre>
        </Step>
        <Step n={3} title="Reload this page" />
      </div>

      <button
        onClick={() => location.reload()}
        className="mt-1 flex items-center justify-center gap-2 rounded-full bg-accent py-3 text-sm font-semibold text-bg transition-transform active:scale-[0.98]"
      >
        <DownloadIcon className="h-4 w-4" />
        Reload
      </button>
    </main>
  );
}

function Step({ n, title, children }: { n: number; title: string; children?: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <div className="hairline grid h-6 w-6 shrink-0 place-items-center rounded-full bg-surface text-[11px] font-semibold text-fg">
        {n}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-medium text-fg">{title}</p>
        {children && <div className="mt-0.5 text-xs text-muted">{children}</div>}
      </div>
    </div>
  );
}
