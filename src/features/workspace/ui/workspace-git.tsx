import {
  Check,
  ChevronDown,
  GitBranch,
  GitCommit,
  Globe,
  MoreHorizontal,
  RefreshCcw,
  Sparkles,
} from "lucide-react";
import * as React from "react";
import { FileIcon } from "./file-icon";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

export function WorkspaceGit() {
  const [hasRepository, setHasRepository] = React.useState(true); // Mocked state
  const [commitMessage, setCommitMessage] = React.useState("");
  const [isChangesOpen, setIsChangesOpen] = React.useState(true);
  const [isGraphOpen, setIsGraphOpen] = React.useState(true);

  if (!hasRepository) {
    return <EmptyRepositoryView onInitialize={() => setHasRepository(true)} />;
  }

  return (
    <div className="flex h-full flex-col bg-background overflow-hidden">
      {/* Header */}
      <div className="flex h-9 items-center justify-between px-4 shrink-0">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/80">
          Source Control
        </h2>
        <div className="flex items-center gap-1">
          <GitActionIcon icon={RefreshCcw} tooltip="Sync" />
          <GitActionIcon icon={MoreHorizontal} tooltip="More Actions" />
        </div>
      </div>

      <div className="flex-1 overflow-auto no-scrollbar">
        {/* Changes Section */}
        <Collapsible
          open={isChangesOpen}
          onOpenChange={setIsChangesOpen}
          className="space-y-1"
        >
          <CollapsibleTrigger
            render={
              <button className="flex w-full items-center gap-1 px-3 py-2 text-[11px] font-medium text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors" />
            }
          >
            <ChevronDown
              className={cn(
                "size-3.5 transition-transform duration-200",
                !isChangesOpen && "-rotate-90",
              )}
            />
            <span>Changes</span>
          </CollapsibleTrigger>

          <CollapsibleContent className="space-y-3 px-3 pb-3">
            <div className="space-y-2">
              <div className="relative group">
                <textarea
                  value={commitMessage}
                  onChange={(e) => setCommitMessage(e.target.value)}
                  placeholder="Message (⌘Enter to commit...)"
                  className="w-full min-h-[70px] max-h-[150px] rounded-md border border-border/50 bg-muted/30 p-2 text-[12px] outline-none transition-all focus:border-primary/50 focus:bg-background resize-none"
                />
                <button className="absolute right-2 bottom-2 flex items-center gap-1.5 rounded-md bg-primary/10 px-2 py-1 text-[10px] font-medium text-primary hover:bg-primary/20 transition-colors">
                  <Sparkles className="size-3" />
                  <span>Generate</span>
                </button>
              </div>

              <div className="flex gap-1">
                <Button className="h-8 flex-1 gap-2 rounded-md bg-foreground text-background hover:bg-foreground/90 text-xs font-medium">
                  <Check className="size-3.5" />
                  Commit
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 rounded-md border-border/50 hover:bg-muted"
                >
                  <ChevronDown className="size-3.5" />
                </Button>
              </div>

              {/* File Changes List */}
              <div className="pt-2">
                <div className="flex flex-col gap-0.5">
                  {[
                    { file: "README.md", state: "M" },
                    { file: "src/features/workspace/ui/workspace-sidebar.tsx", state: "M" },
                    { file: "src/shared/providers/theme/theme-provider.tsx", state: "M" },
                  ].map((item) => (
                    <div
                      key={item.file}
                      className="group flex h-7 items-center justify-between gap-1.5 rounded-sm px-2 text-[11.5px] hover:bg-muted/50 cursor-pointer"
                    >
                      <div className="flex items-center gap-1.5 overflow-hidden">
                        <FileIcon fileName={item.file} size={14} className="shrink-0" />
                        <span className="truncate tracking-[0.1px]">{item.file}</span>
                      </div>
                      <span className="shrink-0 rounded px-1 text-[9px] font-medium uppercase tracking-[0.1em] text-muted-foreground bg-muted group-hover:bg-background">
                        {item.state}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Graph Section */}
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
              <span>Graph</span>
            </CollapsibleTrigger>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground/70">
                <RefreshCcw className="size-2.5" />
                <span>Auto</span>
              </div>
              <MoreHorizontal className="size-3.5 text-muted-foreground/50" />
            </div>
          </div>

          <CollapsibleContent>
            <div className="px-3 pb-4 space-y-4">
              <CommitItem
                message="feat: implement workspace view..."
                branch="main"
                active
                author="BrianPech"
                isFirst
              />
              <CommitItem
                message="refactor: replace workspace overview UI with..."
                author="BrianPech"
              />
              <CommitItem
                message="refactor: extract sidebar navigation to Works..."
                author="BrianPech"
              />
              <CommitItem
                message="feat: implement workspace shell with unified ..."
                author="BrianPech"
              />
              <CommitItem
                message="feat: implement Avatar and DropdownMenu c..."
                author="BrianPech"
              />
              <CommitItem
                message="feat: add IDE settings dialog and integrate wit..."
                author="BrianPech"
              />
              <CommitItem
                message="fix: reorder imports in main.tsx and tooltip.tsx..."
                author="BrianPech"
              />
              <CommitItem
                message="feat: integrate ScrollArea into WorkspaceSide..."
                author="BrianPech"
              />
              <CommitItem message="initial setup" author="BrianPech" isLast />
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </div>
  );
}

function EmptyRepositoryView({ onInitialize }: { onInitialize: () => void }) {
  return (
    <div className="flex h-full flex-col bg-background p-6">
      <div className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground uppercase tracking-[0.22em] mb-6">
        <ChevronDown className="size-3.5" />
        <span>Changes</span>
      </div>

      <div className="space-y-6">
        <p className="text-[12px] text-muted-foreground leading-relaxed">
          The folder currently open doesn't have a Git repository. You can
          initialize a repository which will enable source control features
          powered by Git.
        </p>

        <Button
          onClick={onInitialize}
          className="w-full h-9 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-medium"
        >
          Initialize Repository
        </Button>

        <div className="space-y-4 pt-4">
          <p className="text-[12px] text-muted-foreground leading-relaxed">
            To learn more about how to use Git and source control in VS Code{" "}
            <span className="text-primary hover:underline cursor-pointer">
              read our docs
            </span>
            .
          </p>

          <p className="text-[12px] text-muted-foreground leading-relaxed pt-2 border-t border-border/40">
            You can directly publish this folder to a GitHub repository. Once
            published, you'll have access to source control features powered by
            Git and GitHub.
          </p>

          <Button
            variant="outline"
            className="w-full h-9 rounded-md border-border/60 hover:bg-muted gap-2 text-xs font-medium"
          >
            <Globe className="size-3.5" />
            Publish to GitHub
          </Button>
        </div>
      </div>
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
    <div className="group relative flex items-start gap-3 pl-1">
      {/* Graph Line & Dot */}
      <div className="relative flex flex-col items-center shrink-0 w-3">
        <div
          className={cn(
            "absolute w-[1.5px] bg-border/40",
            isFirst
              ? "top-2 bottom-0"
              : isLast
                ? "top-0 h-2"
                : "top-0 bottom-0",
          )}
        />
        <div
          className={cn(
            "relative z-10 size-2.5 rounded-full mt-1.5 transition-transform group-hover:scale-125",
            active
              ? "bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"
              : "bg-blue-400/60",
          )}
        />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 py-0.5">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span
            className={cn(
              "truncate text-[12px] transition-colors",
              active
                ? "text-foreground font-medium"
                : "text-muted-foreground group-hover:text-foreground/80",
            )}
          >
            {message}
          </span>
          {branch && (
            <div className="flex items-center gap-1 rounded-full bg-blue-500/10 px-1.5 py-0.5 border border-blue-500/20">
              <GitBranch className="size-2.5 text-blue-500" />
              <span className="text-[9px] font-bold text-blue-500 uppercase tracking-tighter">
                {branch}
              </span>
            </div>
          )}
          {active && (
            <div className="size-4 flex items-center justify-center rounded-full bg-purple-500/20 border border-purple-500/30">
              <GitCommit className="size-2.5 text-purple-400" />
            </div>
          )}
        </div>
        <p className="text-[10px] text-muted-foreground/40 mt-0.5 group-hover:text-muted-foreground/60 transition-colors">
          {author}
        </p>
      </div>
    </div>
  );
}

function GitActionIcon({
  icon: Icon,
  tooltip,
}: {
  icon: any;
  tooltip: string;
}) {
  return (
    <button
      title={tooltip}
      className="flex size-6 items-center justify-center rounded-md text-muted-foreground/70 transition-colors hover:bg-muted hover:text-foreground"
    >
      <Icon className="size-3.5" />
    </button>
  );
}
