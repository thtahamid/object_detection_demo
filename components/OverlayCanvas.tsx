"use client";

import { useEffect, useRef } from "react";
import type { Detection } from "@/lib/yolo";
import { CLASS_COLORS } from "@/lib/yolo";

interface Props {
  detections: Detection[];
  videoWidth: number;
  videoHeight: number;
  mirrored: boolean;
}

export default function OverlayCanvas({ detections, videoWidth, videoHeight, mirrored }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !videoWidth || !videoHeight) return;
    if (canvas.width !== videoWidth) canvas.width = videoWidth;
    if (canvas.height !== videoHeight) canvas.height = videoHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    if (mirrored) {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    ctx.lineWidth = Math.max(2, Math.round(videoWidth / 400));
    ctx.font = `600 ${Math.max(14, Math.round(videoWidth / 50))}px Inter, system-ui`;
    ctx.textBaseline = "top";

    for (const d of detections) {
      const color = CLASS_COLORS[d.className] ?? "#22C55E";
      ctx.strokeStyle = color;
      ctx.fillStyle = color + "22";
      ctx.fillRect(d.x, d.y, d.w, d.h);
      ctx.strokeRect(d.x, d.y, d.w, d.h);

      const label = `${d.className.replace("_", " ")} ${(d.score * 100).toFixed(0)}%`;
      const padX = 8;
      const padY = 5;
      const metrics = ctx.measureText(label);
      const tw = metrics.width + padX * 2;
      const th = (metrics.actualBoundingBoxAscent || 14) + (metrics.actualBoundingBoxDescent || 4) + padY * 2;
      const ty = Math.max(0, d.y - th);

      if (mirrored) {
        ctx.save();
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        const mirroredX = canvas.width - (d.x + tw);
        ctx.fillStyle = color;
        ctx.fillRect(mirroredX, ty, tw, th);
        ctx.fillStyle = "#0F172A";
        ctx.fillText(label, mirroredX + padX, ty + padY);
        ctx.restore();
      } else {
        ctx.fillStyle = color;
        ctx.fillRect(d.x, ty, tw, th);
        ctx.fillStyle = "#0F172A";
        ctx.fillText(label, d.x + padX, ty + padY);
      }
    }

    ctx.restore();
  }, [detections, videoWidth, videoHeight, mirrored]);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 h-full w-full object-cover"
    />
  );
}
