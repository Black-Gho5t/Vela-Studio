import { invoke } from "@tauri-apps/api/core";

export interface GitStatusFile {
  path: string;
  status: string;
  staged: boolean;
}

export interface GitCommitInfo {
  id: string;
  short_id: string;
  author_name: string;
  author_email: string;
  timestamp: number;
  relative_date: string;
  message: string;
}

export interface GitRepoStatus {
  branch: string;
  is_repo: boolean;
  staged: GitStatusFile[];
  unstaged: GitStatusFile[];
}

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
   * Fetches only immediate children of a single directory for lazy loading.
   * @param dirPath The directory to list.
   */
  async getDirectoryChildren(dirPath: string): Promise<any[]> {
    return invoke("get_directory_children", { path: dirPath });
  },

  /**
   * Starts native recursive file watching on the workspace directory using Rust notify.
   */
  async startWatchingWorkspace(path: string): Promise<void> {
    return invoke("start_watching_workspace", { path });
  },

  /**
   * Stops native file watching on the workspace directory.
   */
  async stopWatchingWorkspace(): Promise<void> {
    return invoke("stop_watching_workspace");
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
  },

  /**
   * Retrieves real Git repository status (staged and unstaged files).
   */
  async getGitStatus(path: string): Promise<GitRepoStatus> {
    return invoke("get_git_status", { path });
  },

  /**
   * Retrieves commit history log for the repository.
   */
  async getGitLog(path: string, limit = 30): Promise<GitCommitInfo[]> {
    return invoke("get_git_log", { path, limit });
  },

  /**
   * Stages a single file.
   */
  async gitStageFile(path: string, filePath: string): Promise<void> {
    return invoke("git_stage_file", { path, filePath });
  },

  /**
   * Unstages a single file.
   */
  async gitUnstageFile(path: string, filePath: string): Promise<void> {
    return invoke("git_unstage_file", { path, filePath });
  },

  /**
   * Stages all changes in the repository.
   */
  async gitStageAll(path: string): Promise<void> {
    return invoke("git_stage_all", { path });
  },

  /**
   * Commits staged (or all) changes with a commit message.
   */
  async gitCommit(path: string, message: string): Promise<string> {
    return invoke("git_commit", { path, message });
  }
};
