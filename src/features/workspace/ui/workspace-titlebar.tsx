import * as React from "react";
import {
  Check,
  CreditCard,
  GitBranch,
  LogOut,
  PanelBottom,
  PanelLeft,
  PanelRight,
  Play,
  Bug,
  Hammer,
  CornerUpRight,
  ChevronDown,
  MoreVertical,
  Layers,
  Square,
  Layout,
  Code2,
  FolderOpen,
  FolderX,
  Smartphone,
  User,
  Users,
  HelpCircle,
  RotateCcw,
  Zap,
  FileCode2,
} from "lucide-react";
import { open as openDialog } from "@tauri-apps/plugin-dialog";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { usePlatform } from "@/hooks/use-platform";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useWorkspaceStore } from "../model/workspace.store";
import { WorkspaceMode } from "../model/workspace.types";

// ── types ─────────────────────────────────────────────────────────────────────

interface WorkspaceTitlebarProps {
  projectName?: string | null;
  gitBranch?: string;
  onBranchChange?: (branch: string) => void;
  leftPanel: boolean;
  bottomPanel: boolean;
  rightPanel: boolean;
  onToggleLeft: () => void;
  onToggleBottom: () => void;
  onToggleRight: () => void;
  mode?: WorkspaceMode;
  onModeChange?: (mode: WorkspaceMode) => void;
}

// ── constants ─────────────────────────────────────────────────────────────────

const layoutButtons = [
  { key: "left" as const,   icon: PanelLeft,   label: "Left panel",   shortcut: "⌘B" },
  { key: "bottom" as const, icon: PanelBottom, label: "Bottom panel", shortcut: "⌘J" },
  { key: "right" as const,  icon: PanelRight,  label: "Right panel",  shortcut: "⌘⇧R" },
] as const;

const user = {
  name: "Brian Pech",
  email: "brian@example.com",
};

// ── component ─────────────────────────────────────────────────────────────────

export function WorkspaceTitlebar({
  projectName,
  gitBranch,
  onBranchChange,
  leftPanel,
  bottomPanel,
  rightPanel,
  onToggleLeft,
  onToggleBottom,
  onToggleRight,
  mode,
  onModeChange,
}: WorkspaceTitlebarProps) {
  const panelState  = { left: leftPanel, bottom: bottomPanel, right: rightPanel };
  const panelToggle = { left: onToggleLeft, bottom: onToggleBottom, right: onToggleRight };

  const [daemonRunning, setDaemonRunning] = React.useState(false);
  const [appId, setAppId] = React.useState<string | null>(null);

  const [branches, setBranches] = React.useState<string[]>([]);
  const [isLoadingBranches, setIsLoadingBranches] = React.useState(false);
  const [isSwitchingBranch, setIsSwitchingBranch] = React.useState(false);
  const [branchError, setBranchError] = React.useState<string | null>(null);
  const [branchSearch, setBranchSearch] = React.useState("");
  const [isBranchMenuOpen, setIsBranchMenuOpen] = React.useState(false);

  const devices = useWorkspaceStore((s) => s.devices);
  const selectedDeviceId = useWorkspaceStore((s) => s.selectedDeviceId);
  const setSelectedDeviceId = useWorkspaceStore((s) => s.setSelectedDeviceId);
  const projectPath = useWorkspaceStore((s) => s.projectPath);

  const storeMode = useWorkspaceStore((s) => s.workspaceMode);
  const storeSetMode = useWorkspaceStore((s) => s.setWorkspaceMode);

  const currentMode = mode ?? storeMode ?? "editor";
  const handleModeChange = onModeChange ?? storeSetMode;

  const fetchBranches = React.useCallback(async () => {
    if (!projectPath) return;
    setIsLoadingBranches(true);
    setBranchError(null);
    try {
      const list = await invoke<string[]>("get_git_branches", { path: projectPath });
      setBranches(list);
    } catch (err) {
      console.error("Failed to load branches:", err);
      setBranchError("No se pudieron cargar las ramas");
    } finally {
      setIsLoadingBranches(false);
    }
  }, [projectPath]);

  const handleSwitchBranch = async (branchName: string) => {
    if (!projectPath || branchName === gitBranch || isSwitchingBranch) return;
    setIsSwitchingBranch(true);
    setBranchError(null);
    try {
      await invoke<string>("switch_git_branch", {
        path: projectPath,
        branch: branchName,
      });
      onBranchChange?.(branchName);
      setIsBranchMenuOpen(false);

      // Refresh directory tree so changed files reflect in the explorer
      try {
        const tree = await invoke<any>("get_directory_tree", { path: projectPath });
        useWorkspaceStore.getState().setFileTree(tree);
      } catch {}
    } catch (err: any) {
      console.error("Failed to switch branch:", err);
      setBranchError(String(err));
    } finally {
      setIsSwitchingBranch(false);
    }
  };

  const filteredBranches = React.useMemo(() => {
    if (!branchSearch.trim()) return branches;
    return branches.filter((b) =>
      b.toLowerCase().includes(branchSearch.toLowerCase().trim())
    );
  }, [branches, branchSearch]);

  React.useEffect(() => {
    let unlisten: (() => void) | undefined;
    listen<string>("flutter-daemon-msg", (event) => {
      try {
        const raw = JSON.parse(event.payload);
        const msg = Array.isArray(raw) ? raw[0] : raw;
        if (!msg) return;

        if (msg.event === "app.start") {
          setDaemonRunning(true);
          if (msg.params?.appId) {
            setAppId(msg.params.appId);
          }
        } else if (msg.event === "app.stop") {
          setDaemonRunning(false);
          setAppId(null);
        }
      } catch (e) {
        // Not a JSON message, ignore
      }
    }).then((f) => {
      unlisten = f;
    });
    return () => unlisten?.();
  }, []);

  const handlePlay = async () => {
    if (!projectName || !projectPath) return;
    try {
      await invoke("start_flutter_daemon", {
        projectPath,
        deviceId: selectedDeviceId,
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleHotReload = async () => {
    try {
      await invoke("send_flutter_daemon_message", { 
        message: JSON.stringify([{ id: Date.now(), method: "app.restart", params: { ...(appId ? { appId } : {}), fullRestart: false } }]) 
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleHotRestart = async () => {
    try {
      await invoke("send_flutter_daemon_message", { 
        message: JSON.stringify([{ id: Date.now(), method: "app.restart", params: { ...(appId ? { appId } : {}), fullRestart: true } }]) 
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleStop = async () => {
    try {
      await invoke("send_flutter_daemon_message", { 
        message: JSON.stringify([{ id: Date.now(), method: "app.stop", params: { ...(appId ? { appId } : {}) } }]) 
      });
      setDaemonRunning(false);
      setAppId(null);
    } catch (err) {
      console.error(err);
    }
  };

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  const selectedDevice = devices.find((d) => d.id === selectedDeviceId);
  const { hasMacTitleBarOffset } = usePlatform();

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

  const handleNewFile = () => {
    const newTabId = `untitled-${Date.now()}`;
    useWorkspaceStore.getState().addTab({
      id: newTabId,
      name: "untitled.dart",
      path: "untitled.dart",
      content:
        "// New Dart File\nimport 'package:flutter/material.dart';\n\nvoid main() {\n  runApp(const MyApp());\n}\n\nclass MyApp extends StatelessWidget {\n  const MyApp({super.key});\n\n  @override\n  Widget build(BuildContext context) {\n    return const MaterialApp(\n      home: Scaffold(\n        body: Center(\n          child: Text('Hello, Vela!'),\n        ),\n      ),\n    );\n  }\n}\n",
      isActive: true,
      isModified: true,
    });
  };

  const handleCloseFolder = () => {
    useWorkspaceStore.getState().closeFolder();
  };

  React.useEffect(() => {
    let unlistenClose: (() => void) | null = null;
    let unlistenOpen: (() => void) | null = null;
    let unlistenNew: (() => void) | null = null;

    listen("menu-close-folder", () => {
      useWorkspaceStore.getState().closeFolder();
    }).then((u) => {
      unlistenClose = u;
    });

    listen("menu-open-folder", () => {
      handleOpenFolder();
    }).then((u) => {
      unlistenOpen = u;
    });

    listen("menu-new-project", () => {
      useWorkspaceStore.getState().setFlutterWizardOpen(true);
    }).then((u) => {
      unlistenNew = u;
    });

    return () => {
      unlistenClose?.();
      unlistenOpen?.();
      unlistenNew?.();
    };
  }, []);

  return (
    <header
      data-tauri-drag-region
      className={cn(
        "relative flex h-[36px] w-full shrink-0 items-center justify-between bg-background/95 backdrop-blur select-none z-20 transition-[padding] duration-150",
        hasMacTitleBarOffset ? "pl-[78px] pr-3" : "px-3"
      )}
    >
      {/* Background drag region spanning the entire header for macOS window dragging */}
      <div
        data-tauri-drag-region
        className="absolute inset-0 z-0 pointer-events-auto"
      />

      {/* ── Left: Tabs (Diseñador / Editor) + Project info ── */}
      <div data-tauri-drag-region className="relative flex items-center gap-3 min-w-0 z-10">
        <Tabs
          value={currentMode}
          onValueChange={(val) => {
            if (val === "designer" || val === "editor") {
              handleModeChange(val);
            }
          }}
          className="flex-row items-center"
        >
          <TabsList className="group-data-horizontal/tabs:h-7 h-7 bg-muted/40 p-0.5 rounded-lg border-0">
            <TabsTrigger
              value="designer"
              className="h-6 min-w-[70px] justify-center px-2 text-xs font-medium gap-1 rounded-md text-muted-foreground transition-colors hover:text-foreground data-active:bg-background data-active:text-foreground data-active:shadow-xs"
            >
              <Layout className="size-3.5 opacity-70" />
              <span>Diseñador</span>
            </TabsTrigger>
            <TabsTrigger
              value="editor"
              className="h-6 min-w-[70px] justify-center px-2 text-xs font-medium gap-1 rounded-md text-muted-foreground transition-colors hover:text-foreground data-active:bg-background data-active:text-foreground data-active:shadow-xs"
            >
              <Code2 className="size-3.5 opacity-70" />
              <span>Editor</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* File Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button
                type="button"
                className="flex items-center gap-1 h-6 rounded-md px-2 text-xs font-medium text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors cursor-pointer select-none outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <span>File</span>
                <ChevronDown className="size-2.5 opacity-50 shrink-0" />
              </button>
            }
          />
          <DropdownMenuContent align="start" sideOffset={6} className="w-56 p-1 text-xs">
            <DropdownMenuGroup>
              <DropdownMenuItem
                onClick={() => useWorkspaceStore.getState().setFlutterWizardOpen(true)}
                className="cursor-pointer gap-2"
              >
                <Smartphone className="size-3.5 text-primary" />
                <span>New Flutter Project…</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleNewFile}
                className="cursor-pointer gap-2"
              >
                <FileCode2 className="size-3.5 text-muted-foreground" />
                <span>New File</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem
                onClick={handleOpenFolder}
                className="cursor-pointer gap-2"
              >
                <FolderOpen className="size-3.5 text-muted-foreground" />
                <span>Open Folder…</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem
                disabled={!projectPath}
                onClick={handleCloseFolder}
                className="cursor-pointer gap-2 text-destructive focus:text-destructive focus:bg-destructive/10"
              >
                <FolderX className="size-3.5" />
                <span>Close Folder</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        {projectName ? (
          <>
            <div className="h-3 w-px bg-foreground/10" />
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-xs font-medium text-foreground truncate max-w-[110px]" title={projectName}>
                {projectName}
              </span>
              {gitBranch && (
                <DropdownMenu
                  open={isBranchMenuOpen}
                  onOpenChange={(open) => {
                    setIsBranchMenuOpen(open);
                    if (open) {
                      fetchBranches();
                      setBranchSearch("");
                      setBranchError(null);
                    }
                  }}
                >
                  <DropdownMenuTrigger
                    render={
                      <button
                        type="button"
                        disabled={isSwitchingBranch}
                        className={cn(
                          "group/branch flex items-center gap-1 rounded-full bg-muted/40 hover:bg-muted/70 px-2 py-0.5 text-muted-foreground",
                          "transition-all duration-150 hover:text-foreground cursor-pointer select-none outline-none",
                          "focus-visible:ring-1 focus-visible:ring-ring active:scale-95",
                          isSwitchingBranch && "opacity-70 pointer-events-none"
                        )}
                        title="Cambiar rama de Git"
                      />
                    }
                  >
                    <GitBranch className={cn("size-2.5 shrink-0 text-muted-foreground group-hover/branch:text-foreground", isSwitchingBranch && "animate-spin")} />
                    <span className="text-[10px] font-medium text-muted-foreground group-hover/branch:text-foreground truncate max-w-[85px]">
                      {isSwitchingBranch ? "Cambiando..." : gitBranch}
                    </span>
                    <ChevronDown className="size-2.5 opacity-50 shrink-0 group-hover/branch:opacity-80" />
                  </DropdownMenuTrigger>

                  <DropdownMenuContent align="start" sideOffset={6} className="w-60 p-1 text-xs">
                    <DropdownMenuGroup>
                      <DropdownMenuLabel className="px-2 py-1.5 text-[10.5px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <GitBranch className="size-3" />
                          Ramas
                        </span>
                        <span className="text-[9.5px] font-normal lowercase opacity-70">
                          {branches.length} en total
                        </span>
                      </DropdownMenuLabel>
                    </DropdownMenuGroup>

                    {branchError && (
                      <div className="mx-1 my-1 p-2 bg-destructive/10 text-destructive text-[11px] rounded border border-destructive/20 leading-tight">
                        {branchError}
                      </div>
                    )}

                    {branches.length > 5 && (
                      <div className="px-1 pb-1">
                        <input
                          type="text"
                          value={branchSearch}
                          onChange={(e) => setBranchSearch(e.target.value)}
                          placeholder="Buscar rama..."
                          className="w-full h-6 px-2 text-[11px] bg-muted/40 border border-border/60 rounded outline-none focus:border-ring placeholder:text-muted-foreground/60 text-foreground"
                          onClick={(e) => e.stopPropagation()}
                          onKeyDown={(e) => e.stopPropagation()}
                        />
                      </div>
                    )}

                    <DropdownMenuSeparator />

                    <div className="max-h-56 overflow-y-auto no-scrollbar">
                      {isLoadingBranches ? (
                        <div className="p-3 text-center text-[11px] text-muted-foreground animate-pulse">
                          Cargando ramas...
                        </div>
                      ) : filteredBranches.length === 0 ? (
                        <div className="p-3 text-center text-[11px] text-muted-foreground">
                          {branches.length === 0 ? "No se encontraron ramas" : "Sin coincidencias"}
                        </div>
                      ) : (
                        <DropdownMenuGroup>
                          {filteredBranches.map((b) => {
                            const isCurrent = b === gitBranch;
                            return (
                              <DropdownMenuItem
                                key={b}
                                onClick={() => handleSwitchBranch(b)}
                                disabled={isCurrent || isSwitchingBranch}
                                className={cn(
                                  "flex items-center justify-between px-2 py-1.5 text-xs rounded-sm cursor-pointer",
                                  isCurrent && "font-semibold text-primary bg-primary/10 cursor-default"
                                )}
                              >
                                <div className="flex items-center gap-2 truncate">
                                  <GitBranch className={cn("size-3 shrink-0", isCurrent ? "text-primary" : "text-muted-foreground")} />
                                  <span className="truncate">{b}</span>
                                </div>
                                {isCurrent && <Check className="size-3 text-primary shrink-0 ml-1" />}
                              </DropdownMenuItem>
                            );
                          })}
                        </DropdownMenuGroup>
                      )}
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </>
        ) : (
          <>
            <div className="h-3 w-px bg-foreground/10" />
            <button
              type="button"
              onClick={handleOpenFolder}
              className="flex items-center gap-1.5 rounded-md bg-muted/40 hover:bg-muted/70 px-2.5 py-1 text-xs text-muted-foreground transition-all duration-150 hover:text-foreground cursor-pointer select-none outline-none focus-visible:ring-1 focus-visible:ring-ring active:scale-95"
            >
              <FolderOpen className="size-3 text-muted-foreground" />
              <span>Abrir carpeta</span>
            </button>
          </>
        )}
      </div>

      {/* ── Center: Flutter / Android Debug & Build Controls (Dead Center, hidden in designer mode) ── */}
      <div className="absolute inset-x-0 top-0 bottom-0 flex items-center justify-center pointer-events-none z-10">
        {projectName && currentMode !== "designer" ? (
          <div className="pointer-events-auto flex items-center gap-1 rounded-lg bg-muted/40 hover:bg-muted/50 transition-colors p-0.5 shadow-2xs">
            {/* Target Device Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6.5 px-2 text-[11.5px] font-normal gap-1.5 text-muted-foreground hover:text-foreground cursor-pointer"
                  />
                }
              >
                <span
                  className={cn(
                    "size-1.5 rounded-full shrink-0 transition-colors",
                    daemonRunning
                      ? "bg-emerald-500 animate-pulse ring-2 ring-emerald-500/20"
                      : selectedDevice
                      ? "bg-emerald-500"
                      : "bg-muted-foreground/40"
                  )}
                />
                <span className="truncate max-w-[110px]">
                  {selectedDevice ? selectedDevice.name : (devices.length > 0 ? devices[0].name : "No Devices")}
                </span>
                <ChevronDown className="size-3 opacity-50 shrink-0" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="min-w-[170px]">
                <DropdownMenuGroup>
                  {devices.length === 0 ? (
                    <DropdownMenuItem disabled className="text-xs">No devices detected</DropdownMenuItem>
                  ) : (
                    devices.map((device: any) => (
                      <DropdownMenuItem
                        key={device.id}
                        onClick={() => setSelectedDeviceId(device.id)}
                        className={cn(
                          "text-xs cursor-pointer flex items-center justify-between",
                          selectedDeviceId === device.id && "font-semibold text-primary"
                        )}
                      >
                        <span>{device.name}</span>
                        {device.targetPlatform && (
                          <span className="text-[10px] text-muted-foreground ml-2">
                            ({device.targetPlatform})
                          </span>
                        )}
                      </DropdownMenuItem>
                    ))
                  )}
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="w-px h-3 bg-foreground/10 shrink-0" />

            {/* Target Entry / main.dart */}
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6.5 px-2 text-[11.5px] font-normal gap-1.5 text-muted-foreground hover:text-foreground cursor-pointer"
                  />
                }
              >
                <FileCode2 className="size-3 text-primary shrink-0" />
                <span className="truncate max-w-[90px]">main.dart</span>
                <ChevronDown className="size-3 opacity-50 shrink-0" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="min-w-[150px]">
                <DropdownMenuGroup>
                  <DropdownMenuItem className="text-xs cursor-pointer font-semibold text-primary">
                    <FileCode2 className="size-3 mr-1.5" />
                    <span>main.dart</span>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="w-px h-3.5 bg-foreground/15 shrink-0 mx-0.5" />

            {/* Action Buttons: Run/Stop, Debug, Hot Reload, Hot Restart, More */}
            <div className="flex items-center gap-0.5">
              {daemonRunning ? (
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <Button
                        onClick={handleStop}
                        variant="ghost"
                        size="icon"
                        className="size-6.5 text-destructive hover:bg-destructive/15 cursor-pointer"
                      />
                    }
                  >
                    <Square className="size-3 fill-current" />
                  </TooltipTrigger>
                  <TooltipContent side="bottom" sideOffset={6}>Stop</TooltipContent>
                </Tooltip>
              ) : (
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <Button
                        onClick={handlePlay}
                        variant="ghost"
                        size="icon"
                        className="size-6.5 text-emerald-500 hover:text-emerald-400 hover:bg-emerald-500/15 cursor-pointer"
                      />
                    }
                  >
                    <Play className="size-3 fill-current" />
                  </TooltipTrigger>
                  <TooltipContent side="bottom" sideOffset={6}>Run (main.dart)</TooltipContent>
                </Tooltip>
              )}

              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-6.5 text-muted-foreground hover:text-foreground hover:bg-muted/50 cursor-pointer"
                    />
                  }
                >
                  <Bug className="size-3.5" />
                </TooltipTrigger>
                <TooltipContent side="bottom" sideOffset={6}>Debug</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      onClick={handleHotReload}
                      disabled={!daemonRunning}
                      variant="ghost"
                      size="icon"
                      className="size-6.5 text-amber-500 hover:text-amber-400 hover:bg-amber-500/15 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                    />
                  }
                >
                  <Zap className="size-3.5 fill-current" />
                </TooltipTrigger>
                <TooltipContent side="bottom" sideOffset={6}>Hot Reload (⚡)</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      onClick={handleHotRestart}
                      disabled={!daemonRunning}
                      variant="ghost"
                      size="icon"
                      className="size-6.5 text-primary hover:bg-primary/15 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                    />
                  }
                >
                  <RotateCcw className="size-3" />
                </TooltipTrigger>
                <TooltipContent side="bottom" sideOffset={6}>Hot Restart (⇧⌘\)</TooltipContent>
              </Tooltip>

              {/* More Actions Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-6.5 text-muted-foreground hover:text-foreground cursor-pointer"
                    />
                  }
                >
                  <MoreVertical className="size-3.5" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center" className="min-w-[180px]">
                  <DropdownMenuGroup>
                    <DropdownMenuItem className="text-xs cursor-pointer">
                      <Hammer className="size-3.5 mr-2 text-muted-foreground" />
                      <span>Compilar proyecto</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-xs cursor-pointer">
                      <Layers className="size-3.5 mr-2 text-muted-foreground" />
                      <span>Sincronizar Gradle / Pub</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-xs cursor-pointer">
                      <CornerUpRight className="size-3.5 mr-2 text-muted-foreground" />
                      <span>Step Out</span>
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        ) : null}
      </div>


      {/* ── Right: Layout Toggles + User Avatar ── */}
      <div className="relative flex items-center gap-1.5 shrink-0 z-10 ml-auto">
        {/* Panel toggles (hidden in designer mode) */}
        {currentMode !== "designer" && (
          <>
            <div className="flex items-center gap-0.5">
              {layoutButtons.map(({ key, icon: Icon, label, shortcut }) => (
                <Tooltip key={key}>
                  <TooltipTrigger
                    render={
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className={cn(
                          "size-7 rounded-md text-muted-foreground transition-all duration-150 hover:bg-muted/60 hover:text-foreground",
                          panelState[key]
                            ? "text-foreground opacity-100 bg-muted/30"
                            : "opacity-60 hover:opacity-100"
                        )}
                        aria-label={label}
                        aria-pressed={panelState[key]}
                        onClick={panelToggle[key]}
                      />
                    }
                  >
                    <Icon className="size-3.5" />
                  </TooltipTrigger>
                  <TooltipContent side="bottom" sideOffset={6}>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{label}</span>
                      <span className="text-[10px] opacity-60">{shortcut}</span>
                    </div>
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>

            {/* Divider */}
            <div className="mx-1 h-3 w-px bg-foreground/10" />
          </>
        )}

        {/* User avatar dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button
                type="button"
                className="flex size-7 items-center justify-center rounded-lg outline-none transition-all duration-150 hover:ring-2 hover:ring-border focus-visible:ring-2 focus-visible:ring-ring active:scale-95"
                aria-label="User menu"
              />
            }
          >
            <Avatar name={user.name} className="size-6 rounded-lg">
              <AvatarImage alt={user.name} />
              <AvatarFallback className="rounded-lg text-[10px]">
                {initials}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            className="w-56 rounded-lg"
            side="bottom"
            align="end"
            sideOffset={6}
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5">
                  <Avatar name={user.name} className="h-8 w-8 rounded-lg">
                    <AvatarImage alt={user.name} />
                    <AvatarFallback className="rounded-lg text-xs">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">{user.name}</span>
                    <span className="truncate text-xs text-muted-foreground">
                      {user.email}
                    </span>
                  </div>
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>

            <DropdownMenuSeparator />

            <DropdownMenuGroup>
              <DropdownMenuItem className="cursor-pointer">
                <User className="size-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer">
                <Users className="size-4" />
                Community
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer">
                <CreditCard className="size-4" />
                Subscription
              </DropdownMenuItem>
            </DropdownMenuGroup>

            <DropdownMenuSeparator />

            <DropdownMenuGroup>
              <DropdownMenuItem className="cursor-pointer">
                <HelpCircle className="size-4" />
                Help Center
              </DropdownMenuItem>
            </DropdownMenuGroup>

            <DropdownMenuSeparator />

            <DropdownMenuItem className="cursor-pointer text-destructive focus:text-destructive">
              <LogOut className="size-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
