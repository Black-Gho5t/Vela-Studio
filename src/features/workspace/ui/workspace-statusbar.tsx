import {
  GitBranch,
  XCircle,
  AlertTriangle,
  CheckCheck,
  RefreshCw,
  Radio,
  FileCode2,
  Loader2,
} from "lucide-react";
import { useWorkspaceStore } from "../model/workspace.store";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface WorkspaceStatusbarProps {
  gitBranch?: string | null;
  onToggleBottom?: () => void;
  onSelectBottomTab?: (tab: "PROBLEMS" | "OUTPUT" | "DEBUG CONSOLE" | "TERMINAL") => void;
}

export function WorkspaceStatusbar({
  gitBranch,
  onSelectBottomTab,
}: WorkspaceStatusbarProps) {
  const {
    tabs,
    activeTabId,
    cursorPosition,
    workspaceMode,
    projectName,
    isAppRunning,
    isAppLaunching,
    devices,
    selectedDeviceId,
  } = useWorkspaceStore();

  const selectedDevice = devices.find((d) => d.id === selectedDeviceId);

  const activeTab = tabs.find((t) => t.id === activeTabId);

  const getLanguageLabel = (fileName?: string) => {
    if (!fileName) return "Plain Text";
    const ext = fileName.split(".").pop()?.toLowerCase();
    switch (ext) {
      case "dart":
        return "Dart";
      case "ts":
        return "TypeScript";
      case "tsx":
        return "TypeScript React";
      case "js":
        return "JavaScript";
      case "jsx":
        return "JavaScript React";
      case "json":
        return "JSON";
      case "yaml":
      case "yml":
        return "YAML";
      case "md":
        return "Markdown";
      case "html":
        return "HTML";
      case "css":
        return "CSS";
      default:
        return ext ? ext.toUpperCase() : "Plain Text";
    }
  };

  const language =
    activeTab && activeTab.id !== "welcome"
      ? getLanguageLabel(activeTab.name)
      : null;

  return (
    <footer className="relative flex h-[28px] w-full shrink-0 items-center justify-between bg-background px-3 pb-1.5 text-[11px] text-muted-foreground select-none z-20">
      {/* ── Left items ── */}
      <div className="flex items-center gap-1 min-w-0">
        {/* Git branch */}
        {projectName && (
          <Tooltip>
            <TooltipTrigger
              render={
                <button
                  type="button"
                  className="flex items-center gap-1 rounded px-1.5 py-0.5 hover:bg-muted/50 hover:text-foreground transition-colors cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              }
            >
              <GitBranch className="size-3 shrink-0" />
              <span className="truncate max-w-[120px] font-medium">
                {gitBranch || "main"}
              </span>
              <RefreshCw className="size-2.5 opacity-50 shrink-0 ml-0.5" />
            </TooltipTrigger>
            <TooltipContent side="top" sideOffset={6}>
              Rama Git actual ({gitBranch || "main"})
            </TooltipContent>
          </Tooltip>
        )}

        {/* Problems & Warnings indicator */}
        <Tooltip>
          <TooltipTrigger
            render={
              <button
                type="button"
                onClick={() => onSelectBottomTab?.("PROBLEMS")}
                className="flex items-center gap-2 rounded px-1.5 py-0.5 hover:bg-muted/50 hover:text-foreground transition-colors cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            }
          >
            <span className="flex items-center gap-1">
              <XCircle className="size-3 text-muted-foreground/60" />
              <span>0</span>
            </span>
            <span className="flex items-center gap-1">
              <AlertTriangle className="size-3 text-muted-foreground/60" />
              <span>0</span>
            </span>
          </TooltipTrigger>
          <TooltipContent side="top" sideOffset={6}>
            Problemas: 0 errores, 0 advertencias
          </TooltipContent>
        </Tooltip>

        <div className="h-3 w-px bg-foreground/10 mx-0.5" />

        {/* Flutter / Dart status */}
        <Tooltip>
          <TooltipTrigger
            render={
              <button
                type="button"
                onClick={() => onSelectBottomTab?.("TERMINAL")}
                className="flex items-center gap-1.5 rounded px-1.5 py-0.5 hover:bg-muted/50 hover:text-foreground transition-colors cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            }
          >
            <Radio className="size-3 text-emerald-500 shrink-0" />
            <span className="truncate">Flutter 3.x</span>
          </TooltipTrigger>
          <TooltipContent side="top" sideOffset={6}>
            Entorno Flutter listo • Terminal interactiva
          </TooltipContent>
        </Tooltip>

        {/* Live Running / Launching Indicator */}
        {isAppRunning && (
          <Tooltip>
            <TooltipTrigger
              render={
                <button
                  type="button"
                  onClick={() => onSelectBottomTab?.("OUTPUT")}
                  className="flex items-center gap-1.5 rounded px-2 py-0.5 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors cursor-pointer"
                />
              }
            >
              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="truncate font-medium">App en ejecución ({selectedDevice?.name || "Flutter"})</span>
            </TooltipTrigger>
            <TooltipContent side="top" sideOffset={6}>
              Clic para ver registros de ejecución
            </TooltipContent>
          </Tooltip>
        )}
        {isAppLaunching && (
          <Tooltip>
            <TooltipTrigger
              render={
                <button
                  type="button"
                  onClick={() => onSelectBottomTab?.("OUTPUT")}
                  className="flex items-center gap-1.5 rounded px-2 py-0.5 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition-colors cursor-pointer"
                />
              }
            >
              <Loader2 className="size-3 animate-spin text-amber-400" />
              <span className="truncate font-medium">Compilando app...</span>
            </TooltipTrigger>
            <TooltipContent side="top" sideOffset={6}>
              Clic para ver registros de compilación
            </TooltipContent>
          </Tooltip>
        )}
      </div>

      {/* ── Right items ── */}
      <div className="flex items-center gap-1 shrink-0">
        {/* Editor details (only in Editor mode with an active code tab) */}
        {workspaceMode === "editor" && activeTab && activeTab.id !== "welcome" && (
          <>
            {/* Cursor position */}
            <Tooltip>
              <TooltipTrigger
                render={
                  <button
                    type="button"
                    className="flex items-center gap-1 rounded px-1.5 py-0.5 hover:bg-muted/50 hover:text-foreground transition-colors cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-ring font-mono text-[10.5px]"
                  />
                }
              >
                <span>
                  Ln {cursorPosition?.line ?? 1}, Col {cursorPosition?.column ?? 1}
                </span>
              </TooltipTrigger>
              <TooltipContent side="top" sideOffset={6}>
                Línea y columna del cursor
              </TooltipContent>
            </Tooltip>

            {/* Indentation */}
            <Tooltip>
              <TooltipTrigger
                render={
                  <button
                    type="button"
                    className="rounded px-1.5 py-0.5 hover:bg-muted/50 hover:text-foreground transition-colors cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                }
              >
                <span>Espacios: 2</span>
              </TooltipTrigger>
              <TooltipContent side="top" sideOffset={6}>
                Tamaño de tabulación
              </TooltipContent>
            </Tooltip>

            {/* Encoding */}
            <span className="px-1.5 py-0.5 opacity-75">UTF-8</span>

            {/* Line ending */}
            <span className="px-1.5 py-0.5 opacity-75">LF</span>

            {/* Language */}
            {language && (
              <Tooltip>
                <TooltipTrigger
                  render={
                    <button
                      type="button"
                      className="flex items-center gap-1 rounded px-1.5 py-0.5 hover:bg-muted/50 hover:text-foreground transition-colors cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    />
                  }
                >
                  <FileCode2 className="size-3 text-primary/80 shrink-0" />
                  <span>{language}</span>
                </TooltipTrigger>
                <TooltipContent side="top" sideOffset={6}>
                  Lenguaje: {language}
                </TooltipContent>
              </Tooltip>
            )}

            {/* Formatter */}
            <Tooltip>
              <TooltipTrigger
                render={
                  <div className="flex items-center gap-1 px-1.5 py-0.5 opacity-80" />
                }
              >
                <CheckCheck className="size-3 text-emerald-500/80" />
                <span>Prettier</span>
              </TooltipTrigger>
              <TooltipContent side="top" sideOffset={6}>
                Formateador de código activo
              </TooltipContent>
            </Tooltip>
          </>
        )}
      </div>
    </footer>
  );
}
