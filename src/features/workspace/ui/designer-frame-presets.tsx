import * as React from "react";
import {
  Smartphone,
  ChevronDown,
  GripVertical,
  Plus,
  Tablet,
  Monitor,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type DeviceFrameType = "iphone" | "android";

export interface FramePresetItem {
  id: string;
  type: DeviceFrameType;
  name: string;
  os: "iOS" | "Android";
  width: number;
  height: number;
  description: string;
}

export const PHONE_PRESETS: FramePresetItem[] = [
  // ── iPhone 18 Series ──
  {
    id: "iphone-18-promax",
    type: "iphone",
    name: "iPhone 18 Pro Max",
    os: "iOS",
    width: 440,
    height: 956,
    description: "440 × 956 • Super Retina XDR",
  },
  {
    id: "iphone-18-pro",
    type: "iphone",
    name: "iPhone 18 Pro",
    os: "iOS",
    width: 402,
    height: 874,
    description: "402 × 874 • Super Retina XDR",
  },

  // ── iPhone 17 Series ──
  {
    id: "iphone-17-promax",
    type: "iphone",
    name: "iPhone 17 Pro Max",
    os: "iOS",
    width: 440,
    height: 956,
    description: "440 × 956 • Super Retina XDR",
  },
  {
    id: "iphone-17-pro",
    type: "iphone",
    name: "iPhone 17 Pro",
    os: "iOS",
    width: 402,
    height: 874,
    description: "402 × 874 • Super Retina XDR",
  },
  {
    id: "iphone-17",
    type: "iphone",
    name: "iPhone 17",
    os: "iOS",
    width: 402,
    height: 874,
    description: "402 × 874 • Super Retina XDR",
  },

  // ── iPhone 16 Series ──
  {
    id: "iphone-16-promax",
    type: "iphone",
    name: "iPhone 16 Pro Max",
    os: "iOS",
    width: 440,
    height: 956,
    description: "440 × 956 • Super Retina XDR",
  },
  {
    id: "iphone-16-pro",
    type: "iphone",
    name: "iPhone 16 Pro",
    os: "iOS",
    width: 402,
    height: 874,
    description: "402 × 874 • Super Retina XDR",
  },
  {
    id: "iphone-16",
    type: "iphone",
    name: "iPhone 16",
    os: "iOS",
    width: 393,
    height: 852,
    description: "393 × 852 • Super Retina XDR",
  },

  // ── Android ──
  {
    id: "android-phone",
    type: "android",
    name: "Android Phone",
    os: "Android",
    width: 380,
    height: 830,
    description: "380 × 830 • Material 3",
  },
];

interface DesignerFramePresetsProps {
  onSelectPreset: (preset: FramePresetItem) => void;
  className?: string;
}

export function DesignerFramePresets({
  onSelectPreset,
  className,
}: DesignerFramePresetsProps) {
  const [phoneOpen, setPhoneOpen] = React.useState(true);
  const [tabletOpen, setTabletOpen] = React.useState(false);
  const [desktopOpen, setDesktopOpen] = React.useState(false);

  return (
    <div className={cn("flex flex-col gap-3 p-3 select-none text-sidebar-foreground", className)}>
      {/* Informative Header / Hint */}
      <div className="rounded-xl border border-border/50 bg-muted/40 p-2.5">
        <p className="text-[11px] font-medium text-foreground">
          Marcos de dispositivo
        </p>
        <p className="mt-0.5 text-[10px] text-muted-foreground leading-normal">
          Haz clic para añadir al canvas o arrastra directamente hacia la posición deseada.
        </p>
      </div>

      {/* ── 1. TELÉFONO (Collapsible Group) ───────────────────────────── */}
      <div className="flex flex-col rounded-xl border border-sidebar-border bg-sidebar-accent/15 overflow-hidden">
        {/* Collapsible Trigger */}
        <button
          type="button"
          onClick={() => setPhoneOpen((v) => !v)}
          className="flex w-full items-center justify-between px-3 py-2 text-left transition-colors hover:bg-muted/50"
        >
          <div className="flex items-center gap-2 min-w-0">
            <Smartphone className="size-3.5 text-primary shrink-0" />
            <span className="text-xs font-semibold text-foreground tracking-tight">
              Teléfono
            </span>
            <span className="rounded-full bg-primary/10 px-1.5 py-0.2 font-mono text-[9px] font-medium text-primary">
              {PHONE_PRESETS.length}
            </span>
          </div>
          <ChevronDown
            className={cn(
              "size-3.5 text-muted-foreground transition-transform duration-200",
              !phoneOpen && "-rotate-90"
            )}
          />
        </button>

        {/* Presets List */}
        {phoneOpen && (
          <div className="flex flex-col gap-1.5 p-2 pt-0">
            {PHONE_PRESETS.map((preset) => (
              <div
                key={preset.id}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData("application/json", JSON.stringify(preset));
                  e.dataTransfer.effectAllowed = "copy";
                }}
                onClick={() => onSelectPreset(preset)}
                className="group relative flex items-center justify-between rounded-xl border border-border/50 bg-background/80 p-2.5 shadow-xs transition-all duration-150 hover:border-primary/40 hover:bg-muted/60 hover:shadow-md cursor-grab active:cursor-grabbing"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {/* Miniature Device Badge */}
                  <div
                    className={cn(
                      "flex size-7 shrink-0 items-center justify-center rounded-lg border text-[10px] font-semibold transition-colors",
                      preset.os === "iOS"
                        ? "border-sky-500/20 bg-sky-500/10 text-sky-500 group-hover:bg-sky-500/20"
                        : "border-emerald-500/20 bg-emerald-500/10 text-emerald-500 group-hover:bg-emerald-500/20"
                    )}
                  >
                    <Smartphone className="size-3.5" />
                  </div>

                  {/* Device Info */}
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-medium text-foreground truncate group-hover:text-primary transition-colors">
                      {preset.name}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-mono truncate">
                      {preset.description}
                    </span>
                  </div>
                </div>

                {/* Drag Handle & Add Action */}
                <div className="flex items-center gap-1 shrink-0 text-muted-foreground opacity-60 group-hover:opacity-100 transition-opacity">
                  <div
                    title="Añadir al canvas"
                    className="flex size-6 items-center justify-center rounded-md hover:bg-primary/10 hover:text-primary transition-colors"
                  >
                    <Plus className="size-3.5" />
                  </div>
                  <GripVertical className="size-3.5 text-muted-foreground/50" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── 2. TABLET (Collapsible Group - Coming Soon) ───────────────── */}
      <div className="flex flex-col rounded-xl border border-sidebar-border bg-sidebar-accent/15 overflow-hidden opacity-60 hover:opacity-100 transition-opacity">
        <button
          type="button"
          onClick={() => setTabletOpen((v) => !v)}
          className="flex w-full items-center justify-between px-3 py-2 text-left transition-colors hover:bg-muted/50"
        >
          <div className="flex items-center gap-2 min-w-0">
            <Tablet className="size-3.5 text-muted-foreground shrink-0" />
            <span className="text-xs font-semibold text-foreground tracking-tight">
              Tablet
            </span>
            <span className="text-[9px] text-muted-foreground font-mono">
              (Próximamente)
            </span>
          </div>
          <ChevronDown
            className={cn(
              "size-3.5 text-muted-foreground transition-transform duration-200",
              !tabletOpen && "-rotate-90"
            )}
          />
        </button>

        {tabletOpen && (
          <div className="p-3 text-center text-xs text-muted-foreground">
            Los marcos de iPad y tablets estarán disponibles próximamente.
          </div>
        )}
      </div>

      {/* ── 3. ESCRITORIO (Collapsible Group - Coming Soon) ───────────── */}
      <div className="flex flex-col rounded-xl border border-sidebar-border bg-sidebar-accent/15 overflow-hidden opacity-60 hover:opacity-100 transition-opacity">
        <button
          type="button"
          onClick={() => setDesktopOpen((v) => !v)}
          className="flex w-full items-center justify-between px-3 py-2 text-left transition-colors hover:bg-muted/50"
        >
          <div className="flex items-center gap-2 min-w-0">
            <Monitor className="size-3.5 text-muted-foreground shrink-0" />
            <span className="text-xs font-semibold text-foreground tracking-tight">
              Escritorio
            </span>
            <span className="text-[9px] text-muted-foreground font-mono">
              (Próximamente)
            </span>
          </div>
          <ChevronDown
            className={cn(
              "size-3.5 text-muted-foreground transition-transform duration-200",
              !desktopOpen && "-rotate-90"
            )}
          />
        </button>

        {desktopOpen && (
          <div className="p-3 text-center text-xs text-muted-foreground">
            Los marcos de Desktop / Web estarán disponibles próximamente.
          </div>
        )}
      </div>
    </div>
  );
}
