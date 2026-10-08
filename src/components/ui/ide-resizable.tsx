import React, { useState, useEffect, useRef, useCallback } from "react";
import { cn } from "cn";

interface ResizableSidebarProps {
  id: string;
  side: "left" | "right";
  minWidth?: number;
  maxWidth?: number;
  defaultWidth?: number;
  children: React.ReactNode;
  className?: string;
}

export function ResizableSidebar({
  id,
  side,
  minWidth = 150,
  maxWidth = 800,
  defaultWidth = 250,
  children,
  className,
}: ResizableSidebarProps) {
  const [width, setWidth] = useState(() => {
    const saved = localStorage.getItem(`vela-resize-${id}`);
    return saved ? parseInt(saved, 10) : defaultWidth;
  });

  const isDragging = useRef(false);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current = true;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    const startX = e.clientX;
    const startWidth = width;

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      const delta = side === "left" ? e.clientX - startX : startX - e.clientX;
      const newWidth = Math.min(Math.max(startWidth + delta, minWidth), maxWidth);
      setWidth(newWidth);
    };

    const handleMouseUp = () => {
      isDragging.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  }, [width, side, minWidth, maxWidth]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      localStorage.setItem(`vela-resize-${id}`, width.toString());
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [width, id]);

  return (
    <div className={cn("relative flex h-full shrink-0", className)} style={{ width }}>
      <div className="flex-1 h-full w-full overflow-hidden">{children}</div>
      {/* Handle */}
      <div
        onMouseDown={handleMouseDown}
        className={cn(
          "absolute top-0 bottom-0 w-2 cursor-col-resize z-50 flex items-center justify-center group",
          side === "left" ? "-right-1" : "-left-1"
        )}
      >
        <div className="h-full w-px bg-border group-hover:bg-sky-500 transition-colors" />
      </div>
    </div>
  );
}

interface ResizableBottomPanelProps {
  id: string;
  minHeight?: number;
  maxHeight?: number;
  defaultHeight?: number;
  children: React.ReactNode;
  className?: string;
}

export function ResizableBottomPanel({
  id,
  minHeight = 100,
  maxHeight = 800,
  defaultHeight = 250,
  children,
  className,
}: ResizableBottomPanelProps) {
  const [height, setHeight] = useState(() => {
    const saved = localStorage.getItem(`vela-resize-${id}`);
    return saved ? parseInt(saved, 10) : defaultHeight;
  });

  const isDragging = useRef(false);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current = true;
    document.body.style.cursor = "row-resize";
    document.body.style.userSelect = "none";

    const startY = e.clientY;
    const startHeight = height;

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      const delta = startY - e.clientY;
      const newHeight = Math.min(Math.max(startHeight + delta, minHeight), maxHeight);
      setHeight(newHeight);
    };

    const handleMouseUp = () => {
      isDragging.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  }, [height, minHeight, maxHeight]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      localStorage.setItem(`vela-resize-${id}`, height.toString());
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [height, id]);

  return (
    <div className={cn("relative flex w-full shrink-0 flex-col", className)} style={{ height }}>
      {/* Handle */}
      <div
        onMouseDown={handleMouseDown}
        className="absolute left-0 right-0 -top-1 h-2 cursor-row-resize z-50 flex flex-col items-center justify-center group"
      >
        <div className="w-full h-px bg-border group-hover:bg-sky-500 transition-colors" />
      </div>
      <div className="flex-1 w-full h-full overflow-hidden">{children}</div>
    </div>
  );
}
