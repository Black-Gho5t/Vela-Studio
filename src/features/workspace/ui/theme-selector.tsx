import { MonitorCog, MoonStar, SunMedium } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useTheme } from "@/shared/providers/theme";

const themeOptions = [
  { value: "light" as const, label: "Light", icon: SunMedium },
  { value: "system" as const, label: "System", icon: MonitorCog },
  { value: "dark" as const, label: "Dark", icon: MoonStar },
];

export function ThemeSelector() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Theme</span>
        <span className="capitalize">{theme}</span>
      </div>

      <div className="flex gap-0">
        {themeOptions.map(({ value, label, icon: Icon }) => (
          <Button
            key={value}
            type="button"
            variant={theme === value ? "secondary" : "ghost"}
            size="icon"
            className="size-8 !p-0 group-data-[collapsible=icon]:!p-0 group-data-[collapsible=icon]:bg-transparent"
            aria-pressed={theme === value}
            title={label}
            onClick={() => setTheme(value)}
          >
            <Icon className="size-4 text-sidebar-foreground" />
          </Button>
        ))}
      </div>
    </div>
  );
}
