import * as React from "react";
import {
  BadgeCheck,
  Bell,
  Check,
  CreditCard,
  GitBranch,
  LogOut,
  PanelBottom,
  PanelLeft,
  PanelRight,
  Sparkles,
  Play,
  Bug,
  Hammer,
  RefreshCcw,
  StepForward,
  CornerUpRight,
  Bot,
  ChevronDown,
  MoreVertical,
  Layers,
  Square,
  Layout,
  Code2,
} from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";

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

interface WorkspaceToolbarProps {
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
  avatar: "https://github.com/shadcn.png",
};

// ── component ─────────────────────────────────────────────────────────────────

export function WorkspaceToolbar({
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
}: WorkspaceToolbarProps) {
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

  return (
    <header className="relative flex h-10 w-full shrink-0 items-center justify-between border-b border-border/60 bg-background/95 px-3 backdrop-blur select-none z-20">
      {/* ── Left: Tabs (Diseñador / Editor) + Project info ── */}
      <div className="flex items-center gap-3 min-w-0 z-10">
        <Tabs
          value={currentMode}
          onValueChange={(val) => {
            if (val === "designer" || val === "editor") {
              handleModeChange(val);
            }
          }}
          className="flex-row items-center"
        >
          <TabsList className="group-data-horizontal/tabs:h-7 h-7 bg-muted/60 p-0.5 rounded-lg border border-border/50">
            <TabsTrigger
              value="designer"
              className="h-6 min-w-[82px] justify-center px-2 text-xs font-medium gap-1.5 rounded-md text-muted-foreground transition-colors hover:text-foreground data-active:bg-background data-active:text-foreground data-active:shadow-xs"
            >
              <Layout className="size-3.5 opacity-70" />
              <span>Diseñador</span>
            </TabsTrigger>
            <TabsTrigger
              value="editor"
              className="h-6 min-w-[82px] justify-center px-2 text-xs font-medium gap-1.5 rounded-md text-muted-foreground transition-colors hover:text-foreground data-active:bg-background data-active:text-foreground data-active:shadow-xs"
            >
              <Code2 className="size-3.5 opacity-70" />
              <span>Editor</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {projectName && (
          <>
            <div className="h-3.5 w-px bg-border/60" />
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-xs font-medium text-foreground truncate max-w-[150px]" title={projectName}>
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
                          "group/branch flex items-center gap-1 rounded-full border border-border/60 bg-muted/40 px-2 py-0.5 text-muted-foreground",
                          "transition-all duration-150 hover:border-border hover:bg-muted/80 hover:text-foreground cursor-pointer select-none outline-none",
                          "focus-visible:ring-1 focus-visible:ring-ring active:scale-95",
                          isSwitchingBranch && "opacity-70 pointer-events-none"
                        )}
                        title="Cambiar rama de Git"
                      />
                    }
                  >
                    <GitBranch className={cn("size-2.5 shrink-0 text-muted-foreground group-hover/branch:text-foreground", isSwitchingBranch && "animate-spin")} />
                    <span className="text-[10px] font-medium text-muted-foreground group-hover/branch:text-foreground truncate max-w-[120px]">
                      {isSwitchingBranch ? "Cambiando..." : gitBranch}
                    </span>
                    <ChevronDown className="size-2.5 opacity-50 shrink-0 group-hover/branch:opacity-80" />
                  </DropdownMenuTrigger>

                  <DropdownMenuContent align="start" sideOffset={6} className="w-60 p-1 text-xs">
                    <DropdownMenuLabel className="px-2 py-1.5 text-[10.5px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <GitBranch className="size-3" />
                        Ramas
                      </span>
                      <span className="text-[9.5px] font-normal lowercase opacity-70">
                        {branches.length} en total
                      </span>
                    </DropdownMenuLabel>

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
                          className="w-full h-6 px-2 text-[11px] bg-muted/40 border border-border/50 rounded outline-none focus:border-primary placeholder:text-muted-foreground/60"
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
                        filteredBranches.map((b) => {
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
                        })
                      )}
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </>
        )}
      </div>

      {/* ── Center: Flutter / Android Debug & Build Controls (Dead Center) ── */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-auto z-10">
        {projectName ? (
          <div className="flex items-center gap-1 rounded-lg border border-border/50 bg-muted/20 px-1 py-0.5 shadow-2xs">
            {/* Target Device Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6.5 px-2 text-[11.5px] font-normal gap-1.5 text-muted-foreground hover:text-foreground"
                  />
                }
              >
                <span
                  className={cn(
                    "size-1.5 rounded-full shrink-0",
                    daemonRunning
                      ? "bg-emerald-500 animate-pulse"
                      : selectedDevice
                      ? "bg-emerald-500"
                      : "bg-muted-foreground/40"
                  )}
                />
                <span className="truncate max-w-[120px]">
                  {selectedDevice ? selectedDevice.name : (devices.length > 0 ? devices[0].name : "No Devices")}
                </span>
                <ChevronDown className="size-3 opacity-50 shrink-0" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="min-w-[170px]">
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
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="w-px h-3.5 bg-border/50" />

            {/* Target App Module */}
            <Button
              variant="ghost"
              size="sm"
              className="h-6.5 px-2 text-[11.5px] font-normal gap-1.5 text-muted-foreground hover:text-foreground"
            >
              <Bot className="size-3.5 text-emerald-500" />
              <span>app</span>
              <ChevronDown className="size-3 opacity-50" />
            </Button>

            <div className="w-px h-3.5 bg-border/50" />

            {/* Run / Stop / Debug Action Buttons */}
            <div className="flex items-center gap-0.5">
              {daemonRunning ? (
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <Button
                        onClick={handleStop}
                        variant="ghost"
                        size="icon"
                        className="size-6.5 text-red-500 hover:text-red-400 hover:bg-red-500/15"
                      />
                    }
                  >
                    <Square className="size-3.5 fill-current" />
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
                        className="size-6.5 text-emerald-500 hover:text-emerald-400 hover:bg-emerald-500/15"
                      />
                    }
                  >
                    <Play className="size-3.5 fill-current" />
                  </TooltipTrigger>
                  <TooltipContent side="bottom" sideOffset={6}>Run</TooltipContent>
                </Tooltip>
              )}

              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-6.5 text-emerald-500 hover:text-emerald-400 hover:bg-emerald-500/15"
                    />
                  }
                >
                  <Bug className="size-3.5" />
                </TooltipTrigger>
                <TooltipContent side="bottom" sideOffset={6}>Debug</TooltipContent>
              </Tooltip>

              <Button
                variant="ghost"
                size="icon"
                className="size-6.5 text-muted-foreground hover:text-foreground"
              >
                <MoreVertical className="size-3.5" />
              </Button>
            </div>

            <div className="w-px h-3.5 bg-border/50" />

            {/* Fast Actions: Build, Hot Reload, Hot Restart, Gradle Sync */}
            <div className="flex items-center gap-0.5">
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-6.5 text-muted-foreground hover:text-foreground"
                    />
                  }
                >
                  <Hammer className="size-3.5" />
                </TooltipTrigger>
                <TooltipContent side="bottom" sideOffset={6}>Make Project</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      onClick={handleHotReload}
                      disabled={!daemonRunning}
                      variant="ghost"
                      size="icon"
                      className="size-6.5 text-sky-400 hover:text-sky-300 disabled:opacity-40"
                    />
                  }
                >
                  <RefreshCcw className="size-3.5" />
                </TooltipTrigger>
                <TooltipContent side="bottom" sideOffset={6}>Apply Changes (Hot Reload)</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      onClick={handleHotRestart}
                      disabled={!daemonRunning}
                      variant="ghost"
                      size="icon"
                      className="size-6.5 text-emerald-500 hover:text-emerald-400 disabled:opacity-40"
                    />
                  }
                >
                  <StepForward className="size-3.5" />
                </TooltipTrigger>
                <TooltipContent side="bottom" sideOffset={6}>Hot Restart</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-6.5 text-muted-foreground hover:text-foreground"
                    />
                  }
                >
                  <CornerUpRight className="size-3.5" />
                </TooltipTrigger>
                <TooltipContent side="bottom" sideOffset={6}>Step Out</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-6.5 text-muted-foreground hover:text-foreground"
                    />
                  }
                >
                  <Layers className="size-3.5" />
                </TooltipTrigger>
                <TooltipContent side="bottom" sideOffset={6}>Sync Project with Gradle Files</TooltipContent>
              </Tooltip>
            </div>
          </div>
        ) : null}
      </div>

      {/* ── Right: Layout Toggles + User Avatar ── */}
      <div className="flex items-center gap-1.5 shrink-0 z-10 ml-auto">
        {/* Panel toggles */}
        <div className="flex items-center gap-0.5 rounded-lg border border-border/50 bg-muted/20 p-0.5">
          {layoutButtons.map(({ key, icon: Icon, label, shortcut }) => (
            <Tooltip key={key}>
              <TooltipTrigger
                render={
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "size-6 rounded-md text-muted-foreground transition-all hover:bg-muted hover:text-foreground",
                      panelState[key] && "bg-background text-foreground shadow-xs",
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
        <div className="mx-1 h-3.5 w-px bg-border/60" />

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
            <Avatar className="size-6 rounded-lg">
              <AvatarImage src={user.avatar} alt={user.name} />
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
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={user.avatar} alt={user.name} />
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

            <DropdownMenuSeparator />

            <DropdownMenuGroup>
              <DropdownMenuItem>
                <Sparkles className="size-4" />
                Upgrade to Pro
              </DropdownMenuItem>
            </DropdownMenuGroup>

            <DropdownMenuSeparator />

            <DropdownMenuGroup>
              <DropdownMenuItem>
                <BadgeCheck className="size-4" />
                Account
              </DropdownMenuItem>
              <DropdownMenuItem>
                <CreditCard className="size-4" />
                Billing
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Bell className="size-4" />
                Notifications
              </DropdownMenuItem>
            </DropdownMenuGroup>

            <DropdownMenuSeparator />

            <DropdownMenuItem>
              <LogOut className="size-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
