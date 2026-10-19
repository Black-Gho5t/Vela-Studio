import {
  FilePlus2,
  FolderOpen,
  GitBranch,
  Layout,
  Terminal,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { open as openDialog } from "@tauri-apps/plugin-dialog";
import { useWorkspaceStore } from "../model/workspace.store";

interface WorkspaceWelcomeTabProps {
  onSwitchView?: (view: "explorer" | "search" | "git") => void;
}

export function WorkspaceWelcomeTab({ onSwitchView }: WorkspaceWelcomeTabProps) {
  const recentProjects = useWorkspaceStore((state) => state.recentProjects) || [];
  const showWelcomeOnStartup = useWorkspaceStore((state) => state.showWelcomeOnStartup) ?? true;
  const setShowWelcomeOnStartup = useWorkspaceStore((state) => state.setShowWelcomeOnStartup);
  const setWorkspaceMode = useWorkspaceStore((state) => state.setWorkspaceMode);
  const addTab = useWorkspaceStore((state) => state.addTab);

  const handleOpenFolder = async () => {
    try {
      const selected = await openDialog({
        directory: true,
        multiple: false,
      });
      if (selected && typeof selected === "string") {
        const name = selected.split(/[/\\]/).pop() || "unknown-project";
        useWorkspaceStore.getState().setProjectName(name);
        useWorkspaceStore.getState().setProjectPath(selected);
        useWorkspaceStore.getState().addRecentProject({ name, path: selected });
      }
    } catch (e) {
      console.error("Failed to open folder:", e);
    }
  };

  const handleOpenRecent = (name: string, path: string) => {
    useWorkspaceStore.getState().setProjectName(name);
    useWorkspaceStore.getState().setProjectPath(path);
    useWorkspaceStore.getState().addRecentProject({ name, path });
  };

  const handleNewFile = () => {
    const newTabId = `untitled-${Date.now()}`;
    addTab({
      id: newTabId,
      name: "untitled.dart",
      path: "untitled.dart",
      content: "// New Dart File\nimport 'package:flutter/material.dart';\n\nvoid main() {\n  runApp(const MyApp());\n}\n\nclass MyApp extends StatelessWidget {\n  const MyApp({super.key});\n\n  @override\n  Widget build(BuildContext context) {\n    return const MaterialApp(\n      home: Scaffold(\n        body: Center(\n          child: Text('Hello, Vela!'),\n        ),\n      ),\n    );\n  }\n}\n",
      isActive: true,
      isModified: true,
    });
  };

  return (
    <div className="flex h-full w-full flex-col overflow-y-auto bg-background text-foreground select-none">
      <div className="flex flex-1 flex-col items-center justify-between p-8 md:p-14 max-w-4xl mx-auto w-full">
        {/* Top & Columns container */}
        <div className="w-full flex flex-col">
          {/* Header Branding */}
          <div className="mb-10">
            <h1 className="text-3xl font-medium tracking-tight text-foreground">
              Vela Studio
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Visual Flutter & Dart workspace
            </p>
          </div>

          {/* 2-Columns Grid: Start & Recent / Walkthroughs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-14 w-full">
            {/* Left Column: Start & Recent */}
            <div className="flex flex-col gap-8">
              {/* Start */}
              <div>
                <h2 className="text-sm font-semibold tracking-wide text-foreground mb-3">
                  Start
                </h2>
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={handleNewFile}
                    className="flex items-center gap-2.5 text-xs text-primary hover:underline cursor-pointer group text-left"
                  >
                    <FilePlus2 className="size-4 shrink-0 text-primary" />
                    <span>New File...</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleOpenFolder}
                    className="flex items-center gap-2.5 text-xs text-primary hover:underline cursor-pointer group text-left"
                  >
                    <FolderOpen className="size-4 shrink-0 text-primary" />
                    <span>Open Folder...</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onSwitchView?.("git")}
                    className="flex items-center gap-2.5 text-xs text-primary hover:underline cursor-pointer group text-left"
                  >
                    <GitBranch className="size-4 shrink-0 text-primary" />
                    <span>Clone Git Repository...</span>
                  </button>
                </div>
              </div>

              {/* Recent */}
              <div>
                <h2 className="text-sm font-semibold tracking-wide text-foreground mb-3">
                  Recent
                </h2>
                {recentProjects.length > 0 ? (
                  <div className="flex flex-col gap-2.5">
                    {recentProjects.map((p) => (
                      <button
                        key={p.path}
                        type="button"
                        onClick={() => handleOpenRecent(p.name, p.path)}
                        className="group flex flex-col text-left cursor-pointer outline-none transition-colors"
                      >
                        <span className="text-xs font-medium text-primary group-hover:underline truncate max-w-sm">
                          {p.name}
                        </span>
                        <span className="text-[11px] text-muted-foreground/60 truncate max-w-sm">
                          {p.path}
                        </span>
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={handleOpenFolder}
                      className="text-[11px] text-primary hover:underline cursor-pointer text-left mt-1"
                    >
                      More...
                    </button>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground/60">No recent projects</p>
                )}
              </div>
            </div>

            {/* Right Column: Walkthroughs */}
            <div>
              <h2 className="text-sm font-semibold tracking-wide text-foreground mb-3">
                Walkthroughs
              </h2>
              <div className="flex flex-col gap-3">
                {/* Walkthrough 1 */}
                <div
                  onClick={() => setWorkspaceMode("editor")}
                  className="group relative flex flex-col p-3 rounded-lg border border-border/50 bg-muted/20 hover:bg-muted/40 hover:border-border transition-all cursor-pointer"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex size-7 items-center justify-center rounded-md bg-primary/10 text-primary shrink-0 mt-0.5">
                      <Sparkles className="size-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
                        Get started with Vela Studio
                      </h3>
                      <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                        Customize your editor, learn key shortcuts, and start coding Flutter apps.
                      </p>
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div className="w-full h-1 bg-muted/60 rounded-full mt-3 overflow-hidden">
                    <div className="w-1/3 h-full bg-primary rounded-full" />
                  </div>
                </div>

                {/* Walkthrough 2 */}
                <div
                  onClick={() => setWorkspaceMode("designer")}
                  className="group relative flex flex-col p-3 rounded-lg border border-border/50 bg-muted/20 hover:bg-muted/40 hover:border-border transition-all cursor-pointer"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex size-7 items-center justify-center rounded-md bg-primary/10 text-primary shrink-0 mt-0.5">
                      <Layout className="size-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
                        Visual Flutter Designer
                      </h3>
                      <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                        Design widgets visually with split-view and real-time Flutter AST synchronization.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Walkthrough 3 */}
                <div
                  className="group relative flex flex-col p-3 rounded-lg border border-border/50 bg-muted/20 hover:bg-muted/40 hover:border-border transition-all cursor-pointer"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex size-7 items-center justify-center rounded-md bg-primary/10 text-primary shrink-0 mt-0.5">
                      <Terminal className="size-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
                        Flutter Tools & Hot Reload
                      </h3>
                      <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                        Detect running devices, inspect logs, and hot reload code changes seamlessly.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer: Quick Button & Startup Checkbox */}
        <div className="mt-12 pt-6 flex flex-col items-center gap-3 border-t border-border/30 w-full">
          <button
            type="button"
            onClick={() => setWorkspaceMode("designer")}
            className="flex items-center gap-2 rounded-full border border-border/60 bg-muted/40 hover:bg-muted/80 px-4 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-all cursor-pointer shadow-2xs"
          >
            <Sparkles className="size-3.5 text-primary" />
            <span>Try out the Visual Designer mode</span>
            <ArrowRight className="size-3 opacity-60" />
          </button>

          <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer select-none hover:text-foreground transition-colors">
            <input
              type="checkbox"
              checked={showWelcomeOnStartup}
              onChange={(e) => setShowWelcomeOnStartup(e.target.checked)}
              className="size-3.5 rounded border-border text-primary accent-primary cursor-pointer"
            />
            <span>Show welcome page on startup</span>
          </label>
        </div>
      </div>
    </div>
  );
}
