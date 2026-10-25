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
import { WorkspaceSecondaryRail } from "./workspace-secondary-rail";
import { WorkspaceTerminal } from "./workspace-terminal";
import { Layers, PanelLeft, PanelsTopLeft, Play, Frame, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DesignerSidebar } from "./designer-sidebar";
import { DesignerCanvas, type CanvasDeviceFrame } from "./designer-canvas";
import { type DesignerTool } from "./designer-dock";
import { DesignerFramePresets, type FramePresetItem } from "./designer-frame-presets";
import { VelaSetupScreen } from "./vela-setup";
import { useWorkspaceStore } from "../model/workspace.store";

export function WorkspaceShell() {
  const [engineReady, setEngineReady] = React.useState(false);
  const projectName = useWorkspaceStore((state) => state.projectName);
  const projectPath = useWorkspaceStore((state) => state.projectPath);

  const [gitBranch, setGitBranch] = React.useState<string | undefined>(undefined);

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
  const [designerActiveTool, setDesignerActiveTool] = React.useState<DesignerTool>("select");
  const [designerFrames, setDesignerFrames] = React.useState<CanvasDeviceFrame[]>([
    {
      id: "frame-iphone-default",
      type: "iphone",
      name: "iPhone 16 Pro",
      x: -402 / 2,
      y: -874 / 2,
      width: 402,
      height: 874,
    },
  ]);
  const [selectedFrameId, setSelectedFrameId] = React.useState<string>("frame-iphone-default");

  const handleSelectTool = (tool: DesignerTool) => {
    setDesignerActiveTool(tool);
    if (tool === "frame") {
      setDesignerRightSidebarOpen(true);
      setDesignerSidebarsMinimized(false);
    }
  };

  const handleAddFramePreset = (preset: FramePresetItem) => {
    const maxX =
      designerFrames.length > 0
        ? Math.max(...designerFrames.map((f) => f.x + f.width))
        : -preset.width / 2;
    const newX = designerFrames.length > 0 ? maxX + 80 : -preset.width / 2;
    const newY = -preset.height / 2;

    const newFrame: CanvasDeviceFrame = {
      id: `frame-${preset.id}-${Date.now()}`,
      type: preset.type,
      name: preset.name,
      x: Math.round(newX),
      y: Math.round(newY),
      width: preset.width,
      height: preset.height,
    };

    setDesignerFrames((prev) => [...prev, newFrame]);
    setSelectedFrameId(newFrame.id);
    setDesignerActiveTool("select");
  };

  const workspaceMode = useWorkspaceStore((state) => state.workspaceMode);
  const setWorkspaceMode = useWorkspaceStore((state) => state.setWorkspaceMode);

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
            showRightBorder={!leftPanel}
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
                  <ResizableSidebar id="right-panel" side="right" defaultWidth={280}>
                    <div className="flex flex-col h-full border-l border-border bg-background">
                      <div className="flex h-9 items-center border-b border-border px-3 shrink-0">
                        <span className="text-[10px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
                          Panel
                        </span>
                      </div>
                      <div className="flex flex-1 items-center justify-center">
                        <span className="text-xs text-muted-foreground/50">Right panel</span>
                      </div>
                    </div>
                  </ResizableSidebar>
                )}
                
                {/* Right secondary rail (inside editor row) */}
                <WorkspaceSecondaryRail />
              </div>
            </ResizablePanel>

            {/* Bottom panel */}
            {bottomPanel && (
              <>
                <ResizableHandle withHandle />
                <ResizablePanel id="bottom-panel" defaultSize="28" minSize="10" className="flex flex-col h-full min-h-0 overflow-hidden bg-background border-t border-border">
                  <div className="flex h-9 items-center px-1 shrink-0 border-b border-border gap-1 overflow-x-auto no-scrollbar">
                    {["PROBLEMS", "OUTPUT", "DEBUG CONSOLE", "TERMINAL"].map((tab) => (
                      <button
                        key={tab}
                        className={cn(
                          "px-3 py-1 text-[10px] font-medium uppercase tracking-[0.1em] transition-colors whitespace-nowrap outline-none",
                          tab === "TERMINAL"
                            ? "text-foreground border-b border-foreground"
                            : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>
                  <div className="flex-1 min-h-0 h-full w-full">
                    {/* Hardcoded to WorkspaceTerminal for now as requested */}
                    <WorkspaceTerminal projectPath={projectPath || undefined} />
                  </div>
                </ResizablePanel>
              </>
            )}
          </ResizablePanelGroup>
        </div>
      </div>

      {/* Designer Workspace: layout with Slide-over Sidebars and Full-Width Canvas */}
      {workspaceMode === "designer" && (
        <div className="relative flex flex-1 min-h-0 w-full overflow-hidden bg-background">
          {/* Full-width Infinite Canvas (Never resizes, zero layout shifting) */}
          <DesignerCanvas
            isLeftSidebarOpen={!designerSidebarsMinimized && designerSidebarOpen}
            isRightSidebarOpen={!designerSidebarsMinimized && designerRightSidebarOpen}
            activeTool={designerActiveTool}
            onSelectTool={handleSelectTool}
            frames={designerFrames}
            onFramesChange={setDesignerFrames}
            selectedFrameId={selectedFrameId}
            onSelectFrameId={setSelectedFrameId}
          />

          {/* Left Designer Sidebar (Slide-over) */}
          <DesignerSidebar
            open={!designerSidebarsMinimized && designerSidebarOpen}
            onToggleMinimize={() => setDesignerSidebarsMinimized(true)}
          />

          {/* Right Designer Sidebar (Slide-over) */}
          <DesignerSidebar
            side="right"
            open={!designerSidebarsMinimized && designerRightSidebarOpen}
            title={designerActiveTool === "frame" ? "Marco" : "Propiedades"}
            icon={
              designerActiveTool === "frame" ? (
                <Frame className="size-3.5 text-primary shrink-0" />
              ) : (
                <SlidersHorizontal className="size-3.5 text-primary shrink-0" />
              )
            }
          >
            {designerActiveTool === "frame" ? (
              <DesignerFramePresets onSelectPreset={handleAddFramePreset} />
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
            <div className="pointer-events-auto flex items-center gap-2 h-9 px-3 rounded-2xl border border-border/50 dark:border-white/10 bg-background/70 dark:bg-zinc-900/75 backdrop-blur-xl shadow-xl text-foreground select-none">
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
            <div className="pointer-events-auto flex items-center gap-2 h-9 px-2.5 rounded-2xl border border-border/50 dark:border-white/10 bg-background/70 dark:bg-zinc-900/75 backdrop-blur-xl shadow-xl text-foreground select-none">
              <div className="size-5 rounded-full bg-amber-500/20 text-amber-500 font-semibold text-[10px] flex items-center justify-center border border-amber-500/30">
                B
              </div>
              <Button
                variant="ghost"
                size="icon-xs"
                className="size-6 text-muted-foreground hover:text-foreground"
                title="Ejecutar"
              >
                <Play className="size-3 fill-current" />
              </Button>
              <div className="h-3.5 w-px bg-border/40 dark:bg-white/10" />
              <Button
                variant="outline"
                size="xs"
                onClick={() => {
                  setDesignerSidebarsMinimized(false);
                  setDesignerSidebarOpen(true);
                  setDesignerRightSidebarOpen(true);
                }}
                className="h-6 gap-1 px-2 text-[11px] font-medium border-border/50 dark:border-white/10 hover:bg-muted/80 shadow-xs rounded-lg"
                title="Volver a maximizar las 2 sidebars"
              >
                <PanelsTopLeft className="size-3.5" />
                <span>Maximizar</span>
              </Button>
            </div>
          </div>
        </div>
      )}
      </div>
    </SidebarProvider>
  );
}
