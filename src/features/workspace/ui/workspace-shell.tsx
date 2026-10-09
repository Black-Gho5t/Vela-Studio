import * as React from "react";
import { invoke } from "@tauri-apps/api/core";
import { ResizableSidebar } from "@/components/ui/ide-resizable";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { SidebarProvider } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

import { WorkspaceOverview } from "./workspace-overview";
import { WorkspacePrimaryRail } from "./workspace-primary-rail";
import { WorkspaceSidebar } from "./workspace-sidebar";
import { WorkspaceToolbar } from "./workspace-toolbar";
import { WorkspaceSecondaryRail } from "./workspace-secondary-rail";
import { WorkspaceTerminal } from "./workspace-terminal";
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

  const computedProjectName = React.useMemo(() => {
    if (projectName) return projectName;
    if (projectPath) return projectPath.split(/[/\\]/).pop() || null;
    return null;
  }, [projectName, projectPath]);

  const [activeView, setActiveView] = React.useState<"explorer" | "search" | "git">("explorer");
  const [leftPanel, setLeftPanel] = React.useState(true);
  const [bottomPanel, setBottomPanel] = React.useState(true);
  const [rightPanel, setRightPanel] = React.useState(false);

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

  if (!engineReady) {
    return <VelaSetupScreen onComplete={() => setEngineReady(true)} />;
  }

  return (
    <SidebarProvider>
      <div className="flex h-svh w-full flex-col overflow-hidden bg-background">
        {/* Full-width Toolbar across entire window */}
        <WorkspaceToolbar
          projectName={computedProjectName}
          gitBranch={gitBranch}
          onBranchChange={setGitBranch}
          leftPanel={leftPanel}
          bottomPanel={bottomPanel}
          rightPanel={rightPanel}
          onToggleLeft={() => setLeftPanel((v) => !v)}
          onToggleBottom={() => setBottomPanel((v) => !v)}
          onToggleRight={() => setRightPanel((v) => !v)}
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
                  <WorkspaceOverview />
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

      {/* Designer Workspace: renders empty space for now */}
      {workspaceMode === "designer" && (
        <div className="flex flex-1 min-h-0 w-full items-center justify-center bg-background overflow-hidden select-none">
          {/* Espacio vacío por ahora */}
        </div>
      )}
      </div>
    </SidebarProvider>
  );
}
