import type { CanvasWidgetElement, LayoutFlow, ScreenLayoutType } from "../ui/designer-canvas";

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

export interface RecentProject {
  name: string;
  path: string;
  lastOpened: number;
}

export type WorkspaceMode = "designer" | "editor";

export interface CursorPosition {
  line: number;
  column: number;
}

export interface DetectedScreen {
  id: string;
  name: string;
  className: string;
  fileName: string;
  filePath: string;
  relativePath: string;
  widgetType: string;
  screenLayout: ScreenLayoutType;
  layoutFlow: LayoutFlow;
  elements: CanvasWidgetElement[];
}

export type BottomPanelTab = "PROBLEMS" | "OUTPUT" | "DEBUG CONSOLE" | "TERMINAL";

export interface ExecutionLogItem {
  id: string;
  timestamp: string;
  message: string;
  level: "info" | "stdout" | "stderr" | "success" | "progress" | "error";
  raw?: string;
}

export interface WorkspaceState {
  projectName: string | null;
  projectPath: string | null;
  tabs: WorkspaceTab[];
  activeTabId: string | null;
  fileTree: FileNode[];
  treeRevision: number;
  devices: any[];
  selectedDeviceId: string | null;
  workspaceMode: WorkspaceMode;
  recentProjects?: RecentProject[];
  showWelcomeOnStartup?: boolean;
  cursorPosition?: CursorPosition;
  isFlutterWizardOpen?: boolean;
  detectedScreens?: DetectedScreen[];
  isScanningScreens?: boolean;
  // Bottom Panel & Execution
  bottomPanelOpen: boolean;
  activeBottomTab: BottomPanelTab;
  isAppRunning: boolean;
  isAppLaunching: boolean;
  appId: string | null;
  executionLogs: ExecutionLogItem[];
}
