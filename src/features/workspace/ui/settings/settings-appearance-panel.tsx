import * as React from "react";
import { Activity, Layout } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SettingsField } from "./settings-field";
import { ThemeSelector } from "../theme-selector";

export function SettingsAppearancePanel() {
  const [highContrast, setHighContrast] = React.useState(false);
  const [reduceMotion, setReduceMotion] = React.useState(true);
  const [language, setLanguage] = React.useState("en");
  const [density, setDensity] = React.useState<"comfortable" | "compact">("compact");

  return (
    <div className="flex flex-col gap-8">
      {/* Theme Section */}
      <div className="flex flex-col gap-4">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Theme
        </h4>
        <SettingsField
          label="Color Theme"
          description="Choose the visual aesthetic of your workspace."
        >
          <ThemeSelector />
        </SettingsField>
      </div>

      <Separator />

      {/* Accessibility Section */}
      <div className="flex flex-col gap-4">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Accessibility
        </h4>
        <SettingsField
          label="High Contrast Mode"
          description="Increase UI contrast for better readability."
        >
          <div className="flex items-center rounded-lg border border-border/50 bg-muted/30 p-1 w-fit gap-1">
            <Button
              variant={!highContrast ? "secondary" : "ghost"}
              size="sm"
              className="h-7 text-xs font-medium px-3"
              onClick={() => setHighContrast(false)}
            >
              Off
            </Button>
            <Button
              variant={highContrast ? "secondary" : "ghost"}
              size="sm"
              className="h-7 text-xs font-medium px-3"
              onClick={() => setHighContrast(true)}
            >
              On
            </Button>
          </div>
        </SettingsField>
        <SettingsField
          label="Reduce Motion"
          description="Disable non-essential UI animations."
        >
          <div className="flex items-center rounded-lg border border-border/50 bg-muted/30 p-1 w-fit gap-1">
            <Button
              variant={!reduceMotion ? "secondary" : "ghost"}
              size="sm"
              className="h-7 text-xs font-medium px-3"
              onClick={() => setReduceMotion(false)}
            >
              Off
            </Button>
            <Button
              variant={reduceMotion ? "secondary" : "ghost"}
              size="sm"
              className="h-7 text-xs font-medium px-3"
              onClick={() => setReduceMotion(true)}
            >
              On
            </Button>
          </div>
        </SettingsField>
      </div>

      <Separator />

      {/* UI Options Section */}
      <div className="flex flex-col gap-4">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          UI Options
        </h4>
        <SettingsField
          label="Display Language"
          description="Choose the language for the IDE interface."
        >
          <div className="w-56">
            <Select value={language} onValueChange={(val) => val && setLanguage(val)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="en">English (US)</SelectItem>
                  <SelectItem value="es">Español</SelectItem>
                  <SelectItem value="fr">Français</SelectItem>
                  <SelectItem value="de">Deutsch</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </SettingsField>
        <SettingsField
          label="Layout Density"
          description="Adjust the scale of UI elements and spacing."
        >
          <div className="flex gap-3">
            <Button
              variant={density === "comfortable" ? "secondary" : "outline"}
              className="flex-1 h-20 flex-col gap-1.5 rounded-lg transition-colors"
              onClick={() => setDensity("comfortable")}
            >
              <Layout className="size-5 opacity-70" />
              <span className="text-xs">Comfortable</span>
            </Button>
            <Button
              variant={density === "compact" ? "secondary" : "outline"}
              className="flex-1 h-20 flex-col gap-1.5 rounded-lg transition-colors"
              onClick={() => setDensity("compact")}
            >
              <Activity className="size-5" />
              <span className="text-xs font-medium">Compact</span>
            </Button>
          </div>
        </SettingsField>
      </div>
    </div>
  );
}
