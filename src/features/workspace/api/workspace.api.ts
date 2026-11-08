import { invoke } from "@tauri-apps/api/core";

export const workspaceApi = {
  /**
   * Reads a file from the disk using Tauri IPC.
   * @param path The absolute path to the file.
   */
  async readFile(path: string): Promise<string> {
    return invoke("read_file", { path });
  },

  /**
   * Saves a file to the disk using Tauri IPC.
   * @param path The absolute path to the file.
   * @param content The new content of the file.
   */
  async saveFile(path: string, content: string): Promise<void> {
    return invoke("save_file", { path, content });
  },

  /**
   * Deletes a file or directory from the disk using Tauri IPC.
   * @param path The absolute path to the file or directory.
   */
  async deleteFile(path: string): Promise<void> {
    return invoke("delete_file", { path });
  },

  /**
   * Fetches the directory tree for the workspace.
   * @param rootPath The root directory of the workspace.
   */
  async getDirectoryTree(rootPath: string): Promise<any[]> {
    return invoke("get_directory_tree", { path: rootPath });
  },

  /**
   * Surgically patches the Scaffold body in a Dart file using Tree-sitter in Rust.
   */
  async patchScaffoldBody(filePath: string, bodyCode: string, currentSource?: string): Promise<string> {
    return invoke("patch_scaffold_body", {
      filePath,
      bodyCode,
      currentSource: currentSource || null,
    });
  },

  /**
   * Parses Dart source code and extracts layout mode and CanvasWidgetElements using Tree-sitter in Rust.
   */
  async parseDartFileToCanvas(sourceCode: string): Promise<{
    elements: any[];
    layout_flow: string;
    screen_layout: string;
  }> {
    return invoke("parse_dart_file_to_canvas", { sourceCode });
  },

  /**
   * Generates clean canonical Dart screen code using Rust.
   */
  async generateFlutterScreen(className: string, screenTitle: string, layoutType: string): Promise<string> {
    return invoke("generate_flutter_screen", {
      className,
      screenTitle,
      layoutType,
    });
  }
};
