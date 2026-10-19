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

import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { cn } from "@/lib/utils";

export function WorkspaceSearch() {
  const [isReplaceOpen, setIsReplaceOpen] = React.useState(true);

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Header */}
      <div className="flex h-9 items-center justify-between px-3 border-b border-border/40">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/80">
          Code Search
        </h2>
        <div className="flex items-center gap-0.5">
          <SearchActionIcon icon={RotateCcw} tooltip="Refresh" />
          <SearchActionIcon icon={Eraser} tooltip="Clear Search" />
          <SearchActionIcon icon={FileSearch} tooltip="New Search" />
          <SearchActionIcon icon={ListFilter} tooltip="Filter" />
          <SearchActionIcon icon={ChevronDown} tooltip="Collapse All" />
        </div>
      </div>

      {/* Search Controls */}
      <div className="flex flex-col gap-2 p-3">
        <div className="flex items-start gap-1.5">
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            onClick={() => setIsReplaceOpen(!isReplaceOpen)}
            className="mt-1 size-5 shrink-0 text-muted-foreground hover:text-foreground"
          >
            {isReplaceOpen ? (
              <ChevronDown className="size-3.5" />
            ) : (
              <ChevronRight className="size-3.5" />
            )}
          </Button>

          <div className="flex-1 flex flex-col gap-1.5">
            {/* Search Input Container */}
            <InputGroup className="h-8 bg-muted/30 border-border/60">
              <InputGroupInput
                type="text"
                placeholder="Search"
                className="text-xs"
              />
              <InputGroupAddon align="inline-end" className="gap-0.5 pr-1">
                <SearchOptionIcon icon={CaseSensitive} active={false} tooltip="Match Case (Aa)" />
                <SearchOptionIcon icon={WholeWord} active={false} tooltip="Match Whole Word (ab)" />
                <SearchOptionIcon icon={Regex} active={false} tooltip="Use Regular Expression (*)" />
              </InputGroupAddon>
            </InputGroup>

            {/* Replace Input Container */}
            {isReplaceOpen && (
              <div className="flex items-center gap-1.5">
                <InputGroup className="h-8 bg-muted/30 border-border/60 flex-1">
                  <InputGroupInput
                    type="text"
                    placeholder="Replace"
                    className="text-xs"
                  />
                  <InputGroupAddon align="inline-end" className="gap-0.5 pr-1">
                    <SearchOptionIcon icon={CaseSensitive} active={false} tooltip="Preserve Case (AB)" />
                  </InputGroupAddon>
                </InputGroup>
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
        <Empty className="p-4 border-none">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <FileSearch className="size-5 text-muted-foreground" />
            </EmptyMedia>
            <EmptyTitle className="text-sm">No search results</EmptyTitle>
            <EmptyDescription className="text-xs text-muted-foreground">
              Type something above to search across the project.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    </div>
  );
}

function SearchActionIcon({
  icon: Icon,
  tooltip,
  onClick,
}: {
  icon: any;
  tooltip: string;
  onClick?: () => void;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-xs"
      className="size-6 text-muted-foreground/70 hover:text-foreground"
      title={tooltip}
      onClick={onClick}
    >
      <Icon className="size-3.5" />
    </Button>
  );
}

function SearchOptionIcon({
  icon: Icon,
  active,
  tooltip,
  onClick,
}: {
  icon: any;
  active: boolean;
  tooltip: string;
  onClick?: () => void;
}) {
  return (
    <Button
      type="button"
      variant={active ? "secondary" : "ghost"}
      size="icon-xs"
      className={cn(
        "size-6 transition-colors",
        active
          ? "bg-primary/20 text-primary"
          : "text-muted-foreground/60 hover:text-foreground"
      )}
      title={tooltip}
      onClick={onClick}
    >
      <Icon className="size-3.5" />
    </Button>
  );
}

