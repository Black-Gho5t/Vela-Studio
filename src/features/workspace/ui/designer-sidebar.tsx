import * as React from "react";
import { PanelLeftClose, Layers, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DesignerSidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  side?: "left" | "right";
  open?: boolean;
  onToggleMinimize?: () => void;
  title?: string;
  icon?: React.ReactNode;
}

export function DesignerSidebar({
  side = "left",
  open = true,
  onToggleMinimize,
  title,
  icon,
  className,
  children,
  ...props
}: DesignerSidebarProps) {
  const isRight = side === "right";

  return (
    <aside
      data-slot="designer-sidebar"
      data-side={side}
      className={cn(
        "absolute top-0 bottom-0 z-20 w-64 flex flex-col bg-sidebar text-sidebar-foreground transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] select-none",
        isRight
          ? "right-0 border-l border-sidebar-border"
          : "left-0 border-r border-sidebar-border",
        open
          ? "translate-x-0 shadow-lg"
          : isRight
            ? "translate-x-full pointer-events-none"
            : "-translate-x-full pointer-events-none",
        className
      )}
      {...props}
    >
      <div className="h-9 border-b border-sidebar-border/60 px-3 flex flex-row items-center justify-between shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          {icon ? (
            <>
              {icon}
              <span className="text-xs font-semibold text-foreground truncate tracking-tight">
                {title}
              </span>
            </>
          ) : isRight ? (
            <>
              <SlidersHorizontal className="size-3.5 text-primary shrink-0" />
              <span className="text-xs font-semibold text-foreground truncate tracking-tight">
                {title || "Propiedades"}
              </span>
            </>
          ) : (
            <>
              <Layers className="size-3.5 text-primary shrink-0" />
              <span className="text-xs font-semibold text-foreground truncate tracking-tight">
                {title || "Capas"}
              </span>
            </>
          )}
        </div>

        {!isRight && onToggleMinimize && (
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={onToggleMinimize}
            title="Minimizar panel"
            className="size-6 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <PanelLeftClose className="size-3.5" />
          </Button>
        )}
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto p-2">
        {children}
      </div>
    </aside>
  );
}
