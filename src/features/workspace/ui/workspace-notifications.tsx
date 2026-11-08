import * as React from "react";
import {
  Bell,
  BellOff,
  CheckCircle2,
  Info,
  AlertTriangle,
  XCircle,
  X,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export interface WorkspaceNotification {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  timestamp: string;
}

const INITIAL_NOTIFICATIONS: WorkspaceNotification[] = [
  {
    id: "1",
    title: "Flutter SDK",
    message: "Motor Flutter y herramientas de Dart listas para compilar.",
    type: "success",
    timestamp: "Hace 1 min",
  },
  {
    id: "2",
    title: "Dart Analysis Server",
    message: "Servidor LSP conectado. Autocompletado y análisis semántico activos.",
    type: "info",
    timestamp: "Hace 3 min",
  },
  {
    id: "3",
    title: "Vela Studio",
    message: "Espacio de trabajo cargado correctamente.",
    type: "info",
    timestamp: "Hace 5 min",
  },
];

interface WorkspaceNotificationsProps {
  onClose?: () => void;
}

export function WorkspaceNotifications({ onClose }: WorkspaceNotificationsProps) {
  const [notifications, setNotifications] = React.useState<WorkspaceNotification[]>(INITIAL_NOTIFICATIONS);

  const handleDismiss = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const handleClearAll = () => {
    setNotifications([]);
  };

  const getNotificationIcon = (type: WorkspaceNotification["type"]) => {
    switch (type) {
      case "success":
        return <CheckCircle2 className="size-3.5 text-emerald-500 shrink-0 mt-0.5" />;
      case "warning":
        return <AlertTriangle className="size-3.5 text-amber-500 shrink-0 mt-0.5" />;
      case "error":
        return <XCircle className="size-3.5 text-destructive shrink-0 mt-0.5" />;
      case "info":
      default:
        return <Info className="size-3.5 text-primary shrink-0 mt-0.5" />;
    }
  };

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-background select-none">
      {/* Header */}
      <div className="flex h-9 items-center justify-between px-3 shrink-0">
        <div className="flex items-center gap-2">
          <Bell className="size-3.5 text-primary shrink-0" />
          <h2 className="text-[11px] font-semibold text-foreground">
            Notificaciones
          </h2>
          {notifications.length > 0 && (
            <span className="flex items-center justify-center size-4 rounded-full bg-primary/15 text-primary text-[10px] font-mono font-medium">
              {notifications.length}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          {notifications.length > 0 && (
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleClearAll}
                    className="size-6 text-muted-foreground hover:text-foreground cursor-pointer"
                    aria-label="Limpiar todo"
                  />
                }
              >
                <Trash2 className="size-3.5" />
              </TooltipTrigger>
              <TooltipContent side="bottom" sideOffset={6}>
                Limpiar todas
              </TooltipContent>
            </Tooltip>
          )}

          {onClose && (
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onClose}
                    className="size-6 text-muted-foreground hover:text-foreground cursor-pointer"
                    aria-label="Cerrar panel"
                  />
                }
              >
                <X className="size-3.5" />
              </TooltipTrigger>
              <TooltipContent side="bottom" sideOffset={6}>
                Cerrar panel
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {notifications.length > 0 ? (
          <ScrollArea className="h-full w-full">
            <div className="p-2 space-y-1.5">
              {notifications.map((item) => (
                <div
                  key={item.id}
                  className={cn(
                    "group relative flex items-start gap-2.5 p-2.5 rounded-lg",
                    "bg-muted/30 hover:bg-muted/50 transition-colors",
                    "shadow-2xs text-left"
                  )}
                >
                  {getNotificationIcon(item.type)}

                  <div className="flex-1 min-w-0 pr-4">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-medium text-foreground truncate">
                        {item.title}
                      </span>
                      <span className="text-[10px] text-muted-foreground/60 shrink-0">
                        {item.timestamp}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed mt-0.5 break-words">
                      {item.message}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDismiss(item.id)}
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted/60 cursor-pointer"
                    aria-label="Descartar notificación"
                  >
                    <X className="size-3" />
                  </button>
                </div>
              ))}
            </div>
          </ScrollArea>
        ) : (
          <div className="flex flex-col items-center justify-center h-full p-6 text-center">
            <div className="size-9 rounded-full bg-muted/30 flex items-center justify-center mb-2.5 text-muted-foreground/40">
              <BellOff className="size-4" />
            </div>
            <p className="text-xs font-medium text-foreground mb-1">
              Sin notificaciones
            </p>
            <p className="text-[11px] text-muted-foreground max-w-[200px] leading-relaxed">
              Todos los avisos de compilación, alertas y eventos del sistema aparecerán aquí.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
