import * as React from "react";
import { Terminal } from "xterm";
import { FitAddon } from "xterm-addon-fit";
import "xterm/css/xterm.css";
import { listen } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";
import { useTheme } from "@/shared/providers/theme";

const darkTerminalTheme = {
  background: "#141416",
  foreground: "#fafafa",
  cursor: "#fafafa",
  black: "#18181b",
  red: "#ef4444",
  green: "#10b981",
  yellow: "#f59e0b",
  blue: "#3b82f6",
  magenta: "#8b5cf6",
  cyan: "#06b6d4",
  white: "#fafafa",
};

const lightTerminalTheme = {
  background: "#ffffff",
  foreground: "#18181b",
  cursor: "#18181b",
  black: "#000000",
  red: "#dc2626",
  green: "#16a34a",
  yellow: "#ca8a04",
  blue: "#2563eb",
  magenta: "#7c3aed",
  cyan: "#0891b2",
  white: "#ffffff",
};

export function WorkspaceTerminal({ projectPath }: { projectPath?: string }) {
  const terminalRef = React.useRef<HTMLDivElement>(null);
  const xtermRef = React.useRef<Terminal | null>(null);
  const fitAddonRef = React.useRef<FitAddon | null>(null);
  const initialized = React.useRef(false);
  const { theme } = useTheme();

  const [isDark, setIsDark] = React.useState(() => {
    if (typeof window === "undefined") return true;
    if (theme === "dark") return true;
    if (theme === "light") return false;
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  React.useEffect(() => {
    if (theme === "dark") {
      setIsDark(true);
      return;
    }
    if (theme === "light") {
      setIsDark(false);
      return;
    }
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    setIsDark(mediaQuery.matches);
    const handler = (e: MediaQueryListEvent) => setIsDark(e.matches);
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, [theme]);

  React.useEffect(() => {
    if (xtermRef.current) {
      xtermRef.current.options.theme = isDark ? darkTerminalTheme : lightTerminalTheme;
    }
  }, [isDark]);

  React.useEffect(() => {
    if (!terminalRef.current || initialized.current) return;
    initialized.current = true;
    let isDisposed = false;
    let unlistenStdout: (() => void) | null = null;
    let resizeTimer: number | null = null;

    // 1. Initialize Terminal
    const term = new Terminal({
      cursorBlink: true,
      fontFamily: "'JetBrains Mono', 'Fira Code', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
      fontSize: 12,
      theme: isDark ? darkTerminalTheme : lightTerminalTheme,
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    
    term.open(terminalRef.current);
    fitAddon.fit();

    xtermRef.current = term;
    fitAddonRef.current = fitAddon;

    // 2. Start the PTY process in Rust
    let lastCols = term.cols || 80;
    let lastRows = term.rows || 24;

    invoke("start_terminal", { cols: lastCols, rows: lastRows, cwd: projectPath })
      .then(() => {
        console.log("PTY started successfully");
      })
      .catch((err) => {
        if (!isDisposed) {
          term.write(`\r\n❌ Failed to start terminal: ${err}\r\n`);
        }
      });

    // 3. Listen to incoming stdout from PTY and write to xterm
    listen<string>("terminal-stdout", (event) => {
      if (!isDisposed) {
        term.write(event.payload);
      }
    }).then((unsub) => {
      if (isDisposed) {
        unsub();
      } else {
        unlistenStdout = unsub;
      }
    });

    // 4. Send keystrokes to Rust PTY
    const onDataDisposable = term.onData((data) => {
      invoke("write_terminal", { data }).catch(console.error);
    });

    // 5. Handle resizing (debounced and only on actual dimension changes)
    const resizeObserver = new ResizeObserver(() => {
      if (resizeTimer) cancelAnimationFrame(resizeTimer);
      resizeTimer = requestAnimationFrame(() => {
        if (isDisposed || !fitAddonRef.current || !xtermRef.current || !terminalRef.current) return;
        fitAddonRef.current.fit();
        const newCols = xtermRef.current.cols;
        const newRows = xtermRef.current.rows;
        if (newCols && newRows && (newCols !== lastCols || newRows !== lastRows)) {
          lastCols = newCols;
          lastRows = newRows;
          invoke("resize_terminal", { cols: newCols, rows: newRows }).catch(console.error);
        }
      });
    });
    resizeObserver.observe(terminalRef.current);

    return () => {
      isDisposed = true;
      if (resizeTimer) cancelAnimationFrame(resizeTimer);
      onDataDisposable.dispose();
      resizeObserver.disconnect();
      if (unlistenStdout) {
        unlistenStdout();
      }
      term.dispose();
      initialized.current = false;
    };
  }, []);

  return (
    <div className="h-full w-full bg-transparent px-3 py-1.5 overflow-hidden">
      <div ref={terminalRef} className="h-full w-full min-h-0 min-w-0" />
    </div>
  );
}
