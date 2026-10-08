import { ChevronRight } from "lucide-react";
import * as React from "react";
import { FileIcon, FolderMaterialIcon } from "./file-icon";

import {
  ContextMenu,
  ContextMenuContent,
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
    <>
      <ContextMenuItem>New File...</ContextMenuItem>
      <ContextMenuItem>New Folder...</ContextMenuItem>
      <ContextMenuSeparator />
      <ContextMenuItem>Reveal in Finder</ContextMenuItem>
      <ContextMenuItem>Open in Integrated Terminal</ContextMenuItem>
      <ContextMenuSeparator />
      <ContextMenuSub>
        <ContextMenuSubTrigger>Share</ContextMenuSubTrigger>
        <ContextMenuSubContent>
          <ContextMenuItem>Copy Link</ContextMenuItem>
          <ContextMenuItem>Share on GitHub</ContextMenuItem>
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
    </>
  ) : (
    <>
      <ContextMenuItem>Reveal in Finder</ContextMenuItem>
      <ContextMenuItem>Open in Integrated Terminal</ContextMenuItem>
      <ContextMenuSeparator />
      <ContextMenuItem>Copy Path</ContextMenuItem>
      <ContextMenuItem>Copy Relative Path</ContextMenuItem>
    </>
  );

  if (!isFolder) {
    return (
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <SidebarMenuItem>
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
              className="h-7 rounded-full border border-transparent bg-background/70 px-2.5 text-[12px] tracking-[0.12px] transition-none hover:border-border hover:bg-muted/50 data-[active=true]:border-primary data-[active=true]:bg-primary data-[active=true]:text-primary-foreground"
              style={{ paddingLeft: `${0.625 + depth * 0.625}rem` }}
            >
              <FileIcon fileName={name} />
              <span>{name}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </ContextMenuTrigger>
        <ContextMenuContent>{contextMenuItems}</ContextMenuContent>
      </ContextMenu>
    );
  }

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => setOpen((c) => !c)}
              className="h-7 rounded-full border border-transparent bg-background/70 px-2.5 text-[12px] tracking-[0.12px] transition-none hover:border-border hover:bg-muted/50"
              style={{ paddingLeft: `${0.375 + depth * 0.625}rem` }}
              aria-expanded={open}
            >
              <ChevronRight
                className={`transition-transform duration-200 ${open ? "rotate-90" : ""}`}
              />
              <FolderMaterialIcon folderName={name} isOpen={open} />
              <span>{name}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
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
  open: boolean;
  activeView: "explorer" | "search" | "git";
}

export function WorkspaceSidebar({ activeView }: WorkspaceSidebarProps) {
  return (
    <div
      className={cn(
        "flex h-full w-full shrink-0 flex-col border-r border-border bg-background overflow-hidden"
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

import { invoke } from "@tauri-apps/api/core";

function ExplorerView() {
  const fileTree = useWorkspaceStore((state) => state.fileTree);
  const setFileTree = useWorkspaceStore((state) => state.setFileTree);
  const projectName = useWorkspaceStore((state) => state.projectName) || "No Project";
  const projectPath = useWorkspaceStore((state) => state.projectPath);

  const [devices, setDevices] = React.useState<any[]>([]);
  const selectedDevice = useWorkspaceStore((state) => state.selectedDeviceId);
  const setSelectedDevice = useWorkspaceStore((state) => state.setSelectedDeviceId);

  React.useEffect(() => {
    if (projectPath) {
      invoke<FileNode[]>("get_directory_tree", { path: projectPath })
        .then((tree) => setFileTree(tree))
        .catch((e) => console.error("Failed to load directory tree:", e));
    } else {
      setFileTree([]);
    }
  }, [projectPath, setFileTree]);

  React.useEffect(() => {
    const fetchDevices = async () => {
      try {
        const res = await invoke<string>("get_flutter_devices");
        const parsed = JSON.parse(res);
        setDevices(parsed);
        useWorkspaceStore.getState().setDevices(parsed);
        if (parsed.length > 0 && !useWorkspaceStore.getState().selectedDeviceId) {
          useWorkspaceStore.getState().setSelectedDeviceId(parsed[0].id);
        }
      } catch (e) {
        console.error("Failed to fetch devices:", e);
      }
    };
    fetchDevices();
    const interval = setInterval(fetchDevices, 10000); // Poll every 10s
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col gap-2 p-2 h-full">
      {/* Device Selector */}
      <div className="flex flex-col gap-1.5 rounded-[12px] border border-border bg-background p-2">
        <div className="flex items-center justify-between px-1">
          <div className="text-[9px] uppercase tracking-[0.22em] text-muted-foreground h-4 flex items-center">
            Target Device
          </div>
        </div>
        <select 
          value={selectedDevice || ""} 
          onChange={(e) => setSelectedDevice(e.target.value)}
          className="w-full bg-muted/50 text-[11px] rounded-md border border-border/60 p-1.5 outline-none focus:border-primary transition-colors"
        >
          {devices.length === 0 ? (
            <option value="" disabled>No devices found</option>
          ) : (
            devices.map(d => (
              <option key={d.id} value={d.id}>
                {d.name} ({d.platform})
              </option>
            ))
          )}
        </select>
        {selectedDevice && (
          <div className="flex items-center gap-2 px-1">
             <div className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
             <span className="text-[10px] text-muted-foreground">Ready to run</span>
          </div>
        )}
      </div>

      <div className="flex min-h-0 flex-1 flex-col rounded-[12px] border border-border bg-background p-2">
        <div className="flex items-center justify-between px-1">
          <div className="text-[9px] uppercase tracking-[0.22em] text-muted-foreground h-6 flex items-center">
            Files
          </div>
          <span className="text-[9px] uppercase tracking-[0.18em] text-muted-foreground truncate max-w-[100px]" title={projectName}>
            {projectName}
          </span>
        </div>
        <div className="min-h-0 flex-1 overflow-hidden">
          <ScrollArea className="h-full w-full rounded-[10px]">
            <SidebarMenu className="min-w-max space-y-0.5 whitespace-nowrap pr-3 pt-1">
              {fileTree.map((item) => (
                <TreeNode
                  key={item.id}
                  node={item}
                />
              ))}
            </SidebarMenu>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}
