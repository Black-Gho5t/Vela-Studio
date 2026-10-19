import {
  FolderKanban,
  GitBranch,
  Search,
  Settings2,
} from "lucide-react";
import * as React from "react";



import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Kbd } from "@/components/ui/kbd";
import { cn } from "@/lib/utils";
import { IDESettingsDialog } from "./ide-settings-dialog";

interface WorkspacePrimaryRailProps {
  activeView: "explorer" | "search" | "git";
  onViewChange: (view: "explorer" | "search" | "git") => void;
  showRightBorder?: boolean;
}

export function WorkspacePrimaryRail({
  activeView,
  onViewChange,
  showRightBorder = false,
}: WorkspacePrimaryRailProps) {
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
      <div
        className={cn(
          "flex h-full w-12 shrink-0 flex-col items-center justify-between bg-sidebar py-3 px-2 select-none",
          showRightBorder && "border-r border-sidebar-border"
        )}
      >
        {/* Top: nav */}
        <div className="flex flex-col items-center gap-1 w-full">
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
                      ? "h-3.5 bg-primary group-hover/nav:h-4"
                      : "h-0 bg-transparent",
                  )}
                  aria-hidden="true"
                />
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <button
                        type="button"
                        className={cn(
                          // base
                          "group/btn relative flex size-7 items-center justify-center rounded-md outline-none",
                          "transition-all duration-150 ease-out",
                          // hover
                          "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                          // active press
                          "active:scale-95 active:duration-75",
                          // focus-visible
                          "focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:ring-offset-1",
                          // active nav state
                          isActive
                            ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-2xs"
                            : "text-muted-foreground",
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
                      />
                    }
                  >
                    <Icon
                      className={cn(
                        "size-[15px] transition-transform duration-150",
                        "group-hover/btn:scale-105",
                        isActive ? "opacity-100" : "opacity-70 group-hover/btn:opacity-100",
                      )}
                    />
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
        <Kbd className="text-[9px] h-5 px-1 font-mono">⌘B</Kbd>
      </div>

      <IDESettingsDialog
        open={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
      />
    </>
  );
}
