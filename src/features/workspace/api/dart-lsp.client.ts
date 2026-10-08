import { listen } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";
import { useWorkspaceStore } from "../model/workspace.store";

function mapKind(lspKind: number): number {
  // Map LSP CompletionItemKind (1-25) to Monaco CompletionItemKind (0-23)
  if (!lspKind) return 3; // Field as default
  return lspKind - 1;
}

function mapSeverity(lspSeverity: number): number {
  // LSP: Error=1, Warning=2, Information=3, Hint=4
  // Monaco: Error=8, Warning=4, Info=2, Hint=1
  switch (lspSeverity) {
    case 1: return 8;
    case 2: return 4;
    case 3: return 2;
    case 4: return 1;
    default: return 4;
  }
}

class LightLspClient {
  private idCounter = 0;
  private pendingRequests = new Map<number, (value: any) => void>();
  private unlistenStdout: (() => void) | null = null;
  private unlistenStderr: (() => void) | null = null;

  constructor() {
    this.init();
  }

  async init() {
    this.unlistenStdout = await listen<string>("lsp-stdout-message", (event) => {
      try {
        const json = JSON.parse(event.payload);
        this.handleMessage(json);
      } catch (e: any) {
        console.error("❌ LSP Parse Error in frontend:", e, event.payload);
      }
    });

    this.unlistenStderr = await listen<string>("lsp-stderr", (event) => {
      console.warn("📡 LSP Stderr:", event.payload.trim());
    });
  }

  private handleMessage(msg: any) {
    if (msg.id !== undefined && this.pendingRequests.has(msg.id)) {
      const resolve = this.pendingRequests.get(msg.id);
      this.pendingRequests.delete(msg.id);
      if (resolve) resolve(msg);
    } else if (msg.method === "textDocument/publishDiagnostics") {
      this.publishDiagnostics(msg.params);
    }
  }

  private publishDiagnostics(params: any) {
    const { uri, diagnostics } = params;
    const globalMonaco = (window as any).monaco;
    if (!globalMonaco) return;

    // Find the model with this URI
    const model = globalMonaco.editor.getModels().find(
      (m: any) => m.uri.toString() === uri
    );
    if (!model) return;

    const markers = diagnostics.map((d: any) => ({
      severity: mapSeverity(d.severity),
      message: d.message,
      startLineNumber: d.range.start.line + 1,
      startColumn: d.range.start.character + 1,
      endLineNumber: d.range.end.line + 1,
      endColumn: d.range.end.character + 1,
    }));

    globalMonaco.editor.setModelMarkers(model, "dart", markers);
  }

  async sendRequest(method: string, params: any): Promise<any> {
    const id = this.idCounter++;
    const promise = new Promise((resolve) => {
      this.pendingRequests.set(id, resolve);
    });
    
    await invoke("send_lsp_message", {
      message: JSON.stringify({
        jsonrpc: "2.0",
        id,
        method,
        params,
      })
    });
    
    const response: any = await promise;
    return response.result;
  }

  async sendNotification(method: string, params: any) {
    await invoke("send_lsp_message", {
      message: JSON.stringify({
        jsonrpc: "2.0",
        method,
        params,
      })
    });
  }

  dispose() {
    if (this.unlistenStdout) this.unlistenStdout();
    if (this.unlistenStderr) this.unlistenStderr();
  }
}

let lspClient: LightLspClient | null = null;
let providerRegistered = false;

export async function initDartLsp(monaco: any) {
  console.log("🚀 Initializing Dart LSP (Lightweight Mode)...");

  // Save monaco instance globally for diagnostic publication
  (window as any).monaco = monaco;

  if (!lspClient) {
    lspClient = new LightLspClient();
  }

  const projectPath = useWorkspaceStore.getState().projectPath;

  if (!projectPath) {
    console.warn("⚠️ No project path found, skipping LSP start");
    return;
  }

  await invoke("start_lsp");
  console.log("📡 Rust LSP process started");

  // Send Initialize request
  try {
    await lspClient.sendRequest("initialize", {
      processId: null,
      capabilities: {
        textDocument: {
          completion: { completionItem: { snippetSupport: true } },
          hover: { contentFormat: ["markdown", "plaintext"] },
          definition: { dynamicRegistration: true },
        }
      },
      rootUri: monaco.Uri.file(projectPath).toString(),
    });
    
    await lspClient.sendNotification("initialized", {});
    console.log("✅ LSP handshake complete");
  } catch (e) {
    console.error("❌ Failed to handshake with LSP:", e);
  }

  // Hook up automatic document opening/closing/changing sync
  monaco.editor.getModels().forEach((model: any) => {
    if (model.getLanguageId() === 'dart') {
      lspClient?.sendNotification("textDocument/didOpen", {
        textDocument: {
          uri: model.uri.toString(),
          languageId: "dart",
          version: 1,
          text: model.getValue(),
        }
      });
      
      model.onDidChangeContent(() => {
        lspClient?.sendNotification("textDocument/didChange", {
          textDocument: {
            uri: model.uri.toString(),
            version: model.getVersionId(),
          },
          contentChanges: [{ text: model.getValue() }]
        });
      });
    }
  });

  // Listen for new models created at runtime
  monaco.editor.onDidCreateModel((model: any) => {
    if (model.getLanguageId() === 'dart') {
      lspClient?.sendNotification("textDocument/didOpen", {
        textDocument: {
          uri: model.uri.toString(),
          languageId: "dart",
          version: 1,
          text: model.getValue(),
        }
      });

      model.onDidChangeContent(() => {
        lspClient?.sendNotification("textDocument/didChange", {
          textDocument: {
            uri: model.uri.toString(),
            version: model.getVersionId(),
          },
          contentChanges: [{ text: model.getValue() }]
        });
      });
    }
  });

  // Listen for model disposals
  monaco.editor.onWillDisposeModel((model: any) => {
    if (model.getLanguageId() === 'dart') {
      lspClient?.sendNotification("textDocument/didClose", {
        textDocument: { uri: model.uri.toString() }
      });
    }
  });

  if (!providerRegistered) {
    providerRegistered = true;

    // Autocomplete Provider
    monaco.languages.registerCompletionItemProvider("dart", {
      triggerCharacters: [".", ":", " "],
      provideCompletionItems: async (model: any, position: any) => {
        if (!lspClient) return null;
        try {
          const res = await lspClient.sendRequest("textDocument/completion", {
            textDocument: { uri: model.uri.toString() },
            position: { line: position.lineNumber - 1, character: position.column - 1 }
          });
          
          const items = res?.items || res || [];
          return {
            suggestions: items.map((item: any) => ({
              label: typeof item.label === 'string' ? item.label : item.label.label,
              kind: mapKind(item.kind),
              insertText: item.insertText || (typeof item.label === 'string' ? item.label : item.label.label),
              detail: item.detail,
              documentation: typeof item.documentation === 'string' ? item.documentation : item.documentation?.value,
              range: {
                startLineNumber: position.lineNumber,
                startColumn: position.column,
                endLineNumber: position.lineNumber,
                endColumn: position.column,
              }
            }))
          };
        } catch (e) {
          console.error("Completion Error:", e);
          return null;
        }
      }
    });

    // Hover Provider
    monaco.languages.registerHoverProvider("dart", {
      provideHover: async (model: any, position: any) => {
        if (!lspClient) return null;
        try {
          const res = await lspClient.sendRequest("textDocument/hover", {
            textDocument: { uri: model.uri.toString() },
            position: { line: position.lineNumber - 1, character: position.column - 1 }
          });
          if (!res) return null;
          
          const contents = Array.isArray(res.contents)
            ? res.contents.map((c: any) => ({ value: c.value || c }))
            : [{ value: res.contents.value || res.contents }];
            
          return { contents };
        } catch (e) {
          console.error("Hover Error:", e);
          return null;
        }
      }
    });

    // Go to Definition Provider
    monaco.languages.registerDefinitionProvider("dart", {
      provideDefinition: async (model: any, position: any) => {
        if (!lspClient) return null;
        try {
          const res = await lspClient.sendRequest("textDocument/definition", {
            textDocument: { uri: model.uri.toString() },
            position: { line: position.lineNumber - 1, character: position.column - 1 }
          });
          if (!res) return null;
          
          const locs = Array.isArray(res) ? res : [res];
          return locs.map((loc: any) => ({
            uri: monaco.Uri.parse(loc.uri),
            range: {
              startLineNumber: loc.range.start.line + 1,
              startColumn: loc.range.start.character + 1,
              endLineNumber: loc.range.end.line + 1,
              endColumn: loc.range.end.character + 1,
            }
          }));
        } catch (e) {
          console.error("Definition Error:", e);
          return null;
        }
      }
    });

    console.log("✅ Monaco Dart language providers registered successfully");
  }
}
