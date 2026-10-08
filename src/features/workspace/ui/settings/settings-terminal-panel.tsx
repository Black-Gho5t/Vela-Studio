
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SettingsField } from "./settings-field";

export function SettingsTerminalPanel() {
  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <h4 className="text-xs font-semibold uppercase tracking-[0.24px] text-muted-foreground">
          Configuration
        </h4>
        <SettingsField
          label="Shell Path"
          description="Binary location for the default terminal shell."
        >
          <Input defaultValue="/bin/zsh" className="bg-background border-border/40 h-10 rounded-[12px] px-3 tracking-[0.24px] text-[13px] focus-visible:ring-foreground" />
        </SettingsField>
        <SettingsField
          label="Cursor Style"
          description="How the terminal cursor is rendered."
        >
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" className="rounded-full h-8 px-4 text-[12px] tracking-[0.24px] font-semibold bg-muted text-foreground">Block</Button>
            <Button variant="outline" size="sm" className="rounded-full h-8 px-4 text-[12px] tracking-[0.24px] font-medium border-border/40">Line</Button>
            <Button variant="outline" size="sm" className="rounded-full h-8 px-4 text-[12px] tracking-[0.24px] font-medium border-border/40">Underline</Button>
          </div>
        </SettingsField>
      </div>
    </div>
  );
}
