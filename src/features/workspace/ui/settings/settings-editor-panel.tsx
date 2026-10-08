
import { Input } from "@/components/ui/input";
import { SettingsField } from "./settings-field";

export function SettingsEditorPanel() {
  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <h4 className="text-xs font-semibold uppercase tracking-[0.24px] text-muted-foreground">
          Typography
        </h4>
        <SettingsField
          label="Font Family"
          description="Primary font stack used for code and symbols."
        >
          <Input 
            defaultValue="'JetBrains Mono', 'Fira Code', monospace" 
            className="bg-background border-border/40 h-10 rounded-[12px] px-3 tracking-[0.24px] text-[13px] focus-visible:ring-foreground"
          />
        </SettingsField>
        <div className="grid gap-6 sm:grid-cols-2">
          <SettingsField
            label="Font Size"
            description="Main editor text size (px)."
          >
            <Input type="number" defaultValue="13" className="bg-background border-border/40 h-10 rounded-[12px] px-3 tracking-[0.24px] text-[13px] focus-visible:ring-foreground" />
          </SettingsField>
          <SettingsField
            label="Line Height"
            description="Vertical spacing multiplier."
          >
            <Input type="number" defaultValue="1.5" step="0.1" className="bg-background border-border/40 h-10 rounded-[12px] px-3 tracking-[0.24px] text-[13px] focus-visible:ring-foreground" />
          </SettingsField>
        </div>
      </div>
    </div>
  );
}
