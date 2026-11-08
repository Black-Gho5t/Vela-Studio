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
  Lock,
  Unlock,
  SlidersHorizontal,
  Sun,
  Moon,
  Monitor,
  LayoutGrid,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { CanvasDeviceFrame, LayoutFlow, ScreenLayoutType } from "./designer-canvas";
import { DesignerAlignmentMatrix } from "./designer-alignment-matrix";
import { updateFlutterFileScreenLayout, getFlutterFileName } from "../model/designer-frame-file";

// ── Figma-style Layout Icons ──
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

function AutoLayoutHeaderIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <rect x="2" y="2.5" width="4.5" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
      <rect x="9.5" y="2.5" width="4.5" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

function FlowScatterIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <rect x="2.5" y="2.5" width="3.5" height="3.5" rx="0.75" stroke="currentColor" strokeWidth="1.2" />
      <rect x="10" y="3.5" width="3.5" height="3.5" rx="0.75" stroke="currentColor" strokeWidth="1.2" />
      <rect x="5.5" y="10" width="3.5" height="3.5" rx="0.75" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

function ReverseFlowIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path
        d="M12.5 4V7.5C12.5 8.60457 11.6046 9.5 10.5 9.5H3.5M3.5 9.5L6.5 6.5M3.5 9.5L6.5 12.5"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function GapFigmaIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M4 4.5H2.5V11.5H4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="8" cy="8" r="1.2" fill="currentColor" />
      <path d="M12 4.5H13.5V11.5H12" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PaddingHorizontalIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <rect x="2.5" y="3" width="11" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.2" opacity="0.3" />
      <path d="M5.5 3V13M10.5 3V13" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function PaddingVerticalIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <rect x="2.5" y="3" width="11" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.2" opacity="0.3" />
      <path d="M2.5 6H13.5M2.5 10H13.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function PaddingIndividualIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path
        d="M2.5 5.5V3C2.5 2.72386 2.72386 2.5 3 2.5H5.5M10.5 2.5H13C13.2761 2.5 13.5 2.72386 13.5 3V5.5M13.5 10.5V13C13.5 13.2761 13.2761 13.5 13 13.5H10.5M5.5 13.5H3C2.72386 13.5 2.5 13.2761 2.5 13V10.5"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CornerRadiusIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path
        d="M2.5 13.5V6.5C2.5 4.29086 4.29086 2.5 6.5 2.5H13.5"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function OpacityIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.2" />
      <path d="M8 2.5V13.5C11.0376 13.5 13.5 11.0376 13.5 8C13.5 4.96243 11.0376 2.5 8 2.5Z" fill="currentColor" />
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

function extractUniqueColors(frame: CanvasDeviceFrame): { color: string; count: number }[] {
  const map: Record<string, number> = {};

  if (frame.hasFill !== false && frame.fill && frame.fill.startsWith("#")) {
    const c = frame.fill.toUpperCase();
    map[c] = (map[c] || 0) + 1;
  }

  if (frame.stroke && frame.stroke.visible && frame.stroke.color.startsWith("#")) {
    const c = frame.stroke.color.toUpperCase();
    map[c] = (map[c] || 0) + 1;
  }

  (frame.elements || []).forEach((el) => {
    if (el.color && el.color.startsWith("#")) {
      const c = el.color.toUpperCase();
      map[c] = (map[c] || 0) + 1;
    }
    if (el.textColor && el.textColor.startsWith("#")) {
      const c = el.textColor.toUpperCase();
      map[c] = (map[c] || 0) + 1;
    }
  });

  return Object.entries(map).map(([color, count]) => ({ color, count }));
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
  const [opacityInput, setOpacityInput] = React.useState<string>(String(frame.opacity ?? 100));
  const [cornerRadiusInput, setCornerRadiusInput] = React.useState<string>(String(frame.cornerRadius ?? 0));

  // Padding states
  const [paddingMode, setPaddingMode] = React.useState<"symmetric" | "individual">("symmetric");
  const [padHInput, setPadHInput] = React.useState<string>(String(frame.padding?.left ?? 0));
  const [padVInput, setPadVInput] = React.useState<string>(String(frame.padding?.top ?? 0));
  const [padTInput, setPadTInput] = React.useState<string>(String(frame.padding?.top ?? 0));
  const [padRInput, setPadRInput] = React.useState<string>(String(frame.padding?.right ?? 0));
  const [padBInput, setPadBInput] = React.useState<string>(String(frame.padding?.bottom ?? 0));
  const [padLInput, setPadLInput] = React.useState<string>(String(frame.padding?.left ?? 0));

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

  React.useEffect(() => {
    setOpacityInput(String(frame.opacity ?? 100));
  }, [frame.opacity]);

  React.useEffect(() => {
    setCornerRadiusInput(String(frame.cornerRadius ?? 0));
  }, [frame.cornerRadius]);

  const commitOpacity = (val: number) => {
    if (!isNaN(val)) {
      const clamped = Math.max(0, Math.min(100, Math.round(val)));
      onChangeFrame({ ...frame, opacity: clamped });
    }
  };

  const commitCornerRadius = (val: number) => {
    if (!isNaN(val)) {
      const clamped = Math.max(0, Math.round(val));
      onChangeFrame({ ...frame, cornerRadius: clamped });
    }
  };

  React.useEffect(() => {
    const p = frame.padding || { top: 0, right: 0, bottom: 0, left: 0 };
    setPadHInput(String(p.left || 0));
    setPadVInput(String(p.top || 0));
    setPadTInput(String(p.top || 0));
    setPadRInput(String(p.right || 0));
    setPadBInput(String(p.bottom || 0));
    setPadLInput(String(p.left || 0));
  }, [frame.padding]);

  const commitPaddingSymmetric = (h: number, v: number) => {
    onChangeFrame({
      ...frame,
      padding: { top: v, right: h, bottom: v, left: h },
    });
  };

  const commitPaddingIndividual = (t: number, r: number, b: number, l: number) => {
    onChangeFrame({
      ...frame,
      padding: { top: t, right: r, bottom: b, left: l },
    });
  };

  // Dynamic extraction of colors used in this frame
  const frameColors = React.useMemo(() => extractUniqueColors(frame), [frame]);

  const handleReplaceColor = (oldColor: string, newColor: string) => {
    const cleanOld = oldColor.toUpperCase();
    const cleanNew = newColor.toUpperCase();

    const updatedFrame: CanvasDeviceFrame = {
      ...frame,
      fill: frame.fill?.toUpperCase() === cleanOld ? cleanNew : frame.fill,
      stroke:
        frame.stroke && frame.stroke.color.toUpperCase() === cleanOld
          ? { ...frame.stroke, color: cleanNew }
          : frame.stroke,
      elements: (frame.elements || []).map((el) => ({
        ...el,
        color: el.color?.toUpperCase() === cleanOld ? cleanNew : el.color,
        textColor: el.textColor?.toUpperCase() === cleanOld ? cleanNew : el.textColor,
      })),
    };
    onChangeFrame(updatedFrame);
  };

  const handleAddLayoutGrid = () => {
    onChangeFrame({
      ...frame,
      layoutGrid: {
        type: "columns",
        count: 4,
        gutter: 8,
        margin: 16,
        color: "rgba(255, 0, 80, 0.08)",
        visible: true,
      },
    });
  };

  const handleToggleLayoutGridVisible = () => {
    if (!frame.layoutGrid) return;
    onChangeFrame({
      ...frame,
      layoutGrid: {
        ...frame.layoutGrid,
        visible: !frame.layoutGrid.visible,
      },
    });
  };

  const handleRemoveLayoutGrid = () => {
    onChangeFrame({
      ...frame,
      layoutGrid: undefined,
    });
  };

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
            <div className="flex items-center gap-1">
              <button
                type="button"
                title={selectedElement.isVisible === false ? "Mostrar elemento" : "Ocultar elemento"}
                onClick={() => {
                  onChangeFrame({
                    ...frame,
                    elements: (frame.elements || []).map((el) =>
                      el.id === selectedElement.id ? { ...el, isVisible: el.isVisible === false ? true : false } : el
                    ),
                  });
                }}
                className={cn(
                  "p-1 rounded hover:bg-sidebar-accent text-muted-foreground transition-colors",
                  selectedElement.isVisible === false && "text-destructive"
                )}
              >
                {selectedElement.isVisible === false ? <EyeOff className="size-3" /> : <Eye className="size-3" />}
              </button>
              <button
                type="button"
                title={selectedElement.isLocked ? "Desbloquear elemento" : "Bloquear elemento"}
                onClick={() => {
                  onChangeFrame({
                    ...frame,
                    elements: (frame.elements || []).map((el) =>
                      el.id === selectedElement.id ? { ...el, isLocked: !el.isLocked } : el
                    ),
                  });
                }}
                className={cn(
                  "p-1 rounded hover:bg-sidebar-accent text-muted-foreground transition-colors",
                  selectedElement.isLocked && "text-amber-500"
                )}
              >
                {selectedElement.isLocked ? <Lock className="size-3" /> : <Unlock className="size-3" />}
              </button>
              <button
                type="button"
                onClick={() => onSelectElementId?.("")}
                className="text-[10px] text-muted-foreground hover:text-foreground shrink-0 transition-colors ml-1"
              >
                Deseleccionar
              </button>
            </div>
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

          <div className="grid grid-cols-2 gap-1.5 text-xs font-mono">
            <div className="flex items-center gap-1 px-2 py-1 rounded bg-background border border-border">
              <span className="text-muted-foreground text-[10px] w-3">W</span>
              <input
                type="number"
                disabled={selectedElement.widthMode === "fill" || selectedElement.widthMode === "hug"}
                placeholder={selectedElement.widthMode || "auto"}
                value={selectedElement.widthMode === "fill" ? "" : (selectedElement.width || "")}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 0;
                  onChangeFrame({
                    ...frame,
                    elements: (frame.elements || []).map((el) =>
                      el.id === selectedElement.id ? { ...el, width: val, widthMode: "fixed" } : el
                    ),
                  });
                }}
                className="w-full bg-transparent outline-none text-foreground text-xs disabled:opacity-50"
              />
              <select
                value={selectedElement.widthMode || "fixed"}
                onChange={(e) => {
                  const mode = e.target.value as any;
                  onChangeFrame({
                    ...frame,
                    elements: (frame.elements || []).map((el) =>
                      el.id === selectedElement.id ? { ...el, widthMode: mode } : el
                    ),
                  });
                }}
                className="bg-transparent text-[9px] text-muted-foreground cursor-pointer outline-none uppercase"
              >
                <option value="fixed">Fix</option>
                <option value="hug">Hug</option>
                <option value="fill">Fill</option>
              </select>
            </div>
            <div className="flex items-center gap-1 px-2 py-1 rounded bg-background border border-border">
              <span className="text-muted-foreground text-[10px] w-3">H</span>
              <input
                type="number"
                disabled={selectedElement.heightMode === "fill" || selectedElement.heightMode === "hug"}
                placeholder={selectedElement.heightMode || "auto"}
                value={selectedElement.heightMode === "fill" ? "" : (selectedElement.height || "")}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 0;
                  onChangeFrame({
                    ...frame,
                    elements: (frame.elements || []).map((el) =>
                      el.id === selectedElement.id ? { ...el, height: val, heightMode: "fixed" } : el
                    ),
                  });
                }}
                className="w-full bg-transparent outline-none text-foreground text-xs disabled:opacity-50"
              />
              <select
                value={selectedElement.heightMode || "fixed"}
                onChange={(e) => {
                  const mode = e.target.value as any;
                  onChangeFrame({
                    ...frame,
                    elements: (frame.elements || []).map((el) =>
                      el.id === selectedElement.id ? { ...el, heightMode: mode } : el
                    ),
                  });
                }}
                className="bg-transparent text-[9px] text-muted-foreground cursor-pointer outline-none uppercase"
              >
                <option value="fixed">Fix</option>
                <option value="hug">Hug</option>
                <option value="fill">Fill</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] text-muted-foreground font-medium">Padding (L / T / R / B)</span>
            <div className="grid grid-cols-4 gap-1 text-[10px] font-mono">
              <input
                type="number"
                placeholder="L"
                title="Padding Izquierdo"
                value={selectedElement.padding?.left ?? ""}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 0;
                  onChangeFrame({
                    ...frame,
                    elements: (frame.elements || []).map((el) =>
                      el.id === selectedElement.id
                        ? {
                            ...el,
                            padding: {
                              top: el.padding?.top ?? 0,
                              right: el.padding?.right ?? 0,
                              bottom: el.padding?.bottom ?? 0,
                              left: val,
                            },
                          }
                        : el
                    ),
                  });
                }}
                className="px-1.5 py-1 rounded bg-background border border-border text-center outline-none text-foreground"
              />
              <input
                type="number"
                placeholder="T"
                title="Padding Superior"
                value={selectedElement.padding?.top ?? ""}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 0;
                  onChangeFrame({
                    ...frame,
                    elements: (frame.elements || []).map((el) =>
                      el.id === selectedElement.id
                        ? {
                            ...el,
                            padding: {
                              top: val,
                              right: el.padding?.right ?? 0,
                              bottom: el.padding?.bottom ?? 0,
                              left: el.padding?.left ?? 0,
                            },
                          }
                        : el
                    ),
                  });
                }}
                className="px-1.5 py-1 rounded bg-background border border-border text-center outline-none text-foreground"
              />
              <input
                type="number"
                placeholder="R"
                title="Padding Derecho"
                value={selectedElement.padding?.right ?? ""}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 0;
                  onChangeFrame({
                    ...frame,
                    elements: (frame.elements || []).map((el) =>
                      el.id === selectedElement.id
                        ? {
                            ...el,
                            padding: {
                              top: el.padding?.top ?? 0,
                              right: val,
                              bottom: el.padding?.bottom ?? 0,
                              left: el.padding?.left ?? 0,
                            },
                          }
                        : el
                    ),
                  });
                }}
                className="px-1.5 py-1 rounded bg-background border border-border text-center outline-none text-foreground"
              />
              <input
                type="number"
                placeholder="B"
                title="Padding Inferior"
                value={selectedElement.padding?.bottom ?? ""}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 0;
                  onChangeFrame({
                    ...frame,
                    elements: (frame.elements || []).map((el) =>
                      el.id === selectedElement.id
                        ? {
                            ...el,
                            padding: {
                              top: el.padding?.top ?? 0,
                              right: el.padding?.right ?? 0,
                              bottom: val,
                              left: el.padding?.left ?? 0,
                            },
                          }
                        : el
                    ),
                  });
                }}
                className="px-1.5 py-1 rounded bg-background border border-border text-center outline-none text-foreground"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-[10px] text-muted-foreground font-medium">Alineación</span>
            <DesignerAlignmentMatrix
              value={selectedElement.alignment || "center"}
              onChange={(align) => {
                onChangeFrame({
                  ...frame,
                  elements: (frame.elements || []).map((el) =>
                    el.id === selectedElement.id ? { ...el, alignment: align } : el
                  ),
                });
              }}
            />
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

          <div className="grid grid-cols-2 gap-1.5 text-xs font-mono">
            <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-background border border-border">
              <span className="text-muted-foreground text-[10px] shrink-0">Color</span>
              <input
                type="color"
                value={selectedElement.color?.startsWith("#") ? selectedElement.color : "#0ea5e9"}
                onChange={(e) => {
                  const newColor = e.target.value;
                  onChangeFrame({
                    ...frame,
                    elements: (frame.elements || []).map((el) =>
                      el.id === selectedElement.id ? { ...el, color: newColor } : el
                    ),
                  });
                }}
                className="size-4 rounded cursor-pointer border-0 p-0 bg-transparent shrink-0"
              />
              <span className="text-[10px] text-muted-foreground truncate">{selectedElement.color || "#0ea5e9"}</span>
            </div>
            <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-background border border-border">
              <span className="text-muted-foreground text-[10px] shrink-0">Texto</span>
              <input
                type="color"
                value={selectedElement.textColor?.startsWith("#") ? selectedElement.textColor : "#000000"}
                onChange={(e) => {
                  const newColor = e.target.value;
                  onChangeFrame({
                    ...frame,
                    elements: (frame.elements || []).map((el) =>
                      el.id === selectedElement.id ? { ...el, textColor: newColor } : el
                    ),
                  });
                }}
                className="size-4 rounded cursor-pointer border-0 p-0 bg-transparent shrink-0"
              />
              <span className="text-[10px] text-muted-foreground truncate">{selectedElement.textColor || "#000"}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-1.5 text-xs font-mono">
            <div className="flex items-center gap-1 px-2 py-1 rounded bg-background border border-border">
              <span className="text-muted-foreground text-[10px] shrink-0">Fuente</span>
              <input
                type="number"
                value={selectedElement.fontSize || 16}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 16;
                  onChangeFrame({
                    ...frame,
                    elements: (frame.elements || []).map((el) =>
                      el.id === selectedElement.id ? { ...el, fontSize: val } : el
                    ),
                  });
                }}
                className="w-full bg-transparent outline-none text-foreground text-xs"
              />
            </div>
            <div className="flex items-center gap-1 px-2 py-1 rounded bg-background border border-border">
              <span className="text-muted-foreground text-[10px] shrink-0">Radio</span>
              <input
                type="number"
                value={selectedElement.borderRadius ?? 8}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 0;
                  onChangeFrame({
                    ...frame,
                    elements: (frame.elements || []).map((el) =>
                      el.id === selectedElement.id ? { ...el, borderRadius: val } : el
                    ),
                  });
                }}
                className="w-full bg-transparent outline-none text-foreground text-xs"
              />
            </div>
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

      {/* ── 1. Grupo Posición (Alineación H/V, Coordenadas X/Y, Rotación) ── */}
      <div className="space-y-2">
        <span className="text-[10px] font-semibold tracking-wider uppercase text-muted-foreground px-1">
          Posición
        </span>

        {/* Opciones de alineación horizontal y vertical */}
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

        {/* Coordenadas X e Y */}
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

        {/* Rotación y giros */}
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

      {/* ── 2. Diseño automático (Figma Auto Layout) ── */}
      <div className="space-y-3 pt-1 border-t border-sidebar-border/60">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-semibold text-foreground">
            Diseño automático
          </span>
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger
                render={
                  <button
                    type="button"
                    onClick={() => {
                      const nextFlow = frame.layoutFlow === "none" || !frame.layoutFlow ? "vertical" : "none";
                      onChangeFrame({ ...frame, layoutFlow: nextFlow });
                    }}
                    className={cn(
                      "flex size-6 items-center justify-center rounded transition-all",
                      frame.layoutFlow && frame.layoutFlow !== "none"
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
                    )}
                  >
                    <AutoLayoutHeaderIcon className="size-3.5" />
                  </button>
                }
              />
              <TooltipContent side="top">
                {frame.layoutFlow && frame.layoutFlow !== "none"
                  ? "Diseño automático activado"
                  : "Activar diseño automático"}
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Flujo (Scatter / Vertical / Horizontal / Wrap + Reverse) */}
        <div className="space-y-1.5">
          <span className="text-[11px] text-muted-foreground px-1">Flujo</span>
          <div className="flex items-center gap-1">
            <div className="flex-1 grid grid-cols-4 p-0.5 rounded-lg border border-sidebar-border bg-sidebar-accent/30">
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
                      <FlowScatterIcon className="size-3.5" />
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
                      <FlowVerticalIcon className="size-3.5" />
                    </button>
                  }
                />
                <TooltipContent side="top">Vertical (Column)</TooltipContent>
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
                      <FlowHorizontalIcon className="size-3.5" />
                    </button>
                  }
                />
                <TooltipContent side="top">Horizontal (Row)</TooltipContent>
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
                      <FlowWrapIcon className="size-3.5" />
                    </button>
                  }
                />
                <TooltipContent side="top">Envolvente (Wrap)</TooltipContent>
              </Tooltip>
            </div>

            <Tooltip>
              <TooltipTrigger
                render={
                  <button
                    type="button"
                    onClick={() => onChangeFrame({ ...frame, reverseOrder: !frame.reverseOrder })}
                    className={cn(
                      "flex size-7 items-center justify-center rounded-lg border transition-all shrink-0 active:scale-95",
                      frame.reverseOrder
                        ? "bg-primary/10 border-primary/40 text-primary shadow-xs"
                        : "border-sidebar-border bg-sidebar-accent/30 text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
                    )}
                  >
                    <ReverseFlowIcon className="size-3.5" />
                  </button>
                }
              />
              <TooltipContent side="top">Invertir orden de los elementos</TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Dimensiones (W / H con sizing mode: Fixed / Hug / Fill) */}
        <div className="space-y-1.5">
          <span className="text-[11px] text-muted-foreground px-1">Dimensiones</span>
          <div className="flex items-center gap-1.5">
            {/* W Input */}
            <div className="flex-1 flex items-center h-7 px-2 rounded-lg border border-sidebar-border bg-sidebar-accent/30 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/20 transition-all">
              <span className="text-[10px] font-mono font-medium text-muted-foreground mr-1.5 select-none">
                W
              </span>
              <input
                type="number"
                disabled={frame.widthMode === "hug" || frame.widthMode === "fill"}
                value={frame.widthMode === "hug" ? "" : frame.widthMode === "fill" ? "" : wInput}
                placeholder={frame.widthMode === "hug" ? "Hug" : frame.widthMode === "fill" ? "Fill" : ""}
                onChange={(e) => setWInput(e.target.value)}
                onBlur={() => commitWidth(parseFloat(wInput))}
                onKeyDown={(e) => handleDimensionKeyDown(e, "w")}
                className="w-full bg-transparent text-xs font-mono text-foreground outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none disabled:opacity-60"
              />
              <select
                value={frame.widthMode || "fixed"}
                onChange={(e) => onChangeFrame({ ...frame, widthMode: e.target.value as any })}
                className="bg-transparent text-[9px] text-muted-foreground cursor-pointer outline-none uppercase font-mono ml-0.5"
              >
                <option value="fixed" className="bg-popover text-popover-foreground">Fix</option>
                <option value="hug" className="bg-popover text-popover-foreground">Hug</option>
                <option value="fill" className="bg-popover text-popover-foreground">Fill</option>
              </select>
            </div>

            {/* H Input */}
            <div className="flex-1 flex items-center h-7 px-2 rounded-lg border border-sidebar-border bg-sidebar-accent/30 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/20 transition-all">
              <span className="text-[10px] font-mono font-medium text-muted-foreground mr-1.5 select-none">
                H
              </span>
              <input
                type="number"
                disabled={frame.heightMode === "hug" || frame.heightMode === "fill"}
                value={frame.heightMode === "hug" ? "" : frame.heightMode === "fill" ? "" : hInput}
                placeholder={frame.heightMode === "hug" ? "Hug" : frame.heightMode === "fill" ? "Fill" : ""}
                onChange={(e) => setHInput(e.target.value)}
                onBlur={() => commitHeight(parseFloat(hInput))}
                onKeyDown={(e) => handleDimensionKeyDown(e, "h")}
                className="w-full bg-transparent text-xs font-mono text-foreground outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none disabled:opacity-60"
              />
              <select
                value={frame.heightMode || "fixed"}
                onChange={(e) => onChangeFrame({ ...frame, heightMode: e.target.value as any })}
                className="bg-transparent text-[9px] text-muted-foreground cursor-pointer outline-none uppercase font-mono ml-0.5"
              >
                <option value="fixed" className="bg-popover text-popover-foreground">Fix</option>
                <option value="hug" className="bg-popover text-popover-foreground">Hug</option>
                <option value="fill" className="bg-popover text-popover-foreground">Fill</option>
              </select>
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

        {/* Alineación (Columna Izq) y Espacio (Columna Der) */}
        <div className="grid grid-cols-2 gap-2 pt-0.5">
          {/* Columna Izquierda: Alineación */}
          <div className="space-y-1">
            <span className="text-[11px] text-muted-foreground px-1">Alineación</span>
            <DesignerAlignmentMatrix
              value={frame.alignment || "topLeft"}
              onChange={(align) => onChangeFrame({ ...frame, alignment: align })}
            />
          </div>

          {/* Columna Derecha: Espacio */}
          <div className="space-y-1">
            <span className="text-[11px] text-muted-foreground px-1">Espacio</span>
            <div className="flex items-center gap-1">
              <div className="flex-1 flex items-center h-[68px] px-2 rounded-lg border border-sidebar-border bg-sidebar-accent/30 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/20 transition-all flex-col justify-center">
                <div className="flex items-center w-full">
                  <GapFigmaIcon className="size-3.5 text-muted-foreground mr-1.5 shrink-0" />
                  <input
                    type="text"
                    disabled={frame.spacingMode === "spaceBetween"}
                    value={frame.spacingMode === "spaceBetween" ? "Auto" : spacingInput}
                    onChange={(e) => setSpacingInput(e.target.value)}
                    onBlur={() => commitSpacing(parseFloat(spacingInput))}
                    onKeyDown={handleSpacingKeyDown}
                    className="w-full bg-transparent text-xs font-mono text-foreground outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none disabled:opacity-75"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const next = frame.spacingMode === "spaceBetween" ? "packed" : "spaceBetween";
                      onChangeFrame({ ...frame, spacingMode: next });
                    }}
                    title={frame.spacingMode === "spaceBetween" ? "Cambiar a Empaquetado" : "Cambiar a Separar (Auto)"}
                    className="text-muted-foreground hover:text-foreground p-0.5 rounded transition-colors"
                  >
                    <ChevronDown className="size-3" />
                  </button>
                </div>
                <span className="text-[9px] text-muted-foreground/60 w-full text-left font-mono mt-0.5">
                  {frame.spacingMode === "spaceBetween" ? "Auto (Space Between)" : "Packed (px)"}
                </span>
              </div>

              <Tooltip>
                <TooltipTrigger
                  render={
                    <button
                      type="button"
                      onClick={() => {
                        const next = frame.spacingMode === "spaceBetween" ? "packed" : "spaceBetween";
                        onChangeFrame({ ...frame, spacingMode: next });
                      }}
                      className={cn(
                        "flex size-8 items-center justify-center rounded-lg border transition-all shrink-0 active:scale-95",
                        frame.spacingMode === "spaceBetween"
                          ? "bg-primary/10 border-primary/40 text-primary shadow-xs"
                          : "border-sidebar-border bg-sidebar-accent/30 text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
                      )}
                    >
                      <SlidersHorizontal className="size-3.5" />
                    </button>
                  }
                />
                <TooltipContent side="top">
                  {frame.spacingMode === "spaceBetween"
                    ? "Modo Espacio: Separar equitativamente (Space Between)"
                    : "Modo Espacio: Empaquetado (Packed)"}
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>

        {/* Margen interior (Padding) */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] text-muted-foreground">Margen interior</span>
            <Tooltip>
              <TooltipTrigger
                render={
                  <button
                    type="button"
                    onClick={() => setPaddingMode(paddingMode === "symmetric" ? "individual" : "symmetric")}
                    className={cn(
                      "flex size-6 items-center justify-center rounded text-muted-foreground hover:bg-sidebar-accent hover:text-foreground active:scale-95 transition-all",
                      paddingMode === "individual" && "text-primary bg-primary/10"
                    )}
                  >
                    <PaddingIndividualIcon className="size-3.5" />
                  </button>
                }
              />
              <TooltipContent side="top">
                {paddingMode === "symmetric"
                  ? "Configurar márgenes individuales (L / T / R / B)"
                  : "Configurar márgenes simétricos (Horizontal / Vertical)"}
              </TooltipContent>
            </Tooltip>
          </div>

          {paddingMode === "symmetric" ? (
            <div className="grid grid-cols-2 gap-1.5">
              <div className="flex items-center h-7 px-2 rounded-lg border border-sidebar-border bg-sidebar-accent/30 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/20 transition-all">
                <PaddingHorizontalIcon className="size-3 text-muted-foreground mr-1.5 shrink-0" />
                <input
                  type="number"
                  value={padHInput}
                  placeholder="0"
                  onChange={(e) => {
                    setPadHInput(e.target.value);
                    const val = parseInt(e.target.value) || 0;
                    commitPaddingSymmetric(val, parseInt(padVInput) || 0);
                  }}
                  className="w-full bg-transparent text-xs font-mono text-foreground outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>

              <div className="flex items-center h-7 px-2 rounded-lg border border-sidebar-border bg-sidebar-accent/30 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/20 transition-all">
                <PaddingVerticalIcon className="size-3 text-muted-foreground mr-1.5 shrink-0" />
                <input
                  type="number"
                  value={padVInput}
                  placeholder="0"
                  onChange={(e) => {
                    setPadVInput(e.target.value);
                    const val = parseInt(e.target.value) || 0;
                    commitPaddingSymmetric(parseInt(padHInput) || 0, val);
                  }}
                  className="w-full bg-transparent text-xs font-mono text-foreground outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-1 text-[10px] font-mono">
              <input
                type="number"
                placeholder="L"
                title="Padding Izquierdo"
                value={padLInput}
                onChange={(e) => {
                  setPadLInput(e.target.value);
                  const l = parseInt(e.target.value) || 0;
                  commitPaddingIndividual(parseInt(padTInput) || 0, parseInt(padRInput) || 0, parseInt(padBInput) || 0, l);
                }}
                className="px-1.5 py-1 rounded-md bg-sidebar-accent/30 border border-sidebar-border text-center outline-none text-foreground focus:border-primary"
              />
              <input
                type="number"
                placeholder="T"
                title="Padding Superior"
                value={padTInput}
                onChange={(e) => {
                  setPadTInput(e.target.value);
                  const t = parseInt(e.target.value) || 0;
                  commitPaddingIndividual(t, parseInt(padRInput) || 0, parseInt(padBInput) || 0, parseInt(padLInput) || 0);
                }}
                className="px-1.5 py-1 rounded-md bg-sidebar-accent/30 border border-sidebar-border text-center outline-none text-foreground focus:border-primary"
              />
              <input
                type="number"
                placeholder="R"
                title="Padding Derecho"
                value={padRInput}
                onChange={(e) => {
                  setPadRInput(e.target.value);
                  const r = parseInt(e.target.value) || 0;
                  commitPaddingIndividual(parseInt(padTInput) || 0, r, parseInt(padBInput) || 0, parseInt(padLInput) || 0);
                }}
                className="px-1.5 py-1 rounded-md bg-sidebar-accent/30 border border-sidebar-border text-center outline-none text-foreground focus:border-primary"
              />
              <input
                type="number"
                placeholder="B"
                title="Padding Inferior"
                value={padBInput}
                onChange={(e) => {
                  setPadBInput(e.target.value);
                  const b = parseInt(e.target.value) || 0;
                  commitPaddingIndividual(parseInt(padTInput) || 0, parseInt(padRInput) || 0, b, parseInt(padLInput) || 0);
                }}
                className="px-1.5 py-1 rounded-md bg-sidebar-accent/30 border border-sidebar-border text-center outline-none text-foreground focus:border-primary"
              />
            </div>
          )}
        </div>

        {/* Recortar contenido (Clip content) */}
        <div className="flex items-center gap-2 px-1 pt-1">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={frame.clipContent ?? false}
              onChange={(e) => onChangeFrame({ ...frame, clipContent: e.target.checked })}
              className="size-3.5 rounded border border-sidebar-border text-primary focus:ring-primary/20 accent-primary cursor-pointer"
            />
            <span className="text-xs text-foreground">Recortar contenido</span>
          </label>
        </div>

        {/* Estructura Raíz de Pantalla (Scaffold / Scrollable / Stack) */}
        <div className="space-y-1.5 pt-2 border-t border-sidebar-border/40">
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
      </div>

      {/* ── 3. Apariencia (Opacidad, Radio de esquina, Selector de tema) ── */}
      <div className="space-y-3 pt-1 border-t border-sidebar-border/60">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-semibold text-foreground">
            Apariencia
          </span>
        </div>

        {/* Opacidad y Radio de esquina */}
        <div className="grid grid-cols-2 gap-2">
          {/* Opacidad */}
          <div className="space-y-1">
            <span className="text-[11px] text-muted-foreground px-1">Opacidad</span>
            <div className="flex items-center h-7 px-2 rounded-lg border border-sidebar-border bg-sidebar-accent/30 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/20 transition-all">
              <OpacityIcon className="size-3.5 text-muted-foreground mr-1.5 shrink-0" />
              <input
                type="number"
                min="0"
                max="100"
                value={opacityInput}
                onChange={(e) => setOpacityInput(e.target.value)}
                onBlur={() => commitOpacity(parseFloat(opacityInput))}
                className="w-full bg-transparent text-xs font-mono text-foreground outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <span className="text-[10px] font-mono text-muted-foreground/60 select-none">
                %
              </span>
            </div>
          </div>

          {/* Radio de esquina (Aplica únicamente al margen) */}
          <div className="space-y-1">
            <div className="flex items-center justify-between px-1">
              <span className="text-[11px] text-muted-foreground">Radio de esquina</span>
            </div>
            <div className="flex items-center h-7 px-2 rounded-lg border border-sidebar-border bg-sidebar-accent/30 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/20 transition-all">
              <CornerRadiusIcon className="size-3.5 text-muted-foreground mr-1.5 shrink-0" />
              <input
                type="number"
                min="0"
                placeholder="0"
                title="Aplica únicamente al margen exterior del Frame"
                value={cornerRadiusInput}
                onChange={(e) => setCornerRadiusInput(e.target.value)}
                onBlur={() => commitCornerRadius(parseFloat(cornerRadiusInput))}
                className="w-full bg-transparent text-xs font-mono text-foreground outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <span className="text-[10px] font-mono text-muted-foreground/60 select-none">
                px
              </span>
            </div>
          </div>
        </div>

        {/* Selector de tema (Automático, Claro, Oscuro) */}
        <div className="space-y-1.5">
          <span className="text-[11px] text-muted-foreground px-1">Selector de tema</span>
          <div className="grid grid-cols-3 p-0.5 rounded-lg border border-sidebar-border bg-sidebar-accent/30 gap-0.5">
            {/* 1. Automático */}
            <Tooltip>
              <TooltipTrigger
                render={
                  <button
                    type="button"
                    onClick={() => onChangeFrame({ ...frame, themeMode: "system" })}
                    className={cn(
                      "flex items-center justify-center gap-1.5 py-1.5 px-1 rounded-md transition-all text-xs",
                      (frame.themeMode || "system") === "system"
                        ? "bg-background text-foreground shadow-xs border border-sidebar-border font-medium"
                        : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/50"
                    )}
                  >
                    <Monitor className="size-3.5" />
                    <span className="text-[10px] leading-none">Auto</span>
                  </button>
                }
              />
              <TooltipContent side="top">Tema según el sistema operativo o IDE</TooltipContent>
            </Tooltip>

            {/* 2. Claro */}
            <Tooltip>
              <TooltipTrigger
                render={
                  <button
                    type="button"
                    onClick={() => {
                      onChangeFrame({
                        ...frame,
                        themeMode: "light",
                        fill: frame.fill === "#121212" ? "#FFFFFF" : frame.fill,
                      });
                    }}
                    className={cn(
                      "flex items-center justify-center gap-1.5 py-1.5 px-1 rounded-md transition-all text-xs",
                      frame.themeMode === "light"
                        ? "bg-background text-foreground shadow-xs border border-sidebar-border font-medium"
                        : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/50"
                    )}
                  >
                    <Sun className="size-3.5" />
                    <span className="text-[10px] leading-none">Claro</span>
                  </button>
                }
              />
              <TooltipContent side="top">Tema claro (Light Theme)</TooltipContent>
            </Tooltip>

            {/* 3. Oscuro */}
            <Tooltip>
              <TooltipTrigger
                render={
                  <button
                    type="button"
                    onClick={() => {
                      onChangeFrame({
                        ...frame,
                        themeMode: "dark",
                        fill: !frame.fill || frame.fill === "#FFFFFF" ? "#121212" : frame.fill,
                      });
                    }}
                    className={cn(
                      "flex items-center justify-center gap-1.5 py-1.5 px-1 rounded-md transition-all text-xs",
                      frame.themeMode === "dark"
                        ? "bg-background text-foreground shadow-xs border border-sidebar-border font-medium"
                        : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/50"
                    )}
                  >
                    <Moon className="size-3.5" />
                    <span className="text-[10px] leading-none">Oscuro</span>
                  </button>
                }
              />
              <TooltipContent side="top">Tema oscuro (Dark Theme)</TooltipContent>
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
          {frameColors.length > 0 && (
            <div className="flex items-center gap-1.5">
              {frameColors.slice(0, 3).map((item, idx) => (
                <div
                  key={idx}
                  className="size-3.5 rounded-xs border border-border/80 shadow-2xs"
                  style={{ backgroundColor: item.color }}
                />
              ))}
              {frameColors.length > 3 && (
                <span className="text-[10px] font-mono text-muted-foreground select-none">
                  +{frameColors.length - 3}
                </span>
              )}
            </div>
          )}
        </div>

        {frameColors.length > 0 ? (
          <div className="space-y-1.5">
            {frameColors.map((item) => (
              <div
                key={item.color}
                className="flex items-center justify-between h-8 px-2.5 rounded-lg border border-sidebar-border bg-sidebar-accent/30 hover:border-primary/40 transition-all group"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <label className="relative flex size-4 rounded-sm border border-border/80 shadow-2xs cursor-pointer overflow-hidden shrink-0">
                    <div
                      className="size-full pointer-events-none"
                      style={{ backgroundColor: item.color }}
                    />
                    <input
                      type="color"
                      value={item.color.startsWith("#") ? item.color.slice(0, 7) : "#000000"}
                      onChange={(e) => {
                        const newHex = e.target.value.toUpperCase();
                        handleReplaceColor(item.color, newHex);
                      }}
                      className="absolute inset-0 size-full opacity-0 cursor-pointer p-0 m-0 border-0 outline-none"
                    />
                  </label>
                  <span className="text-xs font-mono uppercase text-foreground truncate select-all">
                    {item.color.replace("#", "")}
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] font-mono text-muted-foreground">
                    {item.count} {item.count === 1 ? "elem" : "elems"}
                  </span>
                  <span className="text-xs font-mono text-muted-foreground select-none">
                    100 %
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-[11px] text-muted-foreground/60 px-1 italic">
            Sin colores en la pantalla
          </div>
        )}
      </div>

      {/* ── 9. Guía de disposición (Layout Grid) ── */}
      <div className="space-y-2 pt-1 border-t border-sidebar-border/60">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-semibold text-foreground">Guía de disposición</span>
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger
                render={
                  <button
                    type="button"
                    onClick={handleAddLayoutGrid}
                    className="flex size-6 items-center justify-center rounded text-muted-foreground hover:bg-sidebar-accent hover:text-foreground active:scale-95 transition-all"
                  >
                    <Plus className="size-3.5" />
                  </button>
                }
              />
              <TooltipContent side="top">Añadir guía de disposición</TooltipContent>
            </Tooltip>
          </div>
        </div>

        {frame.layoutGrid ? (
          <div className="flex items-center gap-1.5">
            <div className="flex-1 flex items-center justify-between h-8 px-2 rounded-lg border border-sidebar-border bg-sidebar-accent/30 transition-all min-w-0">
              <div className="flex items-center gap-2 min-w-0">
                <LayoutGrid className="size-3.5 text-muted-foreground shrink-0" />
                <select
                  value={frame.layoutGrid.type}
                  onChange={(e) => {
                    const nextType = e.target.value as "columns" | "grid";
                    onChangeFrame({
                      ...frame,
                      layoutGrid: {
                        ...frame.layoutGrid!,
                        type: nextType,
                        count: nextType === "columns" ? 4 : undefined,
                        size: nextType === "grid" ? 8 : undefined,
                      },
                    });
                  }}
                  className="bg-transparent text-xs text-foreground cursor-pointer outline-none truncate"
                >
                  <option value="columns" className="bg-popover text-popover-foreground">
                    Columnas (4, 16px)
                  </option>
                  <option value="grid" className="bg-popover text-popover-foreground">
                    Cuadrícula (8dp)
                  </option>
                </select>
              </div>

              <div className="flex items-center gap-1 shrink-0 pl-1">
                <span className="text-[10px] font-mono text-muted-foreground">
                  {frame.layoutGrid.type === "columns" ? "4 col" : "8 dp"}
                </span>
              </div>
            </div>

            <Tooltip>
              <TooltipTrigger
                render={
                  <button
                    type="button"
                    onClick={handleToggleLayoutGridVisible}
                    className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-sidebar-accent hover:text-foreground active:scale-95 transition-all shrink-0"
                  >
                    {frame.layoutGrid.visible ? (
                      <Eye className="size-3.5" />
                    ) : (
                      <EyeOff className="size-3.5 text-muted-foreground/60" />
                    )}
                  </button>
                }
              />
              <TooltipContent side="top">
                {frame.layoutGrid.visible ? "Ocultar guía" : "Mostrar guía"}
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger
                render={
                  <button
                    type="button"
                    onClick={handleRemoveLayoutGrid}
                    className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-sidebar-accent hover:text-foreground active:scale-95 transition-all shrink-0"
                  >
                    <Minus className="size-3.5" />
                  </button>
                }
              />
              <TooltipContent side="top">Eliminar guía</TooltipContent>
            </Tooltip>
          </div>
        ) : (
          <div className="text-[11px] text-muted-foreground/60 px-1 italic">
            Sin guías de disposición
          </div>
        )}
      </div>
    </div>
  );
}
