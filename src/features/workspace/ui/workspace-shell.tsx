import * as React from "react";
import { invoke } from "@tauri-apps/api/core";
import { ResizableSidebar, ResizableBottomPanel } from "@/components/ui/ide-resizable";

import { SidebarProvider } from "@/components/ui/sidebar";

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
      <div className="flex h-svh w-full overflow-hidden bg-background">
      {/* Activity bar — always visible */}
      <WorkspacePrimaryRail 
        activeView={activeView}
        onViewChange={handleViewChange}
      />

      <div className="flex flex-1 min-w-0 h-full overflow-hidden">
        {/* File tree */}
        {leftPanel && (
          <ResizableSidebar id="sidebar" side="left" defaultWidth={260}>
            <WorkspaceSidebar open={leftPanel} activeView={activeView} />
          </ResizableSidebar>
        )}

        {/* Main area: toolbar + editor + panels */}
        <div className="flex flex-col flex-1 min-w-0 min-h-0 bg-background overflow-hidden">
          <WorkspaceToolbar
            projectName={computedProjectName}
            gitBranch={gitBranch}
            leftPanel={leftPanel}
            bottomPanel={bottomPanel}
            rightPanel={rightPanel}
            onToggleLeft={() => setLeftPanel((v) => !v)}
            onToggleBottom={() => setBottomPanel((v) => !v)}
            onToggleRight={() => setRightPanel((v) => !v)}
          />

          <div className="flex flex-col flex-1 min-w-0 min-h-0 overflow-hidden">
            {/* Editor row */}
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

            {/* Bottom panel */}
            {bottomPanel && (
              <ResizableBottomPanel id="terminal" defaultHeight={250}>
                <div className="flex flex-col h-full bg-background border-t border-border">
                  <div className="flex h-9 items-center px-3 shrink-0 border-b border-border">
                    <span className="text-[10px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
                      Terminal
                    </span>
                  </div>
                  <div className="flex-1 min-h-0 h-full w-full">
                    <WorkspaceTerminal />
                  </div>
                </div>
              </ResizableBottomPanel>
            )}
          </div>
        </div>
      </div>
      </div>
    </SidebarProvider>
  );
}
