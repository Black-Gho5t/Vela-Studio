
import { Textarea } from "@/components/ui/textarea";
import { SettingsField } from "./settings-field";

export function SettingsAdvancedPanel() {
  return (
    <SettingsField
      label="User Settings JSON"
      description="Advanced raw configuration for power users."
    >
      <div className="rounded-[12px] border border-border/40 overflow-hidden">
         <Textarea
          rows={12}
          className="font-mono text-[13px] bg-muted/30 border-none focus-visible:ring-0 resize-none p-4 tracking-[0.24px]"
          defaultValue={JSON.stringify({
            "editor.fontSize": 13,
            "editor.fontFamily": "JetBrains Mono",
            "workbench.colorTheme": "Rocket Dark",
            "terminal.integrated.fontFamily": "Fira Code"
          }, null, 2)}
        />
      </div>
    </SettingsField>
  );
}
