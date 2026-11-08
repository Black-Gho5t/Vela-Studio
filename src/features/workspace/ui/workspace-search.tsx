import {
  CaseSensitive,
  ChevronDown,
  ChevronRight,
  Eraser,
  FileSearch,
  ListFilter,
  Loader2,
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
import { FileIcon } from "./file-icon";
import { useWorkspaceStore } from "../model/workspace.store";
import { FileSearchResult, workspaceApi } from "../api/workspace.api";

export function WorkspaceSearch() {
  const { projectPath, addTab, setCursorPosition } = useWorkspaceStore();
  const [searchQuery, setSearchQuery] = React.useState("");
  const [replaceQuery, setReplaceQuery] = React.useState("");
  const [isReplaceOpen, setIsReplaceOpen] = React.useState(false);
  const [isFilterOpen, setIsFilterOpen] = React.useState(false);
  const [matchCase, setMatchCase] = React.useState(false);
  const [wholeWord, setWholeWord] = React.useState(false);
  const [isRegex, setIsRegex] = React.useState(false);
  const [filePattern, setFilePattern] = React.useState("");

  const [isSearching, setIsSearching] = React.useState(false);
  const [results, setResults] = React.useState<FileSearchResult[]>([]);
  const [totalMatches, setTotalMatches] = React.useState(0);
  const [totalFiles, setTotalFiles] = React.useState(0);
  const [truncated, setTruncated] = React.useState(false);
  const [collapsedFiles, setCollapsedFiles] = React.useState<Set<string>>(
    new Set()
  );

  const executeSearch = React.useCallback(
    async (query: string, pattern?: string) => {
      if (!projectPath || !query.trim()) {
        setResults([]);
        setTotalMatches(0);
        setTotalFiles(0);
        setTruncated(false);
        return;
      }

      setIsSearching(true);
      try {
        const res = await workspaceApi.searchWorkspace(projectPath, {
          query,
          match_case: matchCase,
          whole_word: wholeWord,
          is_regex: isRegex,
          max_results: 500,
          file_pattern: pattern?.trim() || undefined,
        });
        setResults(res.results);
        setTotalMatches(res.total_matches);
        setTotalFiles(res.total_files);
        setTruncated(res.truncated);
      } catch (err) {
        console.error("Search failed:", err);
      } finally {
        setIsSearching(false);
      }
    },
    [projectPath, matchCase, wholeWord, isRegex]
  );

  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim()) {
        executeSearch(searchQuery, filePattern);
      } else {
        setResults([]);
        setTotalMatches(0);
        setTotalFiles(0);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery, filePattern, matchCase, wholeWord, isRegex, executeSearch]);

  const handleRefresh = () => {
    if (searchQuery.trim()) {
      executeSearch(searchQuery, filePattern);
    }
  };

  const handleClear = () => {
    setSearchQuery("");
    setReplaceQuery("");
    setResults([]);
    setTotalMatches(0);
    setTotalFiles(0);
  };

  const toggleCollapseAll = () => {
    if (collapsedFiles.size === results.length) {
      setCollapsedFiles(new Set());
    } else {
      setCollapsedFiles(new Set(results.map((r) => r.file_path)));
    }
  };

  const toggleFileCollapse = (filePath: string) => {
    setCollapsedFiles((prev) => {
      const next = new Set(prev);
      if (next.has(filePath)) {
        next.delete(filePath);
      } else {
        next.add(filePath);
      }
      return next;
    });
  };

  const handleReplaceAll = async () => {
    if (!projectPath || !searchQuery.trim() || isSearching) return;
    setIsSearching(true);
    try {
      await workspaceApi.replaceInWorkspace(
        projectPath,
        {
          query: searchQuery,
          match_case: matchCase,
          whole_word: wholeWord,
          is_regex: isRegex,
          file_pattern: filePattern.trim() || undefined,
        },
        replaceQuery
      );
      await executeSearch(searchQuery, filePattern);
    } catch (err) {
      console.error("Replace all failed:", err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleReplaceInFile = async (filePath: string) => {
    if (!projectPath || !searchQuery.trim() || isSearching) return;
    try {
      await workspaceApi.replaceInFile(
        filePath,
        searchQuery,
        replaceQuery,
        matchCase,
        wholeWord,
        isRegex
      );
      await executeSearch(searchQuery, filePattern);
    } catch (err) {
      console.error("Replace in file failed:", err);
    }
  };

  const handleOpenMatch = (filePath: string, lineNumber: number) => {
    const fileName = filePath.split("/").pop() || filePath;
    addTab({
      id: filePath,
      name: fileName,
      path: filePath,
      isActive: true,
      isModified: false,
    });
    setCursorPosition({ line: lineNumber, column: 1 });
  };

  return (
    <div className="flex h-full flex-col bg-background overflow-hidden">
      {/* Header */}
      <div className="flex h-9 items-center justify-between px-3 border-b border-border/40 shrink-0">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/80">
          Search
        </h2>
        <div className="flex items-center gap-0.5">
          <SearchActionIcon
            icon={RotateCcw}
            tooltip="Refresh"
            onClick={handleRefresh}
          />
          <SearchActionIcon
            icon={Eraser}
            tooltip="Clear Search"
            onClick={handleClear}
          />
          <SearchActionIcon
            icon={ListFilter}
            tooltip="Toggle Filters"
            onClick={() => setIsFilterOpen(!isFilterOpen)}
          />
          <SearchActionIcon
            icon={
              collapsedFiles.size === results.length
                ? ChevronRight
                : ChevronDown
            }
            tooltip="Toggle Collapse All"
            onClick={toggleCollapseAll}
          />
        </div>
      </div>

      {/* Search Controls */}
      <div className="flex flex-col gap-2 p-3 border-b border-border/40 shrink-0">
        <div className="flex items-start gap-1.5">
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            onClick={() => setIsReplaceOpen(!isReplaceOpen)}
            className="mt-1.5 size-5 shrink-0 text-muted-foreground hover:text-foreground"
            title={isReplaceOpen ? "Hide Replace" : "Show Replace"}
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
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    executeSearch(searchQuery, filePattern);
                  }
                }}
                placeholder="Search"
                className="text-xs"
              />
              <InputGroupAddon align="inline-end" className="gap-0.5 pr-1">
                {isSearching && (
                  <Loader2 className="size-3.5 text-muted-foreground animate-spin mr-1" />
                )}
                <SearchOptionIcon
                  icon={CaseSensitive}
                  active={matchCase}
                  tooltip="Match Case (Aa)"
                  onClick={() => setMatchCase(!matchCase)}
                />
                <SearchOptionIcon
                  icon={WholeWord}
                  active={wholeWord}
                  tooltip="Match Whole Word (ab)"
                  onClick={() => setWholeWord(!wholeWord)}
                />
                <SearchOptionIcon
                  icon={Regex}
                  active={isRegex}
                  tooltip="Use Regular Expression (*)"
                  onClick={() => setIsRegex(!isRegex)}
                />
              </InputGroupAddon>
            </InputGroup>

            {/* Replace Input Container */}
            {isReplaceOpen && (
              <div className="flex items-center gap-1.5">
                <InputGroup className="h-8 bg-muted/30 border-border/60 flex-1">
                  <InputGroupInput
                    type="text"
                    value={replaceQuery}
                    onChange={(e) => setReplaceQuery(e.target.value)}
                    placeholder="Replace"
                    className="text-xs"
                  />
                </InputGroup>
                <div className="flex shrink-0 items-center gap-0.5">
                  <SearchActionIcon
                    icon={ReplaceAll}
                    tooltip="Replace All in Workspace"
                    onClick={handleReplaceAll}
                  />
                </div>
              </div>
            )}

            {/* Filter Input */}
            {isFilterOpen && (
              <InputGroup className="h-7 bg-muted/20 border-border/50">
                <InputGroupInput
                  type="text"
                  value={filePattern}
                  onChange={(e) => setFilePattern(e.target.value)}
                  placeholder="files to include (e.g. *.dart)"
                  className="text-[11px]"
                />
              </InputGroup>
            )}
          </div>
        </div>
      </div>

      {/* Results Header */}
      {searchQuery.trim() && (
        <div className="flex items-center justify-between px-3 py-1.5 text-[11px] font-medium text-muted-foreground border-b border-border/40 shrink-0 bg-muted/10">
          <span>
            {totalMatches} result{totalMatches === 1 ? "" : "s"} in {totalFiles}{" "}
            file{totalFiles === 1 ? "" : "s"}
            {truncated && " (limit reached)"}
          </span>
        </div>
      )}

      {/* Results List */}
      <div className="flex-1 overflow-auto no-scrollbar">
        {!searchQuery.trim() ? (
          <div className="flex h-full items-center justify-center p-4 text-center">
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
        ) : results.length === 0 && !isSearching ? (
          <div className="flex h-full items-center justify-center p-4 text-center">
            <Empty className="p-4 border-none">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <FileSearch className="size-5 text-muted-foreground" />
                </EmptyMedia>
                <EmptyTitle className="text-sm">No matches found</EmptyTitle>
                <EmptyDescription className="text-xs text-muted-foreground">
                  No files matched the search criteria.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          </div>
        ) : (
          <div className="py-1">
            {results.map((fileRes) => {
              const isCollapsed = collapsedFiles.has(fileRes.file_path);
              const fileName =
                fileRes.relative_path.split("/").pop() ||
                fileRes.relative_path;

              return (
                <div key={fileRes.file_path} className="flex flex-col">
                  {/* File Row */}
                  <div
                    onClick={() => toggleFileCollapse(fileRes.file_path)}
                    className="group flex h-7 items-center justify-between gap-1.5 px-2 hover:bg-muted/40 cursor-pointer select-none text-[11.5px]"
                  >
                    <div className="flex items-center gap-1 overflow-hidden min-w-0">
                      {isCollapsed ? (
                        <ChevronRight className="size-3.5 text-muted-foreground shrink-0" />
                      ) : (
                        <ChevronDown className="size-3.5 text-muted-foreground shrink-0" />
                      )}
                      <FileIcon
                        fileName={fileName}
                        size={14}
                        className="shrink-0"
                      />
                      <span className="truncate font-medium text-foreground tracking-[0.1px]">
                        {fileName}
                      </span>
                      <span className="text-[10px] text-muted-foreground/60 truncate">
                        {fileRes.relative_path}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {isReplaceOpen && (
                        <button
                          type="button"
                          title="Replace in this file"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleReplaceInFile(fileRes.file_path);
                          }}
                          className="size-5 hidden group-hover:flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted"
                        >
                          <Replace className="size-3" />
                        </button>
                      )}
                      <span className="rounded-full bg-muted/80 px-1.5 py-0.2 text-[10px] font-medium text-muted-foreground">
                        {fileRes.matches.length}
                      </span>
                    </div>
                  </div>

                  {/* Matches Rows */}
                  {!isCollapsed && (
                    <div className="flex flex-col">
                      {fileRes.matches.map((match, idx) => (
                        <div
                          key={`${fileRes.file_path}-${match.line_number}-${idx}`}
                          onClick={() =>
                            handleOpenMatch(
                              fileRes.file_path,
                              match.line_number
                            )
                          }
                          className="flex h-6 items-center gap-2 pl-7 pr-2 text-xs hover:bg-muted/50 cursor-pointer overflow-hidden group select-none"
                        >
                          <span className="shrink-0 text-[10px] font-mono text-muted-foreground/60 w-6 text-right">
                            {match.line_number}
                          </span>
                          <div className="truncate flex-1">
                            <HighlightedLineText
                              text={match.line_text}
                              start={match.match_start}
                              end={match.match_end}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function HighlightedLineText({
  text,
  start,
  end,
}: {
  text: string;
  start: number;
  end: number;
}) {
  const safeStart = Math.min(start, text.length);
  const safeEnd = Math.min(end, text.length);

  const before = text.slice(0, safeStart);
  const matched = text.slice(safeStart, safeEnd);
  const after = text.slice(safeEnd);

  return (
    <span className="font-mono text-[11px] truncate block">
      <span className="text-muted-foreground/80">{before}</span>
      <span className="bg-primary/25 text-primary font-semibold rounded-xs px-0.5">
        {matched}
      </span>
      <span className="text-muted-foreground/80">{after}</span>
    </span>
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
