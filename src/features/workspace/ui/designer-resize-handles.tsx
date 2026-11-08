import * as React from "react";
import { cn } from "@/lib/utils";

export interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type HandlePosition = "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w";

interface DesignerResizeHandlesProps {
  bounds: Bounds;
  scale: number;
  onResize: (newBounds: Bounds) => void;
  onResizeEnd: () => void;
}

const HANDLES: { pos: HandlePosition; cursor: string; className: string }[] = [
  { pos: "nw", cursor: "nwse-resize", className: "-top-1 -left-1" },
  { pos: "n", cursor: "ns-resize", className: "-top-1 left-1/2 -translate-x-1/2" },
  { pos: "ne", cursor: "nesw-resize", className: "-top-1 -right-1" },
  { pos: "e", cursor: "ew-resize", className: "top-1/2 -right-1 -translate-y-1/2" },
  { pos: "se", cursor: "nwse-resize", className: "-bottom-1 -right-1" },
  { pos: "s", cursor: "ns-resize", className: "-bottom-1 left-1/2 -translate-x-1/2" },
  { pos: "sw", cursor: "nesw-resize", className: "-bottom-1 -left-1" },
  { pos: "w", cursor: "ew-resize", className: "top-1/2 -left-1 -translate-y-1/2" },
];

export function DesignerResizeHandles({
  bounds,
  scale,
  onResize,
  onResizeEnd,
}: DesignerResizeHandlesProps) {
  const [activeHandle, setActiveHandle] = React.useState<HandlePosition | null>(null);
  const startRef = React.useRef<{
    clientX: number;
    clientY: number;
    bounds: Bounds;
  } | null>(null);

  const handlePointerDown = (pos: HandlePosition, e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);

    setActiveHandle(pos);
    startRef.current = {
      clientX: e.clientX,
      clientY: e.clientY,
      bounds: { ...bounds },
    };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!activeHandle || !startRef.current) return;
    e.stopPropagation();

    const dx = (e.clientX - startRef.current.clientX) / scale;
    const dy = (e.clientY - startRef.current.clientY) / scale;
    const initial = startRef.current.bounds;

    let newX = initial.x;
    let newY = initial.y;
    let newWidth = initial.width;
    let newHeight = initial.height;
    const minSize = 20;

    if (activeHandle.includes("e")) {
      newWidth = Math.max(minSize, Math.round(initial.width + dx));
    }
    if (activeHandle.includes("s")) {
      newHeight = Math.max(minSize, Math.round(initial.height + dy));
    }
    if (activeHandle.includes("w")) {
      const clampedWidth = Math.max(minSize, Math.round(initial.width - dx));
      newX = Math.round(initial.x + (initial.width - clampedWidth));
      newWidth = clampedWidth;
    }
    if (activeHandle.includes("n")) {
      const clampedHeight = Math.max(minSize, Math.round(initial.height - dy));
      newY = Math.round(initial.y + (initial.height - clampedHeight));
      newHeight = clampedHeight;
    }

    onResize({
      x: newX,
      y: newY,
      width: newWidth,
      height: newHeight,
    });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!activeHandle) return;
    e.stopPropagation();
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // Ignored if capture was already released
    }
    setActiveHandle(null);
    startRef.current = null;
    onResizeEnd();
  };

  return (
    <div className="absolute inset-0 pointer-events-none ring-1.5 ring-primary ring-offset-0 z-30">
      {/* 8 Resize Handles */}
      {HANDLES.map(({ pos, cursor, className }) => (
        <div
          key={pos}
          onPointerDown={(e) => handlePointerDown(pos, e)}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          style={{ cursor }}
          className={cn(
            "absolute size-2 bg-background border-[1.5px] border-primary rounded-[1.5px] pointer-events-auto transition-transform hover:scale-125 z-40",
            activeHandle === pos && "scale-125 bg-primary",
            className
          )}
        />
      ))}
    </div>
  );
}
