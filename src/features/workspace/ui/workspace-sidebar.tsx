import { invoke } from "@tauri-apps/api/core";
import { open as openDialog } from "@tauri-apps/plugin-dialog";
import { ChevronRight, FolderOpen } from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { FileIcon, FolderMaterialIcon } from "./file-icon";

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { WorkspaceGit } from "./workspace-git";
import { WorkspaceSearch } from "./workspace-search";
import { useWorkspaceStore } from "../model/workspace.store";

import { FileNode } from "../model/workspace.types";

// ── TreeNode ──────────────────────────────────────────────────────────────────

function TreeNode({
  node,
  depth = 0,
}: {
  node: FileNode;
  depth?: number;
}) {
  const { id, name, type, children } = node;
  const isFolder = type === "directory";
  const [open, setOpen] = React.useState(() => node.isExpanded ?? false);
  const { addTab, activeTabId } = useWorkspaceStore();

  const contextMenuItems = isFolder ? (
    <ContextMenuGroup>
      <ContextMenuItem>New File...</ContextMenuItem>
      <ContextMenuItem>New Folder...</ContextMenuItem>
      <ContextMenuSeparator />
      <ContextMenuItem>Reveal in Finder</ContextMenuItem>
      <ContextMenuItem>Open in Integrated Terminal</ContextMenuItem>
      <ContextMenuSeparator />
      <ContextMenuSub>
        <ContextMenuSubTrigger>Share</ContextMenuSubTrigger>
        <ContextMenuSubContent>
          <ContextMenuGroup>
            <ContextMenuItem>Copy Link</ContextMenuItem>
            <ContextMenuItem>Share on GitHub</ContextMenuItem>
          </ContextMenuGroup>
        </ContextMenuSubContent>
      </ContextMenuSub>
      <ContextMenuSeparator />
      <ContextMenuItem>Add Folder to Workspace...</ContextMenuItem>
      <ContextMenuItem>Open Folder Settings</ContextMenuItem>
      <ContextMenuSeparator />
      <ContextMenuItem>Find in Folder...</ContextMenuItem>
      <ContextMenuSeparator />
      <ContextMenuItem>Copy Path</ContextMenuItem>
      <ContextMenuItem>Copy Relative Path</ContextMenuItem>
      <ContextMenuSeparator />
      <ContextMenuItem>Generate Markdown structure</ContextMenuItem>
    </ContextMenuGroup>
  ) : (
    <ContextMenuGroup>
      <ContextMenuItem>Reveal in Finder</ContextMenuItem>
      <ContextMenuItem>Open in Integrated Terminal</ContextMenuItem>
      <ContextMenuSeparator />
      <ContextMenuItem>Copy Path</ContextMenuItem>
      <ContextMenuItem>Copy Relative Path</ContextMenuItem>
    </ContextMenuGroup>
  );

  if (!isFolder) {
    return (
      <ContextMenu>
        <ContextMenuTrigger render={<SidebarMenuItem />}>
          <SidebarMenuButton
            onClick={async () => {
              const store = useWorkspaceStore.getState();
              const existingTab = store.tabs.find((t) => t.id === id);
              if (existingTab) {
                store.setActiveTab(id);
                return;
              }

              // Add tab immediately in a loading state
              addTab({
                id: id,
                name: name,
                path: node.path,
                isActive: true,
                isModified: false,
                isLoading: true,
                content: "",
              });

              try {
                const { workspaceApi } = await import("../api/workspace.api");
                const content = await workspaceApi.readFile(node.path);
                useWorkspaceStore.getState().setTabLoaded(id, content);
              } catch (err) {
                useWorkspaceStore.getState().updateTabContent(id, `// Error loading file:\n${err}`);
              }
            }}
            isActive={id === activeTabId}
            className="h-7 rounded-md border border-transparent px-2 text-xs tracking-normal transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground data-[active=true]:font-medium text-sidebar-foreground"
            style={{ paddingLeft: `${0.625 + depth * 0.625}rem` }}
          >
            <FileIcon fileName={name} />
            <span>{name}</span>
          </SidebarMenuButton>
        </ContextMenuTrigger>
        <ContextMenuContent>{contextMenuItems}</ContextMenuContent>
      </ContextMenu>
    );
  }

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger render={<SidebarMenuItem />}>
          <SidebarMenuButton
            onClick={() => setOpen((c) => !c)}
            className="h-7 rounded-md border border-transparent px-2 text-xs tracking-normal transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-sidebar-foreground"
            style={{ paddingLeft: `${0.375 + depth * 0.625}rem` }}
            aria-expanded={open}
          >
            <ChevronRight
              className={`transition-transform duration-200 ${open ? "rotate-90" : ""}`}
            />
            <FolderMaterialIcon folderName={name} isOpen={open} />
            <span>{name}</span>
          </SidebarMenuButton>
        </ContextMenuTrigger>
        <ContextMenuContent>{contextMenuItems}</ContextMenuContent>
      </ContextMenu>

      {open && children ? (
        <SidebarMenuSub>
          {children.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
            />
          ))}
        </SidebarMenuSub>
      ) : null}
    </>
  );
}

// ── WorkspaceSidebar ──────────────────────────────────────────────────────────

interface WorkspaceSidebarProps {
  open?: boolean;
  activeView: "explorer" | "search" | "git";
}

export function WorkspaceSidebar({ activeView }: WorkspaceSidebarProps) {
  return (
    <div
      className={cn(
        "flex h-full w-full shrink-0 flex-col border-r border-sidebar-border bg-sidebar overflow-hidden"
      )}
    >
      <div className="no-scrollbar flex h-full w-full flex-col gap-0 overflow-auto">
        {activeView === "explorer" && <ExplorerView />}
        {activeView === "search" && <WorkspaceSearch />}
        {activeView === "git" && <WorkspaceGit />}
      </div>
    </div>
  );
}

function ExplorerView() {
  const fileTree = useWorkspaceStore((state) => state.fileTree);
  const setFileTree = useWorkspaceStore((state) => state.setFileTree);
  const projectName = useWorkspaceStore((state) => state.projectName) || "No Project";
  const projectPath = useWorkspaceStore((state) => state.projectPath);

  React.useEffect(() => {
    if (projectPath) {
      invoke<FileNode[]>("get_directory_tree", { path: projectPath })
        .then((tree) => setFileTree(tree))
        .catch((e) => console.error("Failed to load directory tree:", e));
    } else {
      setFileTree([]);
    }
  }, [projectPath, setFileTree]);

  const handleOpenFolder = async () => {
    try {
      const selected = await openDialog({
        directory: true,
        multiple: false,
      });
      if (selected && typeof selected === "string") {
        const name = selected.split(/[/\\]/).pop() || "unknown-project";
        useWorkspaceStore.getState().setProjectName(name);
        useWorkspaceStore.getState().setProjectPath(selected);
      }
    } catch (e) {
      console.error("Failed to open folder:", e);
    }
  };

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-sidebar">
      {/* Header */}
      <div className="flex h-9 items-center justify-between px-3 border-b border-border/40 shrink-0">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/80">
          Files
        </h2>
        {projectName && (
          <span
            className="text-[10px] font-medium uppercase tracking-[0.15em] text-muted-foreground/60 truncate max-w-[120px]"
            title={projectName}
          >
            {projectName}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {fileTree.length > 0 ? (
          <ScrollArea className="h-full w-full">
            <SidebarMenu className="min-w-max space-y-0.5 whitespace-nowrap px-2 py-2">
              {fileTree.map((item) => (
                <TreeNode key={item.id} node={item} />
              ))}
            </SidebarMenu>
          </ScrollArea>
        ) : (
          <div className="flex flex-col items-center justify-center h-full p-4 text-center">
            <p className="text-xs text-muted-foreground mb-3">No hay carpeta abierta</p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleOpenFolder}
              className="text-xs h-7 gap-1.5 cursor-pointer"
            >
              <FolderOpen className="size-3.5" />
              <span>Abrir carpeta</span>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

