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
   * Fetches the directory tree for the workspace.
   * @param rootPath The root directory of the workspace.
   */
  async getDirectoryTree(rootPath: string): Promise<any[]> {
    return invoke("get_directory_tree", { path: rootPath });
  }
};
