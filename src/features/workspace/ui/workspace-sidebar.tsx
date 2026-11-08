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
  const { id, name, type } = node;
  const isFolder = type === "directory";
  const [open, setOpen] = React.useState(() => node.isExpanded ?? false);
  const [childrenList, setChildrenList] = React.useState<FileNode[] | null>(() => node.children || null);
  const [isLoading, setIsLoading] = React.useState(false);
  const { addTab, activeTabId, projectPath } = useWorkspaceStore();

  const loadFolderChildren = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const { workspaceApi } = await import("../api/workspace.api");
      const items = await workspaceApi.getDirectoryChildren(node.path);
      setChildrenList(items);
    } catch (err) {
      console.error("Failed to load folder children:", err);
    } finally {
      setIsLoading(false);
    }
  }, [node.path]);

  const handleToggle = () => {
    const nextOpen = !open;
    setOpen(nextOpen);
    if (nextOpen && childrenList === null) {
      loadFolderChildren();
    }
  };

  React.useEffect(() => {
    if (!isFolder || !open) return;
    let unlisten: (() => void) | null = null;
    import("@tauri-apps/api/event").then(({ listen }) => {
      listen<{ action: string; paths: string[] }>("workspace-fs-change", (event) => {
        const paths = event.payload?.paths || [];
        const touchesFolder = paths.some((p) => p.startsWith(node.path));
        if (touchesFolder) {
          loadFolderChildren();
        }
      }).then((unsub) => {
        unlisten = unsub;
      });
    });
    return () => {
      unlisten?.();
    };
  }, [isFolder, open, node.path, loadFolderChildren]);

  const handleCopyPath = () => {
    navigator.clipboard.writeText(node.path);
  };

  const handleCopyRelativePath = () => {
    const rel = projectPath && node.path.startsWith(projectPath)
      ? node.path.slice(projectPath.length).replace(/^[/\\]+/, "")
      : node.path;
    navigator.clipboard.writeText(rel);
  };

  const handleRevealInFinder = async () => {
    try {
      const { revealItemInDir } = await import("@tauri-apps/plugin-opener");
      await revealItemInDir(node.path);
    } catch (e) {
      console.error("Failed to reveal item in file manager:", e);
    }
  };

  const contextMenuItems = (
    <ContextMenuGroup>
      <ContextMenuItem onClick={handleRevealInFinder}>Reveal in Finder</ContextMenuItem>
      <ContextMenuSeparator />
      <ContextMenuItem onClick={handleCopyPath}>Copy Path</ContextMenuItem>
      <ContextMenuItem onClick={handleCopyRelativePath}>Copy Relative Path</ContextMenuItem>
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
            onClick={handleToggle}
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

      {open && (
        <SidebarMenuSub>
          {isLoading && (
            <div
              className="text-[11px] text-muted-foreground/60 py-1"
              style={{ paddingLeft: `${0.625 + (depth + 1) * 0.625}rem` }}
            >
              Cargando...
            </div>
          )}
          {childrenList && childrenList.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
            />
          ))}
        </SidebarMenuSub>
      )}
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
        "flex h-full w-full shrink-0 flex-col bg-sidebar overflow-hidden"
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

  const loadRootTree = React.useCallback(async () => {
    if (!projectPath) {
      setFileTree([]);
      return;
    }
    try {
      const { workspaceApi } = await import("../api/workspace.api");
      const rootItems = await workspaceApi.getDirectoryChildren(projectPath);
      setFileTree(rootItems);
    } catch (e) {
      console.error("Failed to load root directory children:", e);
    }
  }, [projectPath, setFileTree]);

  React.useEffect(() => {
    if (!projectPath) {
      setFileTree([]);
      return;
    }

    loadRootTree();

    let unlisten: (() => void) | null = null;
    import("../api/workspace.api").then(({ workspaceApi }) => {
      workspaceApi.startWatchingWorkspace(projectPath).catch(console.error);
    });

    import("@tauri-apps/api/event").then(({ listen }) => {
      listen<{ action: string; paths: string[] }>("workspace-fs-change", (event) => {
        const paths = event.payload?.paths || [];
        const affectsRoot = paths.some((p) => {
          const parent = p.replace(/[/\\][^/\\]+$/, "");
          return parent === projectPath || p === projectPath;
        });
        if (affectsRoot) {
          loadRootTree();
        }
      }).then((unsub) => {
        unlisten = unsub;
      });
    });

    return () => {
      unlisten?.();
      import("../api/workspace.api").then(({ workspaceApi }) => {
        workspaceApi.stopWatchingWorkspace().catch(() => {});
      });
    };
  }, [projectPath, loadRootTree, setFileTree]);


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
      <div className="flex h-9 items-center justify-between px-3 shrink-0">
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

