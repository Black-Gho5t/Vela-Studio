import {
  Bell,
  Layers,
  Smartphone,
  MonitorSmartphone,
} from "lucide-react";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export type SecondaryRailView =
  | "notifications"
  | "gradle"
  | "device-manager"
  | "running-devices";

export interface WorkspaceSecondaryRailProps {
  activeView?: SecondaryRailView | null;
  onViewChange?: (view: SecondaryRailView) => void;
  isOpen?: boolean;
}

export function WorkspaceSecondaryRail({
  activeView,
  onViewChange,
  isOpen,
}: WorkspaceSecondaryRailProps = {}) {
  const navigationItems = [
    {
      id: "notifications" as const,
      label: "Notifications",
      icon: Bell,
    },
    {
      id: "gradle" as const,
      label: "Gradle",
      icon: Layers,
    },
    {
      id: "device-manager" as const,
      label: "Device Manager",
      icon: Smartphone,
    },
    {
      id: "running-devices" as const,
      label: "Running Devices",
      icon: MonitorSmartphone,
    },
  ] as const;

  return (
    <div className="flex h-full w-9 shrink-0 flex-col items-center justify-start bg-background py-3 px-1 gap-1 select-none">
      {navigationItems.map(({ id, label, icon: Icon }) => {
        const isActive = Boolean(isOpen && activeView === id);
        return (
          <Tooltip key={id}>
            <TooltipTrigger
              render={
                <button
                  type="button"
                  onClick={() => onViewChange?.(id)}
                  className={cn(
                    "group relative flex size-7 items-center justify-center rounded-lg outline-none cursor-pointer",
                    "transition-all duration-150 ease-out",
                    "hover:scale-105 active:scale-95",
                    isActive
                      ? "bg-muted/70 text-foreground shadow-2xs"
                      : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                  )}
                  aria-label={label}
                  aria-pressed={isActive}
                />
              }
            >
              <Icon
                className={cn(
                  "size-[15px] transition-transform duration-150",
                  isActive
                    ? "opacity-100 text-primary"
                    : "opacity-60 group-hover:opacity-100"
                )}
              />
            </TooltipTrigger>
            <TooltipContent side="left" sideOffset={10}>
              <p className="font-medium text-xs">{label}</p>
            </TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  );
}
