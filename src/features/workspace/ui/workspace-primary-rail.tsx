import {
  FolderKanban,
  GitBranch,
  Search,
  Settings2,
  Sparkles,
} from "lucide-react";
import * as React from "react";



import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { IDESettingsDialog } from "./ide-settings-dialog";

interface WorkspacePrimaryRailProps {
  activeView: "explorer" | "search" | "git";
  onViewChange: (view: "explorer" | "search" | "git") => void;
}

export function WorkspacePrimaryRail({ activeView, onViewChange }: WorkspacePrimaryRailProps) {
  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);

  const navigationItems = [
    {
      id: "explorer",
      label: "Explorer",
      description: "Estructura y archivos activos",
      icon: FolderKanban,
    },
    {
      id: "search",
      label: "Search",
      description: "Búsqueda global del proyecto",
      icon: Search,
    },
    {
      id: "git",
      label: "Git",
      description: "Cambios, ramas y commits",
      icon: GitBranch,
    },
    {
      id: "settings",
      label: "Settings",
      description: "Preferencias del editor",
      icon: Settings2,
    },
  ] as const;

  return (
    <>
      <div className="flex h-full w-12 shrink-0 flex-col items-center justify-between border-r border-border bg-background py-3 px-2">
        {/* Top: logo + nav */}
        <div className="flex flex-col items-center gap-1 w-full">
          {/* AI logo */}
          <div className="flex size-8 items-center justify-center rounded-full border border-border bg-foreground text-background mb-1 shrink-0">
            <Sparkles className="size-3" />
          </div>

          {/* Separator */}
          <div className="w-4 h-px bg-border/50 rounded-full mb-0.5" />

          {/* Nav items */}
          {navigationItems.map(({ id, label, description, icon: Icon }) => {
            const isActive = activeView === id;
            return (
              <div
                key={label}
                className="group/nav relative flex items-center justify-center w-full"
              >
                {/* Active pill — brighter on hover */}
                <span
                  className={cn(
                    "absolute left-0 top-1/2 -translate-y-1/2 w-[2.5px] rounded-full transition-all duration-150",
                    isActive
                      ? "h-3.5 bg-foreground/40 group-hover/nav:h-4 group-hover/nav:bg-foreground/70"
                      : "h-0 bg-transparent",
                  )}
                  aria-hidden="true"
                />
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      className={cn(
                        // base
                        "group/btn relative flex size-7 items-center justify-center rounded-lg outline-none",
                        "transition-all duration-150 ease-out",
                        // hover
                        "hover:bg-muted hover:scale-110",
                        // active press
                        "active:scale-95 active:duration-75",
                        // focus-visible
                        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
                        // active nav state
                        isActive
                          ? "bg-foreground/8 text-foreground"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                      aria-label={label}
                      aria-haspopup={id === "settings" ? "dialog" : undefined}
                      aria-pressed={isActive}
                      onClick={() => {
                        if (id === "settings") {
                          setIsSettingsOpen(true);
                        } else {
                          onViewChange(id);
                        }
                      }}
                    >
                      <Icon
                        className={cn(
                          "size-[15px] transition-transform duration-150",
                          "group-hover/btn:scale-110",
                          isActive ? "opacity-100" : "opacity-60 group-hover/btn:opacity-100",
                        )}
                      />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right" sideOffset={12}>
                    <div className="space-y-0.5">
                      <p className="font-medium">{label}</p>
                      <p className="text-[11px] opacity-70">{description}</p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </div>
            );
          })}
        </div>

        {/* Bottom: ⌘B hint */}
        <div className="flex h-6 w-8 items-center justify-center rounded-full border border-border bg-background text-[8.5px] font-medium text-foreground/50">
          ⌘B
        </div>
      </div>

      <IDESettingsDialog
        open={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
      />
    </>
  );
}
