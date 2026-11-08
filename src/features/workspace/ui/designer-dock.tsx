import * as React from "react";
import {
  MousePointer2,
  Hand,
  Frame,
  Section,
  Square,
  Circle,
  Slash,
  Image as ImageIcon,
  Type,
  Ruler,
  Code2,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type DesignerTool =
  | "select"
  | "hand"
  | "frame"
  | "section"
  | "shape"
  | "ellipse"
  | "line"
  | "image"
  | "text"
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
  const isHandActive = activeTool === "hand";
  const isMoveActive = activeTool === "select";
  const isMoveOrHandActive = isMoveActive || isHandActive;

  // Track which sub-tool was selected last (defaults to "select")
  const [lastMoveTool, setLastMoveTool] = React.useState<"select" | "hand">("select");
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  React.useEffect(() => {
    if (activeTool === "select" || activeTool === "hand") {
      setLastMoveTool(activeTool);
    }
  }, [activeTool]);

  const ActiveIcon = isHandActive || (!isMoveActive && lastMoveTool === "hand") ? Hand : MousePointer2;
  const activeLabel = isHandActive || (!isMoveActive && lastMoveTool === "hand") ? "Mano (H)" : "Mover (V)";

  // Frame / Section state and last tool memory
  const isFrameActive = activeTool === "frame";
  const isSectionActive = activeTool === "section";
  const isFrameOrSectionActive = isFrameActive || isSectionActive;

  const [lastFrameTool, setLastFrameTool] = React.useState<"frame" | "section">("frame");
  const [isFrameMenuOpen, setIsFrameMenuOpen] = React.useState(false);

  React.useEffect(() => {
    if (activeTool === "frame" || activeTool === "section") {
      setLastFrameTool(activeTool);
    }
  }, [activeTool]);

  const FrameActiveIcon = isSectionActive || (!isFrameActive && lastFrameTool === "section") ? Section : Frame;
  const frameActiveLabel = isSectionActive || (!isFrameActive && lastFrameTool === "section") ? "Sección (Shift+S)" : "Marco (F)";

  // Shape tools state and last tool memory
  type ShapeToolType = "shape" | "ellipse" | "line" | "image";
  const isShapeActive =
    activeTool === "shape" ||
    activeTool === "ellipse" ||
    activeTool === "line" ||
    activeTool === "image";

  const [lastShapeTool, setLastShapeTool] = React.useState<ShapeToolType>("shape");
  const [isShapeMenuOpen, setIsShapeMenuOpen] = React.useState(false);

  React.useEffect(() => {
    if (
      activeTool === "shape" ||
      activeTool === "ellipse" ||
      activeTool === "line" ||
      activeTool === "image"
    ) {
      setLastShapeTool(activeTool);
    }
  }, [activeTool]);

  const shapeConfig: Record<
    ShapeToolType,
    { icon: React.ComponentType<{ className?: string }>; label: string }
  > = {
    shape: { icon: Square, label: "Rectángulo (R)" },
    ellipse: { icon: Circle, label: "Elipse (O)" },
    line: { icon: Slash, label: "Línea (L)" },
    image: { icon: ImageIcon, label: "Imagen (⇧⌘K)" },
  };

  const currentShape = shapeConfig[isShapeActive ? (activeTool as ShapeToolType) : lastShapeTool];
  const ShapeActiveIcon = currentShape.icon;
  const shapeActiveLabel = currentShape.label;

  return (
    <div
      data-slot="designer-dock"
      onPointerDown={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      className={cn(
        "pointer-events-auto flex items-center gap-1.5 h-11 px-2 rounded-2xl border border-border/80 bg-background/85 backdrop-blur-xl shadow-2xl select-none transition-all duration-300",
        className
      )}
    >
      {/* Primary Tools Group */}
      <div className="flex items-center gap-0.5">
        {/* 1. Standalone Move / Hand Tool Button (independent, preserves its full curved rounded-xl shape) */}
        <Tooltip>
          <TooltipTrigger
            render={
              <button
                type="button"
                onClick={() => onSelectTool?.(lastMoveTool)}
                className={cn(
                  "group relative flex h-8 items-center justify-center rounded-xl px-2.5 transition-all duration-150 outline-none cursor-pointer",
                  isMoveOrHandActive
                    ? "bg-primary text-primary-foreground shadow-xs font-medium"
                    : "text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                )}
                aria-label={activeLabel}
              />
            }
          >
            <ActiveIcon className="size-4 shrink-0" />
          </TooltipTrigger>
          <TooltipContent side="top" sideOffset={8}>
            <span className="text-xs font-medium">{activeLabel}</span>
          </TooltipContent>
        </Tooltip>

        {/* 2. Standalone Chevron Dropdown Menu Trigger (independent, reliable Base UI menu) */}
        <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
          <DropdownMenuTrigger
            render={
              <button
                type="button"
                className={cn(
                  "flex size-7 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-all duration-150 outline-none cursor-pointer shrink-0 mr-0.5",
                  isMenuOpen && "bg-muted text-foreground"
                )}
                title="Desplegar opciones de Mover / Mano"
                aria-label="Desplegar opciones de Mover / Mano"
              />
            }
          >
            <ChevronDown className={cn("size-3 transition-transform duration-150", isMenuOpen && "rotate-180")} />
          </DropdownMenuTrigger>

          <DropdownMenuContent side="top" align="center" sideOffset={10} className="w-52 p-1">
            <DropdownMenuGroup>
              <DropdownMenuItem
                onClick={() => {
                  onSelectTool?.("select");
                  setIsMenuOpen(false);
                }}
                className={cn(
                  "flex items-center justify-between text-xs py-1.5 px-2 cursor-pointer rounded-lg",
                  activeTool === "select" && "bg-primary/10 text-primary font-medium"
                )}
              >
                <div className="flex items-center gap-2">
                  <MousePointer2 className="size-3.5" />
                  <div className="flex flex-col">
                    <span>Mover</span>
                    <span className="text-[10px] text-muted-foreground">Editar e interactuar</span>
                  </div>
                </div>
                <kbd className="text-[10px] font-mono opacity-60">V</kbd>
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => {
                  onSelectTool?.("hand");
                  setIsMenuOpen(false);
                }}
                className={cn(
                  "flex items-center justify-between text-xs py-1.5 px-2 cursor-pointer rounded-lg",
                  activeTool === "hand" && "bg-primary/10 text-primary font-medium"
                )}
              >
                <div className="flex items-center gap-2">
                  <Hand className="size-3.5" />
                  <div className="flex flex-col">
                    <span>Mano</span>
                    <span className="text-[10px] text-muted-foreground">Navegar y zoom</span>
                  </div>
                </div>
                <kbd className="text-[10px] font-mono opacity-60">H</kbd>
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* 3. Standalone Frame / Section Tool Button */}
        <Tooltip>
          <TooltipTrigger
            render={
              <button
                type="button"
                onClick={() => onSelectTool?.(lastFrameTool)}
                className={cn(
                  "group relative flex h-8 items-center justify-center rounded-xl px-2.5 transition-all duration-150 outline-none cursor-pointer",
                  isFrameOrSectionActive
                    ? "bg-primary text-primary-foreground shadow-xs font-medium"
                    : "text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                )}
                aria-label={frameActiveLabel}
              />
            }
          >
            <FrameActiveIcon className="size-4 shrink-0" />
          </TooltipTrigger>
          <TooltipContent side="top" sideOffset={8}>
            <span className="text-xs font-medium">{frameActiveLabel}</span>
          </TooltipContent>
        </Tooltip>

        {/* 4. Standalone Chevron Dropdown Menu Trigger for Frame / Section */}
        <DropdownMenu open={isFrameMenuOpen} onOpenChange={setIsFrameMenuOpen}>
          <DropdownMenuTrigger
            render={
              <button
                type="button"
                className={cn(
                  "flex size-7 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-all duration-150 outline-none cursor-pointer shrink-0 mr-0.5",
                  isFrameMenuOpen && "bg-muted text-foreground"
                )}
                title="Desplegar opciones de Marco / Sección"
                aria-label="Desplegar opciones de Marco / Sección"
              />
            }
          >
            <ChevronDown className={cn("size-3 transition-transform duration-150", isFrameMenuOpen && "rotate-180")} />
          </DropdownMenuTrigger>

          <DropdownMenuContent side="top" align="center" sideOffset={10} className="w-52 p-1">
            <DropdownMenuGroup>
              <DropdownMenuItem
                onClick={() => {
                  onSelectTool?.("frame");
                  setIsFrameMenuOpen(false);
                }}
                className={cn(
                  "flex items-center justify-between text-xs py-1.5 px-2 cursor-pointer rounded-lg",
                  activeTool === "frame" && "bg-primary/10 text-primary font-medium"
                )}
              >
                <div className="flex items-center gap-2">
                  <Frame className="size-3.5" />
                  <div className="flex flex-col">
                    <span>Marco</span>
                    <span className="text-[10px] text-muted-foreground">Crear pantalla o contenedor</span>
                  </div>
                </div>
                <kbd className="text-[10px] font-mono opacity-60">F</kbd>
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => {
                  onSelectTool?.("section");
                  setIsFrameMenuOpen(false);
                }}
                className={cn(
                  "flex items-center justify-between text-xs py-1.5 px-2 cursor-pointer rounded-lg",
                  activeTool === "section" && "bg-primary/10 text-primary font-medium"
                )}
              >
                <div className="flex items-center gap-2">
                  <Section className="size-3.5" />
                  <div className="flex flex-col">
                    <span>Sección</span>
                    <span className="text-[10px] text-muted-foreground">Organizar y agrupar marcos</span>
                  </div>
                </div>
                <kbd className="text-[10px] font-mono opacity-60">⇧S</kbd>
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* 5. Standalone Shapes Tool Button */}
        <Tooltip>
          <TooltipTrigger
            render={
              <button
                type="button"
                onClick={() => onSelectTool?.(lastShapeTool)}
                className={cn(
                  "group relative flex h-8 items-center justify-center rounded-xl px-2.5 transition-all duration-150 outline-none cursor-pointer",
                  isShapeActive
                    ? "bg-primary text-primary-foreground shadow-xs font-medium"
                    : "text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                )}
                aria-label={shapeActiveLabel}
              />
            }
          >
            <ShapeActiveIcon className="size-4 shrink-0" />
          </TooltipTrigger>
          <TooltipContent side="top" sideOffset={8}>
            <span className="text-xs font-medium">{shapeActiveLabel}</span>
          </TooltipContent>
        </Tooltip>

        {/* 6. Standalone Chevron Dropdown Menu Trigger for Shapes */}
        <DropdownMenu open={isShapeMenuOpen} onOpenChange={setIsShapeMenuOpen}>
          <DropdownMenuTrigger
            render={
              <button
                type="button"
                className={cn(
                  "flex size-7 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-all duration-150 outline-none cursor-pointer shrink-0 mr-0.5",
                  isShapeMenuOpen && "bg-muted text-foreground"
                )}
                title="Desplegar opciones de Formas"
                aria-label="Desplegar opciones de Formas"
              />
            }
          >
            <ChevronDown className={cn("size-3 transition-transform duration-150", isShapeMenuOpen && "rotate-180")} />
          </DropdownMenuTrigger>

          <DropdownMenuContent side="top" align="center" sideOffset={10} className="w-56 p-1">
            <DropdownMenuGroup>
              <DropdownMenuItem
                onClick={() => {
                  onSelectTool?.("shape");
                  setIsShapeMenuOpen(false);
                }}
                className={cn(
                  "flex items-center justify-between text-xs py-1.5 px-2 cursor-pointer rounded-lg",
                  activeTool === "shape" && "bg-primary/10 text-primary font-medium"
                )}
              >
                <div className="flex items-center gap-2">
                  <Square className="size-3.5" />
                  <div className="flex flex-col">
                    <span>Rectángulo</span>
                    <span className="text-[10px] text-muted-foreground">Container / Card</span>
                  </div>
                </div>
                <kbd className="text-[10px] font-mono opacity-60">R</kbd>
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => {
                  onSelectTool?.("ellipse");
                  setIsShapeMenuOpen(false);
                }}
                className={cn(
                  "flex items-center justify-between text-xs py-1.5 px-2 cursor-pointer rounded-lg",
                  activeTool === "ellipse" && "bg-primary/10 text-primary font-medium"
                )}
              >
                <div className="flex items-center gap-2">
                  <Circle className="size-3.5" />
                  <div className="flex flex-col">
                    <span>Elipse</span>
                    <span className="text-[10px] text-muted-foreground">Círculo / Avatar</span>
                  </div>
                </div>
                <kbd className="text-[10px] font-mono opacity-60">O</kbd>
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => {
                  onSelectTool?.("line");
                  setIsShapeMenuOpen(false);
                }}
                className={cn(
                  "flex items-center justify-between text-xs py-1.5 px-2 cursor-pointer rounded-lg",
                  activeTool === "line" && "bg-primary/10 text-primary font-medium"
                )}
              >
                <div className="flex items-center gap-2">
                  <Slash className="size-3.5" />
                  <div className="flex flex-col">
                    <span>Línea</span>
                    <span className="text-[10px] text-muted-foreground">Divisor / Separador</span>
                  </div>
                </div>
                <kbd className="text-[10px] font-mono opacity-60">L</kbd>
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => {
                  onSelectTool?.("image");
                  setIsShapeMenuOpen(false);
                }}
                className={cn(
                  "flex items-center justify-between text-xs py-1.5 px-2 cursor-pointer rounded-lg",
                  activeTool === "image" && "bg-primary/10 text-primary font-medium"
                )}
              >
                <div className="flex items-center gap-2">
                  <ImageIcon className="size-3.5" />
                  <div className="flex flex-col">
                    <span>Imagen / Video...</span>
                    <span className="text-[10px] text-muted-foreground">Asset o URL</span>
                  </div>
                </div>
                <kbd className="text-[10px] font-mono opacity-60">⇧⌘K</kbd>
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* 7. Standalone Text Tool Button */}
        <Tooltip>
          <TooltipTrigger
            render={
              <button
                type="button"
                onClick={() => onSelectTool?.("text")}
                className={cn(
                  "group relative flex h-8 items-center justify-center rounded-xl px-2.5 transition-all duration-150 outline-none cursor-pointer",
                  activeTool === "text"
                    ? "bg-primary text-primary-foreground shadow-xs font-medium"
                    : "text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                )}
                aria-label="Texto (T)"
              />
            }
          >
            <Type className="size-4 shrink-0" />
          </TooltipTrigger>
          <TooltipContent side="top" sideOffset={8}>
            <span className="text-xs font-medium">Texto (T)</span>
          </TooltipContent>
        </Tooltip>
      </div>

      {/* Divider */}
      <div className="h-5 w-px bg-border/60 mx-0.5 shrink-0" />

      {/* Secondary Utilities Sub-dock */}
      <div className="flex items-center gap-0.5 rounded-xl bg-muted/50 p-0.5">
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
                    ? "bg-primary/15 text-primary font-medium"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
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
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
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
