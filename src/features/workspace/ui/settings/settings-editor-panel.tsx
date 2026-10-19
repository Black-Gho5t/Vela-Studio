import { Input } from "@/components/ui/input";
import { SettingsField } from "./settings-field";

export function SettingsEditorPanel() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Typography
        </h4>
        <SettingsField
          label="Font Family"
          description="Primary font stack used for code and symbols."
        >
          <Input 
            defaultValue="'JetBrains Mono', 'Fira Code', monospace" 
            className="max-w-md font-mono text-xs"
          />
        </SettingsField>
        <div className="grid gap-4 sm:grid-cols-2">
          <SettingsField
            label="Font Size"
            description="Main editor text size in pixels."
          >
            <Input type="number" defaultValue="13" className="max-w-[120px] text-xs font-mono" />
          </SettingsField>
          <SettingsField
            label="Line Height"
            description="Vertical spacing multiplier."
          >
            <Input type="number" defaultValue="1.5" step="0.1" className="max-w-[120px] text-xs font-mono" />
          </SettingsField>
        </div>
      </div>
    </div>
  );
}
