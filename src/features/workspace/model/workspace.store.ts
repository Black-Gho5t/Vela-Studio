import { create } from "zustand";
import { persist } from "zustand/middleware";
import { WorkspaceState, WorkspaceTab, FileNode, WorkspaceMode } from "./workspace.types";

interface WorkspaceActions {
  setProjectName: (name: string | null) => void;
  setProjectPath: (path: string | null) => void;
  // Tabs
  addTab: (tab: WorkspaceTab) => void;
  closeTab: (tabId: string) => void;
  setActiveTab: (tabId: string) => void;

  // Files
  setFileTree: (tree: FileNode[]) => void;

  // Editor
  updateTabContent: (tabId: string, content: string) => void;
  setTabLoaded: (tabId: string, content: string) => void;
  markTabUnmodified: (tabId: string) => void;

  // Devices
  setDevices: (devices: any[]) => void;
  setSelectedDeviceId: (id: string | null) => void;

  // Workspace Mode (Diseñador / Editor)
  setWorkspaceMode: (mode: WorkspaceMode) => void;

  // Recent Projects & Welcome
  addRecentProject: (project: { name: string; path: string }) => void;
  setShowWelcomeOnStartup: (show: boolean) => void;
  openWelcomeTab: () => void;
}

export const useWorkspaceStore = create<WorkspaceState & WorkspaceActions>()(
  persist(
    (set) => ({
      // Initial State
      projectName: null,
      projectPath: null,
      tabs: [],
      activeTabId: null,
      fileTree: [],
      devices: [],
      selectedDeviceId: null,
      workspaceMode: "editor",
      recentProjects: [
        {
          name: "Vela-Studio",
          path: "/Volumes/Developer/Personal/Vela-Studio",
          lastOpened: Date.now(),
        },
      ],
      showWelcomeOnStartup: true,

      // Actions
      openWelcomeTab: () =>
        set((state) => {
          const existing = state.tabs.find((t) => t.id === "welcome");
          if (existing) {
            return { activeTabId: "welcome" };
          }
          const welcomeTab: WorkspaceTab = {
            id: "welcome",
            name: "Welcome",
            path: "welcome",
            isActive: true,
            isModified: false,
          };
          return {
            tabs: [welcomeTab, ...state.tabs],
            activeTabId: "welcome",
          };
        }),
      setShowWelcomeOnStartup: (show) => set({ showWelcomeOnStartup: show }),
      addRecentProject: (project) =>
        set((state) => {
          const filtered = (state.recentProjects || []).filter(
            (p) => p.path !== project.path
          );
          return {
            recentProjects: [
              { ...project, lastOpened: Date.now() },
              ...filtered,
            ].slice(0, 10),
          };
        }),
      setWorkspaceMode: (mode) => set({ workspaceMode: mode }),
      setProjectName: (name) => set({ projectName: name }),
      setProjectPath: (path) => set({ projectPath: path }),
      addTab: (tab) =>
        set((state) => {
          const existing = state.tabs.find((t) => t.id === tab.id);
          if (existing) {
            return { activeTabId: tab.id };
          }
          return {
            tabs: [...state.tabs, tab],
            activeTabId: tab.id,
          };
        }),

      closeTab: (tabId) =>
        set((state) => {
          const newTabs = state.tabs.filter((t) => t.id !== tabId);
          return {
            tabs: newTabs,
            activeTabId:
              state.activeTabId === tabId
                ? newTabs[newTabs.length - 1]?.id || null
                : state.activeTabId,
          };
        }),

      setActiveTab: (tabId) => set({ activeTabId: tabId }),

      setFileTree: (tree) => set({ fileTree: tree }),

      updateTabContent: (tabId, content) =>
        set((state) => ({
          tabs: state.tabs.map((tab) =>
            tab.id === tabId ? { ...tab, content, isModified: true } : tab,
          ),
        })),

      setTabLoaded: (tabId, content) =>
        set((state) => ({
          tabs: state.tabs.map((tab) =>
            tab.id === tabId
              ? { ...tab, content, isLoading: false, isModified: false }
              : tab,
          ),
        })),

      markTabUnmodified: (tabId) =>
        set((state) => ({
          tabs: state.tabs.map((tab) =>
            tab.id === tabId ? { ...tab, isModified: false } : tab,
          ),
        })),

      setDevices: (devices) => set({ devices }),
      setSelectedDeviceId: (id) => set({ selectedDeviceId: id }),
    }),
    {
      name: "workspace-project-storage",
      partialize: (state) => ({
        projectName: state.projectName,
        projectPath: state.projectPath,
        workspaceMode: state.workspaceMode,
        recentProjects: state.recentProjects,
        showWelcomeOnStartup: state.showWelcomeOnStartup,
      }),
    },
  ),
);
