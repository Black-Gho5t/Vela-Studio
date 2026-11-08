import * as React from "react";
import {
  Plus,
  Hand,
  MousePointerClick,
  Sparkles,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { DesignerRulers } from "./designer-rulers";
import { DesignerDock, type DesignerTool } from "./designer-dock";
import { DesignerResizeHandles, type Bounds } from "./designer-resize-handles";
import type { FramePresetItem } from "./designer-frame-presets";
import type { AlignmentValue } from "./designer-alignment-matrix";
import { createFlutterFileForFrame, deleteFlutterFileForFrame } from "../model/designer-frame-file";

const CANVAS_SIZE = 4000;
const MIN_SCALE = 0.25;
const MAX_SCALE = 2.0;

export type LayoutFlow = "none" | "vertical" | "horizontal" | "wrap";
export type ScreenLayoutType = "scaffold" | "scrollable" | "stack";

export interface FrameLayoutGrid {
  type: "columns" | "grid";
  count?: number;
  gutter?: number;
  margin?: number;
  size?: number;
  color?: string;
  visible: boolean;
}

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

export type SizingMode = "fixed" | "hug" | "fill";

export interface ElementPadding {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export type ElementAlignment =
  | "topLeft"
  | "topCenter"
  | "topRight"
  | "centerLeft"
  | "center"
  | "centerRight"
  | "bottomLeft"
  | "bottomCenter"
  | "bottomRight";

export interface CanvasWidgetElement {
  id: string;
  type: "button" | "text" | "card" | "input" | "container" | "icon";
  name: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  widthMode?: SizingMode;
  heightMode?: SizingMode;
  padding?: ElementPadding;
  alignment?: ElementAlignment;
  label?: string;
  color?: string;
  textColor?: string;
  fontSize?: number;
  borderRadius?: number;
  isLocked?: boolean;
  isVisible?: boolean;
}

export interface CanvasDeviceFrame {
  id: string;
  type: "iphone" | "android";
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  widthMode?: "fixed" | "hug" | "fill";
  heightMode?: "fixed" | "hug" | "fill";
  fileName?: string;
  filePath?: string;
  rotation?: number;
  flipHorizontal?: boolean;
  flipVertical?: boolean;
  layoutFlow?: LayoutFlow;
  reverseOrder?: boolean;
  screenLayout?: ScreenLayoutType;
  spacing?: number;
  spacingMode?: "packed" | "spaceBetween";
  alignment?: AlignmentValue;
  padding?: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  clipContent?: boolean;
  opacity?: number;
  cornerRadius?: number;
  themeMode?: "system" | "light" | "dark";
  constrainProportions?: boolean;
  hasFill?: boolean;
  fill?: string;
  fillOpacity?: number;
  fillVisible?: boolean;
  fillToken?: string;
  stroke?: FrameStroke;
  effects?: FrameEffect[];
  layoutGrid?: FrameLayoutGrid;
  elements?: CanvasWidgetElement[];
}

const DEFAULT_FRAMES: CanvasDeviceFrame[] = [];

interface DesignerCanvasProps {
  children?: React.ReactNode;
  className?: string;
  isLeftSidebarOpen?: boolean;
  isRightSidebarOpen?: boolean;
  leftSidebarWidth?: number;
  rightSidebarWidth?: number;
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
  leftSidebarWidth = 260,
  rightSidebarWidth = 280,
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

      // Duplicate element shortcut: Cmd+D / Ctrl+D
      if ((e.metaKey || e.ctrlKey) && (e.key === "d" || e.key === "D")) {
        if (selectedElementIdRef.current && selectedFrameIdRef.current) {
          e.preventDefault();
          const frame = frames.find((f) => f.id === selectedFrameIdRef.current);
          const element = frame?.elements?.find((el) => el.id === selectedElementIdRef.current);
          if (frame && element && !element.isLocked) {
            const clonedId = `elem-${element.type}-${Date.now()}`;
            const cloned: CanvasWidgetElement = {
              ...element,
              id: clonedId,
              name: `${element.name} (Copia)`,
              x: Math.min(frame.width - (element.width || 40), element.x + 16),
              y: Math.min(frame.height - (element.height || 40), element.y + 16),
            };
            setFrames(
              frames.map((f) =>
                f.id === frame.id
                  ? { ...f, elements: [...(f.elements || []), cloned] }
                  : f
              )
            );
            setSelectedElementId(clonedId);
          }
          return;
        }
      }

      // Nudge with Arrow keys (1px or 8px with Shift)
      if (
        e.key === "ArrowLeft" ||
        e.key === "ArrowRight" ||
        e.key === "ArrowUp" ||
        e.key === "ArrowDown"
      ) {
        if (selectedElementIdRef.current && selectedFrameIdRef.current) {
          e.preventDefault();
          const frame = frames.find((f) => f.id === selectedFrameIdRef.current);
          const element = frame?.elements?.find((el) => el.id === selectedElementIdRef.current);
          if (frame && element && !element.isLocked) {
            const step = e.shiftKey ? 8 : 1;
            let nextX = element.x;
            let nextY = element.y;
            if (e.key === "ArrowLeft") nextX = Math.max(0, element.x - step);
            if (e.key === "ArrowRight") nextX = Math.min(frame.width - (element.width || 40), element.x + step);
            if (e.key === "ArrowUp") nextY = Math.max(0, element.y - step);
            if (e.key === "ArrowDown") nextY = Math.min(frame.height - (element.height || 40), element.y + step);

            setFrames(
              frames.map((f) =>
                f.id === frame.id
                  ? {
                      ...f,
                      elements: (f.elements || []).map((el) =>
                        el.id === element.id ? { ...el, x: nextX, y: nextY } : el
                      ),
                    }
                  : f
              )
            );
          }
          return;
        }
      }
      // Cmd/Ctrl + Shift + K for Image tool
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && (e.key === "k" || e.key === "K")) {
        e.preventDefault();
        setActiveTool("image");
        return;
      }

      if (!e.ctrlKey && !e.metaKey && !e.altKey) {
        if (e.shiftKey && (e.key === "s" || e.key === "S")) {
          e.preventDefault();
          setActiveTool("section");
          return;
        }
        if (e.key === "f" || e.key === "F") {
          e.preventDefault();
          setActiveTool("frame");
          return;
        }
        if (e.key === "t" || e.key === "T") {
          e.preventDefault();
          setActiveTool("text");
          return;
        }
        if (e.key === "r" || e.key === "R") {
          e.preventDefault();
          setActiveTool("shape");
          return;
        }
        if (e.key === "o" || e.key === "O") {
          e.preventDefault();
          setActiveTool("ellipse");
          return;
        }
        if (e.key === "l" || e.key === "L") {
          e.preventDefault();
          setActiveTool("line");
          return;
        }
        if (e.key === "v" || e.key === "V" || e.key === "Escape") {
          e.preventDefault();
          setActiveTool("select");
          return;
        }
        if (e.key === "h" || e.key === "H") {
          e.preventDefault();
          setActiveTool("hand");
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

  // Pointer drag for canvas panning (Middle click, Space + Left click, or Hand tool)
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // Prevent panning when clicking dock, sidebars, or menus
    if ((e.target as HTMLElement).closest('[data-slot="designer-dock"], [data-slot="designer-sidebar"], [data-slot="dropdown-menu-content"], [role="menu"]')) {
      return;
    }

    const isMiddleClick = e.button === 1;
    const isSpaceLeftClick = isSpacePressed && e.button === 0;
    const isHandLeftClick = activeTool === "hand" && e.button === 0;

    if (isMiddleClick || isSpaceLeftClick || isHandLeftClick) {
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
          elements: [],
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
    if (activeTool === "hand") return;
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

  // Resizing a widget element with handles
  const handleElementResize = (frameId: string, elementId: string, newBounds: Bounds) => {
    setFrames(
      frames.map((f) => {
        if (f.id !== frameId) return f;
        return {
          ...f,
          elements: (f.elements || []).map((el) =>
            el.id === elementId
              ? {
                  ...el,
                  x: newBounds.x,
                  y: newBounds.y,
                  width: newBounds.width,
                  height: newBounds.height,
                  widthMode: "fixed",
                  heightMode: "fixed",
                }
              : el
          ),
        };
      })
    );
  };

  // Dragging and positioning a widget element inside the frame (supports Alt+Drag to clone)
  const handleElementPointerDown = (
    frameId: string,
    elementId: string,
    e: React.PointerEvent
  ) => {
    if (activeTool === "hand") return;
    e.stopPropagation();

    const targetFrame = frames.find((f) => f.id === frameId);
    const targetElement = targetFrame?.elements?.find((el) => el.id === elementId);
    if (!targetElement || targetElement.isLocked) return;

    let activeId = elementId;
    let currentFrames = frames;

    // Alt + Drag: Duplicate element immediately
    if (e.altKey) {
      const clonedId = `elem-${targetElement.type}-${Date.now()}`;
      const clonedElement: CanvasWidgetElement = {
        ...targetElement,
        id: clonedId,
        name: `${targetElement.name} (Copia)`,
        x: targetElement.x + 8,
        y: targetElement.y + 8,
      };
      activeId = clonedId;
      currentFrames = frames.map((f) =>
        f.id === frameId
          ? { ...f, elements: [...(f.elements || []), clonedElement] }
          : f
      );
      setFrames(currentFrames);
    }

    setSelectedFrameId(frameId);
    setSelectedElementId(activeId);

    const startX = e.clientX;
    const startY = e.clientY;

    const origX = targetElement.x;
    const origY = targetElement.y;

    const handlePointerMove = (ev: PointerEvent) => {
      const deltaX = (ev.clientX - startX) / scale;
      const deltaY = (ev.clientY - startY) / scale;

      const nextX = Math.round(origX + deltaX);
      const nextY = Math.round(origY + deltaY);

      setFrames(
        currentFrames.map((f) => {
          if (f.id !== frameId) return f;
          return {
            ...f,
            elements: (f.elements || []).map((el) =>
              el.id === activeId
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
    const isStack = !frame.layoutFlow || frame.layoutFlow === "none";
    const pad = frame.padding || { top: 0, right: 0, bottom: 0, left: 0 };
    const spacing = frame.spacing ?? 0;

    let flexJustify = "flex-start";
    let flexAlign = "flex-start";

    if (!isStack) {
      const align = frame.alignment || "topLeft";
      const isHorizontal = frame.layoutFlow === "horizontal";

      if (frame.spacingMode === "spaceBetween") {
        flexJustify = "space-between";
        flexAlign = align.startsWith("top") ? "flex-start" : align.startsWith("bottom") ? "flex-end" : "center";
      } else {
        const isLeft = align.endsWith("Left") || align === "topLeft" || align === "bottomLeft" || align === "centerLeft";
        const isRight = align.endsWith("Right") || align === "topRight" || align === "bottomRight" || align === "centerRight";
        const horiz = isLeft ? "flex-start" : isRight ? "flex-end" : "center";

        const isTop = align.startsWith("top");
        const isBottom = align.startsWith("bottom");
        const vert = isTop ? "flex-start" : isBottom ? "flex-end" : "center";

        if (isHorizontal) {
          flexJustify = horiz;
          flexAlign = vert;
        } else {
          flexJustify = vert;
          flexAlign = horiz;
        }
      }
    }

    return (
      <div
        className={cn(
          "relative flex-1 w-full min-h-0 transition-all",
          frame.clipContent === false ? "overflow-visible" : "overflow-hidden",
          isTarget && "ring-2 ring-primary ring-inset bg-primary/5"
        )}
        style={
          isStack
            ? undefined
            : {
                display: "flex",
                flexDirection:
                  frame.layoutFlow === "vertical"
                    ? frame.reverseOrder
                      ? "column-reverse"
                      : "column"
                    : frame.reverseOrder
                      ? "row-reverse"
                      : "row",
                flexWrap: frame.layoutFlow === "wrap" ? "wrap" : "nowrap",
                justifyContent: flexJustify,
                alignItems: flexAlign,
                gap: `${spacing}px`,
                paddingTop: `${pad.top}px`,
                paddingRight: `${pad.right}px`,
                paddingBottom: `${pad.bottom}px`,
                paddingLeft: `${pad.left}px`,
              }
        }
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
            if (el.isVisible === false) return null;
            const isSelectedEl = el.id === selectedElementId;
            const elWidth = el.widthMode === "fill" ? (isStack ? frame.width - 32 : undefined) : el.width;
            const elHeight = el.height;
            const paddingStyle = el.padding
              ? {
                  paddingTop: `${el.padding.top}px`,
                  paddingRight: `${el.padding.right}px`,
                  paddingBottom: `${el.padding.bottom}px`,
                  paddingLeft: `${el.padding.left}px`,
                }
              : undefined;

            return (
              <div
                key={el.id}
                onPointerDown={(e) => handleElementPointerDown(frame.id, el.id, e)}
                onClick={(e) => {
                  if (activeTool === "hand") return;
                  e.stopPropagation();
                  setSelectedFrameId(frame.id);
                  setSelectedElementId(el.id);
                }}
                className={cn(
                  isStack ? "absolute" : "relative shrink-0",
                  "select-none cursor-pointer transition-shadow z-10",
                  el.widthMode === "fill" && !isStack && "w-full",
                  isSelectedEl
                    ? "ring-2 ring-primary ring-offset-1 z-30"
                    : "hover:ring-1 hover:ring-primary/60",
                  el.isLocked && "cursor-not-allowed opacity-90"
                )}
                style={{
                  left: isStack ? `${el.x}px` : undefined,
                  top: isStack ? `${el.y}px` : undefined,
                  width: elWidth ? `${elWidth}px` : undefined,
                  height: elHeight ? `${elHeight}px` : undefined,
                  ...paddingStyle,
                }}
              >
                {isSelectedEl && !el.isLocked && activeTool !== "hand" && (
                  <DesignerResizeHandles
                    bounds={{
                      x: el.x,
                      y: el.y,
                      width: elWidth || (el.type === "button" ? 120 : el.type === "text" ? 140 : 160),
                      height: elHeight || (el.type === "button" ? 40 : el.type === "text" ? 32 : 80),
                    }}
                    scale={scale}
                    onResize={(newBounds) => handleElementResize(frame.id, el.id, newBounds)}
                    onResizeEnd={() => {
                      setFrames([...frames]);
                    }}
                  />
                )}

                {isSelectedEl && (
                  <div className="absolute -top-5 left-0 px-1 py-0.2 rounded bg-primary text-primary-foreground text-[8px] font-mono whitespace-nowrap shadow-xs pointer-events-none flex items-center gap-1 z-40">
                    <span>{el.name}</span>
                    <span className="opacity-75">• {el.x}, {el.y}</span>
                    {el.width && el.height && (
                      <span className="opacity-75">• {el.width}×{el.height}</span>
                    )}
                  </div>
                )}

                {el.type === "button" ? (
                  <button
                    type="button"
                    style={{
                      backgroundColor: el.color || undefined,
                      borderRadius: el.borderRadius !== undefined ? `${el.borderRadius}px` : undefined,
                      color: el.textColor || undefined,
                      width: elWidth ? "100%" : undefined,
                      height: elHeight ? "100%" : undefined,
                    }}
                    className={cn(
                      "px-4 py-2 font-medium text-xs shadow-md flex items-center justify-center gap-1.5 pointer-events-none hover:opacity-90 whitespace-nowrap",
                      !el.color && "bg-primary text-primary-foreground",
                      el.borderRadius === undefined && "rounded-xl"
                    )}
                  >
                    <MousePointerClick className="size-3.5" />
                    <span>{el.label || "Botón"}</span>
                  </button>
                ) : el.type === "text" ? (
                  <div
                    style={{
                      color: el.textColor || undefined,
                      fontSize: el.fontSize ? `${el.fontSize}px` : undefined,
                      width: elWidth ? "100%" : undefined,
                      height: elHeight ? "100%" : undefined,
                    }}
                    className="px-2 py-1 text-foreground font-semibold text-sm pointer-events-none whitespace-nowrap"
                  >
                    {el.label || "Texto"}
                  </div>
                ) : el.type === "card" ? (
                  <div
                    style={{
                      backgroundColor: el.color || undefined,
                      borderRadius: el.borderRadius !== undefined ? `${el.borderRadius}px` : undefined,
                      width: elWidth ? "100%" : undefined,
                      height: elHeight ? "100%" : undefined,
                    }}
                    className="p-3 bg-card/90 border border-border/80 rounded-xl shadow-xs space-y-1 min-w-[130px] pointer-events-none"
                  >
                    <span
                      style={{ color: el.textColor || undefined }}
                      className="text-xs font-semibold text-foreground"
                    >
                      {el.label || "Tarjeta"}
                    </span>
                    <p className="text-[10px] text-muted-foreground">Contenido</p>
                  </div>
                ) : el.type === "input" ? (
                  <div
                    style={{
                      borderRadius: el.borderRadius !== undefined ? `${el.borderRadius}px` : undefined,
                      width: elWidth ? "100%" : undefined,
                      height: elHeight ? "100%" : undefined,
                    }}
                    className="px-3 py-2 bg-muted/60 border border-border/70 rounded-lg text-xs text-muted-foreground flex items-center justify-between min-w-[140px] pointer-events-none whitespace-nowrap"
                  >
                    <span>{el.label || "Escribe algo..."}</span>
                  </div>
                ) : el.type === "icon" ? (
                  <div
                    style={{
                      color: el.color || undefined,
                      fontSize: el.fontSize ? `${el.fontSize}px` : undefined,
                      width: elWidth ? "100%" : undefined,
                      height: elHeight ? "100%" : undefined,
                    }}
                    className="size-9 rounded-full bg-primary/10 text-primary flex items-center justify-center shadow-xs pointer-events-none"
                  >
                    <Sparkles className="size-4" />
                  </div>
                ) : (
                  <div
                    style={{
                      backgroundColor: el.color || undefined,
                      borderRadius: el.borderRadius !== undefined ? `${el.borderRadius}px` : undefined,
                      width: elWidth ? `${elWidth}px` : (el.width ? `${el.width}px` : undefined),
                      height: elHeight ? `${elHeight}px` : (el.height ? `${el.height}px` : undefined),
                    }}
                    className="w-24 h-16 bg-muted/50 border border-dashed border-border rounded-xl flex items-center justify-center text-[10px] text-muted-foreground pointer-events-none"
                  >
                    {el.label || null}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="h-full w-full flex flex-col items-center justify-center text-center p-4 text-muted-foreground/30 pointer-events-none select-none">
            <span className="text-[11px] font-medium text-muted-foreground/50">Lienzo vacío • Arrastra widgets aquí</span>
          </div>
        )}
      </div>
    );
  };

  const isDrawToolActive =
    activeTool === "frame" ||
    activeTool === "section" ||
    activeTool === "shape" ||
    activeTool === "ellipse" ||
    activeTool === "line" ||
    activeTool === "image";

  const cursorClass = isPanning
    ? "cursor-grabbing"
    : isSpacePressed || activeTool === "hand"
      ? "cursor-grab"
      : activeTool === "text"
        ? "cursor-text"
        : isDrawToolActive
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
            const defaultBg = frame.themeMode === "dark" ? "#121212" : "#FFFFFF";
            const screenBgColor =
              frame.hasFill === false || frame.fillVisible === false
                ? "transparent"
                : frame.fill || defaultBg;
            const baseOpacity =
              frame.hasFill === false || frame.fillVisible === false
                ? 1
                : (frame.fillOpacity ?? 100) / 100;
            const totalOpacity = ((frame.opacity ?? 100) / 100) * baseOpacity;
            const cornerRadiusPx = frame.cornerRadius || 0;
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
                className="absolute flex flex-col items-start select-none"
                style={{
                  left: `${2000 + frame.x * scale}px`,
                  top: `${2000 + frame.y * scale}px`,
                  transform: `scale(${scale})`,
                  transformOrigin: "top left",
                }}
                onClick={(e) => {
                  if (activeTool === "hand") return;
                  e.stopPropagation();
                  setSelectedFrameId(frame.id);
                }}
              >
                {/* Figma-style Frame Label for selection and dragging */}
                <div
                  className={cn(
                    "mb-1 flex items-center gap-1.5 cursor-grab active:cursor-grabbing select-none transition-colors",
                    isSelected
                      ? "text-primary font-medium"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  onPointerDown={(e) => handleFrameHeaderPointerDown(frame.id, e)}
                  onClick={(e) => {
                    if (activeTool === "hand") return;
                    e.stopPropagation();
                    setSelectedFrameId(frame.id);
                    setSelectedElementId("");
                  }}
                >
                  <span className="text-xs">
                    {frame.name}
                  </span>
                  <span className="text-[10px] opacity-60 font-mono">
                    {frame.width} × {frame.height}
                  </span>
                </div>

                {/* Clean Borderless Artboard Frame */}
                <div
                  className={cn(
                    "relative flex flex-col transition-all duration-150",
                    frame.themeMode === "dark" ? "bg-[#121212] text-white" : "bg-white text-foreground",
                    frame.clipContent === false ? "overflow-visible" : "overflow-hidden",
                    isSelected
                      ? "ring-1 ring-primary shadow-sm"
                      : "shadow-xs"
                  )}
                  style={{
                    width: `${frame.width}px`,
                    height: `${frame.height}px`,
                    backgroundColor: screenBgColor,
                    borderRadius: `${cornerRadiusPx}px`,
                    opacity: totalOpacity,
                    outline: strokeOutline,
                    outlineOffset: "-1px",
                    transform: `rotate(${frame.rotation || 0}deg) scaleX(${frame.flipHorizontal ? -1 : 1}) scaleY(${frame.flipVertical ? -1 : 1})`,
                    transformOrigin: "center center",
                    transition: "transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
                    boxShadow: customShadow,
                  }}
                >
                  <div
                    className="flex-1 w-full h-full min-h-0 overflow-hidden flex flex-col relative"
                    style={{
                      borderRadius: `${cornerRadiusPx}px`,
                    }}
                  >
                    {renderPhoneScreenContent(frame)}

                    {/* Layout Grid Overlay */}
                    {frame.layoutGrid && frame.layoutGrid.visible && (
                      <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden flex">
                        {frame.layoutGrid.type === "columns" ? (
                          <div
                            className="w-full h-full flex"
                            style={{
                              paddingLeft: `${frame.layoutGrid.margin ?? 16}px`,
                              paddingRight: `${frame.layoutGrid.margin ?? 16}px`,
                              gap: `${frame.layoutGrid.gutter ?? 8}px`,
                            }}
                          >
                            {Array.from({ length: frame.layoutGrid.count ?? 4 }).map((_, i) => (
                              <div
                                key={i}
                                className="flex-1 h-full"
                                style={{
                                  backgroundColor: frame.layoutGrid?.color || "rgba(255, 0, 80, 0.08)",
                                }}
                              />
                            ))}
                          </div>
                        ) : (
                          <div
                            className="w-full h-full"
                            style={{
                              backgroundImage: `linear-gradient(to right, ${frame.layoutGrid.color || "rgba(255, 0, 80, 0.1)"} 1px, transparent 1px), linear-gradient(to bottom, ${frame.layoutGrid.color || "rgba(255, 0, 80, 0.1)"} 1px, transparent 1px)`,
                              backgroundSize: `${frame.layoutGrid.size ?? 8}px ${frame.layoutGrid.size ?? 8}px`,
                            }}
                          />
                        )}
                      </div>
                    )}
                  </div>
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

      {/* Designer Rulers (Figma Style) */}
      <DesignerRulers
        viewportRef={viewportRef}
        scale={scale}
        visible={showRulers}
        onToggleVisible={() => setShowRulers(false)}
        isLeftSidebarOpen={isLeftSidebarOpen}
        isRightSidebarOpen={isRightSidebarOpen}
        leftSidebarWidth={leftSidebarWidth}
        rightSidebarWidth={rightSidebarWidth}
        activeFrame={selectedFrame}
      />

      {/* Helpful Hint Pill when Space is held */}
      {isSpacePressed && (
        <div className="absolute top-8 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5 rounded-full border border-border/80 bg-background/85 px-3.5 py-1 shadow-lg backdrop-blur-xl">
          <Hand className="size-3.5 text-primary" />
          <span className="text-xs font-medium text-foreground">
            {isPanning ? "Arrastrando canvas..." : "Modo mano: haz clic y arrastra"}
          </span>
        </div>
      )}
    </div>
  );
}
