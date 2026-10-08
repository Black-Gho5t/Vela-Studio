import * as React from "react";
import { Terminal } from "xterm";
import { FitAddon } from "xterm-addon-fit";
import "xterm/css/xterm.css";
import { listen } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";

export function WorkspaceTerminal({ projectPath }: { projectPath?: string }) {
  const terminalRef = React.useRef<HTMLDivElement>(null);
  const xtermRef = React.useRef<Terminal | null>(null);
  const fitAddonRef = React.useRef<FitAddon | null>(null);
  const initialized = React.useRef(false);

  React.useEffect(() => {
    if (!terminalRef.current || initialized.current) return;
    initialized.current = true;

    // 1. Initialize Terminal
    const term = new Terminal({
      cursorBlink: true,
      fontFamily: "'JetBrains Mono', 'Fira Code', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
      fontSize: 12,
      theme: {
        background: "#09090b", // Matches --background
        foreground: "#fafafa",
        cursor: "#fafafa",
        black: "#000000",
        red: "#ef4444",
        green: "#10b981",
        yellow: "#f59e0b",
        blue: "#3b82f6",
        magenta: "#8b5cf6",
        cyan: "#06b6d4",
        white: "#fafafa",
      },
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    
    term.open(terminalRef.current);
    fitAddon.fit();

    xtermRef.current = term;
    fitAddonRef.current = fitAddon;

    // 2. Start the PTY process in Rust
    const cols = term.cols || 80;
    const rows = term.rows || 24;

    invoke("start_terminal", { cols, rows, cwd: projectPath })
      .then(() => {
        console.log("PTY started successfully");
      })
      .catch((err) => {
        term.write(`\r\n❌ Failed to start terminal: ${err}\r\n`);
      });

    // 3. Listen to incoming stdout from PTY and write to xterm
    let unlistenStdout: (() => void) | null = null;
    listen<string>("terminal-stdout", (event) => {
      term.write(event.payload);
    }).then((unsub) => {
      unlistenStdout = unsub;
    });

    // 4. Send keystrokes to Rust PTY
    const onDataDisposable = term.onData((data) => {
      invoke("write_terminal", { data }).catch(console.error);
    });

    // 5. Handle resizing
    const resizeObserver = new ResizeObserver(() => {
      if (fitAddonRef.current && xtermRef.current && terminalRef.current) {
        fitAddonRef.current.fit();
        const newCols = xtermRef.current.cols;
        const newRows = xtermRef.current.rows;
        invoke("resize_terminal", { cols: newCols, rows: newRows }).catch(console.error);
      }
    });
    resizeObserver.observe(terminalRef.current);

    return () => {
      onDataDisposable.dispose();
      resizeObserver.disconnect();
      if (unlistenStdout) unlistenStdout();
      term.dispose();
      initialized.current = false;
    };
  }, []);

  return (
    <div className="h-full w-full bg-[#09090b] px-4 py-2 overflow-hidden">
      <div ref={terminalRef} className="h-full w-full min-h-0 min-w-0" />
    </div>
  );
}
