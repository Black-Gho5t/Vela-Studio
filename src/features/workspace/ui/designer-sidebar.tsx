import * as React from "react";
import {
  PanelLeftClose,
  SlidersHorizontal,
  Palette,
  Smartphone,
  Code2,
  Copy,
  Check,
  Plus,
  ExternalLink,
  RefreshCw,
  Layers,
  Component,
  PanelTop,
  LayoutDashboard,
  Shield,
  Rows,
  Type,
  Square,
  CreditCard,
  MousePointerClick,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronRight,
  Sparkles,
  GripVertical,
  Minus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useWorkspaceStore } from "../model/workspace.store";
import type { CanvasDeviceFrame, CanvasWidgetElement } from "./designer-canvas";
import {
  loadFlutterThemeVariables,
  saveFlutterThemeVariables,
  type ColorVariableItem,
} from "../model/flutter-theme-parser";
import { resolveAbsoluteFilePath } from "../model/designer-frame-file";

export type DesignerLeftRailTab = "layers" | "files" | "components" | "variables";
export type { ColorVariableItem };

export interface FlutterComponentItem {
  id: string;
  name: string;
  fileName: string;
  filePath: string;
  description: string;
  type?: string;
}

interface DesignerSidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  side?: "left" | "right";
  open?: boolean;
  onToggleMinimize?: () => void;
  title?: string;
  icon?: React.ReactNode;
  activeRailTab?: DesignerLeftRailTab;
  onRailTabChange?: (tab: DesignerLeftRailTab) => void;
  frames?: CanvasDeviceFrame[];
  selectedFrameId?: string;
  onSelectFrameId?: (id: string) => void;
  selectedElementId?: string;
  onSelectElementId?: (id: string) => void;
  onAddElementToFrame?: (frameId: string, element: Omit<CanvasWidgetElement, "id">) => void;
  onDeleteElement?: (frameId: string, elementId: string) => void;
}

function LayerTreeRow({
  icon: Icon,
  name,
  tag,
  onClick,
  isSelected,
}: {
  icon: React.ComponentType<{ className?: string }>;
  name: string;
  tag?: string;
  onClick?: () => void;
  isSelected?: boolean;
}) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "group/layer flex items-center justify-between py-1 px-1.5 rounded text-[11px] cursor-pointer transition-colors select-none",
        isSelected
          ? "bg-sidebar-accent/70 text-sidebar-accent-foreground font-medium"
          : "hover:bg-sidebar-accent/40 text-muted-foreground hover:text-foreground"
      )}
    >
      <div className="flex items-center gap-1.5 min-w-0">
        <Icon className="size-3 shrink-0 text-muted-foreground group-hover/layer:text-primary transition-colors" />
        <span className="truncate">{name}</span>
      </div>
      {tag && (
        <span className="text-[9px] font-mono text-muted-foreground/50 group-hover/layer:text-muted-foreground/80 px-1 py-0.2 bg-muted/40 rounded shrink-0">
          {tag}
        </span>
      )}
    </div>
  );
}

const DRAGGABLE_COMPONENTS = [
  {
    type: "button" as const,
    name: "Botón",
    label: "Botón",
    description: "Botón para pulsación interactiva",
    icon: MousePointerClick,
    width: 120,
    height: 40,
    badge: "Acción",
  },
  {
    type: "text" as const,
    name: "Texto",
    label: "Título de Pantalla",
    description: "Etiqueta o encabezado de texto",
    icon: Type,
    width: 130,
    height: 30,
    badge: "Tipografía",
  },
  {
    type: "card" as const,
    name: "Tarjeta",
    label: "Tarjeta",
    description: "Superficie de contenido elevada",
    icon: CreditCard,
    width: 150,
    height: 70,
    badge: "Contenedor",
  },
  {
    type: "input" as const,
    name: "Campo de Texto",
    label: "Escribe algo...",
    description: "Entrada para formularios",
    icon: Square,
    width: 150,
    height: 40,
    badge: "Formulario",
  },
  {
    type: "icon" as const,
    name: "Icono",
    label: "Icono",
    description: "Icono gráfico Flutter",
    icon: Sparkles,
    width: 40,
    height: 40,
    badge: "Medios",
  },
  {
    type: "container" as const,
    name: "Contenedor",
    label: "Caja",
    description: "Caja con borde para agrupar widgets",
    icon: Layers,
    width: 130,
    height: 75,
    badge: "Layout",
  },
];

export function DesignerSidebar({
  side = "left",
  open = true,
  onToggleMinimize,
  title,
  icon,
  activeRailTab: externalActiveRailTab,
  onRailTabChange,
  frames = [],
  selectedFrameId,
  onSelectFrameId,
  selectedElementId,
  onSelectElementId,
  onAddElementToFrame,
  onDeleteElement,
  className,
  children,
  ...props
}: DesignerSidebarProps) {
  const isRight = side === "right";
  const [internalRailTab, setInternalRailTab] = React.useState<DesignerLeftRailTab>("layers");
  const [colorVariables, setColorVariables] = React.useState<ColorVariableItem[]>([]);
  const [themeSource, setThemeSource] = React.useState<string | null>(null);
  const [isLoadingTheme, setIsLoadingTheme] = React.useState(false);
  const [copiedId, setCopiedId] = React.useState<string | null>(null);
  const [isAddingColor, setIsAddingColor] = React.useState(false);
  const [newColorName, setNewColorName] = React.useState("");
  const [newColorValue, setNewColorValue] = React.useState("#38bdf8");

  // Layers Tree State
  const [collapsedFrames, setCollapsedFrames] = React.useState<Set<string>>(new Set());
  const [hiddenFrames, setHiddenFrames] = React.useState<Set<string>>(new Set());

  // Components Library State
  const [components, setComponents] = React.useState<FlutterComponentItem[]>([]);
  const [isComponentsInitialized, setIsComponentsInitialized] = React.useState(false);
  const [isInitializingComponents, setIsInitializingComponents] = React.useState(false);
  const [copiedCompId, setCopiedCompId] = React.useState<string | null>(null);

  const { setWorkspaceMode } = useWorkspaceStore();

  const refreshThemeVariables = React.useCallback(async () => {
    setIsLoadingTheme(true);
    try {
      const res = await loadFlutterThemeVariables();
      setColorVariables(res.variables);
      setThemeSource(res.sourceFile);
    } finally {
      setIsLoadingTheme(false);
    }
  }, []);

  // Load theme variables from Flutter project on mount
  React.useEffect(() => {
    refreshThemeVariables();
  }, [refreshThemeVariables]);

  // Check if components already exist on disk
  React.useEffect(() => {
    const checkComponents = async () => {
      const { projectPath } = useWorkspaceStore.getState();
      if (!projectPath) return;
      try {
        const { workspaceApi } = await import("../api/workspace.api");
        const resolved = resolveAbsoluteFilePath("lib/components/custom_button.dart", projectPath);
        await workspaceApi.readFile(resolved);
        // File exists on disk
        setComponents((prev) => {
          if (prev.some((c) => c.fileName === "custom_button.dart")) return prev;
          return [
            ...prev,
            {
              id: "comp-button",
              name: "CustomButton",
              fileName: "custom_button.dart",
              filePath: resolved,
              description: "Botón primario con icono y acción",
              type: "button",
            },
          ];
        });
        setIsComponentsInitialized(true);
      } catch {
        // Not yet initialized
      }
    };
    checkComponents();
  }, []);

  const activeRailTab = externalActiveRailTab ?? internalRailTab;
  const isLayersActive = activeRailTab === "layers" || activeRailTab === "files";

  const handleRailTabChange = (tab: DesignerLeftRailTab) => {
    setInternalRailTab(tab);
    onRailTabChange?.(tab);
    if (tab === "variables") {
      refreshThemeVariables();
    }
  };

  const toggleFrameCollapse = (id: string) => {
    setCollapsedFrames((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleFrameVisibility = (id: string) => {
    setHiddenFrames((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleCopyColor = (id: string, value: string) => {
    navigator.clipboard.writeText(value);
    setCopiedId(id);
    setTimeout(() => {
      setCopiedId((curr) => (curr === id ? null : curr));
    }, 1500);
  };

  const handleCopyComponentCode = (id: string, name: string) => {
    navigator.clipboard.writeText(`<${name} />`);
    setCopiedCompId(id);
    setTimeout(() => {
      setCopiedCompId((curr) => (curr === id ? null : curr));
    }, 1500);
  };

  const handleAddColor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newColorName.trim()) return;
    const cleanName = newColorName.trim().replace(/^--/, "");
    const newItem: ColorVariableItem = {
      id: `custom-${Date.now()}`,
      name: cleanName,
      value: newColorValue,
      description: "Variable añadida desde el Diseñador",
    };
    const updated = [...colorVariables, newItem];
    setColorVariables(updated);
    setNewColorName("");
    setIsAddingColor(false);

    // Save back to Flutter project file (lib/theme/app_colors.dart)
    const result = await saveFlutterThemeVariables(updated);
    if (result.success) {
      setThemeSource("lib/theme/app_colors.dart");
    }
  };

  // Iniciar biblioteca de componentes Flutter
  const handleInitComponents = async () => {
    setIsInitializingComponents(true);
    try {
      const { projectPath, addTab, setFileTree } = useWorkspaceStore.getState();
      const fileName = "custom_button.dart";
      const relativePath = `lib/components/${fileName}`;
      const resolvedPath = resolveAbsoluteFilePath(relativePath, projectPath);

      const buttonCode = `import 'package:flutter/material.dart';

class CustomButton extends StatelessWidget {
  final String label;
  final VoidCallback? onPressed;
  final IconData? icon;
  final Color? color;

  const CustomButton({
    super.key,
    required this.label,
    this.onPressed,
    this.icon,
    this.color,
  });

  @override
  Widget build(BuildContext context) {
    return ElevatedButton.icon(
      onPressed: onPressed ?? () {},
      icon: Icon(icon ?? Icons.touch_app, size: 18),
      label: Text(label),
      style: ElevatedButton.styleFrom(
        backgroundColor: color,
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(10),
        ),
      ),
    );
  }
}
`;

      try {
        const { workspaceApi } = await import("../api/workspace.api");
        await workspaceApi.saveFile(resolvedPath, buttonCode);
        if (projectPath) {
          const tree = await workspaceApi.getDirectoryTree(projectPath);
          setFileTree(tree);
        }
      } catch (err) {
        console.warn("Could not save component to disk:", err);
      }

      addTab({
        id: resolvedPath,
        name: fileName,
        path: resolvedPath,
        isActive: false,
        isModified: false,
        content: buttonCode,
      });

      const initialComp: FlutterComponentItem = {
        id: "comp-button",
        name: "CustomButton",
        fileName,
        filePath: resolvedPath,
        description: "Botón primario con icono y acción",
        type: "button",
      };

      setComponents([initialComp]);
      setIsComponentsInitialized(true);
    } finally {
      setIsInitializingComponents(false);
    }
  };

  // Right sidebar stays clean and simple
  if (isRight) {
    return (
      <aside
        data-slot="designer-sidebar"
        data-side="right"
        className={cn(
          "absolute top-0 bottom-0 z-20 w-64 flex flex-col bg-sidebar text-sidebar-foreground transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] select-none right-0 border-l border-sidebar-border",
          open ? "translate-x-0 shadow-lg" : "translate-x-full pointer-events-none",
          className
        )}
        {...props}
      >
        <div className="h-9 border-b border-sidebar-border/60 px-3 flex flex-row items-center justify-between shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            {icon || <SlidersHorizontal className="size-3.5 text-primary shrink-0" />}
            <span className="text-xs font-semibold text-foreground truncate tracking-tight">
              {title || "Propiedades"}
            </span>
          </div>
        </div>

        <ScrollArea className="flex-1 min-h-0" viewportClassName="p-2">
          {children}
        </ScrollArea>
      </aside>
    );
  }

  // Left sidebar with Primary Rail (Capas / Componentes / Variables)
  const leftRailItems = [
    {
      id: "layers" as const,
      label: "Capas",
      description: "Árbol de capas y componentes",
      icon: Layers,
    },
    {
      id: "components" as const,
      label: "Componentes",
      description: "Biblioteca de componentes Flutter",
      icon: Component,
    },
    {
      id: "variables" as const,
      label: "Variables",
      description: "Variables de color",
      icon: Palette,
    },
  ];

  return (
    <aside
      data-slot="designer-sidebar"
      data-side="left"
      className={cn(
        "absolute top-0 bottom-0 z-20 w-64 flex flex-row bg-sidebar text-sidebar-foreground transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] select-none left-0 border-r border-sidebar-border",
        open ? "translate-x-0 shadow-lg" : "-translate-x-full pointer-events-none",
        className
      )}
      {...props}
    >
      {/* ── Left Primary Rail ── */}
      <div className="flex h-full w-12 shrink-0 flex-col items-center justify-between border-r border-sidebar-border/60 bg-sidebar py-3 px-1.5 select-none">
        <div className="flex flex-col items-center gap-1.5 w-full">
          {leftRailItems.map(({ id, label, description, icon: Icon }) => {
            const isActive = id === "layers" ? isLayersActive : activeRailTab === id;
            return (
              <div
                key={id}
                className="group/nav relative flex items-center justify-center w-full"
              >
                {/* Active indicator pill */}
                <span
                  className={cn(
                    "absolute left-0 top-1/2 -translate-y-1/2 w-[2.5px] rounded-full transition-all duration-150",
                    isActive
                      ? "h-3.5 bg-primary group-hover/nav:h-4"
                      : "h-0 bg-transparent"
                  )}
                  aria-hidden="true"
                />

                <Tooltip>
                  <TooltipTrigger
                    render={
                      <button
                        type="button"
                        className={cn(
                          "group/btn relative flex size-7 items-center justify-center rounded-md outline-none transition-all duration-150 ease-out",
                          "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground active:scale-95",
                          isActive
                            ? "text-sidebar-accent-foreground bg-sidebar-accent shadow-xs"
                            : "text-muted-foreground"
                        )}
                        onClick={() => handleRailTabChange(id)}
                      >
                        <Icon className="size-4 shrink-0" />
                      </button>
                    }
                  />
                  <TooltipContent side="right" sideOffset={12}>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs font-semibold">{label}</span>
                      <span className="text-[10px] text-muted-foreground">{description}</span>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Right Content Pane ── */}
      <div className="flex flex-1 min-w-0 flex-col h-full bg-sidebar overflow-hidden">
        {/* Pane Header */}
        <div className="h-9 border-b border-sidebar-border/60 px-3 flex flex-row items-center justify-between shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            {isLayersActive ? (
              <>
                <Layers className="size-3.5 text-primary shrink-0" />
                <span className="text-xs font-semibold text-foreground truncate tracking-tight">
                  Capas y Widgets
                </span>
              </>
            ) : activeRailTab === "components" ? (
              <>
                <Component className="size-3.5 text-primary shrink-0" />
                <span className="text-xs font-semibold text-foreground truncate tracking-tight">
                  Componentes
                </span>
              </>
            ) : (
              <>
                <Palette className="size-3.5 text-primary shrink-0" />
                <span className="text-xs font-semibold text-foreground truncate tracking-tight">
                  Variables de Color
                </span>
              </>
            )}
          </div>

          {onToggleMinimize && (
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={onToggleMinimize}
              title="Minimizar panel"
              className="size-6 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <PanelLeftClose className="size-3.5" />
            </Button>
          )}
        </div>

        {/* Pane Content with ScrollArea */}
        <ScrollArea className="flex-1 min-h-0" viewportClassName="p-2.5">
          <div className="space-y-4">
            {children ? (
              children
            ) : isLayersActive ? (
              /* ── Árbol de Capas / Componentes en Canvas ── */
              <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <span className="text-[10px] font-semibold tracking-wider uppercase text-muted-foreground">
                    Árbol de Capas ({frames.length})
                  </span>
                  <span className="text-[9px] font-mono text-muted-foreground/80 bg-muted/60 px-1.5 py-0.5 rounded">
                    Canvas
                  </span>
                </div>

                {frames.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-6 text-center border border-dashed border-sidebar-border/80 rounded-lg bg-sidebar-accent/10 space-y-2">
                    <div className="size-8 rounded-full bg-muted/60 flex items-center justify-center text-muted-foreground">
                      <Layers className="size-4" />
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-xs font-medium text-foreground">Sin capas en el canvas</span>
                      <p className="text-[10px] text-muted-foreground leading-normal">
                        Añade un marco usando la herramienta Marco (F) para visualizar su árbol de componentes.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {frames.map((frame) => {
                      const isSelected = frame.id === selectedFrameId;
                      const isCollapsed = collapsedFrames.has(frame.id);
                      const isHidden = hiddenFrames.has(frame.id);

                      return (
                        <div key={frame.id} className="space-y-1">
                          {/* Frame Root Item */}
                          <div
                            onClick={() => onSelectFrameId?.(frame.id)}
                            className={cn(
                              "group w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-left transition-colors border cursor-pointer select-none",
                              isSelected
                                ? "bg-sidebar-accent border-sidebar-border text-sidebar-accent-foreground font-medium shadow-xs"
                                : "border-transparent hover:bg-sidebar-accent/50 text-muted-foreground hover:text-foreground"
                            )}
                          >
                            <div className="flex items-center gap-1.5 min-w-0">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleFrameCollapse(frame.id);
                                }}
                                className="size-4 flex items-center justify-center rounded hover:bg-muted text-muted-foreground shrink-0"
                              >
                                {isCollapsed ? (
                                  <ChevronRight className="size-3" />
                                ) : (
                                  <ChevronDown className="size-3" />
                                )}
                              </button>
                              <Smartphone className="size-3.5 shrink-0 text-primary" />
                              <span className="text-xs truncate font-medium">{frame.name}</span>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              <span className="text-[10px] font-mono text-muted-foreground/70 group-hover:hidden">
                                {frame.width}×{frame.height}
                              </span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleFrameVisibility(frame.id);
                                }}
                                className="hidden group-hover:flex size-5 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                                title={isHidden ? "Mostrar marco" : "Ocultar marco"}
                              >
                                {isHidden ? (
                                  <EyeOff className="size-3 text-muted-foreground/60" />
                                ) : (
                                  <Eye className="size-3" />
                                )}
                              </button>
                              {frame.filePath && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const store = useWorkspaceStore.getState();
                                    store.setActiveTab(frame.filePath!);
                                    store.setWorkspaceMode("editor");
                                  }}
                                  title={`Abrir ${frame.fileName || "archivo"} en el Editor`}
                                  className="hidden group-hover:flex size-5 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                                >
                                  <Code2 className="size-3 text-primary" />
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Widget Layer Subtree */}
                          {!isCollapsed && (
                            <div className="ml-3 pl-2.5 border-l border-sidebar-border/60 space-y-0.5 pt-0.5">
                              {frame.screenLayout === "scrollable" ? (
                                <>
                                  <LayerTreeRow
                                    icon={LayoutDashboard}
                                    name="Scaffold"
                                    tag="Widget"
                                    onClick={() => onSelectFrameId?.(frame.id)}
                                    isSelected={isSelected}
                                  />
                                  <div className="ml-2.5 pl-2 border-l border-sidebar-border/40 space-y-0.5">
                                    <LayerTreeRow
                                      icon={PanelTop}
                                      name="CustomScrollView"
                                      tag="Scroll"
                                      onClick={() => onSelectFrameId?.(frame.id)}
                                    />
                                    <div className="ml-2.5 pl-2 border-l border-sidebar-border/40 space-y-0.5">
                                      <LayerTreeRow
                                        icon={PanelTop}
                                        name="SliverAppBar"
                                        tag="Bar"
                                        onClick={() => onSelectFrameId?.(frame.id)}
                                      />
                                      <LayerTreeRow
                                        icon={Rows}
                                        name="SliverToBoxAdapter"
                                        tag="Adapter"
                                        onClick={() => onSelectFrameId?.(frame.id)}
                                      />
                                      <div className="ml-2.5 pl-2 border-l border-sidebar-border/40 space-y-0.5">
                                        <LayerTreeRow
                                          icon={Rows}
                                          name="Column"
                                          tag="Layout"
                                          onClick={() => onSelectFrameId?.(frame.id)}
                                        />
                                        <LayerTreeRow
                                          icon={CreditCard}
                                          name="Card (List items)"
                                          tag="Widget"
                                          onClick={() => onSelectFrameId?.(frame.id)}
                                        />
                                      </div>
                                    </div>
                                  </div>
                                </>
                              ) : frame.screenLayout === "stack" ? (
                                <>
                                  <LayerTreeRow
                                    icon={LayoutDashboard}
                                    name="Scaffold"
                                    tag="Widget"
                                    onClick={() => onSelectFrameId?.(frame.id)}
                                    isSelected={isSelected}
                                  />
                                  <div className="ml-2.5 pl-2 border-l border-sidebar-border/40 space-y-0.5">
                                    <LayerTreeRow
                                      icon={Layers}
                                      name="Stack"
                                      tag="Layout"
                                      onClick={() => onSelectFrameId?.(frame.id)}
                                    />
                                    <div className="ml-2.5 pl-2 border-l border-sidebar-border/40 space-y-0.5">
                                      <LayerTreeRow
                                        icon={Square}
                                        name="Container (Fondo)"
                                        tag="Decor"
                                        onClick={() => onSelectFrameId?.(frame.id)}
                                      />
                                      <LayerTreeRow
                                        icon={Shield}
                                        name="SafeArea"
                                        tag="Safety"
                                        onClick={() => onSelectFrameId?.(frame.id)}
                                      />
                                      <div className="ml-2.5 pl-2 border-l border-sidebar-border/40 space-y-0.5">
                                        <LayerTreeRow
                                          icon={Rows}
                                          name="Column"
                                          tag="Layout"
                                          onClick={() => onSelectFrameId?.(frame.id)}
                                        />
                                        <LayerTreeRow
                                          icon={Type}
                                          name={`Text ("${frame.name}")`}
                                          tag="Text"
                                          onClick={() => onSelectFrameId?.(frame.id)}
                                        />
                                        <LayerTreeRow
                                          icon={MousePointerClick}
                                          name="FilledButton"
                                          tag="Button"
                                          onClick={() => onSelectFrameId?.(frame.id)}
                                        />
                                      </div>
                                    </div>
                                  </div>
                                </>
                              ) : (
                                <>
                                  <LayerTreeRow
                                    icon={LayoutDashboard}
                                    name="Scaffold"
                                    tag="Widget"
                                    onClick={() => onSelectFrameId?.(frame.id)}
                                    isSelected={isSelected}
                                  />
                                  <div className="ml-2.5 pl-2 border-l border-sidebar-border/40 space-y-0.5">
                                    <LayerTreeRow
                                      icon={PanelTop}
                                      name="AppBar"
                                      tag="Bar"
                                      onClick={() => onSelectFrameId?.(frame.id)}
                                    />
                                    <div className="ml-2.5 pl-2 border-l border-sidebar-border/40 space-y-0.5">
                                      <LayerTreeRow
                                        icon={Type}
                                        name={`Text ("${frame.name}")`}
                                        tag="Text"
                                        onClick={() => onSelectFrameId?.(frame.id)}
                                      />
                                    </div>
                                    <LayerTreeRow
                                      icon={Shield}
                                      name="SafeArea"
                                      tag="Safety"
                                      onClick={() => onSelectFrameId?.(frame.id)}
                                    />
                                    <div className="ml-2.5 pl-2 border-l border-sidebar-border/40 space-y-0.5">
                                      <LayerTreeRow
                                        icon={Rows}
                                        name={
                                          frame.layoutFlow === "horizontal"
                                            ? "Row"
                                            : frame.layoutFlow === "wrap"
                                              ? "Wrap"
                                              : frame.layoutFlow === "none"
                                                ? "Stack"
                                                : "Column"
                                        }
                                        tag="Layout"
                                        onClick={() => onSelectFrameId?.(frame.id)}
                                      />
                                      <div className="ml-2.5 pl-2 border-l border-sidebar-border/40 space-y-0.5">
                                        <LayerTreeRow
                                          icon={Type}
                                          name={`Text ("${frame.name}")`}
                                          tag="Text"
                                          onClick={() => onSelectFrameId?.(frame.id)}
                                        />
                                        <LayerTreeRow
                                          icon={Type}
                                          name="Text (Subtítulo)"
                                          tag="Text"
                                          onClick={() => onSelectFrameId?.(frame.id)}
                                        />
                                      </div>
                                    </div>
                                  </div>
                                </>
                              )}

                              {/* Canvas widget elements placed on the frame */}
                              {frame.elements && frame.elements.length > 0 && (
                                <div className="pt-1.5 space-y-0.5 border-t border-sidebar-border/30 mt-1">
                                  <div className="flex items-center justify-between px-1 text-[9px] font-mono tracking-wider uppercase text-muted-foreground/60">
                                    <span>Elementos ({frame.elements.length})</span>
                                  </div>
                                  {frame.elements.map((el) => {
                                    const isSelectedEl = el.id === selectedElementId;
                                    return (
                                      <div
                                        key={el.id}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          onSelectFrameId?.(frame.id);
                                          onSelectElementId?.(el.id);
                                        }}
                                        className={cn(
                                          "group/el flex items-center justify-between py-1 px-1.5 rounded text-[11px] cursor-pointer transition-colors select-none",
                                          isSelectedEl
                                            ? "bg-primary/15 text-primary font-medium"
                                            : "hover:bg-sidebar-accent/50 text-muted-foreground hover:text-foreground"
                                        )}
                                      >
                                        <div className="flex items-center gap-1.5 min-w-0">
                                          {el.type === "button" ? (
                                            <MousePointerClick className="size-3 text-primary shrink-0" />
                                          ) : el.type === "text" ? (
                                            <Type className="size-3 text-sky-400 shrink-0" />
                                          ) : el.type === "card" ? (
                                            <CreditCard className="size-3 text-amber-400 shrink-0" />
                                          ) : el.type === "input" ? (
                                            <Square className="size-3 text-emerald-400 shrink-0" />
                                          ) : (
                                            <Sparkles className="size-3 text-purple-400 shrink-0" />
                                          )}
                                          <span className="truncate">{el.label || el.name}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                          <span className="text-[9px] font-mono text-muted-foreground/50">
                                            {el.x},{el.y}
                                          </span>
                                          {onDeleteElement && (
                                            <button
                                              type="button"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                onDeleteElement(frame.id, el.id);
                                              }}
                                              title="Eliminar elemento"
                                              className="hidden group-hover/el:flex size-4 items-center justify-center rounded hover:bg-destructive/10 hover:text-destructive text-muted-foreground transition-colors"
                                            >
                                              <Minus className="size-2.5" />
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Editor Access Section */}
                <div className="space-y-1.5 pt-2 border-t border-sidebar-border/60">
                  <span className="text-[10px] font-semibold tracking-wider uppercase text-muted-foreground px-1">
                    Editor de Código
                  </span>
                  <button
                    type="button"
                    onClick={() => setWorkspaceMode("editor")}
                    className="w-full flex items-center justify-between p-2 rounded-lg border border-sidebar-border/60 hover:bg-sidebar-accent/60 transition-colors text-left group"
                  >
                    <div className="flex items-center gap-2">
                      <div className="size-6 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <Code2 className="size-3.5" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-medium text-foreground group-hover:text-primary transition-colors">
                          Abrir Editor
                        </span>
                        <span className="text-[10px] text-muted-foreground truncate">
                          Ver código fuente y lógica
                        </span>
                      </div>
                    </div>
                    <ExternalLink className="size-3.5 text-muted-foreground group-hover:text-foreground shrink-0 transition-colors" />
                  </button>
                </div>
              </div>
            ) : activeRailTab === "components" ? (
              /* ── Biblioteca de Componentes UI (Arrastrar y Soltar) ── */
              <div className="space-y-4">
                <div className="space-y-1">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-[10px] font-semibold tracking-wider uppercase text-muted-foreground">
                      Componentes UI ({DRAGGABLE_COMPONENTS.length})
                    </span>
                    <span className="text-[9px] font-mono text-muted-foreground/80 bg-muted/60 px-1.5 py-0.5 rounded">
                      Arrastrar al Marco
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground px-1 leading-tight">
                    Arrastra cualquier componente dentro de una pantalla para posicionarlo libremente.
                  </p>
                </div>

                {/* Draggable components list */}
                <div className="space-y-1.5">
                  {DRAGGABLE_COMPONENTS.map((comp) => {
                    const CompIcon = comp.icon;
                    return (
                      <div
                        key={comp.type}
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData(
                            "application/vela-component",
                            JSON.stringify({
                              type: comp.type,
                              name: comp.name,
                              label: comp.label,
                              width: comp.width,
                              height: comp.height,
                            })
                          );
                          e.dataTransfer.effectAllowed = "copy";
                        }}
                        className="group flex items-center justify-between p-2 rounded-lg border border-sidebar-border/60 bg-sidebar-accent/20 hover:bg-sidebar-accent/50 hover:border-primary/40 cursor-grab active:cursor-grabbing transition-all select-none"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <GripVertical className="size-3 text-muted-foreground/40 group-hover:text-muted-foreground shrink-0" />
                          <div className="size-7 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
                            <CompIcon className="size-3.5" />
                          </div>
                          <div className="flex flex-col min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-medium text-foreground truncate">
                                {comp.name}
                              </span>
                              <span className="text-[9px] font-mono text-muted-foreground/60 px-1 py-0.2 bg-muted/40 rounded">
                                {comp.badge}
                              </span>
                            </div>
                            <span className="text-[10px] text-muted-foreground truncate">
                              {comp.description}
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            const targetFrameId = selectedFrameId || (frames.length > 0 ? frames[0].id : "");
                            if (targetFrameId) {
                              onAddElementToFrame?.(targetFrameId, {
                                type: comp.type,
                                name: comp.name,
                                label: comp.label,
                                x: 40,
                                y: 80,
                                width: comp.width,
                                height: comp.height,
                              });
                            }
                          }}
                          title="Añadir a la pantalla activa"
                          className="size-6 flex items-center justify-center rounded text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-colors shrink-0"
                        >
                          <Plus className="size-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* Reusable Code Files (lib/components) */}
                <div className="pt-2 border-t border-sidebar-border/60 space-y-2">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-[10px] font-semibold tracking-wider uppercase text-muted-foreground">
                      Archivos Flutter (lib/components)
                    </span>
                  </div>

                  {!isComponentsInitialized && components.length === 0 ? (
                    <div className="p-3 border border-sidebar-border/60 rounded-lg bg-sidebar-accent/10 space-y-2 text-center">
                      <span className="text-xs font-medium text-foreground block">
                        Código Reutilizable
                      </span>
                      <p className="text-[10px] text-muted-foreground leading-normal">
                        Crea archivos .dart en lib/components/ para tus widgets.
                      </p>
                      <Button
                        type="button"
                        size="xs"
                        variant="outline"
                        onClick={handleInitComponents}
                        disabled={isInitializingComponents}
                        className="w-full text-xs h-6 font-medium gap-1"
                      >
                        {isInitializingComponents ? (
                          <RefreshCw className="size-3 animate-spin" />
                        ) : (
                          <Sparkles className="size-3" />
                        )}
                        Crear archivo inicial
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      {components.map((comp) => {
                        const isCopied = copiedCompId === comp.id;
                        return (
                          <div
                            key={comp.id}
                            className="group flex flex-col p-2 rounded-lg border border-sidebar-border/60 bg-sidebar-accent/20 hover:bg-sidebar-accent/40 transition-colors space-y-1"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <Component className="size-3 text-primary shrink-0" />
                                <span className="text-xs font-medium text-foreground truncate">
                                  {comp.name}
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleCopyComponentCode(comp.id, comp.name)}
                                  title="Copiar etiqueta del widget"
                                  className="size-5 flex items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                                >
                                  {isCopied ? (
                                    <Check className="size-3 text-emerald-500" />
                                  ) : (
                                    <Copy className="size-3" />
                                  )}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const store = useWorkspaceStore.getState();
                                    store.setActiveTab(comp.filePath);
                                    store.setWorkspaceMode("editor");
                                  }}
                                  title={`Editar ${comp.fileName} en el editor`}
                                  className="size-5 flex items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                                >
                                  <Code2 className="size-3 text-primary" />
                                </button>
                              </div>
                            </div>
                            <span className="text-[9px] font-mono text-muted-foreground/60 truncate">
                              lib/components/{comp.fileName}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* ── Variables de Color View ── */
              <div className="space-y-3">
                {/* Header / Add button / Refresh button */}
                <div className="flex items-center justify-between px-1">
                  <div className="flex flex-col min-w-0">
                    <span className="text-[10px] font-semibold tracking-wider uppercase text-muted-foreground">
                      Variables Flutter ({colorVariables.length})
                    </span>
                    {themeSource && (
                      <span
                        title={`Origen: ${themeSource}`}
                        className="text-[9px] font-mono text-muted-foreground/70 truncate max-w-[130px]"
                      >
                        {themeSource}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={refreshThemeVariables}
                      disabled={isLoadingTheme}
                      title="Recargar variables desde el código Flutter"
                      className="size-5 text-muted-foreground hover:text-foreground"
                    >
                      <RefreshCw
                        className={cn("size-3", isLoadingTheme && "animate-spin text-primary")}
                      />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => setIsAddingColor((v) => !v)}
                      title="Añadir variable de color a Flutter"
                      className="size-5 text-muted-foreground hover:text-foreground"
                    >
                      <Plus className="size-3.5" />
                    </Button>
                  </div>
                </div>

                {/* Quick Link to open Flutter Theme File in Editor */}
                {themeSource && themeSource.endsWith(".dart") && (
                  <button
                    type="button"
                    onClick={() => {
                      const { projectPath } = useWorkspaceStore.getState();
                      const fullPath = projectPath
                        ? `${projectPath.replace(/\/+$/, "")}/${themeSource}`
                        : themeSource;
                      useWorkspaceStore.getState().setActiveTab(fullPath);
                      useWorkspaceStore.getState().setWorkspaceMode("editor");
                    }}
                    className="w-full flex items-center justify-between px-2 py-1.5 rounded-md border border-sidebar-border/60 bg-sidebar-accent/20 hover:bg-sidebar-accent/50 text-[10px] text-muted-foreground hover:text-foreground transition-colors group"
                  >
                    <div className="flex items-center gap-1.5 truncate min-w-0">
                      <Code2 className="size-3 text-primary shrink-0" />
                      <span className="truncate">Editar {themeSource}</span>
                    </div>
                    <ExternalLink className="size-2.5 opacity-60 group-hover:opacity-100 shrink-0" />
                  </button>
                )}

                {/* Inline Add Color Form */}
                {isAddingColor && (
                  <form
                    onSubmit={handleAddColor}
                    className="p-2 rounded-lg border border-sidebar-border bg-sidebar-accent/30 space-y-2 animate-in fade-in-0 duration-150"
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={newColorValue}
                        onChange={(e) => setNewColorValue(e.target.value)}
                        className="size-6 rounded cursor-pointer border border-border/60 bg-transparent p-0 shrink-0"
                        title="Seleccionar color"
                      />
                      <input
                        type="text"
                        placeholder="nombre-variable"
                        value={newColorName}
                        onChange={(e) => setNewColorName(e.target.value)}
                        className="flex-1 min-w-0 h-6 px-1.5 text-xs bg-background border border-border rounded outline-none focus:border-primary text-foreground"
                        autoFocus
                      />
                    </div>
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="xs"
                        onClick={() => setIsAddingColor(false)}
                        className="h-5 px-1.5 text-[10px]"
                      >
                        Cancelar
                      </Button>
                      <Button
                        type="submit"
                        variant="default"
                        size="xs"
                        className="h-5 px-2 text-[10px]"
                      >
                        Guardar
                      </Button>
                    </div>
                  </form>
                )}

                {/* Color Variables List */}
                <div className="space-y-1">
                  {colorVariables.map((color) => {
                    const isCopied = copiedId === color.id;
                    return (
                      <div
                        key={color.id}
                        className="group flex items-center justify-between p-1.5 rounded-lg border border-transparent hover:border-sidebar-border/60 hover:bg-sidebar-accent/50 transition-colors"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {/* Color swatch */}
                          <div
                            className="size-4 rounded-full border border-black/20 dark:border-white/20 shrink-0 shadow-xs"
                            style={{ backgroundColor: color.value }}
                            title={color.value}
                          />
                          <div className="flex flex-col min-w-0">
                            <span className="text-xs font-mono text-foreground truncate">
                              {color.name}
                            </span>
                            {color.description && (
                              <span className="text-[9px] text-muted-foreground/60 truncate">
                                {color.description}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Value + Copy */}
                        <button
                          type="button"
                          onClick={() => handleCopyColor(color.id, color.value)}
                          title="Copiar valor hexadecimal"
                          className="flex items-center gap-1 font-mono text-[10px] text-muted-foreground hover:text-foreground px-1.5 py-0.5 rounded hover:bg-muted/60 transition-colors shrink-0"
                        >
                          <span>{color.value}</span>
                          {isCopied ? (
                            <Check className="size-2.5 text-emerald-500" />
                          ) : (
                            <Copy className="size-2.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </aside>
  );
}
