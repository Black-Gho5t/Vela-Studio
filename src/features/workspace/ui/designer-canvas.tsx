import * as React from "react";
import {
  Plus,
  Minus,
  Focus,
  Smartphone,
  Hand,
  Ruler,
  Copy,
  Trash2,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DesignerRulers } from "./designer-rulers";
import { DesignerDock, type DesignerTool } from "./designer-dock";
import { Iphone } from "@/components/magicui/iphone";
import { Android } from "@/components/magicui/android";
import type { FramePresetItem } from "./designer-frame-presets";

const CANVAS_SIZE = 4000;
const MIN_SCALE = 0.25;
const MAX_SCALE = 2.0;

export interface CanvasDeviceFrame {
  id: string;
  type: "iphone" | "android";
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

const DEFAULT_FRAMES: CanvasDeviceFrame[] = [
  {
    id: "frame-iphone-default",
    type: "iphone",
    name: "iPhone 16 Pro",
    x: -402 / 2,
    y: -874 / 2,
    width: 402,
    height: 874,
  },
];

interface DesignerCanvasProps {
  children?: React.ReactNode;
  className?: string;
  isLeftSidebarOpen?: boolean;
  isRightSidebarOpen?: boolean;
  activeTool?: DesignerTool;
  onSelectTool?: (tool: DesignerTool) => void;
  frames?: CanvasDeviceFrame[];
  onFramesChange?: (frames: CanvasDeviceFrame[]) => void;
  selectedFrameId?: string;
  onSelectFrameId?: (id: string) => void;
}

export function DesignerCanvas({
  children,
  className,
  isLeftSidebarOpen = true,
  isRightSidebarOpen = true,
  activeTool: externalActiveTool,
  onSelectTool: externalOnSelectTool,
  frames: externalFrames,
  onFramesChange,
  selectedFrameId: externalSelectedFrameId,
  onSelectFrameId,
}: DesignerCanvasProps) {
  const viewportRef = React.useRef<HTMLDivElement>(null);
  const [scale, setScale] = React.useState(1);
  const [showRulers, setShowRulers] = React.useState(true);
  const [internalActiveTool, setInternalActiveTool] = React.useState<DesignerTool>("select");
  const [internalFrames, setInternalFrames] = React.useState<CanvasDeviceFrame[]>(DEFAULT_FRAMES);
  const [internalSelectedFrameId, setInternalSelectedFrameId] = React.useState<string>("frame-iphone-default");
  const [isDragOver, setIsDragOver] = React.useState(false);

  const activeTool = externalActiveTool ?? internalActiveTool;
  const setActiveTool = externalOnSelectTool ?? setInternalActiveTool;

  const frames = externalFrames ?? internalFrames;
  const setFrames = onFramesChange ?? setInternalFrames;

  const selectedFrameId = externalSelectedFrameId ?? internalSelectedFrameId;
  const setSelectedFrameId = onSelectFrameId ?? setInternalSelectedFrameId;

  const [isSpacePressed, setIsSpacePressed] = React.useState(false);
  const [isPanning, setIsPanning] = React.useState(false);
  const isPanningRef = React.useRef(false);
  const panStartRef = React.useRef({ x: 0, y: 0, scrollLeft: 0, scrollTop: 0 });

  // Center the artboard within the viewport
  const centerArtboard = React.useCallback((smooth = true) => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const targetX = (CANVAS_SIZE - viewport.clientWidth) / 2;
    const targetY = (CANVAS_SIZE - viewport.clientHeight) / 2;
    if (targetX >= 0 && targetY >= 0) {
      viewport.scrollTo({
        left: targetX,
        top: targetY,
        behavior: smooth ? "smooth" : "auto",
      });
    }
  }, []);

  // Initial centering on mount
  React.useEffect(() => {
    const frame = requestAnimationFrame(() => {
      centerArtboard(false);
    });
    return () => cancelAnimationFrame(frame);
  }, [centerArtboard]);

  const deleteFrame = React.useCallback(
    (frameId: string) => {
      const nextFrames = frames.filter((f) => f.id !== frameId);
      setFrames(nextFrames);
      if (selectedFrameId === frameId) {
        setSelectedFrameId(nextFrames.length > 0 ? nextFrames[0].id : "");
      }
    },
    [frames, selectedFrameId, setFrames, setSelectedFrameId]
  );

  const selectedFrameIdRef = React.useRef(selectedFrameId);
  selectedFrameIdRef.current = selectedFrameId;

  const deleteFrameRef = React.useRef(deleteFrame);
  deleteFrameRef.current = deleteFrame;

  // Handle keyboard shortcuts (F for frame, V for select, Space for pan, Shift+R for rulers, Backspace/Delete to remove frame)
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable
      ) {
        return;
      }
      if (e.shiftKey && (e.key === "R" || e.key === "r")) {
        e.preventDefault();
        setShowRulers((v) => !v);
        return;
      }
      if (
        e.key === "Backspace" ||
        e.key === "Delete" ||
        e.code === "Backspace" ||
        e.code === "Delete"
      ) {
        if (selectedFrameIdRef.current) {
          e.preventDefault();
          deleteFrameRef.current(selectedFrameIdRef.current);
          return;
        }
      }
      if (!e.ctrlKey && !e.metaKey && !e.altKey) {
        if (e.key === "f" || e.key === "F") {
          e.preventDefault();
          setActiveTool("frame");
          return;
        }
        if (e.key === "v" || e.key === "V" || e.key === "Escape") {
          e.preventDefault();
          setActiveTool("select");
          return;
        }
      }
      if (e.code === "Space" && !e.repeat) {
        e.preventDefault();
        setIsSpacePressed(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        setIsSpacePressed(false);
        if (isPanningRef.current) {
          isPanningRef.current = false;
          setIsPanning(false);
        }
      }
    };

    const handleBlur = () => {
      setIsSpacePressed(false);
      isPanningRef.current = false;
      setIsPanning(false);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("blur", handleBlur);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("blur", handleBlur);
    };
  }, [setActiveTool]);

  // Handle Ctrl/Cmd + Wheel for smooth zooming
  React.useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        setScale((prev) => {
          const next = Math.round((prev + delta) * 10) / 10;
          return Math.min(MAX_SCALE, Math.max(MIN_SCALE, next));
        });
      }
    };

    viewport.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      viewport.removeEventListener("wheel", handleWheel);
    };
  }, []);

  // Pointer drag for canvas panning (Middle click or Space + Left click)
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const isMiddleClick = e.button === 1;
    const isSpaceLeftClick = isSpacePressed && e.button === 0;

    if (isMiddleClick || isSpaceLeftClick) {
      const viewport = viewportRef.current;
      if (!viewport) return;

      e.preventDefault();
      e.stopPropagation();
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);

      isPanningRef.current = true;
      setIsPanning(true);
      panStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        scrollLeft: viewport.scrollLeft,
        scrollTop: viewport.scrollTop,
      };
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isPanningRef.current) return;
    const viewport = viewportRef.current;
    if (!viewport) return;

    e.preventDefault();
    const dx = e.clientX - panStartRef.current.x;
    const dy = e.clientY - panStartRef.current.y;
    viewport.scrollLeft = panStartRef.current.scrollLeft - dx;
    viewport.scrollTop = panStartRef.current.scrollTop - dy;
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isPanningRef.current) {
      isPanningRef.current = false;
      setIsPanning(false);
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // Ignore if capture was already released
      }
    }
  };

  // Drag and drop handling for device frames from sidebar to canvas
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
    if (!isDragOver) setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const raw = e.dataTransfer.getData("application/json");
    if (!raw) return;

    try {
      const preset: FramePresetItem = JSON.parse(raw);
      const viewport = viewportRef.current;
      if (!viewport) return;

      const rect = viewport.getBoundingClientRect();
      const dropScreenX = e.clientX - rect.left;
      const dropScreenY = e.clientY - rect.top;

      const surfaceX = dropScreenX + viewport.scrollLeft;
      const surfaceY = dropScreenY + viewport.scrollTop;

      // Coordinate offset relative to canvas center (2000, 2000)
      const dx = (surfaceX - 2000) / scale - preset.width / 2;
      const dy = (surfaceY - 2000) / scale - preset.height / 2;

      const newFrame: CanvasDeviceFrame = {
        id: `frame-${preset.id}-${Date.now()}`,
        type: preset.type,
        name: preset.name,
        x: Math.round(dx),
        y: Math.round(dy),
        width: preset.width,
        height: preset.height,
      };

      setFrames([...frames, newFrame]);
      setSelectedFrameId(newFrame.id);
      setActiveTool("select");
    } catch (err) {
      console.error("Failed to drop frame:", err);
    }
  };

  // Moving frames smoothly on the canvas via their header handle
  const handleFrameHeaderPointerDown = (
    frameId: string,
    e: React.PointerEvent
  ) => {
    e.stopPropagation();
    setSelectedFrameId(frameId);

    const startX = e.clientX;
    const startY = e.clientY;
    const target = frames.find((f) => f.id === frameId);
    if (!target) return;
    const origX = target.x;
    const origY = target.y;

    const handlePointerMove = (ev: PointerEvent) => {
      const deltaX = (ev.clientX - startX) / scale;
      const deltaY = (ev.clientY - startY) / scale;
      setFrames(
        frames.map((f) =>
          f.id === frameId
            ? { ...f, x: Math.round(origX + deltaX), y: Math.round(origY + deltaY) }
            : f
        )
      );
    };

    const handlePointerUp = () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
  };

  const duplicateFrame = (frameId: string) => {
    const target = frames.find((f) => f.id === frameId);
    if (!target) return;
    const newFrame: CanvasDeviceFrame = {
      ...target,
      id: `frame-${target.type}-${Date.now()}`,
      name: `${target.name} (copia)`,
      x: target.x + 50,
      y: target.y + 50,
    };
    setFrames([...frames, newFrame]);
    setSelectedFrameId(newFrame.id);
  };



  const zoomIn = () => {
    setScale((prev) => Math.min(MAX_SCALE, Math.round((prev + 0.1) * 10) / 10));
  };

  const zoomOut = () => {
    setScale((prev) => Math.max(MIN_SCALE, Math.round((prev - 0.1) * 10) / 10));
  };

  const resetZoom = () => {
    setScale(1);
  };

  const cursorClass = isPanning
    ? "cursor-grabbing"
    : isSpacePressed
      ? "cursor-grab"
      : activeTool === "frame"
        ? "cursor-crosshair"
        : "cursor-default";

  const selectedFrame =
    frames.find((f) => f.id === selectedFrameId) || frames[0];

  return (
    <div
      className={cn("relative h-full w-full overflow-hidden select-none bg-muted/10", className)}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <ScrollArea
        viewportRef={viewportRef}
        className="h-full w-full"
        viewportClassName={cn("relative outline-none", cursorClass)}
      >
        {/* Infinite 2D Surface with dot grid */}
        <div
          style={{
            width: `${CANVAS_SIZE}px`,
            height: `${CANVAS_SIZE}px`,
            backgroundImage:
              "radial-gradient(var(--color-border) 1.5px, transparent 1.5px)",
            backgroundSize: "24px 24px",
          }}
          className="relative min-w-[4000px] min-h-[4000px]"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {/* Drop visual indicator over canvas */}
          {isDragOver && (
            <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-primary/5 border-2 border-dashed border-primary/40 transition-all">
              <div className="flex items-center gap-2 rounded-full border border-primary/30 bg-background/90 px-4 py-2 shadow-2xl backdrop-blur-md">
                <Plus className="size-4 text-primary animate-pulse" />
                <span className="text-xs font-medium text-foreground">
                  Suelta para colocar el marco en esta posición
                </span>
              </div>
            </div>
          )}

          {/* Empty Canvas State */}
          {frames.length === 0 && (
            <div
              className="absolute left-1/2 top-1/2 flex flex-col items-center justify-center p-8 text-center rounded-3xl border border-dashed border-border/60 bg-background/60 backdrop-blur-md shadow-xl"
              style={{
                transform: `translate(-50%, -50%) scale(${scale})`,
                transformOrigin: "center center",
              }}
            >
              <div className="mb-3 flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                <Smartphone className="size-6" />
              </div>
              <h3 className="text-sm font-semibold text-foreground">Canvas sin marcos</h3>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed max-w-[240px]">
                Presiona <kbd className="px-1.5 py-0.5 rounded bg-muted border font-mono text-[10px]">F</kbd> o arrastra un dispositivo desde la barra lateral derecha para añadir un marco.
              </p>
              <div className="mt-4 flex items-center gap-2">
                <Button
                  size="xs"
                  variant="outline"
                  onClick={() => {
                    const newF: CanvasDeviceFrame = {
                      id: `frame-iphone-${Date.now()}`,
                      type: "iphone",
                      name: "iPhone 16 Pro",
                      x: -402 / 2,
                      y: -874 / 2,
                      width: 402,
                      height: 874,
                    };
                    setFrames([newF]);
                    setSelectedFrameId(newF.id);
                  }}
                >
                  Añadir iPhone
                </Button>
                <Button
                  size="xs"
                  variant="outline"
                  onClick={() => {
                    const newF: CanvasDeviceFrame = {
                      id: `frame-android-${Date.now()}`,
                      type: "android",
                      name: "Android Phone",
                      x: -380 / 2,
                      y: -830 / 2,
                      width: 380,
                      height: 830,
                    };
                    setFrames([newF]);
                    setSelectedFrameId(newF.id);
                  }}
                >
                  Añadir Android
                </Button>
              </div>
            </div>
          )}

          {/* Device Frames on Infinite Canvas */}
          {frames.map((frame) => {
            const isSelected = frame.id === selectedFrameId;

            return (
              <div
                key={frame.id}
                className="absolute flex flex-col items-center select-none"
                style={{
                  left: `${2000 + frame.x * scale}px`,
                  top: `${2000 + frame.y * scale}px`,
                  transform: `scale(${scale})`,
                  transformOrigin: "top left",
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedFrameId(frame.id);
                }}
              >
                {/* Artboard Frame Header Badge with Drag Handle */}
                <div
                  className={cn(
                    "mb-2.5 flex items-center justify-between gap-2 rounded-full border bg-background/85 px-3 py-1 shadow-xs backdrop-blur-md transition-all cursor-grab active:cursor-grabbing",
                    isSelected
                      ? "border-primary/60 ring-2 ring-primary/20 bg-background shadow-md"
                      : "border-border/60 hover:border-primary/40 hover:bg-background"
                  )}
                  onPointerDown={(e) => handleFrameHeaderPointerDown(frame.id, e)}
                >
                  <div className="flex items-center gap-1.5">
                    <Smartphone
                      className={cn(
                        "size-3.5",
                        frame.type === "iphone" ? "text-sky-500" : "text-emerald-500"
                      )}
                    />
                    <span className="text-xs font-medium text-foreground">
                      {frame.name}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      • {frame.width} × {frame.height}
                    </span>
                  </div>

                  {/* Header Actions: Duplicate & Delete */}
                  <div className="flex items-center gap-0.5 ml-2 border-l border-border/40 pl-1.5">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        duplicateFrame(frame.id);
                      }}
                      title="Duplicar marco"
                      className="flex size-5 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                    >
                      <Copy className="size-3" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteFrame(frame.id);
                      }}
                      title="Eliminar marco (Delete / Backspace)"
                      className="flex size-5 items-center justify-center rounded text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                    >
                      <Trash2 className="size-3" />
                    </button>
                  </div>
                </div>

                {/* Device Mockup */}
                <div
                  className={cn(
                    "relative transition-all duration-150 rounded-[44px]",
                    isSelected && "ring-2 ring-primary/30"
                  )}
                >
                  {frame.type === "iphone" ? (
                    <Iphone
                      contentWidth={frame.width}
                      contentHeight={frame.height}
                      className="drop-shadow-2xl"
                    >
                      <div className="flex h-full w-full flex-col bg-background pt-7 pb-2 justify-between overflow-hidden">
                        <div className="flex-1 w-full min-h-0 overflow-hidden">
                          {children && isSelected ? children : null}
                        </div>
                        {/* Home Indicator */}
                        <div className="pb-1 pt-1 flex justify-center shrink-0 pointer-events-none">
                          <div className="h-1 w-28 rounded-full bg-foreground/20" />
                        </div>
                      </div>
                    </Iphone>
                  ) : (
                    <Android
                      width={380}
                      height={830}
                      className="drop-shadow-2xl"
                    >
                      <div className="flex h-full w-full flex-col bg-background pt-8 pb-3 justify-between overflow-hidden">
                        <div className="flex-1 w-full min-h-0 overflow-hidden">
                          {children && isSelected ? children : null}
                        </div>
                        {/* Android Navigation Gesture Bar */}
                        <div className="flex justify-center shrink-0 pointer-events-none">
                          <div className="h-1 w-20 rounded-full bg-foreground/30" />
                        </div>
                      </div>
                    </Android>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>

      {/* Figma-like Bottom Frosted Glass Dock */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
        <DesignerDock
          activeTool={activeTool}
          onSelectTool={setActiveTool}
          showRulers={showRulers}
          onToggleRulers={() => setShowRulers((v) => !v)}
        />
      </div>

      {/* Floating HUD: Zoom Controls & Center */}
      <div
        className={cn(
          "absolute bottom-4 z-30 flex items-center gap-1 rounded-2xl border border-border/50 dark:border-white/10 bg-background/70 dark:bg-zinc-900/75 p-1.5 shadow-2xl backdrop-blur-xl transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
          isRightSidebarOpen ? "right-[272px]" : "right-4"
        )}
      >
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={zoomOut}
          disabled={scale <= MIN_SCALE}
          title="Zoom Out (Ctrl + Wheel)"
        >
          <Minus className="size-3.5" />
        </Button>
        <button
          type="button"
          onClick={resetZoom}
          className="h-6 min-w-[46px] rounded px-1.5 text-center font-mono text-[11px] font-medium text-foreground transition-colors hover:bg-muted/80"
          title="Restablecer a 100%"
        >
          {Math.round(scale * 100)}%
        </button>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={zoomIn}
          disabled={scale >= MAX_SCALE}
          title="Zoom In (Ctrl + Wheel)"
        >
          <Plus className="size-3.5" />
        </Button>
        <div className="mx-0.5 h-3.5 w-px bg-border/40 dark:bg-white/10" />
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={() => centerArtboard(true)}
          title="Centrar Artboard"
        >
          <Focus className="size-3.5" />
        </Button>
        <div className="mx-0.5 h-3.5 w-px bg-border/40 dark:bg-white/10" />
        <Button
          variant={showRulers ? "secondary" : "ghost"}
          size="icon-xs"
          onClick={() => setShowRulers((v) => !v)}
          title={showRulers ? "Ocultar reglas (Shift + R)" : "Mostrar reglas (Shift + R)"}
        >
          <Ruler className="size-3.5" />
        </Button>
      </div>

      {/* Designer Rulers (Figma Style) */}
      <DesignerRulers
        viewportRef={viewportRef}
        scale={scale}
        visible={showRulers}
        onToggleVisible={() => setShowRulers(false)}
        isLeftSidebarOpen={isLeftSidebarOpen}
        isRightSidebarOpen={isRightSidebarOpen}
        activeFrame={selectedFrame}
      />

      {/* Helpful Hint Pill when Space is held */}
      {isSpacePressed && (
        <div className="absolute top-8 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5 rounded-full border border-border/50 dark:border-white/10 bg-background/80 dark:bg-zinc-900/80 px-3.5 py-1 shadow-lg backdrop-blur-xl">
          <Hand className="size-3.5 text-primary" />
          <span className="text-xs font-medium text-foreground">
            {isPanning ? "Arrastrando canvas..." : "Modo mano: haz clic y arrastra"}
          </span>
        </div>
      )}
    </div>
  );
}
