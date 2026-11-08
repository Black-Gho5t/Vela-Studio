import * as React from "react";
import {
  Zap,
  RotateCw,
  Square,
  Trash2,
  Copy,
  Check,
  ArrowDownCircle,
  Play,
  Loader2,
  Terminal,
} from "lucide-react";
import { useWorkspaceStore } from "../model/workspace.store";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function WorkspaceOutputLogs() {
  const {
    executionLogs,
    isAppRunning,
    isAppLaunching,
    appId,
    selectedDeviceId,
    devices,
    startApp,
    stopApp,
    hotReloadApp,
    hotRestartApp,
    clearExecutionLogs,
  } = useWorkspaceStore();

  const [copied, setCopied] = React.useState(false);
  const [autoScroll, setAutoScroll] = React.useState(true);
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  // Auto scroll to bottom when new logs arrive
  React.useEffect(() => {
    if (autoScroll && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [executionLogs, autoScroll]);

  const handleCopyLogs = () => {
    if (executionLogs.length === 0) return;
    const text = executionLogs
      .map((l) => `[${l.timestamp}] [${l.level.toUpperCase()}] ${l.message}`)
      .join("\n");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const selectedDevice = devices.find((d) => d.id === selectedDeviceId);
  const deviceName = selectedDevice?.name || (devices.length > 0 ? devices[0].name : "Dispositivo");

  return (
    <div className="flex flex-col h-full w-full min-h-0 bg-background/95 select-text overflow-hidden">
      {/* ── Toolbar ── */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-border/60 bg-muted/20 shrink-0 select-none text-xs">
        {/* Left: Execution status & badges */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span
              className={cn(
                "size-2 rounded-full shrink-0 transition-colors",
                isAppRunning
                  ? "bg-emerald-500 animate-pulse ring-2 ring-emerald-500/20"
                  : isAppLaunching
                    ? "bg-amber-500 animate-pulse ring-2 ring-amber-500/20"
                    : "bg-muted-foreground/40"
              )}
            />
            <span className="font-medium text-[11px] text-foreground">
              {isAppRunning
                ? "En ejecución"
                : isAppLaunching
                  ? "Compilando..."
                  : "Detenido"}
            </span>
          </div>

          <span className="text-muted-foreground/40">•</span>

          <span className="text-[11px] text-muted-foreground font-mono">
            {deviceName}
          </span>

          {appId && (
            <span className="hidden sm:inline-flex px-1.5 py-0.2 rounded text-[9.5px] font-mono bg-muted text-muted-foreground border border-border/40">
              ID: {appId.slice(0, 8)}
            </span>
          )}

          <span className="text-[10px] text-muted-foreground/60">
            ({executionLogs.length} líneas)
          </span>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1">
          {/* Hot Reload */}
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  onClick={hotReloadApp}
                  disabled={!isAppRunning}
                  variant="ghost"
                  size="sm"
                  className="h-6 px-1.5 text-amber-500 hover:text-amber-400 hover:bg-amber-500/10 cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
                />
              }
            >
              <Zap className="size-3.5 fill-current mr-1" />
              <span className="text-[11px] font-medium hidden md:inline">Reload</span>
            </TooltipTrigger>
            <TooltipContent side="top" sideOffset={6}>
              Hot Reload (r)
            </TooltipContent>
          </Tooltip>

          {/* Hot Restart */}
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  onClick={hotRestartApp}
                  disabled={!isAppRunning}
                  variant="ghost"
                  size="sm"
                  className="h-6 px-1.5 text-sky-500 hover:text-sky-400 hover:bg-sky-500/10 cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
                />
              }
            >
              <RotateCw className="size-3.5 mr-1" />
              <span className="text-[11px] font-medium hidden md:inline">Restart</span>
            </TooltipTrigger>
            <TooltipContent side="top" sideOffset={6}>
              Hot Restart (Shift+R)
            </TooltipContent>
          </Tooltip>

          {/* Stop / Play */}
          {isAppRunning || isAppLaunching ? (
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    onClick={stopApp}
                    variant="ghost"
                    size="sm"
                    className="h-6 px-1.5 text-destructive hover:bg-destructive/15 cursor-pointer"
                  />
                }
              >
                <Square className="size-3.5 fill-current mr-1" />
                <span className="text-[11px] font-medium hidden md:inline">Detener</span>
              </TooltipTrigger>
              <TooltipContent side="top" sideOffset={6}>
                Detener aplicación Flutter
              </TooltipContent>
            </Tooltip>
          ) : (
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    onClick={() => startApp()}
                    variant="ghost"
                    size="sm"
                    className="h-6 px-1.5 text-emerald-500 hover:text-emerald-400 hover:bg-emerald-500/10 cursor-pointer"
                  />
                }
              >
                <Play className="size-3.5 fill-current mr-1" />
                <span className="text-[11px] font-medium hidden md:inline">Ejecutar</span>
              </TooltipTrigger>
              <TooltipContent side="top" sideOffset={6}>
                Iniciar Flutter (main.dart)
              </TooltipContent>
            </Tooltip>
          )}

          <div className="h-3 w-px bg-border/80 mx-1 shrink-0" />

          {/* Auto scroll toggle */}
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  onClick={() => setAutoScroll((v) => !v)}
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "size-6 cursor-pointer",
                    autoScroll
                      ? "text-primary bg-primary/10"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                />
              }
            >
              <ArrowDownCircle className="size-3.5" />
            </TooltipTrigger>
            <TooltipContent side="top" sideOffset={6}>
              {autoScroll ? "Desactivar auto-scroll" : "Activar auto-scroll"}
            </TooltipContent>
          </Tooltip>

          {/* Copy logs */}
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  onClick={handleCopyLogs}
                  disabled={executionLogs.length === 0}
                  variant="ghost"
                  size="icon"
                  className="size-6 text-muted-foreground hover:text-foreground cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
                />
              }
            >
              {copied ? <Check className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
            </TooltipTrigger>
            <TooltipContent side="top" sideOffset={6}>
              Copiar todos los registros
            </TooltipContent>
          </Tooltip>

          {/* Clear logs */}
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  onClick={clearExecutionLogs}
                  disabled={executionLogs.length === 0}
                  variant="ghost"
                  size="icon"
                  className="size-6 text-muted-foreground hover:text-destructive cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
                />
              }
            >
              <Trash2 className="size-3.5" />
            </TooltipTrigger>
            <TooltipContent side="top" sideOffset={6}>
              Limpiar registros de salida
            </TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* ── Running Banner ── */}
      {isAppRunning && (
        <div className="bg-emerald-500/10 border-b border-emerald-500/20 px-3 py-1 flex items-center justify-between text-[11px] text-emerald-400 shrink-0">
          <div className="flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-emerald-500 animate-ping" />
            <span className="font-medium">
              Flutter app corriendo en {deviceName}. Sincronización en tiempo real activa.
            </span>
          </div>
          <span className="text-[10px] text-emerald-500/70 hidden sm:inline">
            Presiona ⚡ para Hot Reload
          </span>
        </div>
      )}

      {/* ── Compiling Banner ── */}
      {isAppLaunching && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-3 py-1 flex items-center gap-2 text-[11px] text-amber-400 shrink-0">
          <Loader2 className="size-3 animate-spin shrink-0" />
          <span>Compilando y preparando aplicación para {deviceName}...</span>
        </div>
      )}

      {/* ── Log View Container ── */}
      <div
        ref={scrollContainerRef}
        className="flex-1 min-h-0 overflow-y-auto p-3 font-mono text-[11.5px] leading-relaxed space-y-0.5 selection:bg-primary/20"
      >
        {executionLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6 gap-2 select-none">
            <Terminal className="size-7 text-muted-foreground/30" />
            <span className="text-xs font-medium text-foreground">
              Sin registros de ejecución
            </span>
            <span className="text-[11px] text-muted-foreground/60 max-w-sm">
              Haz clic en el botón de reproducción (Play) en la barra superior para iniciar y compilar la aplicación Flutter.
            </span>
            <Button
              onClick={() => startApp()}
              size="sm"
              variant="outline"
              className="mt-2 h-7 text-xs gap-1.5 cursor-pointer text-emerald-500 hover:text-emerald-400 hover:bg-emerald-500/10"
            >
              <Play className="size-3 fill-current" />
              <span>Ejecutar app ahora</span>
            </Button>
          </div>
        ) : (
          executionLogs.map((log) => {
            const isError = log.level === "error";
            const isWarning = log.level === "stderr";
            const isSuccess = log.level === "success";
            const isProgress = log.level === "progress";

            return (
              <div
                key={log.id}
                className={cn(
                  "flex items-start gap-2 py-0.5 px-1 rounded transition-colors hover:bg-muted/30",
                  isError && "bg-destructive/10 text-rose-400 font-medium",
                  isWarning && "text-amber-400/90",
                  isSuccess && "text-emerald-400 font-medium",
                  isProgress && "text-sky-400",
                  !isError && !isWarning && !isSuccess && !isProgress && "text-muted-foreground"
                )}
              >
                <span className="text-[10px] text-muted-foreground/40 shrink-0 select-none pt-0.5">
                  [{log.timestamp}]
                </span>

                <span className="whitespace-pre-wrap break-all flex-1">
                  {log.message}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
