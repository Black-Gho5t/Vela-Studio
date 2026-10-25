import * as React from "react";
import {
  FolderOpen,
  FileCode2,
  GitBranch,
  Layout,
  Clock,
  ChevronRight,
  Code2,
  Search,
} from "lucide-react";
import { open as openDialog } from "@tauri-apps/plugin-dialog";
import { useWorkspaceStore } from "../model/workspace.store";
import { Kbd } from "@/components/ui/kbd";
import { cn } from "@/lib/utils";

interface WorkspaceWelcomeTabProps {
  onSwitchView?: (view: "explorer" | "search" | "git") => void;
}

function formatRelativeTime(timestamp?: number): string {
  if (!timestamp) return "";
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "hace un momento";
  if (minutes < 60) return `hace ${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "ayer";
  if (days < 30) return `hace ${days}d`;
  return new Date(timestamp).toLocaleDateString();
}

export function WorkspaceWelcomeTab({ onSwitchView }: WorkspaceWelcomeTabProps) {
  const recentProjects = useWorkspaceStore((state) => state.recentProjects) || [];
  const showWelcomeOnStartup = useWorkspaceStore((state) => state.showWelcomeOnStartup) ?? true;
  const setShowWelcomeOnStartup = useWorkspaceStore((state) => state.setShowWelcomeOnStartup);
  const setWorkspaceMode = useWorkspaceStore((state) => state.setWorkspaceMode);
  const addTab = useWorkspaceStore((state) => state.addTab);

  const [projectSearch, setProjectSearch] = React.useState("");

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
      content:
        "// New Dart File\nimport 'package:flutter/material.dart';\n\nvoid main() {\n  runApp(const MyApp());\n}\n\nclass MyApp extends StatelessWidget {\n  const MyApp({super.key});\n\n  @override\n  Widget build(BuildContext context) {\n    return const MaterialApp(\n      home: Scaffold(\n        body: Center(\n          child: Text('Hello, Vela!'),\n        ),\n      ),\n    );\n  }\n}\n",
      isActive: true,
      isModified: true,
    });
  };

  const filteredProjects = React.useMemo(() => {
    if (!projectSearch.trim()) return recentProjects;
    const query = projectSearch.toLowerCase().trim();
    return recentProjects.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        p.path.toLowerCase().includes(query)
    );
  }, [recentProjects, projectSearch]);

  const quickActions = [
    {
      id: "open",
      title: "Abrir carpeta",
      description: "Abrir un proyecto Flutter existente desde el disco",
      icon: FolderOpen,
      shortcut: "⌘O",
      color: "text-amber-500 bg-amber-500/10 border-amber-500/20",
      action: handleOpenFolder,
    },
    {
      id: "new-file",
      title: "Nuevo archivo",
      description: "Crear un nuevo archivo Dart con estructura básica",
      icon: FileCode2,
      shortcut: "⌘N",
      color: "text-sky-500 bg-sky-500/10 border-sky-500/20",
      action: handleNewFile,
    },
    {
      id: "designer",
      title: "Modo Diseñador",
      description: "Editor visual de widgets Flutter con sincronización AST",
      icon: Layout,
      badge: "Visual",
      color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
      action: () => setWorkspaceMode("designer"),
    },
    {
      id: "clone",
      title: "Clonar repositorio",
      description: "Clonar desde GitHub, GitLab o una URL de repositorio",
      icon: GitBranch,
      badge: "Git",
      color: "text-purple-500 bg-purple-500/10 border-purple-500/20",
      action: () => onSwitchView?.("git"),
    },
  ];

  return (
    <div className="flex h-full w-full flex-col overflow-y-auto bg-background text-foreground select-none">
      <div className="flex flex-1 flex-col items-center p-6 md:p-12 max-w-4xl mx-auto w-full">
        {/* Hero Header */}
        <div className="w-full mb-8 flex flex-col items-start gap-2 border-b border-border/40 pb-6">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-card border border-border/80 shadow-xs p-1.5">
              <img
                src="/app-logo.png"
                alt="Vela Studio"
                className="size-full object-contain"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                  Vela Studio
                </h1>
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary border border-primary/20">
                  Flutter & Dart IDE
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Entorno de desarrollo visual, reactivo y de alto rendimiento.
              </p>
            </div>
          </div>
        </div>

        {/* Quick Action Tiles */}
        <div className="w-full mb-8">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-foreground/80 mb-3 px-0.5">
            Acciones rápidas
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.id}
                  type="button"
                  onClick={action.action}
                  className="group relative flex flex-col justify-between p-3.5 rounded-xl border border-border/60 bg-card hover:bg-muted/40 hover:border-border transition-all duration-150 cursor-pointer text-left shadow-2xs hover:shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <div className="flex items-start justify-between w-full mb-3">
                    <div
                      className={cn(
                        "flex size-8 items-center justify-center rounded-lg border",
                        action.color
                      )}
                    >
                      <Icon className="size-4" />
                    </div>
                    {action.shortcut ? (
                      <Kbd className="text-[10px] font-mono px-1 py-0.5 opacity-70 group-hover:opacity-100 transition-opacity">
                        {action.shortcut}
                      </Kbd>
                    ) : action.badge ? (
                      <span className="text-[10px] font-medium text-muted-foreground/70 bg-muted px-1.5 py-0.5 rounded-md">
                        {action.badge}
                      </span>
                    ) : null}
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors flex items-center justify-between">
                      <span>{action.title}</span>
                      <ChevronRight className="size-3 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                    </h3>
                    <p className="text-[11px] text-muted-foreground mt-1 leading-snug line-clamp-2">
                      {action.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Recent Workspaces / Projects Section */}
        <div className="w-full flex-1 flex flex-col mb-8">
          <div className="flex items-center justify-between mb-3 px-0.5">
            <div className="flex items-center gap-2">
              <Clock className="size-3.5 text-muted-foreground" />
              <h2 className="text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-foreground/80">
                Proyectos recientes
              </h2>
              {recentProjects.length > 0 && (
                <span className="text-[10px] rounded-full bg-muted px-1.5 py-0.2 text-muted-foreground">
                  {recentProjects.length}
                </span>
              )}
            </div>

            {recentProjects.length > 3 && (
              <div className="relative w-44">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 size-3 text-muted-foreground/60" />
                <input
                  type="text"
                  placeholder="Filtrar..."
                  value={projectSearch}
                  onChange={(e) => setProjectSearch(e.target.value)}
                  className="w-full h-6 pl-6 pr-2 rounded-md border border-border/50 bg-background text-[11px] text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-ring transition-colors"
                />
              </div>
            )}
          </div>

          <div className="rounded-xl border border-border/60 bg-card/60 overflow-hidden shadow-2xs divide-y divide-border/40">
            {filteredProjects.length > 0 ? (
              filteredProjects.map((p) => (
                <button
                  key={p.path}
                  type="button"
                  onClick={() => handleOpenRecent(p.name, p.path)}
                  className="group flex w-full items-center justify-between p-3 text-left transition-colors hover:bg-muted/50 cursor-pointer outline-none focus-visible:bg-muted/50"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="flex size-7 items-center justify-center rounded-lg bg-muted text-muted-foreground group-hover:text-primary group-hover:bg-primary/10 transition-colors shrink-0">
                      <Code2 className="size-3.5" />
                    </div>
                    <div className="flex flex-col min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                          {p.name}
                        </span>
                        {p.lastOpened && (
                          <span className="text-[10px] text-muted-foreground/50 shrink-0">
                            {formatRelativeTime(p.lastOpened)}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] font-mono text-muted-foreground/60 truncate mt-0.5">
                        {p.path}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0 ml-3 text-muted-foreground/40 group-hover:text-foreground transition-colors">
                    <span className="text-[10px] font-medium opacity-0 group-hover:opacity-100 transition-opacity hidden sm:inline">
                      Abrir
                    </span>
                    <ChevronRight className="size-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </button>
              ))
            ) : recentProjects.length > 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground">
                No se encontraron proyectos con ese criterio.
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <FolderOpen className="size-8 text-muted-foreground/40 mb-2" />
                <p className="text-xs font-medium text-foreground">
                  Aún no hay proyectos recientes
                </p>
                <p className="text-[11px] text-muted-foreground mt-1 max-w-xs">
                  Abre una carpeta para comenzar a trabajar en tu aplicación de Flutter.
                </p>
                <button
                  type="button"
                  onClick={handleOpenFolder}
                  className="mt-3.5 flex items-center gap-1.5 text-xs font-medium text-primary hover:underline cursor-pointer"
                >
                  <FolderOpen className="size-3.5" />
                  <span>Abrir carpeta local</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer info & persistent checkbox */}
        <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-border/30 text-xs text-muted-foreground">
          <div className="flex items-center gap-3 text-[11px] text-muted-foreground/70">
            <span>Atajos:</span>
            <span className="flex items-center gap-1">
              <Kbd className="text-[9px] px-1 font-mono">⌘B</Kbd>
              <span>Sidebar</span>
            </span>
            <span className="flex items-center gap-1">
              <Kbd className="text-[9px] px-1 font-mono">⌘J</Kbd>
              <span>Terminal</span>
            </span>
            <span className="flex items-center gap-1">
              <Kbd className="text-[9px] px-1 font-mono">F1</Kbd>
              <span>Comandos</span>
            </span>
          </div>

          <label className="flex items-center gap-2 cursor-pointer select-none hover:text-foreground transition-colors">
            <input
              type="checkbox"
              checked={showWelcomeOnStartup}
              onChange={(e) => setShowWelcomeOnStartup(e.target.checked)}
              className="size-3.5 rounded border-border text-primary accent-primary cursor-pointer"
            />
            <span className="text-[11px]">Mostrar bienvenida al iniciar</span>
          </label>
        </div>
      </div>
    </div>
  );
}
