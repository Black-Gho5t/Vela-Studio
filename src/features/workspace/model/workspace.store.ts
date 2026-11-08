import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  WorkspaceState,
  WorkspaceTab,
  FileNode,
  WorkspaceMode,
  CursorPosition,
  DetectedScreen,
  BottomPanelTab,
  ExecutionLogItem,
} from "./workspace.types";

interface WorkspaceActions {
  setProjectName: (name: string | null) => void;
  setProjectPath: (path: string | null) => void;
  // Cursor Position
  setCursorPosition: (pos: CursorPosition) => void;
  // Tabs
  addTab: (tab: WorkspaceTab) => void;
  closeTab: (tabId: string) => void;
  setActiveTab: (tabId: string) => void;

  // Files
  setFileTree: (tree: FileNode[]) => void;
  refreshFileTree: () => void;

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

  // Settings
  openSettingsTab: () => void;

  // Flutter Wizard
  setFlutterWizardOpen: (open: boolean) => void;

  // Folder / Project
  closeFolder: () => void;

  // Screens
  setDetectedScreens: (screens: DetectedScreen[]) => void;
  scanScreens: () => Promise<void>;

  // Bottom Panel & Flutter Execution
  setBottomPanelOpen: (open: boolean) => void;
  setActiveBottomTab: (tab: BottomPanelTab) => void;
  startApp: (deviceId?: string) => Promise<void>;
  stopApp: () => Promise<void>;
  hotReloadApp: () => Promise<void>;
  hotRestartApp: () => Promise<void>;
  clearExecutionLogs: () => void;
  addExecutionLog: (message: string, level?: ExecutionLogItem["level"], raw?: string) => void;
  setAppRunning: (running: boolean) => void;
  setAppLaunching: (launching: boolean) => void;
  setAppId: (appId: string | null) => void;
}

export const useWorkspaceStore = create<WorkspaceState & WorkspaceActions>()(
  persist(
    (set, get) => ({
      // Initial State
      projectName: null,
      projectPath: null,
      tabs: [],
      activeTabId: null,
      fileTree: [],
      treeRevision: 0,
      devices: [],
      selectedDeviceId: null,
      workspaceMode: "editor",
      cursorPosition: { line: 1, column: 1 },
      isFlutterWizardOpen: false,
      detectedScreens: [],
      isScanningScreens: false,
      // Bottom Panel & Execution
      bottomPanelOpen: false,
      activeBottomTab: "OUTPUT",
      isAppRunning: false,
      isAppLaunching: false,
      appId: null,
      executionLogs: [],
      recentProjects: [
        {
          name: "Vela-Studio",
          path: "/Volumes/Developer/Personal/Vela-Studio",
          lastOpened: Date.now(),
        },
      ],
      showWelcomeOnStartup: true,

      // Actions
      openSettingsTab: () =>
        set((state) => {
          const existing = state.tabs.find((t) => t.id === "settings");
          if (existing) {
            return { activeTabId: "settings", workspaceMode: "editor" };
          }
          const settingsTab: WorkspaceTab = {
            id: "settings",
            name: "Settings",
            path: "settings",
            isActive: true,
            isModified: false,
          };
          return {
            tabs: [...state.tabs, settingsTab],
            activeTabId: "settings",
            workspaceMode: "editor",
          };
        }),
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
      setProjectPath: (path) => {
        set({ projectPath: path });
        if (path) {
          get().scanScreens();
        }
      },
      closeFolder: () => {
        import("../api/workspace.api").then(({ workspaceApi }) => {
          workspaceApi.stopWatchingWorkspace().catch(() => {});
        });
        import("@tauri-apps/api/core").then(({ invoke }) => {
          invoke("send_flutter_daemon_message", {
            message: JSON.stringify([{ id: Date.now(), method: "app.stop", params: {} }]),
          }).catch(() => {});
        });

        const welcomeTab: WorkspaceTab = {
          id: "welcome",
          name: "Welcome",
          path: "welcome",
          isActive: true,
          isModified: false,
        };

        set({
          projectName: null,
          projectPath: null,
          tabs: [welcomeTab],
          activeTabId: "welcome",
          fileTree: [],
          treeRevision: 0,
          workspaceMode: "editor",
          cursorPosition: { line: 1, column: 1 },
          detectedScreens: [],
          isScanningScreens: false,
        });
      },
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
      refreshFileTree: () => {
        set((state) => ({ treeRevision: state.treeRevision + 1 }));
        get().scanScreens();
      },

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
      setCursorPosition: (cursorPosition) => set({ cursorPosition }),
      setFlutterWizardOpen: (open) => set({ isFlutterWizardOpen: open }),

      setDetectedScreens: (detectedScreens) => set({ detectedScreens }),
      scanScreens: async () => {
        const path = get().projectPath;
        if (!path) {
          set({ detectedScreens: [], isScanningScreens: false });
          return;
        }
        set({ isScanningScreens: true });
        try {
          const { workspaceApi } = await import("../api/workspace.api");
          const screens = await workspaceApi.scanProjectScreens(path);
          set({ detectedScreens: screens, isScanningScreens: false });
        } catch (err) {
          console.error("Failed to scan project screens:", err);
          set({ isScanningScreens: false });
        }
      },

      // Bottom Panel & Execution
      setBottomPanelOpen: (open) => set({ bottomPanelOpen: open }),
      setActiveBottomTab: (tab) => set({ activeBottomTab: tab }),
      setAppRunning: (running) => set({ isAppRunning: running }),
      setAppLaunching: (launching) => set({ isAppLaunching: launching }),
      setAppId: (appId) => set({ appId }),

      addExecutionLog: (message, level = "info", raw) =>
        set((state) => {
          const now = new Date();
          const timestamp = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}`;
          const newLog: ExecutionLogItem = {
            id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            timestamp,
            message,
            level,
            raw,
          };
          const logs = state.executionLogs.length > 1000
            ? [...state.executionLogs.slice(-900), newLog]
            : [...state.executionLogs, newLog];
          return { executionLogs: logs };
        }),

      clearExecutionLogs: () => set({ executionLogs: [] }),

      startApp: async (deviceId) => {
        const { projectPath, selectedDeviceId, devices } = get();
        if (!projectPath) {
          get().addExecutionLog("⚠️ No hay ningún proyecto abierto para ejecutar.", "error");
          set({ bottomPanelOpen: true, activeBottomTab: "OUTPUT" });
          return;
        }

        const targetDeviceId = deviceId || selectedDeviceId || (devices[0]?.id ?? undefined);
        const deviceName = devices.find((d) => d.id === targetDeviceId)?.name || targetDeviceId || "dispositivo predeterminado";

        set({
          isAppLaunching: true,
          isAppRunning: false,
          bottomPanelOpen: true,
          activeBottomTab: "OUTPUT",
        });

        get().addExecutionLog(`🚀 Iniciando Flutter app en ${deviceName}...`, "info");

        try {
          const { invoke } = await import("@tauri-apps/api/core");
          await invoke("start_flutter_daemon", {
            projectPath,
            deviceId: targetDeviceId,
          });
        } catch (err: any) {
          const errorMsg = err?.message || String(err);
          get().addExecutionLog(`❌ Error al iniciar Flutter: ${errorMsg}`, "error");
          set({ isAppLaunching: false, isAppRunning: false });
        }
      },

      stopApp: async () => {
        const { appId } = get();
        try {
          const { invoke } = await import("@tauri-apps/api/core");
          await invoke("stop_flutter_daemon", { appId: appId || undefined });
          get().addExecutionLog("⏹️ Deteniendo aplicación Flutter...", "info");
        } catch (err: any) {
          console.error("Failed to stop Flutter daemon:", err);
        } finally {
          set({ isAppRunning: false, isAppLaunching: false, appId: null });
        }
      },

      hotReloadApp: async () => {
        const { appId, isAppRunning } = get();
        if (!isAppRunning) return;
        get().addExecutionLog("⚡ Ejecutando Hot Reload...", "info");
        try {
          const { invoke } = await import("@tauri-apps/api/core");
          await invoke("send_flutter_daemon_message", {
            message: JSON.stringify([{ id: Date.now(), method: "app.restart", params: { ...(appId ? { appId } : {}), fullRestart: false } }])
          });
        } catch (err: any) {
          get().addExecutionLog(`❌ Error en Hot Reload: ${err?.message || err}`, "error");
        }
      },

      hotRestartApp: async () => {
        const { appId, isAppRunning } = get();
        if (!isAppRunning) return;
        get().addExecutionLog("🔄 Ejecutando Hot Restart...", "info");
        try {
          const { invoke } = await import("@tauri-apps/api/core");
          await invoke("send_flutter_daemon_message", {
            message: JSON.stringify([{ id: Date.now(), method: "app.restart", params: { ...(appId ? { appId } : {}), fullRestart: true } }])
          });
        } catch (err: any) {
          get().addExecutionLog(`❌ Error en Hot Restart: ${err?.message || err}`, "error");
        }
      },
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

let daemonListenerInitialized = false;

export function setupFlutterDaemonListener() {
  if (daemonListenerInitialized || typeof window === "undefined") return;
  daemonListenerInitialized = true;

  import("@tauri-apps/api/event").then(({ listen }) => {
    listen<string>("flutter-daemon-msg", (event) => {
      const payload = event.payload;
      if (!payload) return;

      const store = useWorkspaceStore.getState();

      try {
        const raw = JSON.parse(payload);
        const msgs = Array.isArray(raw) ? raw : [raw];

        for (const msg of msgs) {
          if (!msg) continue;

          if (msg.event === "app.start") {
            store.setAppRunning(true);
            store.setAppLaunching(false);
            if (msg.params?.appId) {
              store.setAppId(msg.params.appId);
            }
            const device = msg.params?.deviceId || "";
            store.addExecutionLog(`✨ Aplicación Flutter iniciada en ${device}`, "success");
          } else if (msg.event === "app.progress") {
            const p = msg.params;
            if (p?.message) {
              store.addExecutionLog(`⚙️ ${p.message}`, "progress");
            }
          } else if (msg.event === "app.debugPort") {
            const wsUri = msg.params?.wsUri;
            if (wsUri) {
              store.addExecutionLog(`🔍 Debugger conectado: ${wsUri}`, "info");
            }
          } else if (msg.event === "app.started") {
            store.setAppRunning(true);
            store.setAppLaunching(false);
            store.addExecutionLog("✅ ¡Aplicación Flutter ejecutándose exitosamente! ⚡ Hot Reload activo.", "success");
          } else if (msg.event === "app.log") {
            const logText = msg.params?.log || "";
            if (logText.trim()) {
              store.addExecutionLog(logText.trimEnd(), "stdout");
            }
          } else if (msg.event === "app.stop") {
            store.setAppRunning(false);
            store.setAppLaunching(false);
            store.setAppId(null);
            const reason = msg.params?.reason ? ` (${msg.params.reason})` : "";
            store.addExecutionLog(`⏹️ Aplicación Flutter finalizada${reason}`, "info");
          } else if (msg.id && msg.result) {
            if (msg.result.message) {
              store.addExecutionLog(`⚡ ${msg.result.message}`, "success");
            }
          } else if (msg.event === "daemon.connected") {
            store.addExecutionLog(`🔌 Daemon conectado (v${msg.params?.version || "1.0"})`, "info");
          } else if (typeof msg === "object") {
            if (msg.params?.message) {
              store.addExecutionLog(msg.params.message, "info");
            }
          }
        }
      } catch {
        const trimmed = payload.trim();
        if (trimmed) {
          const isErr = trimmed.toLowerCase().includes("error") || trimmed.toLowerCase().includes("exception") || trimmed.toLowerCase().includes("failed");
          const isWarn = trimmed.toLowerCase().includes("warning");
          store.addExecutionLog(trimmed, isErr ? "error" : isWarn ? "stderr" : "stdout");
        }
      }
    });
  });
}
