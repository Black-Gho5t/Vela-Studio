import * as React from "react";
import { 
  Layout, Box, Type, Smartphone, CheckSquare, 
  Settings2, Component, Layers 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { invoke } from "@tauri-apps/api/core";
import { 
  DndContext, 
  DragOverlay, 
  useDraggable, 
  useDroppable,
  DragEndEvent,
  DragStartEvent,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors
} from "@dnd-kit/core";

// ── Types ───────────────────────────────────────────────────────────────────

export type WidgetType = "Scaffold" | "AppBar" | "Column" | "Row" | "Container" | "Text" | "ElevatedButton";

export interface WidgetNode {
  id: string;
  type: WidgetType;
  props: Record<string, any>;
  children?: WidgetNode[];
}

// Mock initial state representing a basic Flutter app
const initialTree: WidgetNode = {
  id: "root-1",
  type: "Scaffold",
  props: { backgroundColor: "#fafafa" },
  children: [
    {
      id: "appbar-1",
      type: "AppBar",
      props: { title: "Vela App", backgroundColor: "#0284c7" }
    },
    {
      id: "body-1",
      type: "Column",
      props: { mainAxisAlignment: "center", crossAxisAlignment: "center" },
      children: [
        {
          id: "text-1",
          type: "Text",
          props: { data: "Hello Vela Designer!", fontSize: 24, color: "#171717" }
        },
        {
          id: "btn-1",
          type: "ElevatedButton",
          props: { childText: "Click Me", color: "#0ea5e9" }
        }
      ]
    }
  ]
};

const WIDGET_CATALOG = [
  { type: "Container", icon: Box, label: "Container" },
  { type: "Column", icon: Layout, label: "Column" },
  { type: "Row", icon: Layout, label: "Row", rotate: true },
  { type: "Text", icon: Type, label: "Text" },
  { type: "ElevatedButton", icon: CheckSquare, label: "Button" },
] as const;

type CatalogItem = {
  type: WidgetType;
  icon: any;
  label: string;
  rotate?: boolean;
};

const TYPED_WIDGET_CATALOG: CatalogItem[] = [...WIDGET_CATALOG];

// ── Helpers ─────────────────────────────────────────────────────────────────

function generateId() {
  return Math.random().toString(36).substring(2, 9);
}

// Recursively find and add node to parent
function addNodeToTree(tree: WidgetNode, parentId: string, newNode: WidgetNode): WidgetNode {
  if (tree.id === parentId) {
    return {
      ...tree,
      children: [...(tree.children || []), newNode]
    };
  }
  if (tree.children) {
    return {
      ...tree,
      children: tree.children.map(child => addNodeToTree(child, parentId, newNode))
    };
}
  return tree;
}

function getValidColor(colorStr?: any, defaultColor: string = "transparent") {
  if (!colorStr) return defaultColor;
  const str = String(colorStr);
  if (str.includes("Theme.of") || str.includes("Colors.") || str.includes("(")) return defaultColor;
  return str;
}

// ── Draggable & Droppable Wrappers ──────────────────────────────────────────

function PaletteItem({ item }: { item: CatalogItem }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette-${item.type}`,
    data: { type: item.type, isPalette: true }
  });

  return (
    <div 
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={cn(
        "flex flex-col items-center justify-center p-3 gap-2 rounded-lg border border-border/50 bg-background hover:border-sky-500/50 hover:bg-sky-500/5 cursor-grab active:cursor-grabbing transition-colors",
        isDragging && "opacity-50 ring-2 ring-sky-500 ring-offset-1"
      )}
    >
      <item.icon className={cn("size-5 text-muted-foreground", item.rotate && "-rotate-90")} />
      <span className="text-[10px] font-medium text-muted-foreground">{item.label}</span>
    </div>
  );
}

function DroppableWidget({ 
  node, 
  selectedId, 
  onSelect,
  children 
}: { 
  node: WidgetNode; 
  selectedId: string | null; 
  onSelect: (id: string) => void;
  children: React.ReactNode;
}) {
  // Only layout widgets should be droppable targets
  const isDroppableTarget = ["Scaffold", "Column", "Row", "Container"].includes(node.type);
  
  const { setNodeRef, isOver } = useDroppable({
    id: node.id,
    disabled: !isDroppableTarget
  });

  const isSelected = node.id === selectedId;
  const selectionClass = isSelected ? "ring-2 ring-sky-500 ring-offset-1" : "";
  const overClass = isOver ? "ring-2 ring-emerald-500 ring-inset bg-emerald-500/10" : "";

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(node.id);
  };


  return (
    <div 
      ref={setNodeRef} 
      onClick={handleClick}
      className={cn("transition-all duration-150 relative", selectionClass, overClass, !isDroppableTarget && "inline-block")}
      style={{
        display: isDroppableTarget ? "flex" : "block",
        flexDirection: node.type === "Column" ? "column" : node.type === "Row" ? "row" : "column",
        flex: node.type === "Scaffold" ? 1 : undefined,
        width: node.type === "Scaffold" || node.type === "AppBar" ? "100%" : undefined,
        height: node.type === "Scaffold" ? "100%" : undefined,
        backgroundColor: getValidColor(node.props.backgroundColor, node.type === "Container" ? "#e5e5e5" : "transparent"),
        padding: node.props.padding || (node.type === "Column" || node.type === "Row" || node.type === "Container" ? "16px" : "0px"),
        gap: node.type === "Column" || node.type === "Row" ? "16px" : "0px",
        justifyContent: node.props.mainAxisAlignment === "center" ? "center" : "flex-start",
        alignItems: node.props.crossAxisAlignment === "center" ? "center" : "stretch"
      }}
    >
      {/* Visual rendering logic based on type */}
      {node.type === "AppBar" && (
        <div className="w-full h-14 flex items-center px-4 shadow-sm z-10 text-white font-medium" style={{ backgroundColor: getValidColor(node.props.backgroundColor, "#2196F3") }}>
          {node.props.title}
        </div>
      )}
      
      {node.type === "Text" && (
        <span style={{ fontSize: `${node.props.fontSize || 14}px`, color: node.props.color || "#000" }}>
          {node.props.data}
        </span>
      )}
      
      {node.type === "ElevatedButton" && (
        <button className="px-4 py-2 rounded shadow-sm text-white font-medium transition-transform active:scale-95" style={{ backgroundColor: getValidColor(node.props.color, "#2196F3") }}>
          {node.props.text || node.props.childText || node.children?.map(c => c.props.data).join("") || "Button"}
        </button>
      )}

      {/* Children rendering for layouts */}
      {node.type !== "ElevatedButton" && children}
    </div>
  );
}

// ── Main Component ──────────────────────────────────────────────────────────

export function VelaDesigner({ code, filePath }: { code?: string; filePath?: string }) {
  const [tree, setTree] = React.useState<WidgetNode>(initialTree);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [activeDragType, setActiveDragType] = React.useState<WidgetType | null>(null);

  const containerRef = React.useRef<HTMLDivElement>(null);
  const [scale, setScale] = React.useState(1);
  const propertyUpdateTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  React.useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        // Padding is 32px (p-8 = 2rem = 32px) on all sides, so available is width - 64, height - 64
        const availableW = width - 64;
        const availableH = height - 64;
        const scaleW = availableW / 375;
        const scaleH = availableH / 812;
        // Scale to fit available space responsively
        setScale(Math.min(scaleW, scaleH));
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Sync AST from Rust Tree-sitter
  React.useEffect(() => {
    if (!code) return;
    
    let isCancelled = false;
    
    const syncAst = async () => {
      try {
        const jsonStr = await invoke<string>("parse_dart_file", { sourceCode: code });
        if (isCancelled) return;
        
        const parsedTree = JSON.parse(jsonStr) as WidgetNode;
        if (parsedTree) {
          setTree(parsedTree);
        }
      } catch (err) {
        if (!isCancelled) {
          console.error("Failed to parse dart code:", err);
        }
      }
    };

    const timeout = setTimeout(syncAst, 300);
    return () => {
      isCancelled = true;
      clearTimeout(timeout);
    };
  }, [code]);

  // Setup sensors for better DND handling inside scrollable/clickable areas
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } })
  );

  const handleDragStart = (event: DragStartEvent) => {
    if (event.active.data.current?.isPalette) {
      setActiveDragType(event.active.data.current.type as WidgetType);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveDragType(null);
    const { over, active } = event;
    
    if (over && active.data.current?.isPalette) {
      const widgetType = active.data.current.type as WidgetType;
      
      // Default props based on widget type
      const newProps: Record<string, any> = {};
      if (widgetType === "Text") newProps.data = "New Text";
      if (widgetType === "ElevatedButton") newProps.childText = "Button";
      
      const newNode: WidgetNode = {
        id: `${widgetType.toLowerCase()}-${generateId()}`,
        type: widgetType,
        props: newProps,
        children: ["Column", "Row", "Container"].includes(widgetType) ? [] : undefined
      };

      // Optimistic UI update
      setTree(prev => addNodeToTree(prev, over.id as string, newNode));
      setSelectedId(newNode.id);

      // Fase 3.5: Bidirectional Injection!
      if (filePath) {
        invoke("inject_widget", {
          filePath,
          parentId: over.id as string,
          newWidgetType: widgetType,
          currentSource: code
        }).then(() => {
          // Sync back to editor
          import("@/features/workspace/api/workspace.api").then(({ workspaceApi }) => {
             workspaceApi.readFile(filePath).then((content) => {
               import("@/features/workspace/model/workspace.store").then(({ useWorkspaceStore }) => {
                 const state = useWorkspaceStore.getState();
                 if (state.activeTabId) {
                   state.updateTabContent(state.activeTabId, content);
                   state.markTabUnmodified(state.activeTabId);
                 }
               });
             });
          });

          // Fire hot reload automatically since we just edited the code natively
          invoke("write_terminal", { data: "r" }).catch(console.error);
        }).catch(err => {
          console.error("Native injection failed:", err);
        });
      }
    }
  };

  const renderWidget = (node: WidgetNode) => {
    return (
      <DroppableWidget 
        key={node.id} 
        node={node} 
        selectedId={selectedId} 
        onSelect={setSelectedId}
      >
        {node.children?.map(renderWidget)}
      </DroppableWidget>
    );
  };

  const activeIcon = activeDragType ? TYPED_WIDGET_CATALOG.find(i => i.type === activeDragType)?.icon : null;
  const ActiveIconComp = activeIcon || Box;

  // Helper to find a node by ID
  const findNode = (root: WidgetNode, id: string): WidgetNode | null => {
    if (root.id === id) return root;
    if (root.children) {
      for (const child of root.children) {
        const found = findNode(child, id);
        if (found) return found;
      }
    }
    return null;
  };

  const selectedNode = selectedId ? findNode(tree, selectedId) : null;

  return (
    <DndContext 
      sensors={sensors}
      onDragStart={handleDragStart} 
      onDragEnd={handleDragEnd}
    >
      <div className="flex h-full w-full bg-background border-l border-border/50 text-foreground overflow-hidden min-h-0 min-w-0">
        
        {/* LEFT: Component Palette */}
        <div className="w-56 shrink-0 flex flex-col border-r border-border/50 bg-muted/20 min-h-0 h-full">
          <div className="flex h-9 items-center px-3 border-b border-border/50 bg-muted/40">
            <Component className="size-4 mr-2 text-muted-foreground" />
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Widgets</span>
          </div>
          <div className="p-3 grid grid-cols-2 gap-2">
            {TYPED_WIDGET_CATALOG.map((item) => (
              <PaletteItem key={item.type} item={item} />
            ))}
          </div>
        </div>

        {/* CENTER: Canvas (Live Device Mockup) */}
        <div ref={containerRef} className="flex-1 flex items-center justify-center bg-black/5 dark:bg-black/40 overflow-hidden relative min-h-0 min-w-0">
          <div className="absolute top-4 right-4 flex items-center gap-2 bg-background/80 backdrop-blur border border-border rounded-full px-3 py-1.5 shadow-sm z-50">
            <Smartphone className="size-4 text-sky-500" />
            <span className="text-xs font-medium">Live Canvas (DND Enabled)</span>
          </div>

          <div 
            style={{ transform: `scale(${scale})`, transformOrigin: "center center" }}
            className="w-[375px] h-[812px] shrink-0 bg-white rounded-[3rem] shadow-2xl overflow-hidden border-[12px] border-zinc-900 relative ring-1 ring-border"
          >
            {/* Notch */}
            <div className="absolute top-0 inset-x-0 h-6 bg-zinc-900 rounded-b-2xl mx-auto w-40 z-50 flex items-center justify-center">
              <div className="w-12 h-1.5 bg-black rounded-full" />
            </div>
            
            <div className="w-full h-full pt-6 bg-white overflow-y-auto overflow-x-hidden flex flex-col">
              {renderWidget(tree)}
            </div>
          </div>
        </div>

        {/* RIGHT: Properties Inspector */}
        <div className="w-64 shrink-0 flex flex-col border-l border-border/50 bg-muted/20 min-h-0 h-full">
          <div className="flex h-9 items-center px-3 border-b border-border/50 bg-muted/40">
            <Settings2 className="size-4 mr-2 text-muted-foreground" />
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Properties</span>
          </div>
          
          <div className="p-4 flex flex-col gap-6 overflow-y-auto">
            {!selectedId ? (
              <div className="flex flex-col items-center justify-center h-40 text-center opacity-50">
                <Layers className="size-8 mb-2" />
                <p className="text-xs">Drag widgets to the canvas. Select a widget to inspect properties.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">Widget Settings</span>
                  <span className="text-[10px] font-mono bg-muted px-1.5 py-0.5 rounded text-muted-foreground max-w-[100px] truncate">{selectedId}</span>
                </div>
                
                <div className="space-y-3">
                  {(() => {
                    const type = selectedNode?.type || "";
                    const currentProps = selectedNode?.props || {};
                    const schemas: Record<string, string[]> = {
                      "Text": ["data", "color", "fontSize"],
                      "ElevatedButton": ["childText", "color", "onPressed", "estilo", "tipografia", "tamanio_de_texto"],
                      "Scaffold": ["backgroundColor"],
                      "AppBar": ["title", "backgroundColor"],
                      "Column": ["mainAxisAlignment", "crossAxisAlignment"],
                      "Row": ["mainAxisAlignment", "crossAxisAlignment"],
                      "Container": ["backgroundColor", "padding"],
                    };
                    const schema = schemas[type] || [];
                    const allKeys = Array.from(new Set([...schema, ...Object.keys(currentProps)]));
                    
                    if (allKeys.length === 0) {
                      return <p className="text-xs text-muted-foreground italic">No basic properties extracted for this widget yet.</p>;
                    }

                    return allKeys.map((key) => {
                      const value = currentProps[key] !== undefined ? currentProps[key] : "";
                      return (
                        <div key={key} className="space-y-1.5">
                          <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">{key}</label>
                          <div className="flex items-center gap-2">
                            {key.toLowerCase().includes("color") && (
                              <input 
                                type="color"
                                value={getValidColor(String(value), "#000000")}
                                onChange={(e) => {
                                  // Keep the color picker in sync, but wait to update tree until text changes?
                                  // Or just update directly:
                                  const eTarget = e.target as HTMLInputElement;
                                  const hex = eTarget.value;
                                  // The color picker returns #RRGGBB. Convert to Dart Color(0xFFRRGGBB)
                                  const dartColor = `Color(0xFF${hex.replace('#', '')})`;
                                  
                                  const newTree = JSON.parse(JSON.stringify(tree));
                                  const nodeToUpdate = findNode(newTree, selectedId);
                                  if (nodeToUpdate) {
                                    nodeToUpdate.props[key] = dartColor;
                                    setTree(newTree);
                                  }
                                  
                                  if (filePath) {
                                    if (propertyUpdateTimeoutRef.current) clearTimeout(propertyUpdateTimeoutRef.current);
                                    propertyUpdateTimeoutRef.current = setTimeout(() => {
                                      invoke("update_widget_property", {
                                        filePath, nodeId: selectedId, propertyKey: key, propertyValue: dartColor, currentSource: code
                                      }).then(() => {
                                        invoke("write_terminal", { data: "r" }).catch(console.error);
                                      });
                                    }, 500);
                                  }
                                }}
                                className="size-6 rounded border border-border/50 cursor-pointer p-0 overflow-hidden shrink-0"
                              />
                            )}
                            <input 
                              type="text" 
                              value={String(value)}
                              onChange={(e) => {
                                if (!selectedId) return;
                                
                                // 1. Optimistic UI update
                                const newTree = JSON.parse(JSON.stringify(tree)); // Deep clone
                                const nodeToUpdate = findNode(newTree, selectedId);
                                if (nodeToUpdate) {
                                  nodeToUpdate.props[key] = e.target.value;
                                  setTree(newTree);
                                }
                                
                                // 2. Call Rust engine to edit code natively (Debounced)
                                if (filePath) {
                                  if (propertyUpdateTimeoutRef.current) clearTimeout(propertyUpdateTimeoutRef.current);
                                  propertyUpdateTimeoutRef.current = setTimeout(() => {
                                    invoke("update_widget_property", {
                                      filePath,
                                      nodeId: selectedId,
                                      propertyKey: key,
                                      propertyValue: e.target.value,
                                      currentSource: code
                                    }).then(() => {
                                      // Sync back to editor
                                      import("@/features/workspace/api/workspace.api").then(({ workspaceApi }) => {
                                         workspaceApi.readFile(filePath).then((content) => {
                                           import("@/features/workspace/model/workspace.store").then(({ useWorkspaceStore }) => {
                                             const state = useWorkspaceStore.getState();
                                             if (state.activeTabId) {
                                               state.updateTabContent(state.activeTabId, content);
                                               state.markTabUnmodified(state.activeTabId);
                                             }
                                           });
                                         });
                                      });
  
                                      // Fire hot reload automatically
                                      invoke("write_terminal", { data: "r" }).catch(console.error);
                                    }).catch(err => console.error("Failed to update property:", err));
                                  }, 500);
                                }
                              }}
                              className="flex h-8 w-full rounded border border-border/50 bg-background items-center px-2 shadow-sm text-xs font-mono focus:ring-1 focus:ring-sky-500 focus:outline-none" 
                            />
                          </div>
                        </div>
                      );
                    });
                  })()}

                  <p className="text-[10px] text-muted-foreground/60 italic mt-4">
                    Note: Complete AST bidirectional sync (Fase 3) will auto-generate code from this tree.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Drag overlay for visual feedback while dragging */}
      <DragOverlay>
        {activeDragType ? (
          <div className="flex items-center gap-2 p-2 rounded-lg border border-sky-500/50 bg-background/80 backdrop-blur shadow-xl ring-2 ring-sky-500">
            <ActiveIconComp className="size-5 text-sky-500" />
            <span className="text-xs font-medium">{activeDragType}</span>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
