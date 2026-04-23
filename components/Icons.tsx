import type { ReactElement, SVGProps } from "react";
import type { ClassName } from "@/lib/yolo";

type IconProps = SVGProps<SVGSVGElement>;

const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function ProjectorIcon(p: IconProps) {
  return (
    <svg {...base} {...p}>
      <rect x="2.5" y="7" width="15" height="9" rx="2" />
      <circle cx="13.5" cy="11.5" r="2.5" />
      <circle cx="6" cy="10.5" r="0.7" fill="currentColor" stroke="none" />
      <path d="M17.5 11.5 L21.5 9.5 M17.5 12.5 L21.5 14.5" />
      <path d="M5.5 16 L5.5 18.5 M14.5 16 L14.5 18.5" />
    </svg>
  );
}

export function WhiteboardIcon(p: IconProps) {
  return (
    <svg {...base} {...p}>
      <rect x="3" y="3.5" width="18" height="13" rx="1.5" />
      <path d="M12 16.5 L12 21" />
      <path d="M9 21 L15 21" />
      <path d="M6 7.5 L11 7.5 M6 10 L14 10 M6 12.5 L9 12.5" />
    </svg>
  );
}

export function FireExtinguisherIcon(p: IconProps) {
  return (
    <svg {...base} {...p}>
      <path d="M9 5 L15 5 L15 7 L9 7 Z" />
      <path d="M12 7 L12 9" />
      <rect x="8" y="9" width="8" height="12" rx="2" />
      <path d="M16 11 L19 11 L19 13" />
      <path d="M10 13 L14 13" />
    </svg>
  );
}

export function DoorSignIcon(p: IconProps) {
  return (
    <svg {...base} {...p}>
      <rect x="4" y="4" width="16" height="11" rx="1.5" />
      <path d="M9 8.5 L15 8.5 M8 11 L16 11" />
      <path d="M12 15 L12 17.5" />
      <path d="M9.5 19.5 L14.5 19.5" />
    </svg>
  );
}

export function PlayIcon(p: IconProps) {
  return (
    <svg {...p} viewBox="0 0 24 24" fill="currentColor">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

export function StopIcon(p: IconProps) {
  return (
    <svg {...p} viewBox="0 0 24 24" fill="currentColor">
      <rect x="6" y="6" width="12" height="12" rx="1.5" />
    </svg>
  );
}

export function FlipIcon(p: IconProps) {
  return (
    <svg {...base} {...p}>
      <path d="M15 4h4a2 2 0 0 1 2 2v4" />
      <path d="M21 14v4a2 2 0 0 1-2 2h-4" />
      <path d="M9 20H5a2 2 0 0 1-2-2v-4" />
      <path d="M3 10V6a2 2 0 0 1 2-2h4" />
      <circle cx="12" cy="12" r="2.5" />
    </svg>
  );
}

export function SlidersIcon(p: IconProps) {
  return (
    <svg {...base} {...p}>
      <path d="M4 6h10M4 12h6M4 18h14" />
      <circle cx="18" cy="6" r="2" />
      <circle cx="14" cy="12" r="2" />
      <circle cx="8" cy="18" r="2" />
    </svg>
  );
}

export function SparkleIcon(p: IconProps) {
  return (
    <svg {...base} {...p}>
      <path d="M12 3 L13.6 9 L19.5 10.5 L13.6 12 L12 18 L10.4 12 L4.5 10.5 L10.4 9 Z" />
      <path d="M19 17 L19.7 19.3 L22 20 L19.7 20.7 L19 23 L18.3 20.7 L16 20 L18.3 19.3 Z" />
    </svg>
  );
}

export function AlertIcon(p: IconProps) {
  return (
    <svg {...base} {...p}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v5" />
      <path d="M12 16h.01" />
    </svg>
  );
}

export function DownloadIcon(p: IconProps) {
  return (
    <svg {...base} {...p}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

export const CLASS_ICONS: Record<ClassName, (p: IconProps) => ReactElement> = {
  projector: ProjectorIcon,
  whiteboard: WhiteboardIcon,
  fire_extinguisher: FireExtinguisherIcon,
  door_sign: DoorSignIcon,
};
