import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SettingsField } from "./settings-field";

export function SettingsTerminalPanel() {
  const [cursorStyle, setCursorStyle] = React.useState<"block" | "line" | "underline">("block");

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Configuration
        </h4>
        <SettingsField
          label="Shell Path"
          description="Binary location for the default terminal shell."
        >
          <Input defaultValue="/bin/zsh" className="max-w-md font-mono text-xs" />
        </SettingsField>
        <SettingsField
          label="Cursor Style"
          description="How the terminal cursor is rendered."
        >
          <div className="flex gap-2">
            <Button
              variant={cursorStyle === "block" ? "secondary" : "outline"}
              size="sm"
              className="h-8 px-3 text-xs"
              onClick={() => setCursorStyle("block")}
            >
              Block
            </Button>
            <Button
              variant={cursorStyle === "line" ? "secondary" : "outline"}
              size="sm"
              className="h-8 px-3 text-xs"
              onClick={() => setCursorStyle("line")}
            >
              Line
            </Button>
            <Button
              variant={cursorStyle === "underline" ? "secondary" : "outline"}
              size="sm"
              className="h-8 px-3 text-xs"
              onClick={() => setCursorStyle("underline")}
            >
              Underline
            </Button>
          </div>
        </SettingsField>
      </div>
    </div>
  );
}
