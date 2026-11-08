import * as React from "react";
import { invoke } from "@tauri-apps/api/core";
import { ResizableSidebar } from "@/components/ui/ide-resizable";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { SidebarProvider } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

import { WorkspaceOverview } from "./workspace-overview";
import { WorkspacePrimaryRail } from "./workspace-primary-rail";
import { WorkspaceSidebar } from "./workspace-sidebar";
import { WorkspaceTitlebar } from "./workspace-titlebar";
import { WorkspaceSecondaryRail, type SecondaryRailView } from "./workspace-secondary-rail";
import { WorkspaceTerminal } from "./workspace-terminal";
import { WorkspaceStatusbar } from "./workspace-statusbar";
import { WorkspaceNotifications } from "./workspace-notifications";
import { WorkspaceFlutterWizard } from "./workspace-flutter-wizard";
import {
  Layers,
  PanelLeft,
  PanelsTopLeft,
  Frame,
  SlidersHorizontal,
  Smartphone,
  X,
  Trash2,
  Plus,
  Terminal as TerminalIcon,
  CheckCircle2,
  Bug,
  FileText,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { DesignerSidebar } from "./designer-sidebar";
import { DesignerCanvas, type CanvasDeviceFrame, type CanvasWidgetElement } from "./designer-canvas";
import { type DesignerTool } from "./designer-dock";
import { DesignerFramePresets, type FramePresetItem } from "./designer-frame-presets";
import { DesignerFrameProperties } from "./designer-frame-properties";
import { createFlutterFileForFrame, debouncedSyncFrameToFile, syncFrameToFile } from "../model/designer-frame-file";
import { parseDartCodeToFrameElements } from "../model/code-to-canvas-sync";
import { VelaSetupScreen } from "./vela-setup";
import { useWorkspaceStore } from "../model/workspace.store";

// Helper to verify if a Dart file represents a UI screen/widget (excludes themes, colors, models, services)
function isFlutterScreenFile(fileName?: string, filePath?: string, content?: string): boolean {
  if (!fileName || !fileName.endsWith(".dart")) return false;

  const lower = (filePath || fileName).toLowerCase();
  if (
    lower.includes("/theme/") ||
    lower.includes("/styles/") ||
    lower.includes("/colors/") ||
    lower.includes("/models/") ||
    lower.includes("/providers/") ||
    lower.includes("/bloc/") ||
    lower.includes("/services/") ||
    lower.includes("/utils/") ||
    lower.includes("/generated/") ||
    lower.includes(".g.dart") ||
    lower.includes(".freezed.dart") ||
    lower.endsWith("_colors.dart") ||
    lower.endsWith("_theme.dart") ||
    lower.endsWith("_styles.dart") ||
    lower.endsWith("_constants.dart") ||
    lower.endsWith("_model.dart") ||
    lower.endsWith("_service.dart")
  ) {
    return false;
  }

  if (!content) return true;

  return (
    content.includes("StatelessWidget") ||
    content.includes("StatefulWidget") ||
    content.includes("HookWidget") ||
    content.includes("ConsumerWidget") ||
    content.includes("Widget build(")
  );
}

export function WorkspaceShell() {
  const [engineReady, setEngineReady] = React.useState(false);
  const projectName = useWorkspaceStore((state) => state.projectName);
  const projectPath = useWorkspaceStore((state) => state.projectPath);
  const isFlutterWizardOpen = useWorkspaceStore((state) => state.isFlutterWizardOpen) ?? false;
  const setFlutterWizardOpen = useWorkspaceStore((state) => state.setFlutterWizardOpen);

  const [gitBranch, setGitBranch] = React.useState<string | undefined>(undefined);
  const [activeBottomTab, setActiveBottomTab] = React.useState<"PROBLEMS" | "OUTPUT" | "DEBUG CONSOLE" | "TERMINAL">("TERMINAL");
  const [activeSecondaryView, setActiveSecondaryView] = React.useState<SecondaryRailView>("notifications");

  const handleSecondaryViewChange = (view: SecondaryRailView) => {
    if (activeSecondaryView === view && rightPanel) {
      setRightPanel(false);
    } else {
      setActiveSecondaryView(view);
      setRightPanel(true);
    }
  };

  React.useEffect(() => {
    if (!projectPath) {
      setGitBranch(undefined);
      return;
    }

    const checkBranch = () => {
      invoke<string>("get_git_branch", { path: projectPath })
        .then((branch) => setGitBranch(branch))
        .catch(() => setGitBranch(undefined));
    };

    checkBranch();
    const interval = setInterval(checkBranch, 5000);
    return () => clearInterval(interval);
  }, [projectPath]);

  // Scan project for screens on open or project change
  React.useEffect(() => {
    if (projectPath) {
      useWorkspaceStore.getState().scanScreens();
    }
  }, [projectPath]);

  React.useEffect(() => {
    const fetchDevices = async () => {
      try {
        const res = await invoke<string>("get_flutter_devices");
        const parsed = JSON.parse(res);
        useWorkspaceStore.getState().setDevices(parsed);
        if (parsed.length > 0 && !useWorkspaceStore.getState().selectedDeviceId) {
          useWorkspaceStore.getState().setSelectedDeviceId(parsed[0].id);
        }
      } catch (e) {
        console.error("Failed to fetch devices:", e);
      }
    };
    fetchDevices();
    const interval = setInterval(fetchDevices, 10000);
    return () => clearInterval(interval);
  }, []);

  const computedProjectName = React.useMemo(() => {
    if (projectName) return projectName;
    if (projectPath) return projectPath.split(/[/\\]/).pop() || null;
    return null;
  }, [projectName, projectPath]);

  const [activeView, setActiveView] = React.useState<"explorer" | "search" | "git">("explorer");
  const [leftPanel, setLeftPanel] = React.useState(true);
  const [bottomPanel, setBottomPanel] = React.useState(false);
  const [rightPanel, setRightPanel] = React.useState(false);
  const [designerSidebarOpen, setDesignerSidebarOpen] = React.useState(true);
  const [designerRightSidebarOpen, setDesignerRightSidebarOpen] = React.useState(true);
  const [designerSidebarsMinimized, setDesignerSidebarsMinimized] = React.useState(false);
  const [designerLeftWidth, setDesignerLeftWidth] = React.useState(() => {
    const saved = localStorage.getItem("vela-resize-designer-left");
    return saved ? parseInt(saved, 10) : 260;
  });
  const [designerRightWidth, setDesignerRightWidth] = React.useState(() => {
    const saved = localStorage.getItem("vela-resize-designer-right");
    return saved ? parseInt(saved, 10) : 280;
  });
  const [designerActiveTool, setDesignerActiveTool] = React.useState<DesignerTool>("select");
  const [designerFrames, setDesignerFrames] = React.useState<CanvasDeviceFrame[]>([]);
  const [selectedFrameId, setSelectedFrameId] = React.useState<string>("");
  const [selectedElementId, setSelectedElementId] = React.useState<string>("");
  const selectedFrame = designerFrames.find((f) => f.id === selectedFrameId);

  // Clean up designer state when project/folder is closed
  React.useEffect(() => {
    if (!projectPath) {
      setDesignerFrames([]);
      setSelectedFrameId("");
      setSelectedElementId("");
    }
  }, [projectPath]);

  const handleUpdateFrame = (updatedFrame: CanvasDeviceFrame) => {
    setDesignerFrames((prev) =>
      prev.map((f) => (f.id === updatedFrame.id ? updatedFrame : f))
    );
    debouncedSyncFrameToFile(updatedFrame);
  };

  const handleFramesChange = (nextFrames: CanvasDeviceFrame[]) => {
    setDesignerFrames((prev) => {
      for (const nf of nextFrames) {
        const pf = prev.find((f) => f.id === nf.id);
        if (
          !pf ||
          pf.elements !== nf.elements ||
          pf.layoutFlow !== nf.layoutFlow ||
          pf.screenLayout !== nf.screenLayout ||
          pf.spacing !== nf.spacing ||
          pf.fill !== nf.fill
        ) {
          debouncedSyncFrameToFile(nf);
        }
      }
      return nextFrames;
    });
  };

  const handleSelectFrameId = (id: string) => {
    setSelectedFrameId(id);
    if (id) {
      setDesignerRightSidebarOpen(true);
      setDesignerSidebarsMinimized(false);
    }
  };

  const handleSelectElementId = (id: string) => {
    setSelectedElementId(id);
    if (id) {
      setDesignerRightSidebarOpen(true);
      setDesignerSidebarsMinimized(false);
    }
  };

  const handleAddElementToFrame = (
    frameId: string,
    element: Omit<CanvasWidgetElement, "id">
  ) => {
    const targetFrameId = frameId || (designerFrames.length > 0 ? designerFrames[0].id : "");
    if (!targetFrameId) return;

    const newElement: CanvasWidgetElement = {
      ...element,
      id: `elem-${element.type}-${Date.now()}`,
    };

    setDesignerFrames((prev) =>
      prev.map((f) => {
        if (f.id === targetFrameId) {
          const updated = { ...f, elements: [...(f.elements || []), newElement] };
          debouncedSyncFrameToFile(updated, 50);
          return updated;
        }
        return f;
      })
    );
    setSelectedFrameId(targetFrameId);
    setSelectedElementId(newElement.id);
  };

  const handleDeleteElementFromFrame = (frameId: string, elementId: string) => {
    setDesignerFrames((prev) =>
      prev.map((f) => {
        if (f.id === frameId) {
          const updated = {
            ...f,
            elements: (f.elements || []).filter((el) => el.id !== elementId),
          };
          debouncedSyncFrameToFile(updated, 50);
          return updated;
        }
        return f;
      })
    );
    if (selectedElementId === elementId) {
      setSelectedElementId("");
    }
  };

  const handleUpdateElement = (frameId: string, updatedElement: CanvasWidgetElement) => {
    setDesignerFrames((prev) =>
      prev.map((f) => {
        if (f.id === frameId) {
          const updated = {
            ...f,
            elements: (f.elements || []).map((el) =>
              el.id === updatedElement.id ? updatedElement : el
            ),
          };
          debouncedSyncFrameToFile(updated, 50);
          return updated;
        }
        return f;
      })
    );
  };

  const handleSelectTool = (tool: DesignerTool) => {
    setDesignerActiveTool(tool);
    if (tool === "frame") {
      setDesignerRightSidebarOpen(true);
      setDesignerSidebarsMinimized(false);
    }
  };

  const handleAddFramePreset = async (preset: FramePresetItem) => {
    const maxX =
      designerFrames.length > 0
        ? Math.max(...designerFrames.map((f) => f.x + f.width))
        : -preset.width / 2;
    const newX = designerFrames.length > 0 ? maxX + 80 : -preset.width / 2;
    const newY = -preset.height / 2;

    const existingNames = designerFrames.map((f) => f.fileName).filter(Boolean) as string[];
    const fileInfo = await createFlutterFileForFrame(preset.name, existingNames);

    const newFrame: CanvasDeviceFrame = {
      id: `frame-${preset.id}-${Date.now()}`,
      type: preset.type,
      name: preset.name,
      x: Math.round(newX),
      y: Math.round(newY),
      width: preset.width,
      height: preset.height,
      fileName: fileInfo.fileName,
      filePath: fileInfo.filePath,
      elements: [],
    };

    setDesignerFrames((prev) => [...prev, newFrame]);
    setSelectedFrameId(newFrame.id);
    setDesignerActiveTool("select");
  };

  const workspaceMode = useWorkspaceStore((state) => state.workspaceMode);
  const setWorkspaceMode = useWorkspaceStore((state) => state.setWorkspaceMode);
  const tabs = useWorkspaceStore((state) => state.tabs);
  const activeTabId = useWorkspaceStore((state) => state.activeTabId);
  const detectedScreens = useWorkspaceStore((state) => state.detectedScreens) || [];

  // Synchronize active Dart file and detected screens to Designer frames when entering designer mode
  React.useEffect(() => {
    if (workspaceMode !== "designer") return;

    // Purge any mistakenly created non-UI frames (e.g. from app_colors.dart or theme files)
    setDesignerFrames((prev) =>
      prev.filter((f) => !f.fileName || isFlutterScreenFile(f.fileName, f.filePath))
    );

    // If we have detected screens in the project, map all of them to device frames on the canvas!
    if (detectedScreens.length > 0) {
      const FRAME_W = 393;
      const FRAME_H = 852;
      const FRAME_GAP = 80;

      setDesignerFrames((prev) => {
        const total = detectedScreens.length;
        const startX = -((total * FRAME_W + (total - 1) * FRAME_GAP) / 2);

        return detectedScreens.map((screen, idx) => {
          const existing = prev.find(
            (f) => f.filePath === screen.filePath || f.fileName === screen.fileName || f.id === screen.id
          );

          if (existing) {
            return {
              ...existing,
              name: screen.name,
              fileName: screen.fileName,
              filePath: screen.filePath,
              elements: screen.elements.length > 0 ? screen.elements : existing.elements,
              layoutFlow: screen.layoutFlow,
              screenLayout: screen.screenLayout,
            };
          }

          return {
            id: screen.id,
            type: "iphone",
            name: screen.name,
            x: startX + idx * (FRAME_W + FRAME_GAP),
            y: -FRAME_H / 2,
            width: FRAME_W,
            height: FRAME_H,
            fileName: screen.fileName,
            filePath: screen.filePath,
            elements: screen.elements,
            layoutFlow: screen.layoutFlow,
            screenLayout: screen.screenLayout,
          };
        });
      });

      // If active tab corresponds to one of the screens, focus/select that frame
      const activeTab = tabs.find((t) => t.id === activeTabId);
      if (activeTab) {
        const match = detectedScreens.find((s) => s.filePath === activeTab.path || s.fileName === activeTab.name);
        if (match) {
          setSelectedFrameId(match.id);
        }
      }
      return;
    }

    const activeTab = tabs.find((t) => t.id === activeTabId);
    if (!activeTab || !activeTab.content || !isFlutterScreenFile(activeTab.name, activeTab.path, activeTab.content)) return;

    const fileName = activeTab.name;
    const existingFrame = designerFrames.find(
      (f) => f.fileName === fileName || f.filePath === activeTab.path
    );

    if (existingFrame) {
      parseDartCodeToFrameElements(activeTab.content).then(({ elements, layoutFlow, screenLayout }) => {
        if (elements.length > 0) {
          setDesignerFrames((prev) =>
            prev.map((f) =>
              f.id === existingFrame.id
                ? { ...f, elements, layoutFlow, screenLayout }
                : f
            )
          );
        }
      });
    } else if (designerFrames.length === 0) {
      parseDartCodeToFrameElements(activeTab.content).then(({ elements, layoutFlow, screenLayout }) => {
        // Only create a frame if elements were parsed or it defines a Scaffold/Widget structure
        const isUiScreen =
          elements.length > 0 ||
          (activeTab.content && (activeTab.content.includes("Scaffold") || activeTab.content.includes("AppBar")));

        if (!isUiScreen) return;

        const newFrame: CanvasDeviceFrame = {
          id: `frame-${Date.now()}`,
          type: "iphone",
          name: fileName.replace(/\.dart$/, "").replace(/_/g, " "),
          x: -196,
          y: -422,
          width: 393,
          height: 852,
          fileName,
          filePath: activeTab.path,
          elements,
          layoutFlow,
          screenLayout,
        };
        setDesignerFrames([newFrame]);
        setSelectedFrameId(newFrame.id);
      });
    }
  }, [workspaceMode, activeTabId, detectedScreens]);

  // Synchronize Designer frames back to Editor when entering editor mode
  React.useEffect(() => {
    if (workspaceMode !== "editor") return;

    // Refresh file tree in sidebar immediately so newly created frame files show up
    useWorkspaceStore.getState().refreshFileTree();

    const currentFrame =
      designerFrames.find((f) => f.id === selectedFrameId) ||
      designerFrames[designerFrames.length - 1];

    if (currentFrame) {
      // Flush any pending frame modifications to disk and memory
      syncFrameToFile(currentFrame).catch(console.error);

      const targetPath = currentFrame.filePath;
      const targetName = currentFrame.fileName;
      const store = useWorkspaceStore.getState();

      const existingTab = store.tabs.find(
        (t) =>
          (targetPath && (t.path === targetPath || t.id === targetPath)) ||
          (targetName && t.name === targetName)
      );

      if (existingTab) {
        store.setActiveTab(existingTab.id);
      } else if (targetPath) {
        store.addTab({
          id: targetPath,
          name: targetName || targetPath.split(/[/\\]/).pop() || "screen.dart",
          path: targetPath,
          isActive: true,
          isModified: false,
        });
      }
    }
  }, [workspaceMode, selectedFrameId, designerFrames]);

  const handleViewChange = (view: "explorer" | "search" | "git") => {
    if (activeView === view && leftPanel) {
      setLeftPanel(false);
    } else {
      setActiveView(view);
      setLeftPanel(true);
    }
  };

  const currentLeftPanel =
    workspaceMode === "designer" ? !designerSidebarsMinimized && designerSidebarOpen : leftPanel;
  const handleToggleLeft = () => {
    if (workspaceMode === "designer") {
      if (designerSidebarsMinimized) {
        setDesignerSidebarsMinimized(false);
        setDesignerSidebarOpen(true);
      } else {
        setDesignerSidebarOpen((v) => !v);
      }
    } else {
      setLeftPanel((v) => !v);
    }
  };

  const currentRightPanel =
    workspaceMode === "designer" ? !designerSidebarsMinimized && designerRightSidebarOpen : rightPanel;
  const handleToggleRight = () => {
    if (workspaceMode === "designer") {
      if (designerSidebarsMinimized) {
        setDesignerSidebarsMinimized(false);
        setDesignerRightSidebarOpen(true);
      } else {
        setDesignerRightSidebarOpen((v) => !v);
      }
    } else {
      setRightPanel((v) => !v);
    }
  };

  if (!engineReady) {
    return <VelaSetupScreen onComplete={() => setEngineReady(true)} />;
  }

  return (
    <SidebarProvider open={designerSidebarOpen} onOpenChange={setDesignerSidebarOpen}>
      <div className="flex h-svh w-full flex-col overflow-hidden bg-background">
        {/* Full-width Titlebar across entire window */}
        <WorkspaceTitlebar
          projectName={computedProjectName}
          gitBranch={gitBranch}
          onBranchChange={setGitBranch}
          leftPanel={currentLeftPanel}
          bottomPanel={bottomPanel}
          rightPanel={currentRightPanel}
          onToggleLeft={handleToggleLeft}
          onToggleBottom={() => setBottomPanel((v) => !v)}
          onToggleRight={handleToggleRight}
          mode={workspaceMode}
          onModeChange={setWorkspaceMode}
        />

        {/* Editor Workspace: renders full shell layout (activity bar, file tree, monaco editor, panels) */}
        <div
          className={cn(
            "flex flex-1 min-h-0 w-full overflow-hidden",
            workspaceMode !== "editor" && "hidden"
          )}
        >
          {/* Activity bar — always visible */}
          <WorkspacePrimaryRail 
            activeView={activeView}
            onViewChange={handleViewChange}
          />

          {/* File tree */}
          {leftPanel && (
            <ResizableSidebar id="sidebar" side="left" defaultWidth={260}>
              <WorkspaceSidebar open={leftPanel} activeView={activeView} />
            </ResizableSidebar>
          )}

          {/* Main area: editor + panels */}
          <div className="flex flex-col flex-1 min-w-0 min-h-0 bg-background overflow-hidden">

          <ResizablePanelGroup orientation="vertical" className="flex-1 min-h-0">
            <ResizablePanel id="editor" defaultSize="72" minSize="20" className="flex h-full min-h-0 min-w-0 overflow-hidden">
              <div className="flex flex-1 min-h-0 min-w-0 overflow-hidden">
                <div className="flex flex-1 min-w-0 min-h-0 h-full overflow-hidden">
                  <WorkspaceOverview onSwitchView={handleViewChange} />
                </div>
                
                {rightPanel && (
                  <ResizableSidebar id="right-panel" side="right" defaultWidth={300}>
                    <div className="flex flex-col h-full bg-background overflow-hidden">
                      {activeSecondaryView === "notifications" ? (
                        <WorkspaceNotifications onClose={() => setRightPanel(false)} />
                      ) : activeSecondaryView === "device-manager" ? (
                        <div className="flex flex-col h-full select-none">
                          <div className="flex h-9 items-center justify-between px-3 shrink-0">
                            <span className="text-[11px] font-semibold text-foreground">
                              Device Manager
                            </span>
                            <button
                              type="button"
                              onClick={() => setRightPanel(false)}
                              className="size-6 flex items-center justify-center rounded hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
                              aria-label="Cerrar panel"
                            >
                              <X className="size-3.5" />
                            </button>
                          </div>
                          <div className="flex flex-1 items-center justify-center p-4 text-center text-xs text-muted-foreground">
                            Gestor de dispositivos físicos y emuladores.
                          </div>
                        </div>
                      ) : activeSecondaryView === "running-devices" ? (
                        <div className="flex flex-col h-full select-none">
                          <div className="flex h-9 items-center justify-between px-3 shrink-0">
                            <span className="text-[11px] font-semibold text-foreground">
                              Running Devices
                            </span>
                            <button
                              type="button"
                              onClick={() => setRightPanel(false)}
                              className="size-6 flex items-center justify-center rounded hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
                              aria-label="Cerrar panel"
                            >
                              <X className="size-3.5" />
                            </button>
                          </div>
                          <div className="flex flex-1 items-center justify-center p-4 text-center text-xs text-muted-foreground">
                            No hay dispositivos en ejecución actualmente.
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col h-full select-none">
                          <div className="flex h-9 items-center justify-between px-3 shrink-0">
                            <span className="text-[11px] font-semibold text-foreground">
                              Gradle & Dependencies
                            </span>
                            <button
                              type="button"
                              onClick={() => setRightPanel(false)}
                              className="size-6 flex items-center justify-center rounded hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
                              aria-label="Cerrar panel"
                            >
                              <X className="size-3.5" />
                            </button>
                          </div>
                          <div className="flex flex-1 items-center justify-center p-4 text-center text-xs text-muted-foreground">
                            Tareas de Gradle y dependencias del proyecto.
                          </div>
                        </div>
                      )}
                    </div>
                  </ResizableSidebar>
                )}
              </div>
            </ResizablePanel>

            {/* Bottom panel */}
            {bottomPanel && (
              <>
                <ResizableHandle withHandle />
                <ResizablePanel id="bottom-panel" defaultSize="28" minSize="10" className="flex flex-col h-full min-h-0 overflow-hidden bg-background px-2 pb-2">
                  <div className="flex flex-col h-full w-full rounded-xl border border-border/80 bg-card text-card-foreground overflow-hidden shadow-xs isolate">
                    {/* Clean Panel Header */}
                    <div className="flex h-8 items-center justify-between px-3 shrink-0 select-none bg-transparent pt-1">
                      {/* Left: Tab options */}
                      <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                        {[
                          { id: "TERMINAL" as const, label: "Terminal", icon: TerminalIcon },
                          { id: "PROBLEMS" as const, label: "Problems", count: 0 },
                          { id: "OUTPUT" as const, label: "Output", icon: FileText },
                          { id: "DEBUG CONSOLE" as const, label: "Debug Console", icon: Bug },
                        ].map((tab) => {
                          const isActive = tab.id === activeBottomTab;
                          return (
                            <button
                              key={tab.id}
                              type="button"
                              onClick={() => setActiveBottomTab(tab.id)}
                              className={cn(
                                "flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-all cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-ring",
                                isActive
                                  ? "bg-muted/50 text-foreground shadow-2xs"
                                  : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                              )}
                            >
                              {tab.icon && (
                                <tab.icon className={cn("size-3", isActive ? "text-primary" : "opacity-60")} />
                              )}
                              <span>{tab.label}</span>
                              {typeof tab.count === "number" && (
                                <span
                                  className={cn(
                                    "px-1.5 py-0.2 rounded-full text-[10px] font-mono leading-tight",
                                    isActive
                                      ? "bg-background/80 text-foreground"
                                      : "bg-muted/60 text-muted-foreground"
                                  )}
                                >
                                  {tab.count}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center gap-0.5 shrink-0 text-muted-foreground">
                        {activeBottomTab === "TERMINAL" && (
                          <>
                            <Tooltip>
                              <TooltipTrigger
                                render={
                                  <button
                                    type="button"
                                    onClick={() => {
                                      invoke("write_terminal", { data: "\x0c" }).catch(console.error);
                                    }}
                                    className="flex size-6 items-center justify-center rounded-md hover:bg-muted/60 hover:text-foreground transition-colors cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                    aria-label="Limpiar terminal"
                                  />
                                }
                              >
                                <Trash2 className="size-3.5" />
                              </TooltipTrigger>
                              <TooltipContent side="top" sideOffset={6}>Limpiar terminal</TooltipContent>
                            </Tooltip>

                            <Tooltip>
                              <TooltipTrigger
                                render={
                                  <button
                                    type="button"
                                    onClick={() => {
                                      invoke("write_terminal", { data: "\n" }).catch(console.error);
                                    }}
                                    className="flex size-6 items-center justify-center rounded-md hover:bg-muted/60 hover:text-foreground transition-colors cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                    aria-label="Nueva sesión"
                                  />
                                }
                              >
                                <Plus className="size-3.5" />
                              </TooltipTrigger>
                              <TooltipContent side="top" sideOffset={6}>Nueva sesión</TooltipContent>
                            </Tooltip>
                          </>
                        )}

                        <Tooltip>
                          <TooltipTrigger
                            render={
                              <button
                                type="button"
                                onClick={() => setBottomPanel(false)}
                                className="flex size-6 items-center justify-center rounded-md hover:bg-muted/60 hover:text-foreground transition-colors cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                aria-label="Cerrar panel"
                              />
                            }
                          >
                            <X className="size-3.5" />
                          </TooltipTrigger>
                          <TooltipContent side="top" sideOffset={6}>Cerrar panel</TooltipContent>
                        </Tooltip>
                      </div>
                    </div>

                    {/* Panel Body */}
                    <div className="flex-1 min-h-0 h-full w-full">
                      {activeBottomTab === "PROBLEMS" && (
                        <div className="flex flex-col items-center justify-center h-full text-center p-6 gap-2 select-none">
                          <CheckCircle2 className="size-6 text-muted-foreground/40" />
                          <span className="text-xs font-medium text-foreground">Sin problemas</span>
                          <span className="text-[11px] text-muted-foreground/60 max-w-xs">
                            No se han detectado errores ni advertencias en el espacio de trabajo.
                          </span>
                        </div>
                      )}
                      {activeBottomTab === "OUTPUT" && (
                        <div className="flex flex-col items-center justify-center h-full text-center p-6 gap-2 select-none">
                          <FileText className="size-6 text-muted-foreground/40" />
                          <span className="text-xs font-medium text-foreground">Salida vacía</span>
                          <span className="text-[11px] text-muted-foreground/60 max-w-xs">
                            No hay registros ni salida de compilación reciente.
                          </span>
                        </div>
                      )}
                      {activeBottomTab === "DEBUG CONSOLE" && (
                        <div className="flex flex-col items-center justify-center h-full text-center p-6 gap-2 select-none">
                          <Bug className="size-6 text-muted-foreground/40" />
                          <span className="text-xs font-medium text-foreground">Consola de depuración</span>
                          <span className="text-[11px] text-muted-foreground/60 max-w-xs">
                            Inicia una sesión de depuración para evaluar expresiones e inspeccionar registros.
                          </span>
                        </div>
                      )}
                      <div className={cn("h-full w-full", activeBottomTab !== "TERMINAL" && "hidden")}>
                        <WorkspaceTerminal projectPath={projectPath || undefined} />
                      </div>
                    </div>
                  </div>
                </ResizablePanel>
              </>
            )}
          </ResizablePanelGroup>
        </div>

        {/* Right secondary rail — always visible full height on right */}
        <WorkspaceSecondaryRail
          activeView={activeSecondaryView}
          onViewChange={handleSecondaryViewChange}
          isOpen={rightPanel}
        />
      </div>

      {/* Designer Workspace: layout with Sidebars and Rounded Infinite Canvas */}
      {workspaceMode === "designer" && (
        <div className="relative flex flex-1 min-h-0 w-full overflow-hidden bg-background">
          {/* Left Designer Sidebar (with Primary Rail and drawer panel) */}
          <DesignerSidebar
            open={!designerSidebarsMinimized && designerSidebarOpen}
            onToggleMinimize={() => setDesignerSidebarsMinimized(true)}
            width={designerLeftWidth}
            onWidthChange={setDesignerLeftWidth}
            frames={designerFrames}
            selectedFrameId={selectedFrameId}
            onSelectFrameId={handleSelectFrameId}
            selectedElementId={selectedElementId}
            onSelectElementId={handleSelectElementId}
            onAddElementToFrame={handleAddElementToFrame}
            onDeleteElement={handleDeleteElementFromFrame}
            onUpdateElement={handleUpdateElement}
          />

          {/* Center: Infinite Canvas Card with Rounded Corners (matching editor mode) */}
          <div className="flex flex-col flex-1 min-w-0 min-h-0 h-full overflow-hidden px-2 pb-2 pt-0.5">
            <div className="relative flex flex-col flex-1 min-h-0 min-w-0 h-full overflow-hidden rounded-xl border border-border/80 bg-card text-card-foreground shadow-xs isolate">
              <DesignerCanvas
                isLeftSidebarOpen={false}
                isRightSidebarOpen={false}
                leftSidebarWidth={0}
                rightSidebarWidth={0}
                activeTool={designerActiveTool}
                onSelectTool={handleSelectTool}
                frames={designerFrames}
                onFramesChange={handleFramesChange}
                selectedFrameId={selectedFrameId}
                onSelectFrameId={handleSelectFrameId}
                selectedElementId={selectedElementId}
                onSelectElementId={handleSelectElementId}
              />
            </div>
          </div>

          {/* Right Designer Sidebar (Frame Properties / Presets) */}
          <DesignerSidebar
            side="right"
            open={!designerSidebarsMinimized && designerRightSidebarOpen}
            width={designerRightWidth}
            onWidthChange={setDesignerRightWidth}
            title={
              designerActiveTool === "frame"
                ? "Marco"
                : selectedFrame
                  ? selectedFrame.name
                  : "Propiedades"
            }
            icon={
              designerActiveTool === "frame" ? (
                <Frame className="size-3.5 text-primary shrink-0" />
              ) : selectedFrame ? (
                <Smartphone className="size-3.5 text-primary shrink-0" />
              ) : (
                <SlidersHorizontal className="size-3.5 text-primary shrink-0" />
              )
            }
          >
            {designerActiveTool === "frame" ? (
              <DesignerFramePresets onSelectPreset={handleAddFramePreset} />
            ) : selectedFrame ? (
              <DesignerFrameProperties
                frame={selectedFrame}
                allFrames={designerFrames}
                onChangeFrame={handleUpdateFrame}
                selectedElementId={selectedElementId}
                onSelectElementId={setSelectedElementId}
              />
            ) : (
              <div className="flex flex-col items-center justify-center p-6 text-center text-muted-foreground/60 text-xs">
                Selecciona un marco para inspeccionar sus propiedades
              </div>
            )}
          </DesignerSidebar>

          {/* Floating Header Pills (smooth fade & slide when sidebars are minimized, with margin to not overlap rulers) */}
          <div
            className={cn(
              "pointer-events-none absolute inset-x-0 top-8 z-30 flex items-center justify-between px-8 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
              designerSidebarsMinimized
                ? "opacity-100 translate-y-0"
                : "opacity-0 -translate-y-2 pointer-events-none"
            )}
          >
            {/* Left Pill */}
            <div className="pointer-events-auto flex items-center gap-2 h-9 px-3 rounded-2xl border border-border/80 bg-background/85 backdrop-blur-xl shadow-xl text-foreground select-none">
              <Layers className="size-4 text-primary shrink-0" />
              <span className="text-xs font-medium max-w-[180px] truncate">
                {projectName || "Vela Studio"}
              </span>
              <button
                type="button"
                onClick={() => {
                  setDesignerSidebarsMinimized(false);
                  setDesignerSidebarOpen(true);
                  setDesignerRightSidebarOpen(true);
                }}
                title="Maximizar sidebars"
                className="ml-1 flex size-6 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted/80 hover:text-foreground transition-colors"
              >
                <PanelLeft className="size-3.5" />
              </button>
            </div>

            {/* Right Pill */}
            <div className="pointer-events-auto flex items-center gap-2 h-9 px-2.5 rounded-2xl border border-border/80 bg-background/85 backdrop-blur-xl shadow-xl text-foreground select-none">
              <div className="size-5 rounded-full bg-amber-500/20 text-amber-500 font-semibold text-[10px] flex items-center justify-center border border-amber-500/30">
                B
              </div>
              <Button
                variant="outline"
                size="xs"
                onClick={() => {
                  setDesignerSidebarsMinimized(false);
                  setDesignerSidebarOpen(true);
                  setDesignerRightSidebarOpen(true);
                }}
                className="h-6 gap-1 px-2 text-[11px] font-medium border-border/60 hover:bg-muted/80 shadow-xs rounded-lg"
                title="Volver a maximizar las 2 sidebars"
              >
                <PanelsTopLeft className="size-3.5" />
                <span>Maximizar</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Status Bar at the bottom of the window */}
      <WorkspaceStatusbar
        gitBranch={gitBranch}
        onToggleBottom={() => setBottomPanel((v) => !v)}
        onSelectBottomTab={(tab) => {
          setBottomPanel(true);
          setActiveBottomTab(tab);
        }}
      />

      {/* Flutter New Project Wizard */}
      <WorkspaceFlutterWizard
        open={isFlutterWizardOpen}
        onOpenChange={setFlutterWizardOpen}
      />
      </div>
    </SidebarProvider>
  );
}
