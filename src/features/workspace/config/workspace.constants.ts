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
