import {
  Check,
  ChevronDown,
  GitBranch,
  GitCommit,
  Globe,
  Loader2,
  Minus,
  MoreHorizontal,
  Plus,
  RefreshCcw,
  Sparkles,
} from "lucide-react";
import * as React from "react";
import { FileIcon } from "./file-icon";

import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useWorkspaceStore } from "../model/workspace.store";
import {
  GitCommitInfo,
  GitStatusFile,
  workspaceApi,
} from "../api/workspace.api";

function getStatusColor(status: string) {
  switch (status) {
    case "M":
      return "text-amber-500 bg-amber-500/10 border-amber-500/20";
    case "A":
      return "text-emerald-500 bg-emerald-500/10 border-emerald-500/20";
    case "D":
      return "text-rose-500 bg-rose-500/10 border-rose-500/20";
    case "R":
      return "text-blue-500 bg-blue-500/10 border-blue-500/20";
    case "?":
      return "text-emerald-400 bg-emerald-400/10 border-emerald-400/20";
    default:
      return "text-muted-foreground bg-muted border-border/50";
  }
}

export function WorkspaceGit() {
  const { projectPath, addTab } = useWorkspaceStore();
  const [hasRepository, setHasRepository] = React.useState(true);
  const [branch, setBranch] = React.useState<string>("");
  const [stagedFiles, setStagedFiles] = React.useState<GitStatusFile[]>([]);
  const [unstagedFiles, setUnstagedFiles] = React.useState<GitStatusFile[]>([]);
  const [commits, setCommits] = React.useState<GitCommitInfo[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isCommitting, setIsCommitting] = React.useState(false);
  const [commitMessage, setCommitMessage] = React.useState("");
  const [isStagedOpen, setIsStagedOpen] = React.useState(true);
  const [isChangesOpen, setIsChangesOpen] = React.useState(true);
  const [isGraphOpen, setIsGraphOpen] = React.useState(true);

  const refreshGit = React.useCallback(async () => {
    if (!projectPath) {
      setHasRepository(false);
      return;
    }
    setIsLoading(true);
    try {
      const [status, log] = await Promise.all([
        workspaceApi.getGitStatus(projectPath),
        workspaceApi.getGitLog(projectPath, 30),
      ]);
      setHasRepository(status.is_repo);
      setBranch(status.branch);
      setStagedFiles(status.staged);
      setUnstagedFiles(status.unstaged);
      setCommits(log);
    } catch (err) {
      console.error("Failed to load Git status:", err);
      setHasRepository(false);
    } finally {
      setIsLoading(false);
    }
  }, [projectPath]);

  React.useEffect(() => {
    refreshGit();

    let unlisten: (() => void) | null = null;
    import("@tauri-apps/api/event").then(({ listen }) => {
      listen("workspace-fs-change", () => {
        refreshGit();
      }).then((unsub) => {
        unlisten = unsub;
      });
    });

    return () => {
      if (unlisten) unlisten();
    };
  }, [refreshGit]);

  const handleStage = async (file: string) => {
    if (!projectPath) return;
    try {
      await workspaceApi.gitStageFile(projectPath, file);
      await refreshGit();
    } catch (err) {
      console.error("Failed to stage file:", err);
    }
  };

  const handleUnstage = async (file: string) => {
    if (!projectPath) return;
    try {
      await workspaceApi.gitUnstageFile(projectPath, file);
      await refreshGit();
    } catch (err) {
      console.error("Failed to unstage file:", err);
    }
  };

  const handleStageAll = async () => {
    if (!projectPath) return;
    try {
      await workspaceApi.gitStageAll(projectPath);
      await refreshGit();
    } catch (err) {
      console.error("Failed to stage all files:", err);
    }
  };

  const handleCommit = async () => {
    if (!projectPath || !commitMessage.trim() || isCommitting) return;
    setIsCommitting(true);
    try {
      await workspaceApi.gitCommit(projectPath, commitMessage.trim());
      setCommitMessage("");
      await refreshGit();
    } catch (err) {
      console.error("Failed to commit:", err);
    } finally {
      setIsCommitting(false);
    }
  };

  const handleOpenFile = (relPath: string) => {
    if (!projectPath) return;
    const fullPath = projectPath.endsWith("/")
      ? `${projectPath}${relPath}`
      : `${projectPath}/${relPath}`;
    const fileName = relPath.split("/").pop() || relPath;
    addTab({
      id: fullPath,
      name: fileName,
      path: fullPath,
      isActive: true,
      isModified: false,
    });
  };

  if (!projectPath) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-4 text-center text-xs text-muted-foreground">
        No project folder opened
      </div>
    );
  }

  if (!hasRepository) {
    return <EmptyRepositoryView onInitialize={refreshGit} />;
  }

  const totalChanges = stagedFiles.length + unstagedFiles.length;

  return (
    <div className="flex h-full flex-col bg-background overflow-hidden">
      {/* Header */}
      <div className="flex h-9 items-center justify-between px-3 shrink-0 border-b border-border/40">
        <div className="flex items-center gap-1.5 overflow-hidden">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/80 shrink-0">
            Source Control
          </h2>
          {branch && (
            <span className="flex items-center gap-1 rounded bg-muted/60 px-1.5 py-0.5 text-[10px] font-medium text-foreground truncate">
              <GitBranch className="size-3 text-primary shrink-0" />
              <span className="truncate">{branch}</span>
            </span>
          )}
        </div>
        <div className="flex items-center gap-0.5">
          <GitActionIcon
            icon={RefreshCcw}
            tooltip="Refresh Status"
            onClick={refreshGit}
            isLoading={isLoading}
          />
          <GitActionIcon icon={MoreHorizontal} tooltip="More Actions" />
        </div>
      </div>

      <div className="flex-1 overflow-auto no-scrollbar">
        {/* Commit Input Area */}
        <div className="p-3 space-y-2 border-b border-border/40">
          <div className="relative">
            <Textarea
              value={commitMessage}
              onChange={(e) => setCommitMessage(e.target.value)}
              onKeyDown={(e) => {
                if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                  e.preventDefault();
                  handleCommit();
                }
              }}
              placeholder="Message (⌘Enter to commit...)"
              className="min-h-[70px] max-h-[140px] text-xs pb-7 bg-muted/30 border-border/60 resize-none"
            />
            <Button
              type="button"
              variant="ghost"
              size="xs"
              className="absolute right-1.5 bottom-1.5 h-5 text-[10px] text-primary hover:bg-primary/10 gap-1 px-1.5"
            >
              <Sparkles className="size-3" />
              <span>Generate</span>
            </Button>
          </div>

          <div className="flex gap-1">
            <Button
              variant="default"
              size="sm"
              disabled={isCommitting || !commitMessage.trim()}
              onClick={handleCommit}
              className="h-8 flex-1 gap-1.5 text-xs font-medium"
            >
              {isCommitting ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Check className="size-3.5" />
              )}
              {isCommitting ? "Committing..." : "Commit"}
            </Button>
          </div>
        </div>

        {/* Staged Changes Section */}
        {stagedFiles.length > 0 && (
          <Collapsible
            open={isStagedOpen}
            onOpenChange={setIsStagedOpen}
            className="border-b border-border/40"
          >
            <div className="flex items-center justify-between pr-3">
              <CollapsibleTrigger
                render={
                  <button className="flex items-center gap-1 px-3 py-2 text-[11px] font-medium text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors flex-1 text-left" />
                }
              >
                <ChevronDown
                  className={cn(
                    "size-3.5 transition-transform duration-200",
                    !isStagedOpen && "-rotate-90",
                  )}
                />
                <span>Staged Changes ({stagedFiles.length})</span>
              </CollapsibleTrigger>
            </div>

            <CollapsibleContent className="px-1 pb-2">
              <div className="flex flex-col gap-0.5">
                {stagedFiles.map((item) => (
                  <GitFileRow
                    key={item.path}
                    file={item}
                    actionTooltip="Unstage File"
                    actionIcon={Minus}
                    onAction={() => handleUnstage(item.path)}
                    onOpen={() => handleOpenFile(item.path)}
                  />
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Changes Section */}
        <Collapsible
          open={isChangesOpen}
          onOpenChange={setIsChangesOpen}
          className="space-y-1"
        >
          <div className="flex items-center justify-between pr-3">
            <CollapsibleTrigger
              render={
                <button className="flex items-center gap-1 px-3 py-2 text-[11px] font-medium text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors flex-1 text-left" />
              }
            >
              <ChevronDown
                className={cn(
                  "size-3.5 transition-transform duration-200",
                  !isChangesOpen && "-rotate-90",
                )}
              />
              <span>Changes ({unstagedFiles.length})</span>
            </CollapsibleTrigger>
            {unstagedFiles.length > 0 && (
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                className="size-5 text-muted-foreground hover:text-foreground"
                title="Stage All Changes"
                onClick={handleStageAll}
              >
                <Plus className="size-3.5" />
              </Button>
            )}
          </div>

          <CollapsibleContent className="px-1 pb-2">
            {totalChanges === 0 ? (
              <div className="text-[11px] text-muted-foreground/60 py-3 text-center">
                No changes detected
              </div>
            ) : (
              <div className="flex flex-col gap-0.5">
                {unstagedFiles.map((item) => (
                  <GitFileRow
                    key={item.path}
                    file={item}
                    actionTooltip="Stage File"
                    actionIcon={Plus}
                    onAction={() => handleStage(item.path)}
                    onOpen={() => handleOpenFile(item.path)}
                  />
                ))}
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>

        {/* Graph / Commit Log Section */}
        <Collapsible
          open={isGraphOpen}
          onOpenChange={setIsGraphOpen}
          className="border-t border-border/40"
        >
          <div className="flex items-center justify-between pr-3">
            <CollapsibleTrigger
              render={
                <button className="flex items-center gap-1 px-3 py-3 text-[11px] font-medium text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors flex-1 text-left" />
              }
            >
              <ChevronDown
                className={cn(
                  "size-3.5 transition-transform duration-200",
                  !isGraphOpen && "-rotate-90",
                )}
              />
              <span>Graph ({commits.length})</span>
            </CollapsibleTrigger>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground/70">
                <GitBranch className="size-2.5" />
                <span>{branch || "HEAD"}</span>
              </div>
            </div>
          </div>

          <CollapsibleContent>
            <div className="px-3 pb-4 space-y-3">
              {commits.length === 0 ? (
                <div className="text-xs text-muted-foreground/60 py-2 text-center">
                  No commits found
                </div>
              ) : (
                commits.map((commit, index) => (
                  <CommitItem
                    key={commit.id}
                    message={commit.message}
                    branch={index === 0 ? branch : undefined}
                    active={index === 0}
                    author={`${commit.author_name} • ${commit.relative_date}`}
                    isFirst={index === 0}
                    isLast={index === commits.length - 1}
                  />
                ))
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </div>
  );
}

function GitFileRow({
  file,
  actionTooltip,
  actionIcon: ActionIcon,
  onAction,
  onOpen,
}: {
  file: GitStatusFile;
  actionTooltip: string;
  actionIcon: React.ComponentType<{ className?: string }>;
  onAction: () => void;
  onOpen: () => void;
}) {
  return (
    <div
      onClick={onOpen}
      className="group flex h-7 items-center justify-between gap-1.5 rounded-sm px-2 text-[11.5px] hover:bg-muted/50 cursor-pointer select-none"
    >
      <div className="flex items-center gap-1.5 overflow-hidden flex-1 min-w-0">
        <FileIcon fileName={file.path} size={14} className="shrink-0" />
        <span className="truncate tracking-[0.1px] font-mono text-[11px]">
          {file.path}
        </span>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <button
          type="button"
          title={actionTooltip}
          onClick={(e) => {
            e.stopPropagation();
            onAction();
          }}
          className="size-5 hidden group-hover:flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <ActionIcon className="size-3" />
        </button>

        <span
          className={cn(
            "shrink-0 rounded px-1 text-[9px] font-medium uppercase tracking-[0.1em] border",
            getStatusColor(file.status),
          )}
        >
          {file.status}
        </span>
      </div>
    </div>
  );
}

function EmptyRepositoryView({ onInitialize }: { onInitialize: () => void }) {
  return (
    <div className="flex h-full flex-col bg-background p-4">
      <Empty className="border-none max-w-sm mx-auto">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <GitBranch className="size-5 text-muted-foreground" />
          </EmptyMedia>
          <EmptyTitle className="text-sm">No Git repository</EmptyTitle>
          <EmptyDescription className="text-xs text-muted-foreground leading-relaxed">
            The folder currently open doesn&apos;t have a Git repository. You can
            initialize a repository which will enable source control features.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent className="w-full flex flex-col gap-2">
          <Button
            onClick={onInitialize}
            className="w-full h-8 text-xs font-medium"
          >
            Check Repository
          </Button>
          <Button
            variant="outline"
            className="w-full h-8 border-border/60 gap-1.5 text-xs font-medium"
          >
            <Globe className="size-3.5" />
            Publish to GitHub
          </Button>
        </EmptyContent>
      </Empty>
    </div>
  );
}

function CommitItem({
  message,
  branch,
  active,
  author,
  isFirst,
  isLast,
}: {
  message: string;
  branch?: string;
  active?: boolean;
  author: string;
  isFirst?: boolean;
  isLast?: boolean;
}) {
  return (
    <div className="group relative flex items-start gap-2.5 pl-1">
      {/* Graph Line & Dot */}
      <div className="relative flex flex-col items-center shrink-0 w-3">
        <div
          className={cn(
            "absolute w-px bg-border/60",
            isFirst
              ? "top-2 bottom-0"
              : isLast
                ? "top-0 h-2"
                : "top-0 bottom-0",
          )}
        />
        <div
          className={cn(
            "relative z-10 size-2 rounded-full mt-1.5 transition-transform group-hover:scale-125",
            active
              ? "bg-primary ring-2 ring-primary/30"
              : "bg-muted-foreground/40",
          )}
        />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 py-0.5">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span
            className={cn(
              "truncate text-xs transition-colors",
              active
                ? "text-foreground font-medium"
                : "text-muted-foreground group-hover:text-foreground",
            )}
          >
            {message}
          </span>
          {branch && (
            <div className="flex items-center gap-1 rounded-sm bg-primary/10 px-1 py-0.2 border border-primary/20 text-primary">
              <GitBranch className="size-2.5" />
              <span className="text-[9px] font-semibold uppercase tracking-tight">
                {branch}
              </span>
            </div>
          )}
          {active && (
            <div className="size-3.5 flex items-center justify-center rounded-sm bg-accent text-accent-foreground border border-border">
              <GitCommit className="size-2.5" />
            </div>
          )}
        </div>
        <p className="text-[10px] text-muted-foreground/60 mt-0.5 group-hover:text-muted-foreground transition-colors">
          {author}
        </p>
      </div>
    </div>
  );
}

function GitActionIcon({
  icon: Icon,
  tooltip,
  onClick,
  isLoading,
}: {
  icon: any;
  tooltip: string;
  onClick?: () => void;
  isLoading?: boolean;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-xs"
      className="size-6 text-muted-foreground hover:text-foreground"
      title={tooltip}
      onClick={onClick}
    >
      <Icon className={cn("size-3.5", isLoading && "animate-spin")} />
    </Button>
  );
}
