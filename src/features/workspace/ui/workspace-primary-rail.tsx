import {
  FolderKanban,
  GitBranch,
  Search,
  Settings2,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useWorkspaceStore } from "../model/workspace.store";

interface WorkspacePrimaryRailProps {
  activeView: "explorer" | "search" | "git";
  onViewChange: (view: "explorer" | "search" | "git") => void;
  showRightBorder?: boolean;
}

export function WorkspacePrimaryRail({
  activeView,
  onViewChange,
}: WorkspacePrimaryRailProps) {
  const openSettingsTab = useWorkspaceStore((state) => state.openSettingsTab);

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
  ] as const;

  return (
    <div className="flex h-full w-12 shrink-0 flex-col items-center justify-between bg-sidebar py-3 px-2 select-none">
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
                      aria-pressed={isActive}
                      onClick={() => onViewChange(id)}
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

      {/* Bottom: Settings */}
      <div className="flex flex-col items-center w-full">
        <Tooltip>
          <TooltipTrigger
            render={
              <button
                type="button"
                className={cn(
                  "group/btn relative flex size-7 items-center justify-center rounded-md outline-none",
                  "text-muted-foreground transition-all duration-150 ease-out",
                  "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  "active:scale-95 active:duration-75",
                  "focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:ring-offset-1"
                )}
                aria-label="Settings"
                aria-haspopup="dialog"
                onClick={() => openSettingsTab()}
              />
            }
          >
            <Settings2 className="size-[15px] opacity-70 transition-transform duration-150 group-hover/btn:scale-105 group-hover/btn:opacity-100" />
          </TooltipTrigger>
          <TooltipContent side="right" sideOffset={12}>
            <div className="space-y-0.5">
              <p className="font-medium">Settings</p>
              <p className="text-[11px] opacity-70">Preferencias del editor</p>
            </div>
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}
