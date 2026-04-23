"use client";

import { CLASSES, CLASS_COLORS, type ClassName } from "@/lib/yolo";
import { CLASS_ICONS } from "@/components/Icons";

interface Props {
  counts: Record<ClassName, number>;
}

export default function ClassLegend({ counts }: Props) {
  return (
    <div className="relative z-10 px-3 pt-2">
      <div className="grid grid-cols-4 gap-2">
        {CLASSES.map((c) => (
          <ClassChip key={c} name={c} count={counts[c]} />
        ))}
      </div>
    </div>
  );
}

function ClassChip({ name, count }: { name: ClassName; count: number }) {
  const color = CLASS_COLORS[name];
  const Icon = CLASS_ICONS[name];
  const active = count > 0;
  const label = name.replace("_", " ");

  return (
    <div
      className="hairline relative overflow-hidden rounded-card bg-surface/60 px-2.5 py-2.5 transition-colors duration-200"
      style={active ? { borderColor: `${color}66` } : undefined}
    >
      <div className="flex items-center justify-between">
        <Icon
          className="h-4 w-4"
          style={{ color: active ? color : "#8A93A6" }}
        />
        <span
          className="tabular text-sm font-semibold"
          style={{ color: active ? color : "#8A93A6" }}
        >
          {count}
        </span>
      </div>
      <p
        className={`mt-1.5 truncate text-[10.5px] font-medium uppercase tracking-wide ${
          active ? "text-fg" : "text-muted"
        }`}
      >
        {label}
      </p>
    </div>
  );
}
