import {
  Activity,
  Bot,
  Code2,
  GitBranch,
  History,
  Keyboard,
  Layout,
  Settings2,
  Type,
} from "lucide-react";

export type SettingsSectionId =
  | "workbench-appearance"
  | "workbench-general"
  | "workbench-notifications"
  | "editor-font"
  | "editor-formatting"
  | "terminal-general"
  | "git-general"
  | "integrations-assistant"
  | "privacy-general"
  | "advanced-json"
  | "keymap"
  | "plugins"
  | "backup"
  | "advanced"
  | "experimental";

export interface SettingsGroup {
  id: string;
  title: string;
  icon: any;
  items: {
    id: SettingsSectionId;
    title: string;
    description: string;
  }[];
}

export const settingsGroups: SettingsGroup[] = [
  {
    id: "appearance",
    title: "Appearance & Behavior",
    icon: Layout,
    items: [
      { id: "workbench-appearance", title: "Appearance", description: "Visual theme and layout settings." },
      { id: "workbench-general", title: "General", description: "General workbench behavior." },
    ],
  },
  {
    id: "editor",
    title: "Editor",
    icon: Type,
    items: [
      { id: "editor-font", title: "Font", description: "Typeface and size." },
      { id: "editor-formatting", title: "Formatting", description: "Code style and auto-format." },
    ],
  },
  {
    id: "version-control",
    title: "Version Control",
    icon: GitBranch,
    items: [
      { id: "git-general", title: "Git", description: "Git integration settings." },
    ],
  },
  {
    id: "build",
    title: "Build, Execution, Deployment",
    icon: Activity,
    items: [
      { id: "terminal-general", title: "Terminal", description: "Integrated terminal settings." },
    ],
  },
  {
    id: "languages",
    title: "Languages & Frameworks",
    icon: Code2,
    items: [],
  },
  {
    id: "tools",
    title: "Tools",
    icon: Settings2,
    items: [
      { id: "integrations-assistant", title: "Rocket Assistant", description: "AI assistant settings." },
    ],
  },
];

// Flat items that appear without chevron (direct links)
export const flatItems = [
  { id: "keymap", title: "Keymap", icon: Keyboard, description: "Configure keyboard shortcuts." },
  { id: "plugins", title: "Plugins", icon: Bot, description: "Manage IDE extensions." },
  { id: "backup", title: "Backup and Sync", icon: History, description: "Sync settings to cloud." },
  { id: "advanced", title: "Advanced Settings", icon: Settings2, description: "Advanced configuration." },
  { id: "experimental", title: "Experimental", icon: Activity, description: "Preview experimental features." },
];

export const DEFAULT_EDITOR_CODE = `import { ChevronRight, File, Folder } from "lucide-react";
import * as React from "react";

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
} from "@/components/ui/context-menu";

/**
 * WorkspaceSidebar handles the file explorer logic.
 * Ported to Monaco Editor view for Rocket IDE.
 */
export function WorkspaceSidebar() {
  const [open, setOpen] = React.useState(true);

  return (
    <div className="flex h-full flex-col bg-background">
      <header className="p-4 border-b">
        <h2 className="text-lg font-bold">Files</h2>
      </header>
      <main className="flex-1 overflow-auto">
        {/* File tree implementation... */}
      </main>
    </div>
  );
}
`;
