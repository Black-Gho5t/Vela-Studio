
import { Activity, Layout } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SettingsField } from "./settings-field";
import { ThemeSelector } from "../theme-selector";

export function SettingsAppearancePanel() {
  return (
    <div className="space-y-8">
      {/* Theme Section */}
      <div className="space-y-4">
        <h4 className="text-xs font-semibold uppercase tracking-[0.24px] text-muted-foreground">
          Theme
        </h4>
        <SettingsField
          label="Color Theme"
          description="Choose the visual aesthetic of your workspace."
        >
          <ThemeSelector />
        </SettingsField>
      </div>

      <Separator className="bg-border/40" />

      {/* Accessibility Section */}
      <div className="space-y-4">
        <h4 className="text-xs font-semibold uppercase tracking-[0.24px] text-muted-foreground">
          Accessibility
        </h4>
        <SettingsField
          label="High Contrast Mode"
          description="Increase UI contrast for better readability."
        >
          <div className="flex items-center rounded-full border border-border/40 bg-muted/30 p-0.5 w-fit">
             <Button variant="ghost" size="sm" className="h-8 text-[12px] font-semibold tracking-[0.24px] px-4 bg-background shadow-sm rounded-full">Off</Button>
             <Button variant="ghost" size="sm" className="h-8 text-[12px] font-semibold tracking-[0.24px] px-4 text-muted-foreground hover:text-foreground rounded-full">On</Button>
          </div>
        </SettingsField>
        <SettingsField
          label="Reduce Motion"
          description="Disable non-essential UI animations."
        >
          <div className="flex items-center rounded-full border border-border/40 bg-muted/30 p-0.5 w-fit">
             <Button variant="ghost" size="sm" className="h-8 text-[12px] font-semibold tracking-[0.24px] px-4 text-muted-foreground hover:text-foreground rounded-full">Off</Button>
             <Button variant="ghost" size="sm" className="h-8 text-[12px] font-semibold tracking-[0.24px] px-4 bg-background shadow-sm rounded-full">On</Button>
          </div>
        </SettingsField>
      </div>

      <Separator className="bg-border/40" />

      {/* UI Options Section */}
      <div className="space-y-4">
        <h4 className="text-xs font-semibold uppercase tracking-[0.24px] text-muted-foreground">
          UI Options
        </h4>
        <SettingsField
          label="Display Language"
          description="Choose the language for the IDE interface."
        >
           <select className="h-10 w-48 rounded-[12px] border border-border/40 bg-background px-3 text-[13px] tracking-[0.24px] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-foreground text-foreground cursor-pointer appearance-none">
             <option value="en">English (US)</option>
             <option value="es">Español</option>
             <option value="fr">Français</option>
             <option value="de">Deutsch</option>
           </select>
        </SettingsField>
        <SettingsField
          label="Layout Density"
          description="Adjust the scale of UI elements and spacing."
        >
          <div className="flex gap-4">
            <Button variant="outline" className="flex-1 h-24 flex-col gap-2 rounded-[20px] bg-background hover:bg-muted/50 border-border/40 transition-colors">
              <Layout className="size-5 opacity-50" />
              <span className="text-[13px] tracking-[0.24px]">Comfortable</span>
            </Button>
            <Button variant="secondary" className="flex-1 h-24 flex-col gap-2 rounded-[20px] border border-foreground/20 bg-muted/50 hover:bg-muted transition-colors text-foreground">
              <Activity className="size-5" />
              <span className="text-[13px] font-semibold tracking-[0.24px]">Compact</span>
            </Button>
          </div>
        </SettingsField>
      </div>
    </div>
  );
}
