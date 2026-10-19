import Editor from "@monaco-editor/react";
import { FileCode, X, Layout, FolderOpen, Compass } from "lucide-react";
import * as React from "react";
import { open as openDialog } from "@tauri-apps/plugin-dialog";
import { FileIcon } from "./file-icon";
import { ResizableSidebar } from "@/components/ui/ide-resizable";
import { WorkspaceWelcomeTab } from "./workspace-welcome-tab";

import { cn } from "@/lib/utils";

import { DEFAULT_EDITOR_CODE } from "../config/workspace.constants";
import { initDartLsp } from "../api/dart-lsp.client";

const dartMonarch = {
  defaultToken: "",
  tokenPostfix: ".dart",
  keywords: [
    "abstract",
    "as",
    "assert",
    "async",
    "await",
    "break",
    "case",
    "catch",
    "class",
    "const",
    "continue",
    "covariant",
    "default",
    "deferred",
    "do",
    "dynamic",
    "else",
    "enum",
    "export",
    "extends",
    "extension",
    "external",
    "factory",
    "false",
    "final",
    "finally",
    "for",
    "function",
    "get",
    "hide",
    "if",
    "implements",
    "import",
    "in",
    "interface",
    "is",
    "late",
    "library",
    "mixin",
    "native",
    "new",
    "null",
    "on",
    "operator",
    "part",
    "patch",
    "required",
    "rethrow",
    "return",
    "set",
    "show",
    "static",
    "super",
    "switch",
    "sync",
    "this",
    "throw",
    "true",
    "try",
    "typedef",
    "var",
    "void",
    "while",
    "with",
    "yield",
  ],
  typeKeywords: ["bool", "double", "int", "num", "Object", "String", "void"],
  operators: [
    "+",
    "-",
    "*",
    "/",
    "~/",
    "%",
    "++",
    "--",
    "==",
    "!=",
    ">",
    "<",
    ">=",
    "<=",
    "&&",
    "||",
    "!",
    "&",
    "|",
    "^",
    "~",
    "<<",
    ">>",
    ">>>",
    "=",
    "+=",
    "-=",
    "*=",
    "/=",
    "~/=",
    "%=",
    "&=",
    "|=",
    "^=",
    "<<=",
    ">>=",
    ">>>=",
    "??",
    "??=",
    "?",
    ":",
    ".",
    "..",
    "...",
    "=>",
  ],
  symbols: /[=><!~?:&|+\-*\/\^%]+/,
  escapes:
    /\\(?:[abfnrtv\\"']|x[0-9A-Fa-f]{2}|u[0-9A-Fa-f]{4}|u\{[0-9A-Fa-f]{1,6}\})/,
  tokenizer: {
    root: [
      [
        /[a-z_$][\w$]*/,
        {
          cases: {
            "@typeKeywords": "keyword",
            "@keywords": "keyword",
            "@default": "variable",
          },
        },
      ],
      [/[A-Z][\w$]*/, "type.identifier"],
      { include: "@whitespace" },
      [/[{}()\[\]]/, "@brackets"],
      [/[<>](?!@symbols)/, "@brackets"],
      [
        /@symbols/,
        {
          cases: {
            "@operators": "operator",
            "@default": "",
          },
        },
      ],
      [/\d*\.\d+([eE][\-+]?\d+)?/, "number.float"],
      [/0[xX][0-9a-fA-F]+/, "number.hex"],
      [/\d+/, "number"],
      [/[;,.]/, "delimiter"],
      [/"([^"\\]|\\.)*$/, "string.invalid"],
      [/'([^'\\]|\\.)*$/, "string.invalid"],
      [/"/, "string", "@string_double"],
      [/'/, "string", "@string_single"],
    ],
    whitespace: [
      [/[ \t\r\n]+/, "white"],
      [/\/\*/, "comment", "@comment"],
      [/\/\/.*$/, "comment"],
    ],
    comment: [
      [/[^\/*]+/, "comment"],
      [/\/\*/, "comment", "@push"],
      ["\\*/", "comment", "@pop"],
      [/[\/*]/, "comment"],
    ],
    string_double: [
      [/[^\\"]+/, "string"],
      [/@escapes/, "string.escape"],
      [/\\./, "string.escape.invalid"],
      [/"/, "string", "@pop"],
    ],
    string_single: [
      [/[^\\']+/, "string"],
      [/@escapes/, "string.escape"],
      [/\\./, "string.escape.invalid"],
      [/'/, "string", "@pop"],
    ],
  },
};

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

import { useTheme } from "@/shared/providers/theme";
import { useWorkspaceStore } from "../model/workspace.store";

import { VelaDesigner } from "./vela-designer";

interface WorkspaceOverviewProps {
  onSwitchView?: (view: "explorer" | "search" | "git") => void;
}

export function WorkspaceOverview({ onSwitchView }: WorkspaceOverviewProps = {}) {
  const {
    tabs,
    activeTabId,
    setActiveTab,
    closeTab,
    updateTabContent,
    projectName,
  } = useWorkspaceStore();
  const { theme } = useTheme();
  const [isDark, setIsDark] = React.useState(true);
  const [showDesigner, setShowDesigner] = React.useState(false);

  React.useEffect(() => {
    if (theme === "dark") {
      setIsDark(true);
    } else if (theme === "light") {
      setIsDark(false);
    } else {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      setIsDark(mediaQuery.matches);

      const listener = (e: MediaQueryListEvent) => setIsDark(e.matches);
      mediaQuery.addEventListener("change", listener);
      return () => mediaQuery.removeEventListener("change", listener);
    }
  }, [theme]);

  const activeTab = tabs.find((t) => t.id === activeTabId);
  const content = activeTab?.content ?? DEFAULT_EDITOR_CODE;

  React.useEffect(() => {
    const state = useWorkspaceStore.getState();
    if (!state.projectName && state.tabs.length === 0 && state.showWelcomeOnStartup !== false) {
      state.openWelcomeTab();
    }
  }, []);

  const handleEditorWillMount = (monaco: any) => {
    // Register Dart
    monaco.languages.register({ id: "dart" });
    monaco.languages.setMonarchTokensProvider("dart", dartMonarch);

    initDartLsp(monaco).catch(console.error);

    monaco.editor.defineTheme("vela-dark", {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "comment", foreground: "71717a", fontStyle: "italic" },
        { token: "keyword", foreground: "7dd3fc" }, // soft blue
        { token: "string", foreground: "a7f3d0" }, // soft green
        { token: "number", foreground: "fbbf24" }, // amber
        { token: "type", foreground: "f472b6" }, // pink
        { token: "function", foreground: "fb7185" }, // rose
        { token: "variable", foreground: "f4f4f5" }, // zinc-100
        { token: "constant", foreground: "c084fc" }, // purple
      ],
      colors: {
        "editor.background": "#141416",
        "editor.foreground": "#fafafa",
        "editorLineNumber.foreground": "#52525b",
        "editorLineNumber.activeForeground": "#a1a1aa",
        "editor.lineHighlightBackground": "#1d1d21",
        "editorCursor.foreground": "#fafafa",
        "editor.selectionBackground": "#27272a",
        "editor.inactiveSelectionBackground": "#18181b",
        "editorIndentGuide.background": "#27272a",
        "editorIndentGuide.activeBackground": "#3f3f46",
        "editorBracketMatch.background": "#27272a",
        "editorBracketMatch.border": "#3f3f46",
        "editor.border": "#141416",
        "editorGroupHeader.tabsBackground": "#141416",
        "editorWidget.background": "#1c1c20",
        "editorWidget.border": "#2e2e34",
        "editorSuggestWidget.background": "#1c1c20",
        "editorSuggestWidget.border": "#2e2e34",
        "editorSuggestWidget.selectedBackground": "#2e2e34",
        "scrollbarSlider.background": "#27272a50",
        "scrollbarSlider.hoverBackground": "#27272a80",
        "scrollbarSlider.activeBackground": "#27272a",
      },
    });

    monaco.editor.defineTheme("vela-light", {
      base: "vs",
      inherit: true,
      rules: [
        { token: "comment", foreground: "71717a", fontStyle: "italic" },
        { token: "keyword", foreground: "0284c7" },
        { token: "string", foreground: "059669" },
        { token: "number", foreground: "d97706" },
        { token: "type", foreground: "db2777" },
        { token: "function", foreground: "e11d48" },
        { token: "variable", foreground: "18181b" },
        { token: "constant", foreground: "7c3aed" },
      ],
      colors: {
        "editor.background": "#ffffff",
        "editor.foreground": "#18181b",
        "editorLineNumber.foreground": "#a1a1aa",
        "editorLineNumber.activeForeground": "#3f3f46",
        "editor.lineHighlightBackground": "#f4f4f5",
        "editorCursor.foreground": "#18181b",
        "editor.selectionBackground": "#e4e4e7",
        "editorIndentGuide.background": "#f4f4f5",
        "editorIndentGuide.activeBackground": "#e4e4e7",
        "editor.border": "#ffffff",
        "editorGroupHeader.tabsBackground": "#ffffff",
        "editorWidget.background": "#ffffff",
        "editorWidget.border": "#e4e4e7",
      },
    });
  };

  const handleEditorDidMount = (editor: any, monaco: any) => {
    // Add save command
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      const state = useWorkspaceStore.getState();
      const currentActiveTabId = state.activeTabId;
      if (!currentActiveTabId) return;

      const currentTab = state.tabs.find((t) => t.id === currentActiveTabId);
      if (!currentTab || currentTab.isLoading) return;

      const currentContent = editor.getValue();
      state.updateTabContent(currentActiveTabId, currentContent);

      import("../api/workspace.api").then(({ workspaceApi }) => {
        workspaceApi.saveFile(currentTab.path, currentContent).then(() => {
          useWorkspaceStore.getState().markTabUnmodified(currentActiveTabId);
          // Trigger hot reload by sending 'r' to the terminal
          import("@tauri-apps/api/core").then(({ invoke }) => {
            invoke("write_terminal", { data: "r" }).catch(console.error);
          });
        });
      });
    });
  };

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
    <div className="flex h-full w-full flex-1 flex-col overflow-hidden bg-background">
      {/* Editor Tabs */}
      <div className="flex h-9 items-center gap-px border-b border-border/60 bg-muted/20 px-1 pt-1">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTabId;
          return (
            <div
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "group relative flex h-full min-w-[120px] max-w-[200px] cursor-pointer items-center gap-2 rounded-t-md border-x border-t border-transparent px-3 text-xs transition-colors select-none",
                isActive
                  ? "border-border/60 bg-background text-foreground shadow-2xs font-medium"
                  : "text-muted-foreground hover:bg-muted/40 hover:text-foreground",
              )}
            >
              {tab.id === "welcome" ? (
                <Compass className="size-3.5 text-primary shrink-0" />
              ) : (
                <FileIcon fileName={tab.name} size={14} className="shrink-0" />
              )}
              <span className="truncate">{tab.name}</span>
              <div className="ml-auto flex items-center">
                {tab.isModified && !isActive && (
                  <div className="size-1.5 rounded-full bg-primary/50 group-hover:hidden" />
                )}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    closeTab(tab.id);
                  }}
                  className={cn(
                    "flex size-4 items-center justify-center rounded-sm transition-colors hover:bg-muted text-muted-foreground hover:text-foreground",
                    isActive
                      ? "opacity-100"
                      : "opacity-0 group-hover:opacity-100",
                  )}
                >
                  <X className="size-2.5" />
                </button>
              </div>
              {isActive && (
                <div className="absolute -bottom-[1px] left-0 h-[2px] w-full bg-primary" />
              )}
            </div>
          );
        })}
        
        {/* Toggle Designer Button */}
        {activeTab && activeTab.path.endsWith(".dart") && (
          <div className="ml-auto mr-2 flex items-center gap-2">
            <Button 
              variant={showDesigner ? "secondary" : "outline"} 
              size="xs" 
              className={cn(
                "h-6 text-[10px] gap-1",
                showDesigner && "border-primary/30 text-primary"
              )}
              onClick={() => setShowDesigner(!showDesigner)}
            >
              <Layout className="size-3" data-icon="inline-start" />
              {showDesigner ? "Hide Designer" : "Split Designer"}
            </Button>
          </div>
        )}
      </div>

      <div className="flex flex-1 min-h-0 min-w-0 w-full h-full overflow-hidden">
        {/* Editor Content with Custom Context Menu */}
        <div className="flex flex-col min-h-0 min-w-0 flex-1">
      <ContextMenu>
        <ContextMenuTrigger className="flex-1 overflow-hidden relative">
          {activeTabId ? (
            activeTab?.id === "welcome" ? (
              <WorkspaceWelcomeTab onSwitchView={onSwitchView} />
            ) : activeTab?.isLoading ? (
              <div className="flex h-full items-center justify-center bg-background text-muted-foreground animate-pulse text-sm">
                Loading {activeTab.name}…
              </div>
            ) : (
              <Editor
                height="100%"
                language={
                  activeTab?.name.endsWith(".dart") ? "dart" : "typescript"
                }
                path={activeTab ? `file://${activeTab.path}` : "untitled"}
                value={content}
                onChange={(v) => {
                  if (activeTabId && v !== undefined && !activeTab?.isLoading) {
                    updateTabContent(activeTabId, v);
                  }
                }}
                theme={isDark ? "vela-dark" : "vela-light"}
                beforeMount={handleEditorWillMount}
                onMount={handleEditorDidMount}
                options={{
                  automaticLayout: true,
                  fontSize: 13,
                  fontFamily:
                    "'JetBrains Mono', 'Fira Code', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                  minimap: { enabled: true, scale: 0.75, side: "right" },
                  scrollBeyondLastLine: false,
                  lineNumbers: "on",
                  glyphMargin: true,
                  folding: true,
                  lineDecorationsWidth: 10,
                  lineNumbersMinChars: 3,
                  fixedOverflowWidgets: true,
                  padding: { top: 16, bottom: 16 },
                  cursorSmoothCaretAnimation: "on",
                  smoothScrolling: true,
                  cursorStyle: "line",
                  renderLineHighlight: "all",
                  bracketPairColorization: { enabled: true },
                  guides: { indentation: true, bracketPairs: true },
                  contextmenu: false, // Disable native context menu
                }}
                loading={
                  <div className="flex h-full items-center justify-center bg-background text-muted-foreground animate-pulse">
                    Initializing editor…
                  </div>
                }
              />
            )
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-background">
              <Empty className="border-none max-w-sm">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    {projectName ? (
                      <FileCode className="size-5 text-muted-foreground" />
                    ) : (
                      <FolderOpen className="size-5 text-muted-foreground" />
                    )}
                  </EmptyMedia>
                  <EmptyTitle className="text-sm">
                    {projectName ? "No file selected" : "No folder opened"}
                  </EmptyTitle>
                  <EmptyDescription className="text-xs text-muted-foreground">
                    {projectName
                      ? "Select a file from the explorer to view and edit code."
                      : "Open a folder to start working on your project."}
                  </EmptyDescription>
                </EmptyHeader>
                {!projectName && (
                  <div className="mt-3 flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleOpenFolder}
                      className="text-xs"
                    >
                      <FolderOpen className="size-3.5 mr-1.5" />
                      Open Folder
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => useWorkspaceStore.getState().openWelcomeTab()}
                      className="text-xs text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      <Compass className="size-3.5 mr-1.5 text-primary" />
                      Welcome Page
                    </Button>
                  </div>
                )}
              </Empty>
            </div>
          )}
        </ContextMenuTrigger>
        <ContextMenuContent className="w-64">
          <ContextMenuGroup>
            <ContextMenuItem>
              Command Palette…
              <ContextMenuShortcut>F1</ContextMenuShortcut>
            </ContextMenuItem>
          </ContextMenuGroup>
          <ContextMenuSeparator />
          <ContextMenuGroup>
            <ContextMenuItem>
              Go to Definition
              <ContextMenuShortcut>F12</ContextMenuShortcut>
            </ContextMenuItem>
            <ContextMenuItem>Go to Type Definition</ContextMenuItem>
            <ContextMenuItem>
              Go to Implementations
              <ContextMenuShortcut>⌘F12</ContextMenuShortcut>
            </ContextMenuItem>
            <ContextMenuItem>
              Go to References
              <ContextMenuShortcut>⇧F12</ContextMenuShortcut>
            </ContextMenuItem>
          </ContextMenuGroup>
          <ContextMenuSeparator />
          <ContextMenuGroup>
            <ContextMenuItem>
              Format Document
              <ContextMenuShortcut>⇧⌥F</ContextMenuShortcut>
            </ContextMenuItem>
            <ContextMenuItem>
              Format Selection
              <ContextMenuShortcut>⌘K ⌘F</ContextMenuShortcut>
            </ContextMenuItem>
          </ContextMenuGroup>
          <ContextMenuSeparator />
          <ContextMenuGroup>
            <ContextMenuItem>
              Refactor...
              <ContextMenuShortcut>⌘⇧R</ContextMenuShortcut>
            </ContextMenuItem>
            <ContextMenuItem>Source Action...</ContextMenuItem>
          </ContextMenuGroup>
          <ContextMenuSeparator />
          <ContextMenuGroup>
            <ContextMenuSub>
              <ContextMenuSubTrigger>
                Change All Occurrences
              </ContextMenuSubTrigger>
              <ContextMenuSubContent className="w-48">
                <ContextMenuGroup>
                  <ContextMenuItem>
                    Rename Symbol<ContextMenuShortcut>F2</ContextMenuShortcut>
                  </ContextMenuItem>
                </ContextMenuGroup>
              </ContextMenuSubContent>
            </ContextMenuSub>
          </ContextMenuGroup>
          <ContextMenuSeparator />
          <ContextMenuGroup>
            <ContextMenuItem>
              Cut
              <ContextMenuShortcut>⌘X</ContextMenuShortcut>
            </ContextMenuItem>
            <ContextMenuItem>
              Copy
              <ContextMenuShortcut>⌘C</ContextMenuShortcut>
            </ContextMenuItem>
            <ContextMenuItem>
              Paste
              <ContextMenuShortcut>⌘V</ContextMenuShortcut>
            </ContextMenuItem>
          </ContextMenuGroup>
        </ContextMenuContent>
      </ContextMenu>
      </div>

      {/* Designer View */}
      {showDesigner && activeTab && activeTab.path.endsWith(".dart") && (
        <ResizableSidebar id="designer" side="right" defaultWidth={600} minWidth={300} maxWidth={1200}>
          <div className="flex-1 w-full h-full border-l border-border bg-background">
            <VelaDesigner code={content || ""} filePath={activeTab.path} />
          </div>
        </ResizableSidebar>
      )}
      </div>

      {/* Breadcrumbs */}
      <div className="flex h-6 items-center border-t border-border/40 bg-muted/20 px-3 text-[11px] text-muted-foreground">
        {activeTab ? (
          activeTab.id === "welcome" ? (
            <span className="text-[11px] text-muted-foreground/80">Welcome</span>
          ) : (
            <div className="flex items-center gap-1.5 overflow-hidden truncate">
              {activeTab.path.split(/[/\\]/).filter(Boolean).map((part, index, arr) => (
                <React.Fragment key={index}>
                  <span className={cn(index === arr.length - 1 ? "text-foreground font-medium" : "text-muted-foreground/80")}>
                    {part}
                  </span>
                  {index < arr.length - 1 && <span className="opacity-30">/</span>}
                </React.Fragment>
              ))}
            </div>
          )
        ) : (
          <span className="text-[10px] text-muted-foreground/60">No file open</span>
        )}
      </div>
    </div>
  );
}

