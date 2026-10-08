import { create } from "zustand";
import { persist } from "zustand/middleware";
import { WorkspaceState, WorkspaceTab, FileNode } from "./workspace.types";

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
}

export const useWorkspaceStore = create<WorkspaceState & WorkspaceActions>()(
  persist(
    (set) => ({
      // Initial State
      projectName: null, // Start with no project to show Welcome UI
      projectPath: null,
      tabs: [],
      activeTabId: null,
      fileTree: [],
      devices: [],
      selectedDeviceId: null,

      // Actions
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
      }),
    },
  ),
);
