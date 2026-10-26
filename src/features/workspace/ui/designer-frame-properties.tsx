import * as React from "react";
import {
  AlignHorizontalJustifyStart,
  AlignHorizontalJustifyCenter,
  AlignHorizontalJustifyEnd,
  AlignVerticalJustifyStart,
  AlignVerticalJustifyCenter,
  AlignVerticalJustifyEnd,
  RotateCw,
  FlipHorizontal,
  FlipVertical,
  Plus,
  Minus,
  Eye,
  EyeOff,
  LayoutTemplate,
  ScrollText,
  Layers,
  MousePointerClick,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { CanvasDeviceFrame, LayoutFlow, ScreenLayoutType } from "./designer-canvas";
import { updateFlutterFileScreenLayout, getFlutterFileName } from "../model/designer-frame-file";

// ── Figma-style Layout Icons ──
function HugContentIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M2.5 5.5H5.5V2.5M13.5 10.5H10.5V13.5M5.5 5.5L2 2M10.5 10.5L14 14"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function OrientationIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect
        x="2.5"
        y="1.5"
        width="7"
        height="12"
        rx="1.5"
        stroke="currentColor"
        strokeWidth="1.2"
      />
      <path
        d="M12.5 8V13M10 10.5H15"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function FlowNoneIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 18 18"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect x="7" y="2.5" width="4" height="4" rx="1" stroke="currentColor" strokeWidth="1.2" />
      <rect x="2.5" y="10.5" width="4" height="4" rx="1" stroke="currentColor" strokeWidth="1.2" />
      <rect x="11.5" y="10.5" width="4" height="4" rx="1" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

function FlowVerticalIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 18 18"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect x="3" y="3" width="4.5" height="4.5" rx="1" stroke="currentColor" strokeWidth="1.2" />
      <rect x="3" y="10.5" width="4.5" height="4.5" rx="1" stroke="currentColor" strokeWidth="1.2" />
      <path
        d="M12.5 4.5V13.5M12.5 13.5L10 11M12.5 13.5L15 11"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function FlowHorizontalIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 18 18"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect x="3" y="3" width="4.5" height="4.5" rx="1" stroke="currentColor" strokeWidth="1.2" />
      <rect x="10.5" y="3" width="4.5" height="4.5" rx="1" stroke="currentColor" strokeWidth="1.2" />
      <path
        d="M4.5 12.5H13.5M13.5 12.5L11 10M13.5 12.5L11 15"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function FlowWrapIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 18 18"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect x="3" y="3" width="4.5" height="4.5" rx="1" stroke="currentColor" strokeWidth="1.2" />
      <rect x="10.5" y="3" width="4.5" height="4.5" rx="1" stroke="currentColor" strokeWidth="1.2" />
      <rect x="3" y="10.5" width="4.5" height="4.5" rx="1" stroke="currentColor" strokeWidth="1.2" />
      <rect x="10.5" y="10.5" width="4.5" height="4.5" rx="1" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

function ConstrainProportionsIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 14 14"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M4 1.5H2C1.72386 1.5 1.5 1.72386 1.5 2V4M10 1.5H12C12.2761 1.5 12.5 1.72386 12.5 2V4M1.5 10V12C1.5 12.2761 1.72386 12.5 2 12.5H4M12.5 10V12C12.5 12.2761 12.2761 12.5 12 12.5H10"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect x="5" y="5" width="4" height="4" rx="0.5" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

function SpacingIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 14 14"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect x="1.5" y="2" width="2.5" height="10" rx="0.75" stroke="currentColor" strokeWidth="1.2" />
      <rect x="10" y="2" width="2.5" height="10" rx="0.75" stroke="currentColor" strokeWidth="1.2" />
      <path d="M5.5 7H8.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

function VariableStylesIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <circle cx="4.5" cy="4.5" r="1.5" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="11.5" cy="4.5" r="1.5" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="4.5" cy="11.5" r="1.5" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="11.5" cy="11.5" r="1.5" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

function DropShadowIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect x="2" y="2" width="9" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
      <path
        d="M5 13H12C12.5523 13 13 12.5523 13 12V5"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeDasharray="1.5 2"
      />
    </svg>
  );
}

interface DesignerFramePropertiesProps {
  frame: CanvasDeviceFrame;
  allFrames?: CanvasDeviceFrame[];
  onChangeFrame: (updatedFrame: CanvasDeviceFrame) => void;
  selectedElementId?: string;
  onSelectElementId?: (id: string) => void;
}

const DEFAULT_THEME_VARIABLES = [
  { id: "primary", name: "primary (Light)", value: "#6750a4" },
  { id: "onPrimary", name: "onPrimary", value: "#ffffff" },
  { id: "secondary", name: "secondary", value: "#625b71" },
  { id: "surface", name: "surface", value: "#fef7ff" },
  { id: "background", name: "background", value: "#ffffff" },
  { id: "error", name: "error", value: "#b3261e" },
];

export function DesignerFrameProperties({
  frame,
  allFrames = [],
  onChangeFrame,
  selectedElementId,
  onSelectElementId,
}: DesignerFramePropertiesProps) {
  // Local state for smooth typing before blur/commit
  const [xInput, setXInput] = React.useState<string>(String(Math.round(frame.x)));
  const [yInput, setYInput] = React.useState<string>(String(Math.round(frame.y)));
  const [wInput, setWInput] = React.useState<string>(String(Math.round(frame.width)));
  const [hInput, setHInput] = React.useState<string>(String(Math.round(frame.height)));
  const [spacingInput, setSpacingInput] = React.useState<string>(String(frame.spacing ?? 16));
  const [rotInput, setRotInput] = React.useState<string>(String(frame.rotation || 0));

  // Fill, Stroke, Effects local states
  const [fillHexInput, setFillHexInput] = React.useState<string>(
    (frame.fill || "#FFFFFF").replace("#", "").toUpperCase()
  );
  const [fillOpacityInput, setFillOpacityInput] = React.useState<string>(
    String(frame.fillOpacity ?? 100)
  );
  const [isColorVariablesOpen, setIsColorVariablesOpen] = React.useState<boolean>(false);

  // Sync inputs when frame changes externally
  React.useEffect(() => {
    setXInput(String(Math.round(frame.x)));
  }, [frame.x]);

  React.useEffect(() => {
    setYInput(String(Math.round(frame.y)));
  }, [frame.y]);

  React.useEffect(() => {
    setWInput(String(Math.round(frame.width)));
  }, [frame.width]);

  React.useEffect(() => {
    setHInput(String(Math.round(frame.height)));
  }, [frame.height]);

  React.useEffect(() => {
    setSpacingInput(String(frame.spacing ?? 16));
  }, [frame.spacing]);

  React.useEffect(() => {
    setRotInput(String(frame.rotation || 0));
  }, [frame.rotation]);

  React.useEffect(() => {
    setFillHexInput((frame.fill || "#FFFFFF").replace("#", "").toUpperCase());
  }, [frame.fill]);

  React.useEffect(() => {
    setFillOpacityInput(String(frame.fillOpacity ?? 100));
  }, [frame.fillOpacity]);

  // Position & Dimension commit helpers
  const commitX = (val: number) => {
    if (!isNaN(val)) onChangeFrame({ ...frame, x: Math.round(val) });
  };

  const commitY = (val: number) => {
    if (!isNaN(val)) onChangeFrame({ ...frame, y: Math.round(val) });
  };

  const commitWidth = (val: number) => {
    if (!isNaN(val) && val > 0) {
      const newW = Math.round(val);
      if (frame.constrainProportions && frame.width > 0) {
        const ratio = frame.height / frame.width;
        const newH = Math.round(newW * ratio);
        onChangeFrame({ ...frame, width: newW, height: newH });
        setHInput(String(newH));
      } else {
        onChangeFrame({ ...frame, width: newW });
      }
    }
  };

  const commitHeight = (val: number) => {
    if (!isNaN(val) && val > 0) {
      const newH = Math.round(val);
      if (frame.constrainProportions && frame.height > 0) {
        const ratio = frame.width / frame.height;
        const newW = Math.round(newH * ratio);
        onChangeFrame({ ...frame, width: newW, height: newH });
        setWInput(String(newW));
      } else {
        onChangeFrame({ ...frame, height: newH });
      }
    }
  };

  const commitSpacing = (val: number) => {
    if (!isNaN(val)) onChangeFrame({ ...frame, spacing: Math.round(val) });
  };

  const toggleConstrainProportions = () => {
    onChangeFrame({ ...frame, constrainProportions: !frame.constrainProportions });
  };

  const handleFlowChange = (newFlow: LayoutFlow) => {
    onChangeFrame({ ...frame, layoutFlow: newFlow });
  };

  const handleHugContent = () => {
    let standardW = 402;
    let standardH = 874;
    if (frame.type === "android") {
      standardW = 380;
      standardH = 830;
    } else {
      if (frame.name.toLowerCase().includes("pro max")) {
        standardW = 440;
        standardH = 956;
      } else if (frame.name.includes("16") && !frame.name.toLowerCase().includes("pro")) {
        standardW = 393;
        standardH = 852;
      }
    }
    onChangeFrame({ ...frame, width: standardW, height: standardH });
  };

  const handleToggleOrientation = () => {
    onChangeFrame({ ...frame, width: frame.height, height: frame.width });
  };

  const commitRotation = (val: number) => {
    if (!isNaN(val)) onChangeFrame({ ...frame, rotation: Math.round(val) });
  };

  // Fill actions
  const commitFillHex = (val: string) => {
    const clean = val.replace(/[^0-9a-fA-F]/g, "").slice(0, 6);
    if (clean.length === 6 || clean.length === 3) {
      const fullHex =
        clean.length === 3
          ? `#${clean[0]}${clean[0]}${clean[1]}${clean[1]}${clean[2]}${clean[2]}`
          : `#${clean}`;
      onChangeFrame({
        ...frame,
        hasFill: true,
        fill: fullHex,
        fillToken: undefined,
      });
    }
  };

  const commitFillOpacity = (val: number) => {
    if (!isNaN(val)) {
      const clamped = Math.max(0, Math.min(100, Math.round(val)));
      onChangeFrame({ ...frame, fillOpacity: clamped });
    }
  };

  const handleToggleFillVisible = () => {
    onChangeFrame({
      ...frame,
      fillVisible: frame.fillVisible === false ? true : false,
    });
  };

  const handleRemoveFill = () => {
    onChangeFrame({ ...frame, hasFill: false });
  };

  const handleAddFill = () => {
    onChangeFrame({
      ...frame,
      hasFill: true,
      fill: frame.fill || "#FFFFFF",
      fillOpacity: frame.fillOpacity ?? 100,
      fillVisible: true,
      fillToken: undefined,
    });
    setFillHexInput((frame.fill || "#FFFFFF").replace("#", "").toUpperCase());
  };

  const handleSelectToken = (tokenName: string, tokenValue: string) => {
    onChangeFrame({
      ...frame,
      hasFill: true,
      fill: tokenValue,
      fillToken: tokenName,
      fillVisible: true,
    });
    setFillHexInput(tokenValue.replace("#", "").toUpperCase());
    setIsColorVariablesOpen(false);
  };

  // Stroke actions
  const handleAddStroke = () => {
    onChangeFrame({
      ...frame,
      stroke: {
        color: "#021014",
        opacity: 100,
        width: 1,
        visible: true,
      },
    });
  };

  const handleRemoveStroke = () => {
    onChangeFrame({ ...frame, stroke: undefined });
  };

  const handleToggleStrokeVisible = () => {
    if (!frame.stroke) return;
    onChangeFrame({
      ...frame,
      stroke: { ...frame.stroke, visible: !frame.stroke.visible },
    });
  };

  // Effects actions
  const handleAddEffect = () => {
    const newEffect = {
      id: `effect-${Date.now()}`,
      type: "dropShadow" as const,
      blur: 16,
      x: 0,
      y: 4,
      color: "rgba(0,0,0,0.25)",
      opacity: 25,
      visible: true,
    };
    onChangeFrame({
      ...frame,
      effects: [...(frame.effects || []), newEffect],
    });
  };

  const handleRemoveEffect = (id: string) => {
    onChangeFrame({
      ...frame,
      effects: frame.effects?.filter((e) => e.id !== id),
    });
  };

  const handleToggleEffectVisible = (id: string) => {
    onChangeFrame({
      ...frame,
      effects: frame.effects?.map((e) =>
        e.id === id ? { ...e, visible: !e.visible } : e
      ),
    });
  };

  // Keyboard navigation
  const handlePositionKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    type: "x" | "y" | "rot"
  ) => {
    if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault();
      const step = e.shiftKey ? 10 : 1;
      const delta = e.key === "ArrowUp" ? step : -step;
      if (type === "x") {
        const next = Math.round(frame.x) + delta;
        setXInput(String(next));
        commitX(next);
      } else if (type === "y") {
        const next = Math.round(frame.y) + delta;
        setYInput(String(next));
        commitY(next);
      } else if (type === "rot") {
        const next = (frame.rotation || 0) + delta;
        setRotInput(String(next));
        commitRotation(next);
      }
    } else if (e.key === "Enter") {
      e.currentTarget.blur();
    }
  };

  const handleDimensionKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    type: "w" | "h"
  ) => {
    if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault();
      const step = e.shiftKey ? 10 : 1;
      const delta = e.key === "ArrowUp" ? step : -step;
      if (type === "w") {
        const next = Math.max(10, Math.round(frame.width) + delta);
        setWInput(String(next));
        commitWidth(next);
      } else {
        const next = Math.max(10, Math.round(frame.height) + delta);
        setHInput(String(next));
        commitHeight(next);
      }
    } else if (e.key === "Enter") {
      e.currentTarget.blur();
    }
  };

  const handleSpacingKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault();
      const step = e.shiftKey ? 10 : 1;
      const delta = e.key === "ArrowUp" ? step : -step;
      const next = Math.max(0, (frame.spacing ?? 16) + delta);
      setSpacingInput(String(next));
      commitSpacing(next);
    } else if (e.key === "Enter") {
      e.currentTarget.blur();
    }
  };

  // Alignments
  const alignHorizontal = (type: "left" | "center" | "right") => {
    if (allFrames.length > 1) {
      const minX = Math.min(...allFrames.map((f) => f.x));
      const maxX = Math.max(...allFrames.map((f) => f.x + f.width));
      if (type === "left") commitX(minX);
      if (type === "center") commitX((minX + maxX - frame.width) / 2);
      if (type === "right") commitX(maxX - frame.width);
    } else {
      if (type === "left") commitX(-frame.width);
      if (type === "center") commitX(-frame.width / 2);
      if (type === "right") commitX(0);
    }
  };

  const alignVertical = (type: "top" | "center" | "bottom") => {
    if (allFrames.length > 1) {
      const minY = Math.min(...allFrames.map((f) => f.y));
      const maxY = Math.max(...allFrames.map((f) => f.y + f.height));
      if (type === "top") commitY(minY);
      if (type === "center") commitY((minY + maxY - frame.height) / 2);
      if (type === "bottom") commitY(maxY - frame.height);
    } else {
      if (type === "top") commitY(-frame.height);
      if (type === "center") commitY(-frame.height / 2);
      if (type === "bottom") commitY(0);
    }
  };

  // Quick rotations
  const handleRotate90 = () => {
    const current = frame.rotation || 0;
    const next = (current + 90) % 360;
    setRotInput(String(next));
    onChangeFrame({ ...frame, rotation: next });
  };

  const handleFlipHorizontal = () => {
    onChangeFrame({ ...frame, flipHorizontal: !frame.flipHorizontal });
  };

  const handleFlipVertical = () => {
    onChangeFrame({ ...frame, flipVertical: !frame.flipVertical });
  };

  const flow = frame.layoutFlow || "none";
  const hasFill = frame.hasFill !== false;
  const currentScreenLayout: ScreenLayoutType = frame.screenLayout || "scaffold";

  const handleScreenLayoutChange = (newLayout: ScreenLayoutType) => {
    const fileName = frame.fileName || getFlutterFileName(frame.name);
    const filePath = frame.filePath || `lib/screens/${fileName}`;
    const updatedFrame: CanvasDeviceFrame = {
      ...frame,
      screenLayout: newLayout,
      fileName,
      filePath,
    };
    onChangeFrame(updatedFrame);

    updateFlutterFileScreenLayout(
      filePath,
      fileName,
      frame.name,
      newLayout
    );
  };

  const selectedElement = frame.elements?.find((el) => el.id === selectedElementId);

  return (
    <div className="space-y-4 p-1 pb-6">
      {/* ── Selected Element Precision Controls (if an element is selected) ── */}
      {selectedElement && (
        <div className="p-2.5 rounded-lg border border-primary/40 bg-primary/5 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 min-w-0">
              <MousePointerClick className="size-3.5 text-primary shrink-0" />
              <span className="text-xs font-semibold text-foreground truncate">
                {selectedElement.name}
              </span>
            </div>
            <button
              type="button"
              onClick={() => onSelectElementId?.("")}
              className="text-[10px] text-muted-foreground hover:text-foreground shrink-0 transition-colors"
            >
              Deseleccionar
            </button>
          </div>

          <div className="grid grid-cols-2 gap-1.5 text-xs font-mono">
            <div className="flex items-center gap-1 px-2 py-1 rounded bg-background border border-border">
              <span className="text-muted-foreground text-[10px] w-3">X</span>
              <input
                type="number"
                value={selectedElement.x}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 0;
                  onChangeFrame({
                    ...frame,
                    elements: (frame.elements || []).map((el) =>
                      el.id === selectedElement.id ? { ...el, x: val } : el
                    ),
                  });
                }}
                className="w-full bg-transparent outline-none text-foreground text-xs"
              />
            </div>
            <div className="flex items-center gap-1 px-2 py-1 rounded bg-background border border-border">
              <span className="text-muted-foreground text-[10px] w-3">Y</span>
              <input
                type="number"
                value={selectedElement.y}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 0;
                  onChangeFrame({
                    ...frame,
                    elements: (frame.elements || []).map((el) =>
                      el.id === selectedElement.id ? { ...el, y: val } : el
                    ),
                  });
                }}
                className="w-full bg-transparent outline-none text-foreground text-xs"
              />
            </div>
          </div>

          <div className="flex items-center gap-1 px-2 py-1 rounded bg-background border border-border">
            <span className="text-muted-foreground text-[10px] shrink-0">Texto</span>
            <input
              type="text"
              value={selectedElement.label || ""}
              onChange={(e) => {
                const newLabel = e.target.value;
                onChangeFrame({
                  ...frame,
                  elements: (frame.elements || []).map((el) =>
                    el.id === selectedElement.id ? { ...el, label: newLabel } : el
                  ),
                });
              }}
              className="w-full bg-transparent outline-none text-foreground text-xs font-sans"
            />
          </div>

          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={() => {
              onChangeFrame({
                ...frame,
                elements: (frame.elements || []).filter((el) => el.id !== selectedElement.id),
              });
              onSelectElementId?.("");
            }}
            className="w-full text-destructive hover:bg-destructive/10 h-6 text-[10px]"
          >
            Eliminar de la pantalla
          </Button>
        </div>
      )}

      {/* ── 1. Layout Alignments Bar ── */}
      <div className="space-y-1.5">
        <span className="text-[10px] font-semibold tracking-wider uppercase text-muted-foreground px-1">
          Alineación
        </span>
        <div className="flex items-center justify-between p-1 rounded-lg border border-sidebar-border bg-sidebar-accent/30">
          <div className="flex items-center gap-0.5">
            <Tooltip>
              <TooltipTrigger
                render={
                  <button
                    type="button"
                    onClick={() => alignHorizontal("left")}
                    className="flex size-6 items-center justify-center rounded text-muted-foreground hover:bg-sidebar-accent hover:text-foreground active:scale-95 transition-all"
                  >
                    <AlignHorizontalJustifyStart className="size-3.5" />
                  </button>
                }
              />
              <TooltipContent side="top">Alinear izquierda</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger
                render={
                  <button
                    type="button"
                    onClick={() => alignHorizontal("center")}
                    className="flex size-6 items-center justify-center rounded text-muted-foreground hover:bg-sidebar-accent hover:text-foreground active:scale-95 transition-all"
                  >
                    <AlignHorizontalJustifyCenter className="size-3.5" />
                  </button>
                }
              />
              <TooltipContent side="top">Alinear centro horizontal</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger
                render={
                  <button
                    type="button"
                    onClick={() => alignHorizontal("right")}
                    className="flex size-6 items-center justify-center rounded text-muted-foreground hover:bg-sidebar-accent hover:text-foreground active:scale-95 transition-all"
                  >
                    <AlignHorizontalJustifyEnd className="size-3.5" />
                  </button>
                }
              />
              <TooltipContent side="top">Alinear derecha</TooltipContent>
            </Tooltip>
          </div>

          <div className="h-4 w-px bg-sidebar-border/80 mx-1" />

          <div className="flex items-center gap-0.5">
            <Tooltip>
              <TooltipTrigger
                render={
                  <button
                    type="button"
                    onClick={() => alignVertical("top")}
                    className="flex size-6 items-center justify-center rounded text-muted-foreground hover:bg-sidebar-accent hover:text-foreground active:scale-95 transition-all"
                  >
                    <AlignVerticalJustifyStart className="size-3.5" />
                  </button>
                }
              />
              <TooltipContent side="top">Alinear arriba</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger
                render={
                  <button
                    type="button"
                    onClick={() => alignVertical("center")}
                    className="flex size-6 items-center justify-center rounded text-muted-foreground hover:bg-sidebar-accent hover:text-foreground active:scale-95 transition-all"
                  >
                    <AlignVerticalJustifyCenter className="size-3.5" />
                  </button>
                }
              />
              <TooltipContent side="top">Alinear centro vertical</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger
                render={
                  <button
                    type="button"
                    onClick={() => alignVertical("bottom")}
                    className="flex size-6 items-center justify-center rounded text-muted-foreground hover:bg-sidebar-accent hover:text-foreground active:scale-95 transition-all"
                  >
                    <AlignVerticalJustifyEnd className="size-3.5" />
                  </button>
                }
              />
              <TooltipContent side="top">Alinear abajo</TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>

      {/* ── 2. Disposición (Figma Auto Layout & Dimensions) ── */}
      <div className="space-y-3 pt-1 border-t border-sidebar-border/60">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-semibold text-foreground">
            Disposición
          </span>
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger
                render={
                  <button
                    type="button"
                    onClick={handleHugContent}
                    className="flex size-6 items-center justify-center rounded text-muted-foreground hover:bg-sidebar-accent hover:text-foreground active:scale-95 transition-all"
                  >
                    <HugContentIcon className="size-3.5" />
                  </button>
                }
              />
              <TooltipContent side="top">Ajustar al tamaño estándar</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger
                render={
                  <button
                    type="button"
                    onClick={handleToggleOrientation}
                    className="flex size-6 items-center justify-center rounded text-muted-foreground hover:bg-sidebar-accent hover:text-foreground active:scale-95 transition-all"
                  >
                    <OrientationIcon className="size-3.5" />
                  </button>
                }
              />
              <TooltipContent side="top">Cambiar orientación</TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Estructura Raíz de Pantalla (Scaffold / Scrollable / Stack) */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] text-muted-foreground">Estructura Flutter</span>
            <span className="text-[9px] font-mono font-medium text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20">
              {currentScreenLayout === "scaffold"
                ? "Scaffold"
                : currentScreenLayout === "scrollable"
                  ? "Slivers"
                  : "Stack"}
            </span>
          </div>

          <div className="grid grid-cols-3 p-0.5 rounded-lg border border-sidebar-border bg-sidebar-accent/30 gap-0.5">
            {/* 1. Scaffold */}
            <Tooltip>
              <TooltipTrigger
                render={
                  <button
                    type="button"
                    onClick={() => handleScreenLayoutChange("scaffold")}
                    className={cn(
                      "flex flex-col items-center justify-center gap-1 py-1.5 px-1 rounded-md transition-all",
                      currentScreenLayout === "scaffold"
                        ? "bg-background text-foreground shadow-xs border border-sidebar-border font-medium"
                        : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/50"
                    )}
                  >
                    <LayoutTemplate className="size-3.5" />
                    <span className="text-[10px] leading-none">Scaffold</span>
                  </button>
                }
              />
              <TooltipContent side="top">
                Material Scaffold (AppBar, Body, Navigation)
              </TooltipContent>
            </Tooltip>

            {/* 2. Scrollable */}
            <Tooltip>
              <TooltipTrigger
                render={
                  <button
                    type="button"
                    onClick={() => handleScreenLayoutChange("scrollable")}
                    className={cn(
                      "flex flex-col items-center justify-center gap-1 py-1.5 px-1 rounded-md transition-all",
                      currentScreenLayout === "scrollable"
                        ? "bg-background text-foreground shadow-xs border border-sidebar-border font-medium"
                        : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/50"
                    )}
                  >
                    <ScrollText className="size-3.5" />
                    <span className="text-[10px] leading-none">Scrollable</span>
                  </button>
                }
              />
              <TooltipContent side="top">
                CustomScrollView con Slivers y cabecera expandible
              </TooltipContent>
            </Tooltip>

            {/* 3. Stack */}
            <Tooltip>
              <TooltipTrigger
                render={
                  <button
                    type="button"
                    onClick={() => handleScreenLayoutChange("stack")}
                    className={cn(
                      "flex flex-col items-center justify-center gap-1 py-1.5 px-1 rounded-md transition-all",
                      currentScreenLayout === "stack"
                        ? "bg-background text-foreground shadow-xs border border-sidebar-border font-medium"
                        : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/50"
                    )}
                  >
                    <Layers className="size-3.5" />
                    <span className="text-[10px] leading-none">Stack</span>
                  </button>
                }
              />
              <TooltipContent side="top">
                Pantalla inmersiva con Stack y capas superpuestas
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Flujo Subsection */}
        <div className="space-y-1.5">
          <span className="text-[11px] text-muted-foreground px-1">Flujo</span>
          <div className="grid grid-cols-4 p-0.5 rounded-lg border border-sidebar-border bg-sidebar-accent/30">
            <Tooltip>
              <TooltipTrigger
                render={
                  <button
                    type="button"
                    onClick={() => handleFlowChange("none")}
                    className={cn(
                      "flex h-7 items-center justify-center rounded-md transition-all",
                      flow === "none"
                        ? "bg-background text-foreground shadow-xs border border-sidebar-border"
                        : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/50"
                    )}
                  >
                    <FlowNoneIcon className="size-4" />
                  </button>
                }
              />
              <TooltipContent side="top">Diseño libre (Stack)</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger
                render={
                  <button
                    type="button"
                    onClick={() => handleFlowChange("vertical")}
                    className={cn(
                      "flex h-7 items-center justify-center rounded-md transition-all",
                      flow === "vertical"
                        ? "bg-background text-foreground shadow-xs border border-sidebar-border"
                        : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/50"
                    )}
                  >
                    <FlowVerticalIcon className="size-4" />
                  </button>
                }
              />
              <TooltipContent side="top">Flujo vertical (Column)</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger
                render={
                  <button
                    type="button"
                    onClick={() => handleFlowChange("horizontal")}
                    className={cn(
                      "flex h-7 items-center justify-center rounded-md transition-all",
                      flow === "horizontal"
                        ? "bg-background text-foreground shadow-xs border border-sidebar-border"
                        : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/50"
                    )}
                  >
                    <FlowHorizontalIcon className="size-4" />
                  </button>
                }
              />
              <TooltipContent side="top">Flujo horizontal (Row)</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger
                render={
                  <button
                    type="button"
                    onClick={() => handleFlowChange("wrap")}
                    className={cn(
                      "flex h-7 items-center justify-center rounded-md transition-all",
                      flow === "wrap"
                        ? "bg-background text-foreground shadow-xs border border-sidebar-border"
                        : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/50"
                    )}
                  >
                    <FlowWrapIcon className="size-4" />
                  </button>
                }
              />
              <TooltipContent side="top">Flujo envolvente (Wrap)</TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Dimensiones Subsection */}
        <div className="space-y-1.5">
          <span className="text-[11px] text-muted-foreground px-1">Dimensiones</span>
          <div className="flex items-center gap-2">
            <div className="flex-1 flex items-center h-7 px-2.5 rounded-lg border border-sidebar-border bg-sidebar-accent/30 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/20 transition-all">
              <span className="text-[11px] font-medium text-muted-foreground mr-2 select-none">
                W
              </span>
              <input
                type="number"
                value={wInput}
                onChange={(e) => setWInput(e.target.value)}
                onBlur={() => commitWidth(parseFloat(wInput))}
                onKeyDown={(e) => handleDimensionKeyDown(e, "w")}
                className="w-full bg-transparent text-xs font-mono text-foreground outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>

            <div className="flex-1 flex items-center h-7 px-2.5 rounded-lg border border-sidebar-border bg-sidebar-accent/30 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/20 transition-all">
              <span className="text-[11px] font-medium text-muted-foreground mr-2 select-none">
                H
              </span>
              <input
                type="number"
                value={hInput}
                onChange={(e) => setHInput(e.target.value)}
                onBlur={() => commitHeight(parseFloat(hInput))}
                onKeyDown={(e) => handleDimensionKeyDown(e, "h")}
                className="w-full bg-transparent text-xs font-mono text-foreground outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>

            <Tooltip>
              <TooltipTrigger
                render={
                  <button
                    type="button"
                    onClick={toggleConstrainProportions}
                    className={cn(
                      "flex size-7 items-center justify-center rounded-lg border transition-all shrink-0 active:scale-95",
                      frame.constrainProportions
                        ? "bg-primary/10 border-primary/40 text-primary shadow-xs"
                        : "border-sidebar-border bg-sidebar-accent/30 text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
                    )}
                  >
                    <ConstrainProportionsIcon className="size-3.5" />
                  </button>
                }
              />
              <TooltipContent side="top">
                {frame.constrainProportions ? "Desbloquear proporciones" : "Bloquear proporciones"}
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Espaciamiento Subsection */}
        <div className="space-y-1.5">
          <span className="text-[11px] text-muted-foreground px-1">Espaciamiento</span>
          <div className="w-[calc(50%-4px)] flex items-center h-7 px-2.5 rounded-lg border border-sidebar-border bg-sidebar-accent/30 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/20 transition-all">
            <SpacingIcon className="size-3.5 text-muted-foreground mr-1.5 shrink-0" />
            <input
              type="number"
              value={spacingInput}
              onChange={(e) => setSpacingInput(e.target.value)}
              onBlur={() => commitSpacing(parseFloat(spacingInput))}
              onKeyDown={handleSpacingKeyDown}
              className="w-full bg-transparent text-xs font-mono text-foreground outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
          </div>
        </div>
      </div>

      {/* ── 3. Position Inputs (X, Y) ── */}
      <div className="space-y-1.5 pt-1 border-t border-sidebar-border/60">
        <span className="text-[10px] font-semibold tracking-wider uppercase text-muted-foreground px-1">
          Posición
        </span>
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center h-7 px-2 rounded-md border border-sidebar-border bg-background/50 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/20 transition-all">
            <span className="text-[10px] font-mono font-medium text-muted-foreground mr-1.5 select-none">
              X
            </span>
            <input
              type="number"
              value={xInput}
              onChange={(e) => setXInput(e.target.value)}
              onBlur={() => commitX(parseFloat(xInput))}
              onKeyDown={(e) => handlePositionKeyDown(e, "x")}
              className="w-full bg-transparent text-xs font-mono text-foreground outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <span className="text-[10px] font-mono text-muted-foreground/60 select-none">
              px
            </span>
          </div>

          <div className="flex items-center h-7 px-2 rounded-md border border-sidebar-border bg-background/50 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/20 transition-all">
            <span className="text-[10px] font-mono font-medium text-muted-foreground mr-1.5 select-none">
              Y
            </span>
            <input
              type="number"
              value={yInput}
              onChange={(e) => setYInput(e.target.value)}
              onBlur={() => commitY(parseFloat(yInput))}
              onKeyDown={(e) => handlePositionKeyDown(e, "y")}
              className="w-full bg-transparent text-xs font-mono text-foreground outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <span className="text-[10px] font-mono text-muted-foreground/60 select-none">
              px
            </span>
          </div>
        </div>
      </div>

      {/* ── 4. Rotation Input & Quick Actions ── */}
      <div className="space-y-1.5 pt-1 border-t border-sidebar-border/60">
        <span className="text-[10px] font-semibold tracking-wider uppercase text-muted-foreground px-1">
          Rotación
        </span>
        <div className="flex items-center gap-2">
          <div className="flex-1 flex items-center h-7 px-2 rounded-md border border-sidebar-border bg-background/50 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/20 transition-all">
            <RotateCw className="size-3 text-muted-foreground mr-1.5 shrink-0" />
            <input
              type="number"
              value={rotInput}
              onChange={(e) => setRotInput(e.target.value)}
              onBlur={() => commitRotation(parseFloat(rotInput))}
              onKeyDown={(e) => handlePositionKeyDown(e, "rot")}
              className="w-full bg-transparent text-xs font-mono text-foreground outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <span className="text-[10px] font-mono text-muted-foreground/60 select-none">
              °
            </span>
          </div>

          <div className="flex items-center gap-0.5 bg-sidebar-accent/30 p-0.5 rounded-md border border-sidebar-border shrink-0">
            <Tooltip>
              <TooltipTrigger
                render={
                  <button
                    type="button"
                    onClick={handleRotate90}
                    className="flex size-6 items-center justify-center rounded text-muted-foreground hover:bg-sidebar-accent hover:text-foreground active:scale-95 transition-all"
                  >
                    <RotateCw className="size-3.5" />
                  </button>
                }
              />
              <TooltipContent side="top">Girar 90°</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger
                render={
                  <button
                    type="button"
                    onClick={handleFlipHorizontal}
                    className={cn(
                      "flex size-6 items-center justify-center rounded transition-all",
                      frame.flipHorizontal
                        ? "bg-primary text-primary-foreground shadow-xs"
                        : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground active:scale-95"
                    )}
                  >
                    <FlipHorizontal className="size-3.5" />
                  </button>
                }
              />
              <TooltipContent side="top">Girar horizontalmente</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger
                render={
                  <button
                    type="button"
                    onClick={handleFlipVertical}
                    className={cn(
                      "flex size-6 items-center justify-center rounded transition-all",
                      frame.flipVertical
                        ? "bg-primary text-primary-foreground shadow-xs"
                        : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground active:scale-95"
                    )}
                  >
                    <FlipVertical className="size-3.5" />
                  </button>
                }
              />
              <TooltipContent side="top">Girar verticalmente</TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>

      {/* ── 5. Relleno (Fill) ── */}
      <div className="space-y-2 pt-1 border-t border-sidebar-border/60">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-semibold text-foreground">Relleno</span>
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger
                render={
                  <button
                    type="button"
                    onClick={() => setIsColorVariablesOpen(!isColorVariablesOpen)}
                    className={cn(
                      "flex size-6 items-center justify-center rounded transition-all",
                      isColorVariablesOpen
                        ? "bg-sidebar-accent text-foreground shadow-xs"
                        : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground active:scale-95"
                    )}
                  >
                    <VariableStylesIcon className="size-3.5" />
                  </button>
                }
              />
              <TooltipContent side="top">Variables de color de Flutter</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger
                render={
                  <button
                    type="button"
                    onClick={handleAddFill}
                    className="flex size-6 items-center justify-center rounded text-muted-foreground hover:bg-sidebar-accent hover:text-foreground active:scale-95 transition-all"
                  >
                    <Plus className="size-3.5" />
                  </button>
                }
              />
              <TooltipContent side="top">Añadir relleno</TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Color Variables Dropdown Popover */}
        {isColorVariablesOpen && (
          <div className="p-1.5 rounded-lg border border-sidebar-border bg-sidebar shadow-xl space-y-1 animate-in fade-in zoom-in-95 duration-100">
            <span className="text-[10px] font-semibold text-muted-foreground px-1.5 uppercase tracking-wider block">
              Tokens de tema Flutter
            </span>
            <div className="space-y-0.5 max-h-40 overflow-y-auto">
              {DEFAULT_THEME_VARIABLES.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => handleSelectToken(v.name, v.value)}
                  className="w-full flex items-center justify-between px-2 py-1 rounded text-xs hover:bg-sidebar-accent text-foreground transition-colors group"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="size-3.5 rounded-sm border border-border/80 shadow-2xs shrink-0"
                      style={{ backgroundColor: v.value }}
                    />
                    <span className="font-medium truncate">{v.name}</span>
                  </div>
                  <span className="font-mono text-[10px] text-muted-foreground group-hover:text-foreground">
                    {v.value.toUpperCase()}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Fill Row */}
        {hasFill ? (
          <div className="flex items-center gap-1.5">
            {/* Pill Container for Swatch + Hex + Opacity */}
            <div className="flex-1 flex items-center justify-between h-8 px-2 rounded-lg border border-sidebar-border bg-sidebar-accent/30 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/20 transition-all min-w-0">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                {/* Clickable Swatch with native color picker overlay */}
                <label className="relative flex size-4 rounded-sm border border-border/80 shadow-2xs cursor-pointer overflow-hidden shrink-0">
                  <div
                    className="size-full pointer-events-none"
                    style={{ backgroundColor: frame.fill || "#FFFFFF" }}
                  />
                  <input
                    type="color"
                    value={frame.fill?.startsWith("#") ? frame.fill.slice(0, 7) : "#ffffff"}
                    onChange={(e) => {
                      const hex = e.target.value.toUpperCase();
                      setFillHexInput(hex.replace("#", ""));
                      onChangeFrame({
                        ...frame,
                        hasFill: true,
                        fill: hex,
                        fillToken: undefined,
                      });
                    }}
                    className="absolute inset-0 size-full opacity-0 cursor-pointer p-0 m-0 border-0 outline-none"
                  />
                </label>

                {/* Token or Hex input */}
                {frame.fillToken ? (
                  <span
                    onClick={() => {
                      onChangeFrame({ ...frame, fillToken: undefined });
                    }}
                    title="Haz clic para desacoplar el token"
                    className="text-xs font-medium text-foreground truncate cursor-pointer hover:underline select-none"
                  >
                    {frame.fillToken}
                  </span>
                ) : (
                  <input
                    type="text"
                    value={fillHexInput}
                    onChange={(e) => setFillHexInput(e.target.value.toUpperCase())}
                    onBlur={() => commitFillHex(fillHexInput)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") e.currentTarget.blur();
                    }}
                    className="w-full bg-transparent text-xs font-mono uppercase text-foreground outline-none"
                  />
                )}
              </div>

              {/* Opacity */}
              <div className="flex items-center gap-0.5 shrink-0 pl-1">
                <input
                  type="number"
                  value={fillOpacityInput}
                  onChange={(e) => setFillOpacityInput(e.target.value)}
                  onBlur={() => commitFillOpacity(parseFloat(fillOpacityInput))}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") e.currentTarget.blur();
                  }}
                  className="w-7 text-right bg-transparent text-xs font-mono text-foreground outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <span className="text-xs font-mono text-muted-foreground select-none">
                  %
                </span>
              </div>
            </div>

            {/* Visibility Toggle */}
            <Tooltip>
              <TooltipTrigger
                render={
                  <button
                    type="button"
                    onClick={handleToggleFillVisible}
                    className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-sidebar-accent hover:text-foreground active:scale-95 transition-all shrink-0"
                  >
                    {frame.fillVisible !== false ? (
                      <Eye className="size-3.5" />
                    ) : (
                      <EyeOff className="size-3.5 text-muted-foreground/60" />
                    )}
                  </button>
                }
              />
              <TooltipContent side="top">
                {frame.fillVisible !== false ? "Ocultar relleno" : "Mostrar relleno"}
              </TooltipContent>
            </Tooltip>

            {/* Remove Fill */}
            <Tooltip>
              <TooltipTrigger
                render={
                  <button
                    type="button"
                    onClick={handleRemoveFill}
                    className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-sidebar-accent hover:text-foreground active:scale-95 transition-all shrink-0"
                  >
                    <Minus className="size-3.5" />
                  </button>
                }
              />
              <TooltipContent side="top">Eliminar relleno</TooltipContent>
            </Tooltip>
          </div>
        ) : (
          <div className="text-[11px] text-muted-foreground/60 px-1 italic">
            Sin relleno
          </div>
        )}
      </div>

      {/* ── 6. Trazos (Stroke) ── */}
      <div className="space-y-2 pt-1 border-t border-sidebar-border/60">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-semibold text-foreground">Trazos</span>
          <Tooltip>
            <TooltipTrigger
              render={
                <button
                  type="button"
                  onClick={handleAddStroke}
                  className="flex size-6 items-center justify-center rounded text-muted-foreground hover:bg-sidebar-accent hover:text-foreground active:scale-95 transition-all"
                >
                  <Plus className="size-3.5" />
                </button>
              }
            />
            <TooltipContent side="top">Añadir trazo</TooltipContent>
          </Tooltip>
        </div>

        {frame.stroke && (
          <div className="flex items-center gap-1.5">
            <div className="flex-1 flex items-center justify-between h-8 px-2 rounded-lg border border-sidebar-border bg-sidebar-accent/30 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/20 transition-all min-w-0">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <label className="relative flex size-4 rounded-sm border border-border/80 shadow-2xs cursor-pointer overflow-hidden shrink-0">
                  <div
                    className="size-full pointer-events-none"
                    style={{ backgroundColor: frame.stroke.color }}
                  />
                  <input
                    type="color"
                    value={frame.stroke.color.startsWith("#") ? frame.stroke.color.slice(0, 7) : "#000000"}
                    onChange={(e) => {
                      if (!frame.stroke) return;
                      onChangeFrame({
                        ...frame,
                        stroke: { ...frame.stroke, color: e.target.value.toUpperCase() },
                      });
                    }}
                    className="absolute inset-0 size-full opacity-0 cursor-pointer p-0 m-0 border-0 outline-none"
                  />
                </label>
                <span className="text-xs font-mono uppercase text-foreground truncate">
                  {frame.stroke.color.replace("#", "")}
                </span>
              </div>

              <div className="flex items-center gap-0.5 shrink-0 pl-1">
                <input
                  type="number"
                  value={frame.stroke.width}
                  onChange={(e) => {
                    if (!frame.stroke) return;
                    const w = Math.max(1, parseInt(e.target.value, 10) || 1);
                    onChangeFrame({
                      ...frame,
                      stroke: { ...frame.stroke, width: w },
                    });
                  }}
                  className="w-5 text-right bg-transparent text-xs font-mono text-foreground outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <span className="text-xs font-mono text-muted-foreground select-none">
                  px
                </span>
              </div>
            </div>

            <Tooltip>
              <TooltipTrigger
                render={
                  <button
                    type="button"
                    onClick={handleToggleStrokeVisible}
                    className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-sidebar-accent hover:text-foreground active:scale-95 transition-all shrink-0"
                  >
                    {frame.stroke.visible ? (
                      <Eye className="size-3.5" />
                    ) : (
                      <EyeOff className="size-3.5 text-muted-foreground/60" />
                    )}
                  </button>
                }
              />
              <TooltipContent side="top">
                {frame.stroke.visible ? "Ocultar trazo" : "Mostrar trazo"}
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger
                render={
                  <button
                    type="button"
                    onClick={handleRemoveStroke}
                    className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-sidebar-accent hover:text-foreground active:scale-95 transition-all shrink-0"
                  >
                    <Minus className="size-3.5" />
                  </button>
                }
              />
              <TooltipContent side="top">Eliminar trazo</TooltipContent>
            </Tooltip>
          </div>
        )}
      </div>

      {/* ── 7. Efectos (Effects) ── */}
      <div className="space-y-2 pt-1 border-t border-sidebar-border/60">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-semibold text-foreground">Efectos</span>
          <Tooltip>
            <TooltipTrigger
              render={
                <button
                  type="button"
                  onClick={handleAddEffect}
                  className="flex size-6 items-center justify-center rounded text-muted-foreground hover:bg-sidebar-accent hover:text-foreground active:scale-95 transition-all"
                >
                  <Plus className="size-3.5" />
                </button>
              }
            />
            <TooltipContent side="top">Añadir efecto</TooltipContent>
          </Tooltip>
        </div>

        {frame.effects && frame.effects.length > 0 && (
          <div className="space-y-1.5">
            {frame.effects.map((effect) => (
              <div key={effect.id} className="flex items-center gap-1.5">
                <div className="flex-1 flex items-center justify-between h-8 px-2 rounded-lg border border-sidebar-border bg-sidebar-accent/30 transition-all min-w-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <DropShadowIcon className="size-3.5 text-muted-foreground shrink-0" />
                    <span className="text-xs text-foreground truncate select-none">
                      Sombra paralela
                    </span>
                  </div>

                  <div className="flex items-center gap-0.5 shrink-0 pl-1">
                    <input
                      type="number"
                      value={effect.blur}
                      onChange={(e) => {
                        const b = Math.max(0, parseInt(e.target.value, 10) || 0);
                        onChangeFrame({
                          ...frame,
                          effects: frame.effects?.map((item) =>
                            item.id === effect.id ? { ...item, blur: b } : item
                          ),
                        });
                      }}
                      className="w-5 text-right bg-transparent text-xs font-mono text-foreground outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <span className="text-xs font-mono text-muted-foreground select-none">
                      px
                    </span>
                  </div>
                </div>

                <Tooltip>
                  <TooltipTrigger
                    render={
                      <button
                        type="button"
                        onClick={() => handleToggleEffectVisible(effect.id)}
                        className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-sidebar-accent hover:text-foreground active:scale-95 transition-all shrink-0"
                      >
                        {effect.visible ? (
                          <Eye className="size-3.5" />
                        ) : (
                          <EyeOff className="size-3.5 text-muted-foreground/60" />
                        )}
                      </button>
                    }
                  />
                  <TooltipContent side="top">
                    {effect.visible ? "Ocultar efecto" : "Mostrar efecto"}
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger
                    render={
                      <button
                        type="button"
                        onClick={() => handleRemoveEffect(effect.id)}
                        className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-sidebar-accent hover:text-foreground active:scale-95 transition-all shrink-0"
                      >
                        <Minus className="size-3.5" />
                      </button>
                    }
                  />
                  <TooltipContent side="top">Eliminar efecto</TooltipContent>
                </Tooltip>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── 8. Colores (Document / Selection Colors) ── */}
      <div className="space-y-2 pt-1 border-t border-sidebar-border/60">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-semibold text-foreground">Colores</span>
        </div>

        <div className="space-y-1.5">
          {/* Color 1: Theme variable token primary (Light) */}
          <div
            onClick={() => handleSelectToken("primary (Light)", "#6750A4")}
            className="flex items-center h-8 px-2.5 rounded-lg border border-sidebar-border bg-sidebar-accent/30 hover:border-primary/40 cursor-pointer transition-all group"
          >
            <div className="size-4 rounded-sm border border-border/80 shadow-2xs bg-[#6750A4] mr-2.5 shrink-0" />
            <span className="text-xs font-medium text-foreground truncate group-hover:text-primary transition-colors">
              primary (Light)
            </span>
          </div>

          {/* Color 2: Dark tone 021014 */}
          <div
            onClick={() => {
              onChangeFrame({
                ...frame,
                hasFill: true,
                fill: "#021014",
                fillToken: undefined,
              });
              setFillHexInput("021014");
            }}
            className="flex items-center justify-between h-8 px-2.5 rounded-lg border border-sidebar-border bg-sidebar-accent/30 hover:border-primary/40 cursor-pointer transition-all"
          >
            <div className="flex items-center gap-2.5">
              <label
                onClick={(e) => e.stopPropagation()}
                className="relative flex size-4 rounded-sm border border-border/80 shadow-2xs cursor-pointer overflow-hidden shrink-0"
              >
                <div className="size-full pointer-events-none bg-[#021014]" />
                <input
                  type="color"
                  value="#021014"
                  onChange={(e) => {
                    const hex = e.target.value.toUpperCase();
                    onChangeFrame({
                      ...frame,
                      hasFill: true,
                      fill: hex,
                      fillToken: undefined,
                    });
                    setFillHexInput(hex.replace("#", ""));
                  }}
                  className="absolute inset-0 size-full opacity-0 cursor-pointer p-0 m-0 border-0 outline-none"
                />
              </label>
              <span className="text-xs font-mono uppercase text-foreground">
                021014
              </span>
            </div>
            <span className="text-xs font-mono text-muted-foreground">
              100 %
            </span>
          </div>

          {/* Color 3: White FFFFFF */}
          <div
            onClick={() => {
              onChangeFrame({
                ...frame,
                hasFill: true,
                fill: "#FFFFFF",
                fillToken: undefined,
              });
              setFillHexInput("FFFFFF");
            }}
            className="flex items-center justify-between h-8 px-2.5 rounded-lg border border-sidebar-border bg-sidebar-accent/30 hover:border-primary/40 cursor-pointer transition-all"
          >
            <div className="flex items-center gap-2.5">
              <label
                onClick={(e) => e.stopPropagation()}
                className="relative flex size-4 rounded-sm border border-border/80 shadow-2xs cursor-pointer overflow-hidden shrink-0"
              >
                <div className="size-full pointer-events-none bg-[#FFFFFF]" />
                <input
                  type="color"
                  value="#ffffff"
                  onChange={(e) => {
                    const hex = e.target.value.toUpperCase();
                    onChangeFrame({
                      ...frame,
                      hasFill: true,
                      fill: hex,
                      fillToken: undefined,
                    });
                    setFillHexInput(hex.replace("#", ""));
                  }}
                  className="absolute inset-0 size-full opacity-0 cursor-pointer p-0 m-0 border-0 outline-none"
                />
              </label>
              <span className="text-xs font-mono uppercase text-foreground">
                FFFFFF
              </span>
            </div>
            <span className="text-xs font-mono text-muted-foreground">
              100 %
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
