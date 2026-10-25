import * as React from "react";
import {
  MousePointer2,
  Frame,
  Square,
  PenTool,
  Type,
  Braces,
  MessageSquare,
  Component,
  Pencil,
  Ruler,
  Code2,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export type DesignerTool =
  | "select"
  | "frame"
  | "shape"
  | "pen"
  | "text"
  | "code"
  | "comment"
  | "components"
  | "draw"
  | "dev";

interface DesignerDockProps {
  activeTool?: DesignerTool;
  onSelectTool?: (tool: DesignerTool) => void;
  showRulers?: boolean;
  onToggleRulers?: () => void;
  className?: string;
}

export function DesignerDock({
  activeTool = "select",
  onSelectTool,
  showRulers = true,
  onToggleRulers,
  className,
}: DesignerDockProps) {
  const primaryTools: Array<{
    id: DesignerTool;
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    hasDropdown?: boolean;
  }> = [
    { id: "select", icon: MousePointer2, label: "Mover / Seleccionar (V)", hasDropdown: true },
    { id: "frame", icon: Frame, label: "Marco / Artboard (F)", hasDropdown: true },
    { id: "shape", icon: Square, label: "Formas / Rectángulo (R)", hasDropdown: true },
    { id: "pen", icon: PenTool, label: "Pluma / Vector (P)", hasDropdown: true },
    { id: "text", icon: Type, label: "Texto (T)", hasDropdown: true },
    { id: "code", icon: Braces, label: "Widgets Flutter ({})", hasDropdown: true },
    { id: "comment", icon: MessageSquare, label: "Comentarios (C)", hasDropdown: true },
    { id: "components", icon: Component, label: "Librería de Componentes" },
  ];

  return (
    <div
      data-slot="designer-dock"
      className={cn(
        "pointer-events-auto flex items-center gap-1.5 h-11 px-2 rounded-2xl border border-border/50 dark:border-white/10 bg-background/70 dark:bg-zinc-900/75 backdrop-blur-xl shadow-2xl select-none transition-all duration-300",
        className
      )}
    >
      {/* Primary Tools Group */}
      <div className="flex items-center gap-0.5">
        {primaryTools.map(({ id, icon: Icon, label, hasDropdown }) => {
          const isActive = activeTool === id;
          return (
            <Tooltip key={id}>
              <TooltipTrigger
                render={
                  <button
                    type="button"
                    onClick={() => onSelectTool?.(id)}
                    className={cn(
                      "group relative flex h-8 items-center gap-0.5 rounded-xl px-2 transition-all duration-150 outline-none",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-xs"
                        : "text-muted-foreground hover:bg-muted/60 hover:text-foreground dark:hover:bg-white/10"
                    )}
                    aria-label={label}
                  />
                }
              >
                <Icon className="size-4 shrink-0" />
                {hasDropdown && (
                  <ChevronDown
                    className={cn(
                      "size-2.5 opacity-60 transition-opacity group-hover:opacity-100",
                      isActive && "opacity-90"
                    )}
                  />
                )}
              </TooltipTrigger>
              <TooltipContent side="top" sideOffset={8}>
                <span className="text-xs font-medium">{label}</span>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>

      {/* Divider */}
      <div className="h-5 w-px bg-border/40 dark:bg-white/10 mx-0.5 shrink-0" />

      {/* Secondary Utilities Sub-dock */}
      <div className="flex items-center gap-0.5 rounded-xl bg-muted/40 dark:bg-white/5 p-0.5">
        {/* Draw tool */}
        <Tooltip>
          <TooltipTrigger
            render={
              <button
                type="button"
                onClick={() => onSelectTool?.("draw")}
                className={cn(
                  "flex size-7 items-center justify-center rounded-lg transition-all duration-150 outline-none",
                  activeTool === "draw"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground dark:hover:bg-white/10"
                )}
                aria-label="Dibujo libre"
              />
            }
          >
            <Pencil className="size-3.5" />
          </TooltipTrigger>
          <TooltipContent side="top" sideOffset={8}>
            <span className="text-xs font-medium">Dibujo a mano alzada</span>
          </TooltipContent>
        </Tooltip>

        {/* Ruler / Measure Toggle */}
        <Tooltip>
          <TooltipTrigger
            render={
              <button
                type="button"
                onClick={onToggleRulers}
                className={cn(
                  "flex size-7 items-center justify-center rounded-lg transition-all duration-150 outline-none",
                  showRulers
                    ? "bg-primary/15 text-primary dark:bg-primary/25 dark:text-sky-300 font-medium"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground dark:hover:bg-white/10"
                )}
                aria-label="Alternar reglas (Shift + R)"
              />
            }
          >
            <Ruler className="size-3.5" />
          </TooltipTrigger>
          <TooltipContent side="top" sideOffset={8}>
            <span className="text-xs font-medium">Reglas de medición (Shift + R)</span>
          </TooltipContent>
        </Tooltip>

        {/* Dev Mode Toggle */}
        <Tooltip>
          <TooltipTrigger
            render={
              <button
                type="button"
                onClick={() => onSelectTool?.("dev")}
                className={cn(
                  "flex size-7 items-center justify-center rounded-lg transition-all duration-150 outline-none",
                  activeTool === "dev"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground dark:hover:bg-white/10"
                )}
                aria-label="Modo desarrollador"
              />
            }
          >
            <Code2 className="size-3.5" />
          </TooltipTrigger>
          <TooltipContent side="top" sideOffset={8}>
            <span className="text-xs font-medium">Modo Desarrollador (código Flutter)</span>
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}
