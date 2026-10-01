"use client";

import { Search, X } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";

import { IssueCollapsible } from "@/components/issue-collapsible";
import { IssueListItem } from "@/components/issue-list-item";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Empty, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { Kbd } from "@/components/ui/kbd";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UTM_PARAMS } from "@/constants/site";
import type { GitHubIssue, RepoIssues } from "@/lib/github";
import { addQueryParams } from "@/lib/url";

interface IssuesListProps {
  groups: RepoIssues[] | null;
  idleProjects: string[];
  total: number;
}

const INITIAL_VISIBLE = 5;

export const IssuesList = ({
  groups,
  idleProjects,
  total,
}: IssuesListProps) => {
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchInputId = useId();

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [selectedRepo, setSelectedRepo] = useState<string>("all");
  const [isHydrated, setIsHydrated] = useState(false);

  // Read URL query params on initial mount
  useEffect(() => {
    setIsHydrated(true);
    if (typeof window === "undefined") {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const qParam = params.get("q");
    const repoParam = params.get("repo");

    if (qParam) {
      setSearchQuery(qParam);
      setDebouncedQuery(qParam);
    }
    if (repoParam) {
      setSelectedRepo(repoParam);
    }
  }, []);

  // Debounce search query by 150ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 150);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Sync state to URL search parameters
  useEffect(() => {
    if (!isHydrated || typeof window === "undefined") {
      return;
    }

    const url = new URL(window.location.href);
    const trimmed = debouncedQuery.trim();

    if (trimmed) {
      url.searchParams.set("q", trimmed);
    } else {
      url.searchParams.delete("q");
    }

    if (selectedRepo && selectedRepo !== "all") {
      url.searchParams.set("repo", selectedRepo);
    } else {
      url.searchParams.delete("repo");
    }

    const nextSearch = url.searchParams.toString();
    const nextUrl = nextSearch ? `${url.pathname}?${nextSearch}` : url.pathname;

    if (nextUrl !== `${window.location.pathname}${window.location.search}`) {
      window.history.replaceState(null, "", nextUrl);
    }
  }, [debouncedQuery, selectedRepo, isHydrated]);

  // Keyboard shortcut: '/' to focus search, 'Escape' to clear
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === "/" &&
        document.activeElement !== searchInputRef.current &&
        !["INPUT", "TEXTAREA", "SELECT"].includes(
          document.activeElement?.tagName || ""
        )
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, []);

  // Filter matching
  const normalizedQuery = debouncedQuery.trim().toLowerCase();
  const hasActiveFilter = Boolean(normalizedQuery || selectedRepo !== "all");

  const matchesIssue = (issue: GitHubIssue): boolean => {
    if (!normalizedQuery) {
      return true;
    }

    // Match title
    if (issue.title.toLowerCase().includes(normalizedQuery)) {
      return true;
    }

    // Match issue number (#13, 13)
    const numStr = String(issue.number);
    if (
      normalizedQuery === numStr ||
      normalizedQuery === `#${numStr}` ||
      normalizedQuery.includes(numStr)
    ) {
      return true;
    }

    // Match labels
    return issue.labels.some((l) =>
      l.name.toLowerCase().includes(normalizedQuery)
    );
  };

  const filteredGroups = useMemo(() => {
    if (!groups) {
      return [];
    }

    return groups
      .filter((group) => {
        if (selectedRepo !== "all" && group.name !== selectedRepo) {
          return false;
        }
        return true;
      })
      .map((group) => {
        const matchingIssues = group.issues.filter(matchesIssue);
        return {
          ...group,
          issues: matchingIssues,
          visibleCount: matchingIssues.length,
        };
      })
      .filter((group) => group.visibleCount > 0);
  }, [groups, selectedRepo, normalizedQuery]);

  const visibleIssuesCount = filteredGroups.reduce(
    (sum, group) => sum + group.visibleCount,
    0
  );

  const handleClear = () => {
    setSearchQuery("");
    setDebouncedQuery("");
    setSelectedRepo("all");
    searchInputRef.current?.focus();
  };

  return (
    <div className="space-y-4">
      {/* Controls Bar */}
      <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <label htmlFor={searchInputId} className="sr-only">
            Search issues
          </label>
          <Search
            className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2"
            aria-hidden="true"
          />
          <Input
            id={searchInputId}
            ref={searchInputRef}
            type="search"
            placeholder="Search by title, #number, or label..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                if (searchQuery) {
                  setSearchQuery("");
                  setDebouncedQuery("");
                } else {
                  searchInputRef.current?.blur();
                }
              }
            }}
            className="pr-10 pl-9"
          />
          <div className="absolute top-1/2 right-2.5 flex -translate-y-1/2 items-center">
            {searchQuery ? (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setDebouncedQuery("");
                  searchInputRef.current?.focus();
                }}
                className="text-muted-foreground hover:text-foreground cursor-pointer rounded p-0.5 transition-colors"
                aria-label="Clear search input"
              >
                <X className="size-3.5" aria-hidden="true" />
              </button>
            ) : (
              <Kbd className="hidden sm:inline-flex" aria-hidden="true">
                /
              </Kbd>
            )}
          </div>
        </div>

        <Select
          value={selectedRepo}
          onValueChange={(val) => {
            if (val !== null) {
              setSelectedRepo(val);
            }
          }}
        >
          <SelectTrigger
            size="default"
            className="w-full sm:w-[130px]"
            aria-label="Filter by repository"
          >
            <SelectValue placeholder="All projects" />
          </SelectTrigger>
          <SelectContent className="min-w-[200px]">
            <SelectGroup>
              <SelectItem value="all">
                <span className="min-w-0 truncate" title="All projects">
                  All projects
                </span>
                <span className="text-muted-foreground ml-1 shrink-0 font-mono">
                  [{total}]
                </span>
              </SelectItem>
              {groups?.map((group) => (
                <SelectItem key={group.name} value={group.name}>
                  <span className="min-w-0 truncate" title={group.name}>
                    {group.name}
                  </span>
                  <span className="text-muted-foreground ml-1 shrink-0 font-mono">
                    [{group.count}]
                  </span>
                </SelectItem>
              ))}
              {idleProjects.map((projectName) => (
                <SelectItem key={projectName} value={projectName}>
                  <span className="min-w-0 truncate" title={projectName}>
                    {projectName}
                  </span>
                  <span className="text-muted-foreground ml-1 shrink-0 font-mono">
                    [0]
                  </span>
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      {/* Live Count / Stats */}
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <p aria-live="polite" className="text-muted-foreground">
          {hasActiveFilter ? (
            <>
              Showing{" "}
              <span className="text-foreground font-mono">
                {visibleIssuesCount}
              </span>{" "}
              of <span className="text-foreground font-mono">{total}</span> open
              issue{total === 1 ? "" : "s"} across the labs.
            </>
          ) : (
            <>
              <span className="text-foreground font-mono">{total}</span> open
              issue
              {total === 1 ? "" : "s"} across the labs. Issues marked{" "}
              <Badge variant="secondary">good first issue</Badge> or{" "}
              <Badge variant="secondary">help wanted</Badge> are a great place
              to start.
            </>
          )}
        </p>

        {hasActiveFilter && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="text-muted-foreground hover:text-foreground shrink-0"
          >
            Reset
          </Button>
        )}
      </div>

      {/* Issues Grouped by Repo */}
      {filteredGroups.length === 0 ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyTitle>No issues match your search.</EmptyTitle>
          </EmptyHeader>
          <Button variant="outline" size="sm" onClick={handleClear}>
            Clear filters
          </Button>
        </Empty>
      ) : (
        <div className="space-y-6">
          {filteredGroups.map((group) => {
            const collapse = normalizedQuery.length === 0;
            const visibleIssues = collapse
              ? group.issues.slice(0, INITIAL_VISIBLE)
              : group.issues;
            const hiddenIssues = collapse
              ? group.issues.slice(INITIAL_VISIBLE)
              : [];

            return (
              <div key={group.name} className="space-y-2">
                <h3 className="pt-2">
                  <a
                    target="_blank"
                    href={addQueryParams(group.url, UTM_PARAMS)}
                  >
                    {group.name}
                  </a>{" "}
                  <span className="font-mono">[{group.issues.length}]</span>
                </h3>
                <ul className="space-y-2">
                  {visibleIssues.map((issue) => (
                    <IssueListItem key={issue.number} issue={issue} />
                  ))}
                </ul>
                {hiddenIssues.length > 0 && (
                  <IssueCollapsible count={hiddenIssues.length}>
                    {hiddenIssues.map((issue) => (
                      <IssueListItem key={issue.number} issue={issue} />
                    ))}
                  </IssueCollapsible>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Idle Projects - only shown when no search/filter is active */}
      {!hasActiveFilter && idleProjects.length > 0 && (
        <p className="text-muted-foreground pt-4">
          No open issues: {idleProjects.join(", ")}.
        </p>
      )}
    </div>
  );
};
