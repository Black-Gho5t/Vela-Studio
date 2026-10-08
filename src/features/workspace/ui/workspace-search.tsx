import {
  CaseSensitive,
  ChevronDown,
  ChevronRight,
  Eraser,
  FileSearch,
  ListFilter,
  MoreHorizontal,
  Regex,
  Replace,
  ReplaceAll,
  RotateCcw,
  WholeWord,
} from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";

export function WorkspaceSearch() {
  const [isReplaceOpen, setIsReplaceOpen] = React.useState(true);

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Header */}
      <div className="flex h-9 items-center justify-between px-4">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/80">
          Code Search
        </h2>
        <div className="flex items-center gap-1">
          <SearchActionIcon icon={RotateCcw} tooltip="Refresh" />
          <SearchActionIcon icon={Eraser} tooltip="Clear Search" />
          <SearchActionIcon icon={FileSearch} tooltip="New Search" />
          <SearchActionIcon icon={ListFilter} tooltip="Filter" />
          <SearchActionIcon icon={ChevronDown} tooltip="Collapse All" />
        </div>
      </div>

      {/* Search Controls */}
      <div className="space-y-2 p-3">
        <div className="flex items-start gap-1.5">
          <button
            onClick={() => setIsReplaceOpen(!isReplaceOpen)}
            className="mt-1.5 flex size-4 shrink-0 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            {isReplaceOpen ? (
              <ChevronDown className="size-3.5" />
            ) : (
              <ChevronRight className="size-3.5" />
            )}
          </button>

          <div className="flex-1 space-y-1.5">
            {/* Search Input Container */}
            <div className="relative group">
              <input
                type="text"
                placeholder="Search"
                className="h-8 w-full rounded-md border border-border/50 bg-muted/30 pl-2.5 pr-20 text-[12px] outline-none transition-all focus:border-primary/50 focus:bg-background"
              />
              <div className="absolute right-1 top-1 flex items-center gap-0.5 pr-1">
                <SearchOptionIcon icon={CaseSensitive} active={false} tooltip="Match Case (Aa)" />
                <SearchOptionIcon icon={WholeWord} active={false} tooltip="Match Whole Word (ab)" />
                <SearchOptionIcon icon={Regex} active={false} tooltip="Use Regular Expression (*)" />
              </div>
            </div>

            {/* Replace Input Container */}
            {isReplaceOpen && (
              <div className="relative group flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="Replace"
                    className="h-8 w-full rounded-md border border-border/50 bg-muted/30 pl-2.5 pr-10 text-[12px] outline-none transition-all focus:border-primary/50 focus:bg-background"
                  />
                  <div className="absolute right-1 top-1 flex items-center gap-0.5 pr-1">
                    <SearchOptionIcon icon={CaseSensitive} active={false} tooltip="Preserve Case (AB)" />
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-0.5">
                   <SearchActionIcon icon={Replace} tooltip="Replace" />
                   <SearchActionIcon icon={ReplaceAll} tooltip="Replace All" />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end">
          <SearchActionIcon icon={MoreHorizontal} tooltip="More Search Options" />
        </div>
      </div>

      {/* Results Placeholder */}
      <div className="flex flex-1 items-center justify-center p-4 text-center">
         <p className="text-[11px] text-muted-foreground/60 leading-relaxed">
           No search results found.<br />
           Type something to start searching across the project.
         </p>
      </div>
    </div>
  );
}

function SearchActionIcon({ icon: Icon, tooltip }: { icon: any; tooltip: string }) {
  return (
    <button
      title={tooltip}
      className="flex size-6 items-center justify-center rounded-md text-muted-foreground/70 transition-colors hover:bg-muted hover:text-foreground"
    >
      <Icon className="size-3.5" />
    </button>
  );
}

function SearchOptionIcon({ icon: Icon, active, tooltip }: { icon: any; active: boolean; tooltip: string }) {
  return (
    <button
      title={tooltip}
      className={cn(
        "flex size-5 items-center justify-center rounded transition-colors",
        active
          ? "bg-primary/20 text-primary"
          : "text-muted-foreground/50 hover:bg-muted hover:text-foreground"
      )}
    >
      <Icon className="size-3.5" />
    </button>
  );
}
