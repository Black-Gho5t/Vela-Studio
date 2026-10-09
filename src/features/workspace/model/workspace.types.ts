export interface FileNode {
  id: string;
  name: string;
  path: string;
  type: "file" | "directory";
  children?: FileNode[];
  isExpanded?: boolean;
}

export interface WorkspaceTab {
  id: string;
  name: string;
  path: string;
  isActive: boolean;
  isModified: boolean;
  content?: string;
  isLoading?: boolean;
}

export type WorkspaceMode = "designer" | "editor";

export interface WorkspaceState {
  projectName: string | null;
  projectPath: string | null;
  tabs: WorkspaceTab[];
  activeTabId: string | null;
  fileTree: FileNode[];
  devices: any[];
  selectedDeviceId: string | null;
  workspaceMode: WorkspaceMode;
}
