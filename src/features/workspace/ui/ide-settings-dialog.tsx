import * as React from "react";
import { History } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
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
      <DialogContent className="overflow-hidden p-0 md:max-h-[720px] md:max-w-[1000px] lg:max-w-[1200px] border-border shadow-2xl bg-background text-foreground">
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
            <header className="border-b border-border/40 px-8 py-4 sticky top-0 z-10 bg-background/95 backdrop-blur">
              <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.24px] text-muted-foreground/60 mb-1">
                <span>{section.split("-")[0]}</span>
                <span className="opacity-30">/</span>
                <span className="text-foreground/80">{selectedItem.title}</span>
              </div>
              <h3 className="text-2xl font-semibold tracking-tight leading-none text-foreground">
                {selectedItem.title}
              </h3>
              <p className="text-xs text-muted-foreground mt-1.5 tracking-normal">
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
                    <Empty className="py-24 border-none">
                      <EmptyHeader>
                        <EmptyMedia variant="icon">
                          <History className="size-6 text-muted-foreground" />
                        </EmptyMedia>
                        <EmptyTitle className="text-lg">Under Construction</EmptyTitle>
                        <EmptyDescription className="text-xs">
                          This setting panel will be available in the next update.
                        </EmptyDescription>
                      </EmptyHeader>
                    </Empty>
                  )}
                </div>
              </ScrollArea>
            </div>

            <Separator className="bg-border/40" />
            <footer className="flex items-center justify-between px-8 py-4 bg-background">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <div className="size-2 rounded-full bg-primary animate-pulse" />
                <span>Syncing with Cloud Profile</span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
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
                  size="sm"
                  onClick={() => onOpenChange(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="default"
                  size="sm"
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

