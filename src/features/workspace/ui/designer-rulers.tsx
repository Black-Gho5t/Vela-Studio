import * as React from "react";
import { cn } from "@/lib/utils";

const RULER_SIZE = 20;

const STEPS = [
  { major: 10, minor: 2 },
  { major: 25, minor: 5 },
  { major: 50, minor: 10 },
  { major: 100, minor: 20 },
  { major: 200, minor: 50 },
  { major: 500, minor: 100 },
  { major: 1000, minor: 200 },
  { major: 2000, minor: 500 },
];

function getRulerStep(scale: number) {
  for (const step of STEPS) {
    if (step.major * scale >= 45) {
      return step;
    }
  }
  return { major: 5000, minor: 1000 };
}

interface DesignerRulersProps {
  viewportRef: React.RefObject<HTMLDivElement | null>;
  scale: number;
  visible: boolean;
  onToggleVisible?: () => void;
  className?: string;
  isLeftSidebarOpen?: boolean;
  isRightSidebarOpen?: boolean;
  activeFrame?: { x: number; y: number; width: number; height: number };
}

export function DesignerRulers({
  viewportRef,
  scale,
  visible,
  onToggleVisible,
  className,
  isLeftSidebarOpen = false,
  isRightSidebarOpen = false,
  activeFrame,
}: DesignerRulersProps) {
  const hCanvasRef = React.useRef<HTMLCanvasElement>(null);
  const vCanvasRef = React.useRef<HTMLCanvasElement>(null);
  const cursorPosRef = React.useRef<{ x: number; y: number } | null>(null);

  const drawRulers = React.useCallback(() => {
    if (!visible) return;

    const viewport = viewportRef.current;
    const hCanvas = hCanvasRef.current;
    const vCanvas = vCanvasRef.current;
    if (!viewport || !hCanvas || !vCanvas) return;

    const hCtx = hCanvas.getContext("2d");
    const vCtx = vCanvas.getContext("2d");
    if (!hCtx || !vCtx) return;

    const dpr = window.devicePixelRatio || 1;
    const viewportRect = viewport.getBoundingClientRect();
    const hRect = hCanvas.getBoundingClientRect();
    const vRect = vCanvas.getBoundingClientRect();

    const hWidth = Math.max(0, Math.floor(hRect.width));
    const vHeight = Math.max(0, Math.floor(vRect.height));

    if (hWidth <= 0 || vHeight <= 0) return;

    const hOffset = hRect.left - viewportRect.left;
    const vOffset = vRect.top - viewportRect.top;

    // Resize horizontal canvas with DPR
    const targetHW = Math.round(hWidth * dpr);
    const targetHH = Math.round(RULER_SIZE * dpr);
    if (hCanvas.width !== targetHW || hCanvas.height !== targetHH) {
      hCanvas.width = targetHW;
      hCanvas.height = targetHH;
    }

    // Resize vertical canvas with DPR
    const targetVW = Math.round(RULER_SIZE * dpr);
    const targetVH = Math.round(vHeight * dpr);
    if (vCanvas.width !== targetVW || vCanvas.height !== targetVH) {
      vCanvas.width = targetVW;
      vCanvas.height = targetVH;
    }

    hCtx.resetTransform();
    hCtx.scale(dpr, dpr);
    vCtx.resetTransform();
    vCtx.scale(dpr, dpr);

    const isDark = document.documentElement.classList.contains("dark");
    const bgColor = isDark ? "rgba(18, 18, 20, 0.95)" : "rgba(255, 255, 255, 0.95)";
    const highlightBg = isDark ? "rgba(14, 165, 233, 0.09)" : "rgba(14, 165, 233, 0.08)";
    const tickColor = isDark ? "rgba(255, 255, 255, 0.15)" : "rgba(0, 0, 0, 0.15)";
    const majorTickColor = isDark ? "rgba(255, 255, 255, 0.35)" : "rgba(0, 0, 0, 0.35)";
    const textColor = isDark ? "rgba(255, 255, 255, 0.6)" : "rgba(0, 0, 0, 0.65)";
    const cursorColor = isDark ? "rgb(56, 189, 248)" : "rgb(2, 132, 199)";

    const rulerFont = "9px Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

    const scrollLeft = viewport.scrollLeft;
    const scrollTop = viewport.scrollTop;

    // Active artboard bounds in canvas coordinates (4000x4000 centered)
    const artboardW = activeFrame?.width ?? 393;
    const artboardH = activeFrame?.height ?? 800;
    const frameX = activeFrame?.x ?? -artboardW / 2;
    const frameY = activeFrame?.y ?? -artboardH / 2;

    const artboardXStart = 2000 + frameX * scale;
    const artboardXEnd = artboardXStart + artboardW * scale;

    const artboardYStart = 2000 + frameY * scale;
    const artboardYEnd = artboardYStart + artboardH * scale;

    const { major, minor } = getRulerStep(scale);

    // Check if cursor is inside the visible canvas area (not over sidebars)
    const vRulerLeft = vRect.left - viewportRect.left;
    const rightSidebarWidth = isRightSidebarOpen ? 256 : 0;
    const isCursorInCanvas =
      cursorPosRef.current !== null &&
      cursorPosRef.current.x >= vRulerLeft &&
      cursorPosRef.current.x <= viewportRect.width - rightSidebarWidth;

    // ── 1. DRAW HORIZONTAL RULER ──────────────────────────────────────────
    hCtx.fillStyle = bgColor;
    hCtx.fillRect(0, 0, hWidth, RULER_SIZE);

    // Active artboard span highlight
    const screenArtboardX1 = Math.max(0, artboardXStart - scrollLeft - hOffset);
    const screenArtboardX2 = Math.min(hWidth, artboardXEnd - scrollLeft - hOffset);
    if (screenArtboardX2 > screenArtboardX1) {
      hCtx.fillStyle = highlightBg;
      hCtx.fillRect(screenArtboardX1, 0, screenArtboardX2 - screenArtboardX1, RULER_SIZE);
    }

    // Calculate visible design range for X
    const minVisibleDesignX = Math.floor(((scrollLeft + hOffset - artboardXStart) / scale) / minor) * minor;
    const maxVisibleDesignX = Math.ceil(((scrollLeft + hOffset + hWidth - artboardXStart) / scale) / minor) * minor;

    hCtx.font = rulerFont;
    hCtx.textBaseline = "top";
    hCtx.textAlign = "left";

    for (let d = minVisibleDesignX; d <= maxVisibleDesignX; d += minor) {
      const screenX = artboardXStart + d * scale - scrollLeft - hOffset;
      if (screenX < -20 || screenX > hWidth + 20) continue;

      const isMajor = Math.abs(d) % major === 0 || d === 0;
      const isHalf = !isMajor && Math.abs(d) % (major / 2) === 0;
      const tickH = isMajor ? 6 : isHalf ? 4 : 2.5;

      hCtx.strokeStyle = isMajor ? majorTickColor : tickColor;
      hCtx.lineWidth = 1;
      hCtx.beginPath();
      hCtx.moveTo(Math.floor(screenX) + 0.5, RULER_SIZE);
      hCtx.lineTo(Math.floor(screenX) + 0.5, RULER_SIZE - tickH);
      hCtx.stroke();

      if (isMajor) {
        hCtx.fillStyle = textColor;
        hCtx.fillText(String(d), Math.floor(screenX) + 3, 2.5);
      }
    }

    // Cursor indicator on horizontal ruler
    if (isCursorInCanvas && cursorPosRef.current) {
      const cursorScreenX = cursorPosRef.current.x - hOffset;
      if (cursorScreenX >= 0 && cursorScreenX <= hWidth) {
        hCtx.strokeStyle = cursorColor;
        hCtx.lineWidth = 1.5;
        hCtx.beginPath();
        hCtx.moveTo(Math.floor(cursorScreenX) + 0.5, 0);
        hCtx.lineTo(Math.floor(cursorScreenX) + 0.5, RULER_SIZE);
        hCtx.stroke();
      }
    }

    // ── 2. DRAW VERTICAL RULER ────────────────────────────────────────────
    vCtx.fillStyle = bgColor;
    vCtx.fillRect(0, 0, RULER_SIZE, vHeight);

    // Active artboard span highlight
    const screenArtboardY1 = Math.max(0, artboardYStart - scrollTop - vOffset);
    const screenArtboardY2 = Math.min(vHeight, artboardYEnd - scrollTop - vOffset);
    if (screenArtboardY2 > screenArtboardY1) {
      vCtx.fillStyle = highlightBg;
      vCtx.fillRect(0, screenArtboardY1, RULER_SIZE, screenArtboardY2 - screenArtboardY1);
    }

    // Calculate visible design range for Y
    const minVisibleDesignY = Math.floor(((scrollTop + vOffset - artboardYStart) / scale) / minor) * minor;
    const maxVisibleDesignY = Math.ceil(((scrollTop + vOffset + vHeight - artboardYStart) / scale) / minor) * minor;

    vCtx.font = rulerFont;
    vCtx.textBaseline = "middle";
    vCtx.textAlign = "left";

    for (let d = minVisibleDesignY; d <= maxVisibleDesignY; d += minor) {
      const screenY = artboardYStart + d * scale - scrollTop - vOffset;
      if (screenY < -20 || screenY > vHeight + 20) continue;

      const isMajor = Math.abs(d) % major === 0 || d === 0;
      const isHalf = !isMajor && Math.abs(d) % (major / 2) === 0;
      const tickW = isMajor ? 6 : isHalf ? 4 : 2.5;

      vCtx.strokeStyle = isMajor ? majorTickColor : tickColor;
      vCtx.lineWidth = 1;
      vCtx.beginPath();
      vCtx.moveTo(RULER_SIZE, Math.floor(screenY) + 0.5);
      vCtx.lineTo(RULER_SIZE - tickW, Math.floor(screenY) + 0.5);
      vCtx.stroke();

      if (isMajor) {
        vCtx.save();
        vCtx.translate(7, Math.floor(screenY));
        vCtx.rotate(-Math.PI / 2);
        vCtx.fillStyle = textColor;
        vCtx.fillText(String(d), 3, 0);
        vCtx.restore();
      }
    }

    // Cursor indicator on vertical ruler
    if (isCursorInCanvas && cursorPosRef.current) {
      const cursorScreenY = cursorPosRef.current.y - vOffset;
      if (cursorScreenY >= 0 && cursorScreenY <= vHeight) {
        vCtx.strokeStyle = cursorColor;
        vCtx.lineWidth = 1.5;
        vCtx.beginPath();
        vCtx.moveTo(0, Math.floor(cursorScreenY) + 0.5);
        vCtx.lineTo(RULER_SIZE, Math.floor(cursorScreenY) + 0.5);
        vCtx.stroke();
      }
    }
  }, [
    scale,
    visible,
    viewportRef,
    isLeftSidebarOpen,
    isRightSidebarOpen,
    activeFrame?.x,
    activeFrame?.y,
    activeFrame?.width,
    activeFrame?.height,
  ]);

  // Hook into viewport scroll and mouse events directly (zero React re-renders)
  React.useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const handleScroll = () => {
      requestAnimationFrame(drawRulers);
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = viewport.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      cursorPosRef.current = { x, y };
      requestAnimationFrame(drawRulers);
    };

    const handleMouseLeave = () => {
      cursorPosRef.current = null;
      requestAnimationFrame(drawRulers);
    };

    viewport.addEventListener("scroll", handleScroll, { passive: true });
    viewport.addEventListener("mousemove", handleMouseMove, { passive: true });
    viewport.addEventListener("mouseleave", handleMouseLeave, { passive: true });
    window.addEventListener("resize", handleScroll);

    // Initial draw
    requestAnimationFrame(drawRulers);

    return () => {
      viewport.removeEventListener("scroll", handleScroll);
      viewport.removeEventListener("mousemove", handleMouseMove);
      viewport.removeEventListener("mouseleave", handleMouseLeave);
      window.removeEventListener("resize", handleScroll);
    };
  }, [drawRulers, viewportRef]);

  // Redraw smoothly during transitions when sidebars open/close or on visible/scale changes
  React.useEffect(() => {
    let startTime: number | null = null;
    let rafId: number;

    const step = (time: number) => {
      if (startTime === null) startTime = time;
      drawRulers();
      if (time - startTime < 350) {
        rafId = requestAnimationFrame(step);
      }
    };

    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, [drawRulers, isLeftSidebarOpen, isRightSidebarOpen]);

  if (!visible) return null;

  return (
    <div className={cn("pointer-events-none absolute inset-0 z-20 overflow-hidden", className)}>
      {/* Corner Box (Intersection) */}
      <button
        type="button"
        onClick={onToggleVisible}
        title="Ocultar reglas (Shift + R)"
        className={cn(
          "pointer-events-auto absolute top-0 z-30 flex size-5 cursor-pointer items-center justify-center border-b border-r border-border/50 bg-background/90 font-mono text-[8px] text-muted-foreground/60 backdrop-blur-xs transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-muted hover:text-foreground",
          isLeftSidebarOpen ? "left-64" : "left-0"
        )}
      >
        px
      </button>

      {/* Top (Horizontal) Ruler */}
      <div
        className={cn(
          "absolute top-0 h-5 border-b border-border/50 bg-background/80 backdrop-blur-xs transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
          isLeftSidebarOpen ? "left-[276px]" : "left-5",
          isRightSidebarOpen ? "right-64" : "right-0"
        )}
      >
        <canvas ref={hCanvasRef} className="h-full w-full block" />
      </div>

      {/* Left (Vertical) Ruler */}
      <div
        className={cn(
          "absolute inset-y-0 top-5 w-5 border-r border-border/50 bg-background/80 backdrop-blur-xs transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
          isLeftSidebarOpen ? "left-64" : "left-0"
        )}
      >
        <canvas ref={vCanvasRef} className="h-full w-full block" />
      </div>
    </div>
  );
}
