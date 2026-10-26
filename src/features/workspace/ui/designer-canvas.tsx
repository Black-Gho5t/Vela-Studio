import * as React from "react";
import {
  Plus,
  Minus,
  Focus,
  Smartphone,
  Hand,
  Ruler,
  MousePointerClick,
  Sparkles,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DesignerRulers } from "./designer-rulers";
import { DesignerDock, type DesignerTool } from "./designer-dock";
import { Iphone } from "@/components/magicui/iphone";
import { Android } from "@/components/magicui/android";
import type { FramePresetItem } from "./designer-frame-presets";
import { createFlutterFileForFrame, deleteFlutterFileForFrame } from "../model/designer-frame-file";

const CANVAS_SIZE = 4000;
const MIN_SCALE = 0.25;
const MAX_SCALE = 2.0;

export type LayoutFlow = "none" | "vertical" | "horizontal" | "wrap";
export type ScreenLayoutType = "scaffold" | "scrollable" | "stack";

export interface FrameStroke {
  color: string;
  opacity: number;
  width: number;
  visible: boolean;
}

export interface FrameEffect {
  id: string;
  type: "dropShadow" | "layerBlur";
  blur: number;
  x?: number;
  y?: number;
  color?: string;
  opacity?: number;
  visible: boolean;
}

export interface CanvasWidgetElement {
  id: string;
  type: "button" | "text" | "card" | "input" | "container" | "icon";
  name: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  label?: string;
  color?: string;
  textColor?: string;
  fontSize?: number;
  borderRadius?: number;
}

export interface CanvasDeviceFrame {
  id: string;
  type: "iphone" | "android";
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fileName?: string;
  filePath?: string;
  rotation?: number;
  flipHorizontal?: boolean;
  flipVertical?: boolean;
  layoutFlow?: LayoutFlow;
  screenLayout?: ScreenLayoutType;
  spacing?: number;
  constrainProportions?: boolean;
  hasFill?: boolean;
  fill?: string;
  fillOpacity?: number;
  fillVisible?: boolean;
  fillToken?: string;
  stroke?: FrameStroke;
  effects?: FrameEffect[];
  elements?: CanvasWidgetElement[];
}

const DEFAULT_FRAMES: CanvasDeviceFrame[] = [];

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
  selectedElementId?: string;
  onSelectElementId?: (id: string) => void;
}

export function DesignerCanvas({
  children: _children,
  className,
  isLeftSidebarOpen = true,
  isRightSidebarOpen = true,
  activeTool: externalActiveTool,
  onSelectTool: externalOnSelectTool,
  frames: externalFrames,
  onFramesChange,
  selectedFrameId: externalSelectedFrameId,
  onSelectFrameId,
  selectedElementId: externalSelectedElementId,
  onSelectElementId,
}: DesignerCanvasProps) {
  const viewportRef = React.useRef<HTMLDivElement>(null);
  const [scale, setScale] = React.useState(1);
  const [showRulers, setShowRulers] = React.useState(true);
  const [internalActiveTool, setInternalActiveTool] = React.useState<DesignerTool>("select");
  const [internalFrames, setInternalFrames] = React.useState<CanvasDeviceFrame[]>(DEFAULT_FRAMES);
  const [internalSelectedFrameId, setInternalSelectedFrameId] = React.useState<string>("");
  const [isDragOver, setIsDragOver] = React.useState(false);

  const activeTool = externalActiveTool ?? internalActiveTool;
  const setActiveTool = externalOnSelectTool ?? setInternalActiveTool;

  const frames = externalFrames ?? internalFrames;
  const setFrames = onFramesChange ?? setInternalFrames;

  const selectedFrameId = externalSelectedFrameId ?? internalSelectedFrameId;
  const setSelectedFrameId = onSelectFrameId ?? setInternalSelectedFrameId;

  const [internalSelectedElementId, setInternalSelectedElementId] = React.useState<string>("");
  const selectedElementId = externalSelectedElementId ?? internalSelectedElementId;
  const setSelectedElementId = onSelectElementId ?? setInternalSelectedElementId;

  const [dropTargetFrameId, setDropTargetFrameId] = React.useState<string | null>(null);

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
      const target = frames.find((f) => f.id === frameId);
      if (target) {
        deleteFlutterFileForFrame(target.filePath, target.fileName);
      }
      const nextFrames = frames.filter((f) => f.id !== frameId);
      setFrames(nextFrames);
      if (selectedFrameId === frameId) {
        setSelectedFrameId(nextFrames.length > 0 ? nextFrames[0].id : "");
      }
    },
    [frames, selectedFrameId, setFrames, setSelectedFrameId]
  );

  const deleteElement = React.useCallback(
    (frameId: string, elementId: string) => {
      setFrames(
        frames.map((f) =>
          f.id === frameId
            ? { ...f, elements: (f.elements || []).filter((el) => el.id !== elementId) }
            : f
        )
      );
      if (selectedElementId === elementId) {
        setSelectedElementId("");
      }
    },
    [frames, selectedElementId, setFrames, setSelectedElementId]
  );

  const selectedFrameIdRef = React.useRef(selectedFrameId);
  selectedFrameIdRef.current = selectedFrameId;

  const deleteFrameRef = React.useRef(deleteFrame);
  deleteFrameRef.current = deleteFrame;

  const selectedElementIdRef = React.useRef(selectedElementId);
  selectedElementIdRef.current = selectedElementId;

  const deleteElementRef = React.useRef(deleteElement);
  deleteElementRef.current = deleteElement;

  // Handle keyboard shortcuts (F for frame, V for select, Space for pan, Shift+R for rulers, Backspace/Delete to remove frame or element)
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
        if (selectedElementIdRef.current && selectedFrameIdRef.current) {
          e.preventDefault();
          deleteElementRef.current(selectedFrameIdRef.current, selectedElementIdRef.current);
          return;
        }
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

      const existingNames = frames.map((f) => f.fileName).filter(Boolean) as string[];
      createFlutterFileForFrame(preset.name, existingNames).then((fileInfo) => {
        const newFrame: CanvasDeviceFrame = {
          id: `frame-${preset.id}-${Date.now()}`,
          type: preset.type,
          name: preset.name,
          x: Math.round(dx),
          y: Math.round(dy),
          width: preset.width,
          height: preset.height,
          fileName: fileInfo.fileName,
          filePath: fileInfo.filePath,
        };

        setFrames([...frames, newFrame]);
        setSelectedFrameId(newFrame.id);
        setActiveTool("select");
      });
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





  // Dropping a UI component (e.g. Button) from sidebar onto a device frame
  const handleComponentDrop = (
    frameId: string,
    e: React.DragEvent<HTMLDivElement>
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setDropTargetFrameId(null);

    const raw = e.dataTransfer.getData("application/vela-component");
    if (!raw) return;

    try {
      const data = JSON.parse(raw);
      const screenRect = e.currentTarget.getBoundingClientRect();
      const localX = Math.round((e.clientX - screenRect.left) / scale);
      const localY = Math.round((e.clientY - screenRect.top) / scale);

      const frame = frames.find((f) => f.id === frameId);
      if (!frame) return;

      const width = data.width || 120;
      const height = data.height || 40;

      const newElement: CanvasWidgetElement = {
        id: `elem-${data.type}-${Date.now()}`,
        type: data.type,
        name: data.name,
        label: data.label || data.name,
        x: Math.max(10, Math.min(localX - width / 2, frame.width - width - 10)),
        y: Math.max(10, Math.min(localY - height / 2, frame.height - height - 10)),
        width,
        height,
      };

      setFrames(
        frames.map((f) =>
          f.id === frameId
            ? { ...f, elements: [...(f.elements || []), newElement] }
            : f
        )
      );
      setSelectedFrameId(frameId);
      setSelectedElementId(newElement.id);
    } catch (err) {
      console.error("Failed to drop component onto frame:", err);
    }
  };

  // Dragging and positioning a widget element inside the frame
  const handleElementPointerDown = (
    frameId: string,
    elementId: string,
    e: React.PointerEvent
  ) => {
    e.stopPropagation();
    setSelectedFrameId(frameId);
    setSelectedElementId(elementId);

    const startX = e.clientX;
    const startY = e.clientY;

    const targetFrame = frames.find((f) => f.id === frameId);
    const targetElement = targetFrame?.elements?.find((el) => el.id === elementId);
    if (!targetElement) return;

    const origX = targetElement.x;
    const origY = targetElement.y;

    const handlePointerMove = (ev: PointerEvent) => {
      const deltaX = (ev.clientX - startX) / scale;
      const deltaY = (ev.clientY - startY) / scale;

      const nextX = Math.round(origX + deltaX);
      const nextY = Math.round(origY + deltaY);

      setFrames(
        frames.map((f) => {
          if (f.id !== frameId) return f;
          return {
            ...f,
            elements: (f.elements || []).map((el) =>
              el.id === elementId
                ? {
                    ...el,
                    x: Math.max(0, Math.min(nextX, f.width - (el.width || 40))),
                    y: Math.max(0, Math.min(nextY, f.height - (el.height || 40))),
                  }
                : el
            ),
          };
        })
      );
    };

    const handlePointerUp = () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
  };

  const renderPhoneScreenContent = (frame: CanvasDeviceFrame) => {
    const isTarget = dropTargetFrameId === frame.id;
    return (
      <div
        className={cn(
          "relative flex-1 w-full min-h-0 overflow-hidden transition-all",
          isTarget && "ring-2 ring-primary ring-inset bg-primary/5"
        )}
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
          e.dataTransfer.dropEffect = "copy";
          if (dropTargetFrameId !== frame.id) {
            setDropTargetFrameId(frame.id);
          }
        }}
        onDragLeave={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node)) {
            setDropTargetFrameId(null);
          }
        }}
        onDrop={(e) => handleComponentDrop(frame.id, e)}
        onClick={() => setSelectedElementId("")}
      >
        {isTarget && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-primary/10 border-2 border-dashed border-primary/50 pointer-events-none">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-background/90 text-primary text-xs font-medium shadow-md">
              <Plus className="size-3.5 animate-pulse" />
              <span>Soltar aquí</span>
            </div>
          </div>
        )}

        {frame.elements && frame.elements.length > 0 ? (
          frame.elements.map((el) => {
            const isSelectedEl = el.id === selectedElementId;
            return (
              <div
                key={el.id}
                onPointerDown={(e) => handleElementPointerDown(frame.id, el.id, e)}
                className={cn(
                  "absolute select-none cursor-move transition-shadow z-10",
                  isSelectedEl && "ring-2 ring-primary ring-offset-1 z-30"
                )}
                style={{
                  left: `${el.x}px`,
                  top: `${el.y}px`,
                }}
              >
                {isSelectedEl && (
                  <div className="absolute -top-5 left-0 px-1 py-0.2 rounded bg-primary text-primary-foreground text-[8px] font-mono whitespace-nowrap shadow-xs pointer-events-none flex items-center gap-1">
                    <span>{el.name}</span>
                    <span className="opacity-75">• {el.x}, {el.y}</span>
                  </div>
                )}

                {el.type === "button" ? (
                  <button
                    type="button"
                    className="px-4 py-2 bg-primary text-primary-foreground font-medium text-xs rounded-xl shadow-md flex items-center gap-1.5 pointer-events-none hover:opacity-90 whitespace-nowrap"
                  >
                    <MousePointerClick className="size-3.5" />
                    <span>{el.label || "Botón"}</span>
                  </button>
                ) : el.type === "text" ? (
                  <div className="px-2 py-1 text-foreground font-semibold text-sm pointer-events-none whitespace-nowrap">
                    {el.label || "Texto"}
                  </div>
                ) : el.type === "card" ? (
                  <div className="p-3 bg-card/90 border border-border/80 rounded-xl shadow-xs space-y-1 min-w-[130px] pointer-events-none">
                    <span className="text-xs font-semibold text-foreground">{el.label || "Tarjeta"}</span>
                    <p className="text-[10px] text-muted-foreground">Contenido</p>
                  </div>
                ) : el.type === "input" ? (
                  <div className="px-3 py-2 bg-muted/60 border border-border/70 rounded-lg text-xs text-muted-foreground flex items-center justify-between min-w-[140px] pointer-events-none whitespace-nowrap">
                    <span>{el.label || "Escribe algo..."}</span>
                  </div>
                ) : el.type === "icon" ? (
                  <div className="size-9 rounded-full bg-primary/10 text-primary flex items-center justify-center shadow-xs pointer-events-none">
                    <Sparkles className="size-4" />
                  </div>
                ) : (
                  <div className="w-24 h-16 bg-muted/50 border border-dashed border-border rounded-xl flex items-center justify-center text-[10px] text-muted-foreground pointer-events-none">
                    {el.label || "Contenedor"}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="h-full w-full flex flex-col items-center justify-center text-center p-4 text-muted-foreground/40 pointer-events-none select-none">
            <MousePointerClick className="size-6 mb-1.5 opacity-30 animate-pulse" />
            <span className="text-[11px] font-medium">Arrastra un botón o componente aquí</span>
          </div>
        )}
      </div>
    );
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

          {/* Device Frames on Infinite Canvas */}
          {frames.map((frame) => {
            const isSelected = frame.id === selectedFrameId;
            const screenBgColor =
              frame.hasFill === false || frame.fillVisible === false
                ? "transparent"
                : frame.fill || "#FFFFFF";
            const screenOpacity =
              frame.hasFill === false || frame.fillVisible === false
                ? 1
                : (frame.fillOpacity ?? 100) / 100;
            const strokeOutline =
              frame.stroke && frame.stroke.visible
                ? `${frame.stroke.width}px solid ${frame.stroke.color}`
                : undefined;
            const customShadow =
              frame.effects && frame.effects.some((e) => e.visible)
                ? frame.effects
                    .filter((e) => e.visible)
                    .map(
                      (e) =>
                        `${e.x ?? 0}px ${e.y ?? 4}px ${e.blur}px ${e.color || "rgba(0,0,0,0.25)"}`
                    )
                    .join(", ")
                : undefined;

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
                    "mb-2.5 flex items-center gap-1.5 rounded-full border bg-background/85 px-3 py-1 shadow-xs backdrop-blur-md transition-all cursor-grab active:cursor-grabbing",
                    isSelected
                      ? "border-primary/60 ring-2 ring-primary/20 bg-background shadow-md"
                      : "border-border/60 hover:border-primary/40 hover:bg-background"
                  )}
                  onPointerDown={(e) => handleFrameHeaderPointerDown(frame.id, e)}
                >
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

                {/* Device Mockup */}
                <div
                  className={cn(
                    "relative transition-all duration-150 rounded-[44px]",
                    isSelected && "ring-2 ring-primary/30"
                  )}
                  style={{
                    transform: `rotate(${frame.rotation || 0}deg) scaleX(${frame.flipHorizontal ? -1 : 1}) scaleY(${frame.flipVertical ? -1 : 1})`,
                    transformOrigin: "center center",
                    transition: "transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
                    boxShadow: customShadow,
                  }}
                >
                  {frame.type === "iphone" ? (
                    <Iphone
                      contentWidth={frame.width}
                      contentHeight={frame.height}
                      className={cn(!customShadow && "drop-shadow-2xl")}
                    >
                      <div
                        className="flex h-full w-full flex-col pt-7 pb-2 justify-between overflow-hidden transition-colors"
                        style={{
                          backgroundColor: screenBgColor,
                          opacity: screenOpacity,
                          outline: strokeOutline,
                          outlineOffset: "-1px",
                        }}
                      >
                        <div className="flex-1 w-full min-h-0 overflow-hidden flex flex-col">
                          {renderPhoneScreenContent(frame)}
                        </div>
                        {/* Home Indicator */}
                        <div className="pb-1 pt-1 flex justify-center shrink-0 pointer-events-none">
                          <div className="h-1 w-28 rounded-full bg-foreground/20" />
                        </div>
                      </div>
                    </Iphone>
                  ) : (
                    <Android
                      width={frame.width || 380}
                      height={frame.height || 830}
                      className={cn(!customShadow && "drop-shadow-2xl")}
                    >
                      <div
                        className="flex h-full w-full flex-col pt-8 pb-3 justify-between overflow-hidden transition-colors"
                        style={{
                          backgroundColor: screenBgColor,
                          opacity: screenOpacity,
                          outline: strokeOutline,
                          outlineOffset: "-1px",
                        }}
                      >
                        <div className="flex-1 w-full min-h-0 overflow-hidden flex flex-col">
                          {renderPhoneScreenContent(frame)}
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
