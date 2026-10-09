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

export function WorkspaceSecondaryRail() {
  const navigationItems = [
    {
      id: "notifications",
      label: "Notifications",
      icon: Bell,
    },
    {
      id: "gradle",
      label: "Gradle",
      icon: Layers,
    },
    {
      id: "device-manager",
      label: "Device Manager",
      icon: Smartphone,
    },
    {
      id: "running-devices",
      label: "Running Devices",
      icon: MonitorSmartphone,
    },
  ] as const;

  return (
    <div className="flex h-full w-9 shrink-0 flex-col items-center justify-start border-l border-border bg-background py-3 px-1 gap-1">
      {navigationItems.map(({ id, label, icon: Icon }) => (
        <Tooltip key={id}>
          <TooltipTrigger
            render={
              <button
                type="button"
                className={cn(
                  "group relative flex size-7 items-center justify-center rounded-lg outline-none",
                  "transition-all duration-150 ease-out",
                  "hover:bg-muted hover:scale-110",
                  "active:scale-95 active:duration-75",
                  "text-muted-foreground hover:text-foreground"
                )}
                aria-label={label}
              />
            }
          >
            <Icon className="size-[15px] transition-transform duration-150 group-hover:scale-110 opacity-60 group-hover:opacity-100" />
          </TooltipTrigger>
          <TooltipContent side="left" sideOffset={12}>
            <p className="font-medium">{label}</p>
          </TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
}
