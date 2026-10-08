import Editor from "@monaco-editor/react";
import { FileCode, X, Layout } from "lucide-react";
import * as React from "react";
import { FileIcon } from "./file-icon";
import { ResizableSidebar } from "@/components/ui/ide-resizable";

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
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Button } from "@/components/ui/button";

import { useTheme } from "@/shared/providers/theme";
import { useWorkspaceStore } from "../model/workspace.store";

import { WorkspaceWelcome } from "./workspace-welcome";
import { VelaDesigner } from "./vela-designer";

export function WorkspaceOverview() {
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
    // We can't easily get the monaco instance here without the loader
    // but the beforeMount hook handles registration.
    // We just need to trigger the LSP start once.
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
        "editor.background": "#09090b", // Matches --background
        "editor.foreground": "#fafafa",
        "editorLineNumber.foreground": "#3f3f46",
        "editorLineNumber.activeForeground": "#a1a1aa",
        "editor.lineHighlightBackground": "#18181b",
        "editorCursor.foreground": "#fafafa",
        "editor.selectionBackground": "#27272a",
        "editor.inactiveSelectionBackground": "#18181b",
        "editorIndentGuide.background": "#18181b",
        "editorIndentGuide.activeBackground": "#27272a",
        "editorBracketMatch.background": "#27272a",
        "editorBracketMatch.border": "#3f3f46",
        "editor.border": "#09090b",
        "editorGroupHeader.tabsBackground": "#09090b",
        "editorWidget.background": "#18181b",
        "editorWidget.border": "#27272a",
        "editorSuggestWidget.background": "#18181b",
        "editorSuggestWidget.border": "#27272a",
        "editorSuggestWidget.selectedBackground": "#27272a",
        "scrollbarSlider.background": "#27272a50",
        "scrollbarSlider.hoverBackground": "#27272a80",
        "scrollbarSlider.activeBackground": "#27272a",
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

  if (!projectName) {
    return <WorkspaceWelcome />;
  }

  return (
    <div className="flex h-full w-full flex-1 flex-col overflow-hidden bg-background">
      {/* Editor Tabs */}
      <div className="flex h-9 items-center gap-px border-b border-border/60 bg-muted/30 px-1 pt-1">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTabId;
          return (
            <div
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "group relative flex h-full min-w-[120px] max-w-[200px] cursor-pointer items-center gap-2 rounded-t-lg border-x border-t border-transparent px-3 text-[11px] transition-all duration-150 select-none",
                isActive
                  ? "border-border/60 bg-background text-foreground"
                  : "text-muted-foreground hover:bg-background/50 hover:text-foreground",
              )}
            >
              <FileIcon fileName={tab.name} size={14} className="shrink-0" />
              <span className="truncate">{tab.name}</span>
              <div className="ml-auto flex items-center">
                {tab.isModified && !isActive && (
                  <div className="size-1.5 rounded-full bg-foreground/30 group-hover:hidden" />
                )}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    closeTab(tab.id);
                  }}
                  className={cn(
                    "flex size-4 items-center justify-center rounded-md transition-colors hover:bg-muted",
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
              variant="outline" 
              size="sm" 
              className={cn("h-6 text-[10px] px-2", showDesigner ? "bg-sky-500/10 text-sky-500 border-sky-500/50" : "text-muted-foreground")}
              onClick={() => setShowDesigner(!showDesigner)}
            >
              <Layout className="size-3 mr-1" />
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
            activeTab?.isLoading ? (
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
                theme={isDark ? "vela-dark" : "vs"}
                beforeMount={handleEditorWillMount}
                onMount={handleEditorDidMount}
                options={{
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
            <div className="flex h-full w-full items-center justify-center bg-background text-muted-foreground/50">
              <div className="flex flex-col items-center justify-center gap-2">
                <FileCode className="size-16 opacity-20" />
                <p className="text-sm font-medium tracking-[0.24px] opacity-60">
                  Select a file to start coding
                </p>
              </div>
            </div>
          )}
        </ContextMenuTrigger>
        <ContextMenuContent className="w-64">
          <ContextMenuItem>
            Command Palette…
            <ContextMenuShortcut>F1</ContextMenuShortcut>
          </ContextMenuItem>
          <ContextMenuSeparator />
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
          <ContextMenuSeparator />
          <ContextMenuItem>
            Format Document
            <ContextMenuShortcut>⇧⌥F</ContextMenuShortcut>
          </ContextMenuItem>
          <ContextMenuItem>
            Format Selection
            <ContextMenuShortcut>⌘K ⌘F</ContextMenuShortcut>
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem>
            Refactor...
            <ContextMenuShortcut>⌘⇧R</ContextMenuShortcut>
          </ContextMenuItem>
          <ContextMenuItem>Source Action...</ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuSub>
            <ContextMenuSubTrigger>
              Change All Occurrences
            </ContextMenuSubTrigger>
            <ContextMenuSubContent className="w-48">
              <ContextMenuItem>
                Rename Symbol<ContextMenuShortcut>F2</ContextMenuShortcut>
              </ContextMenuItem>
            </ContextMenuSubContent>
          </ContextMenuSub>
          <ContextMenuSeparator />
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
      <div className="flex h-6 items-center border-t border-border/40 bg-background/50 px-4 text-[10px] text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <span>src</span>
          <span className="opacity-40">/</span>
          <span>features</span>
          <span className="opacity-40">/</span>
          <span>workspace</span>
          <span className="opacity-40">/</span>
          <span>ui</span>
          <span className="opacity-40">/</span>
          <span className="text-foreground/80">workspace-sidebar.tsx</span>
        </div>
      </div>
    </div>
  );
}
