import * as React from "react";
import { History } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { SidebarProvider } from "@/components/ui/sidebar";

type IDESettingsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

import {
  SettingsSectionId,
  settingsGroups,
  flatItems,
} from "../config/workspace.constants";

const itemsMap = new Map();
settingsGroups.forEach((group) => {
  group.items.forEach((item) => {
    itemsMap.set(item.id, item);
  });
});
flatItems.forEach((item) => {
  if (!itemsMap.has(item.id)) {
    itemsMap.set(item.id, {
      ...item,
      id: item.id as SettingsSectionId,
      description: `Configure ${item.title} settings.`,
    });
  }
});

import { SettingsSidebar } from "./settings/settings-sidebar";
import { SettingsAppearancePanel } from "./settings/settings-appearance-panel";
import { SettingsEditorPanel } from "./settings/settings-editor-panel";
import { SettingsTerminalPanel } from "./settings/settings-terminal-panel";
import { SettingsAdvancedPanel } from "./settings/settings-advanced-panel";

export function IDESettingsDialog({
  open,
  onOpenChange,
}: IDESettingsDialogProps) {
  const [section, setSection] = React.useState<SettingsSectionId>(
    "workbench-appearance",
  );
  const [searchQuery, setSearchQuery] = React.useState("");

  const selectedItem = React.useMemo(() => {
    return itemsMap.get(section) || settingsGroups[0].items[0];
  }, [section]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden p-0 md:max-h-[720px] md:max-w-[1000px] lg:max-w-[1200px] border-border/40 shadow-2xl backdrop-blur-3xl bg-background/95 dark:bg-[#1e1e1e]/95">
        <DialogTitle className="sr-only">IDE Settings</DialogTitle>
        <DialogDescription className="sr-only">
          Configure your IDE preferences.
        </DialogDescription>

        <SidebarProvider className="items-start h-full">
          <SettingsSidebar
            section={section}
            setSection={setSection}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
          />

          <main className="flex h-[720px] flex-1 flex-col overflow-hidden bg-background">
            <header className="border-b border-border/40 px-8 py-4 sticky top-0 z-10 bg-background">
              <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.24px] text-muted-foreground/60 mb-1">
                <span>{section.split("-")[0]}</span>
                <span className="opacity-30">/</span>
                <span className="text-foreground/80">{selectedItem.title}</span>
              </div>
              <h3 className="text-[24px] font-semibold tracking-tight leading-none text-foreground">
                {selectedItem.title}
              </h3>
              <p className="text-[13px] text-muted-foreground mt-1.5 tracking-[0.24px]">
                {selectedItem.description}
              </p>
            </header>

            <div className="flex-1 overflow-hidden min-h-0">
              <ScrollArea className="h-full bg-background">
                <div className="space-y-8 p-8 max-w-3xl pb-12">
                  {section === "workbench-appearance" && (
                    <SettingsAppearancePanel />
                  )}
                  {section === "editor-font" && <SettingsEditorPanel />}
                  {section === "terminal-general" && <SettingsTerminalPanel />}
                  {section === "advanced-json" && <SettingsAdvancedPanel />}

                  {/* Fallback for other sections */}
                  {![
                    "workbench-appearance",
                    "editor-font",
                    "terminal-general",
                    "advanced-json",
                  ].includes(section) && (
                    <div className="flex flex-col items-center justify-center py-32 text-center opacity-40">
                      <History className="size-12 mb-4" />
                      <h4 className="text-xl font-medium tracking-tight">
                        Under Construction
                      </h4>
                      <p className="text-[14px] tracking-[0.24px] mt-2">
                        This setting panel will be available in the next update.
                      </p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>

            <Separator className="bg-border/40" />
            <footer className="flex items-center justify-between px-8 py-4 bg-background">
              <div className="flex items-center gap-2 text-[12px] tracking-[0.24px] text-muted-foreground/80">
                <div className="size-2 rounded-full bg-blue-500 animate-pulse" />
                <span>Syncing with Cloud Profile</span>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="ghost"
                  className="rounded-full h-10 px-5 text-[14px] font-semibold tracking-[0.24px] hover:bg-muted/50"
                  onClick={() => onOpenChange(false)}
                >
                  Reset
                </Button>
                <Separator
                  orientation="vertical"
                  className="h-4 my-auto bg-border/40"
                />
                <Button
                  variant="outline"
                  className="rounded-full h-10 px-5 text-[14px] font-semibold tracking-[0.24px] border-border/40"
                  onClick={() => onOpenChange(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="rounded-full h-10 px-6 text-[14px] font-semibold tracking-[0.24px] bg-foreground text-background hover:bg-foreground/90 transition-colors"
                  onClick={() => onOpenChange(false)}
                >
                  Save changes
                </Button>
              </div>
            </footer>
          </main>
        </SidebarProvider>
      </DialogContent>
    </Dialog>
  );
}
