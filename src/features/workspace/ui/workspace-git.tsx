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
      <div className="flex h-9 items-center justify-between px-3 border-b border-border/40 shrink-0">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/80">
          Source Control
        </h2>
        <div className="flex items-center gap-0.5">
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
            <div className="flex flex-col gap-2">
              <div className="relative">
                <Textarea
                  value={commitMessage}
                  onChange={(e) => setCommitMessage(e.target.value)}
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
                  className="h-8 flex-1 gap-1.5 text-xs font-medium"
                >
                  <Check className="size-3.5" />
                  Commit
                </Button>
                <Button
                  variant="outline"
                  size="icon-sm"
                  className="h-8 w-8 border-border/60"
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
            Initialize Repository
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
}: {
  icon: any;
  tooltip: string;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-xs"
      className="size-6 text-muted-foreground hover:text-foreground"
      title={tooltip}
    >
      <Icon className="size-3.5" />
    </Button>
  );
}

