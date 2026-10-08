import * as React from "react";
import {
  BadgeCheck,
  Bell,
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
  Square
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
import { cn } from "@/lib/utils";
import { useWorkspaceStore } from "../model/workspace.store";

// ── types ─────────────────────────────────────────────────────────────────────

interface WorkspaceToolbarProps {
  projectName?: string | null;
  gitBranch?: string;
  leftPanel: boolean;
  bottomPanel: boolean;
  rightPanel: boolean;
  onToggleLeft: () => void;
  onToggleBottom: () => void;
  onToggleRight: () => void;
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
  leftPanel,
  bottomPanel,
  rightPanel,
  onToggleLeft,
  onToggleBottom,
  onToggleRight,
}: WorkspaceToolbarProps) {
  const panelState  = { left: leftPanel, bottom: bottomPanel, right: rightPanel };
  const panelToggle = { left: onToggleLeft, bottom: onToggleBottom, right: onToggleRight };

  const [daemonRunning, setDaemonRunning] = React.useState(false);
  const [appId, setAppId] = React.useState<string | null>(null);

  const devices = useWorkspaceStore((s) => s.devices);
  const selectedDeviceId = useWorkspaceStore((s) => s.selectedDeviceId);
  const setSelectedDeviceId = useWorkspaceStore((s) => s.setSelectedDeviceId);
  const projectPath = useWorkspaceStore((s) => s.projectPath);

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
    <div className="flex h-9 shrink-0 items-center justify-between border-b border-border/60 bg-background/80 px-3 backdrop-blur-sm">
      {projectName ? (
        <>
          {/* Left: project + branch */}
          <div className="flex items-center gap-2 min-w-[200px]">
            <span className="text-[12px] font-medium text-foreground truncate">
              {projectName}
            </span>
            {gitBranch && (
              <>
                <span className="text-border/80 select-none">/</span>
                <div className="flex items-center gap-1 rounded-full border border-border/60 bg-muted/40 px-2 py-0.5">
                  <GitBranch className="size-2.5 shrink-0 text-muted-foreground" />
                  <span className="text-[10.5px] font-medium text-muted-foreground truncate max-w-[160px]">
                    {gitBranch}
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Center: Android Debug Controls */}
          <div className="flex items-center justify-center flex-1 gap-6">
            {/* Run Configurations */}
            <div className="flex items-center bg-transparent">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-7 px-2.5 text-[12px] font-normal gap-2 text-muted-foreground hover:text-foreground">
                    {selectedDevice ? selectedDevice.name : (devices.length > 0 ? devices[0].name : "No Devices")}
                    <ChevronDown className="size-3.5 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center" className="min-w-[160px]">
                  {devices.length === 0 ? (
                    <DropdownMenuItem disabled>No devices detected</DropdownMenuItem>
                  ) : (
                    devices.map((device: any) => (
                      <DropdownMenuItem
                        key={device.id}
                        onClick={() => setSelectedDeviceId(device.id)}
                        className={cn("text-xs cursor-pointer", selectedDeviceId === device.id && "font-semibold text-primary")}
                      >
                        {device.name} {device.targetPlatform ? `(${device.targetPlatform})` : ""}
                      </DropdownMenuItem>
                    ))
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
              
              <Button variant="ghost" className="h-7 px-2.5 text-[12px] font-normal gap-2 text-muted-foreground hover:text-foreground">
                <Bot className="size-4 text-emerald-500" />
                app
                <ChevronDown className="size-3.5 opacity-50" />
              </Button>

              <div className="flex items-center gap-1 ml-2">
                {daemonRunning ? (
                  <Button onClick={handleStop} variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-400 hover:bg-red-500/10">
                    <Square className="size-4 fill-current" />
                  </Button>
                ) : (
                  <Button onClick={handlePlay} variant="ghost" size="icon" className="h-7 w-7 text-emerald-500 hover:text-emerald-400 hover:bg-emerald-500/10">
                    <Play className="size-4 fill-current" />
                  </Button>
                )}
                <Button variant="ghost" size="icon" className="h-7 w-7 text-emerald-500 hover:text-emerald-400 hover:bg-emerald-500/10">
                  <Bug className="size-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground">
                  <MoreVertical className="size-4" />
                </Button>
              </div>
            </div>

            {/* Build & Debug Actions */}
            <div className="flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground">
                    <Hammer className="size-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" sideOffset={6}>Make Project</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button onClick={handleHotReload} disabled={!daemonRunning} variant="ghost" size="icon" className="h-7 w-7 text-sky-400 hover:text-sky-300">
                    <RefreshCcw className="size-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" sideOffset={6}>Apply Changes</TooltipContent>
              </Tooltip>

              <div className="w-px h-4 bg-border/60 mx-1" />

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button onClick={handleHotRestart} disabled={!daemonRunning} variant="ghost" size="icon" className="h-7 w-7 text-emerald-500 hover:text-emerald-400">
                    <StepForward className="size-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" sideOffset={6}>Step Over</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground">
                    <CornerUpRight className="size-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" sideOffset={6}>Step Out</TooltipContent>
              </Tooltip>
              
              <div className="w-px h-4 bg-border/60 mx-1" />

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground">
                    <Layers className="size-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" sideOffset={6}>Sync Project with Gradle Files</TooltipContent>
              </Tooltip>
            </div>
          </div>
        </>
      ) : (
        <div className="flex-1" />
      )}

      {/* Right: layout toggles + avatar */}
      <div className="flex items-center gap-1">
        {/* Panel toggles */}
        <div className="flex items-center gap-0.5">
          {layoutButtons.map(({ key, icon: Icon, label, shortcut }) => (
            <Tooltip key={key}>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "size-7 rounded-md text-muted-foreground transition-none hover:bg-muted/60 hover:text-foreground",
                    panelState[key] && "bg-muted/80 text-foreground",
                  )}
                  aria-label={label}
                  aria-pressed={panelState[key]}
                  onClick={panelToggle[key]}
                >
                  <Icon className="size-3.5" />
                </Button>
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
        <div className="mx-1 h-4 w-px bg-border/60" />

        {/* User avatar — opens dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex size-7 items-center justify-center rounded-lg outline-none transition-all duration-150 hover:ring-2 hover:ring-border focus-visible:ring-2 focus-visible:ring-ring active:scale-95"
              aria-label="User menu"
            >
              <Avatar className="size-6 rounded-lg">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="rounded-lg text-[10px]">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            className="w-56 rounded-lg"
            side="bottom"
            align="end"
            sideOffset={6}
          >
            {/* User info header */}
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
    </div>
  );
}
