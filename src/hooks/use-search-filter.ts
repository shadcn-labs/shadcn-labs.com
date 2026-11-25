"use client";

import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent, RefObject } from "react";

export interface UseSearchFilterOptions {
  initialQuery?: string;
  initialFilter?: string;
  defaultFilter?: string;
  queryParam?: string;
  filterParam?: string;
  debounceMs?: number;
}

export interface SearchFilterState {
  inputRef: RefObject<HTMLInputElement | null>;
  query: string;
  setQuery: (value: string) => void;
  debouncedQuery: string;
  normalizedQuery: string;
  filter: string;
  setFilter: (value: string) => void;
  hasActiveFilter: boolean;
  clear: () => void;
  clearQuery: () => void;
  handleInputKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
}

export const useSearchFilter = ({
  initialQuery = "",
  initialFilter = "",
  defaultFilter = "all",
  queryParam = "q",
  filterParam = "filter",
  debounceMs = 150,
}: UseSearchFilterOptions = {}): SearchFilterState => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);
  const [filter, setFilter] = useState(initialFilter || defaultFilter);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [query, debounceMs]);

  useEffect(() => {
    const url = new URL(window.location.href);
    const trimmed = debouncedQuery.trim();

    if (trimmed) {
      url.searchParams.set(queryParam, trimmed);
    } else {
      url.searchParams.delete(queryParam);
    }

    if (filter && filter !== defaultFilter) {
      url.searchParams.set(filterParam, filter);
    } else {
      url.searchParams.delete(filterParam);
    }

    const nextSearch = url.searchParams.toString();
    const nextUrl = nextSearch ? `${url.pathname}?${nextSearch}` : url.pathname;

    if (nextUrl !== `${window.location.pathname}${window.location.search}`) {
      window.history.replaceState(null, "", nextUrl);
    }
  }, [debouncedQuery, filter, queryParam, filterParam, defaultFilter]);

  const clearQuery = () => {
    setQuery("");
    setDebouncedQuery("");
    inputRef.current?.focus();
  };

  const clear = () => {
    setQuery("");
    setDebouncedQuery("");
    setFilter(defaultFilter);
    inputRef.current?.focus();
  };

  const handleInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      if (query) {
        setQuery("");
        setDebouncedQuery("");
      } else {
        inputRef.current?.blur();
      }
    }
  };

  const normalizedQuery = debouncedQuery.trim().toLowerCase();
  const hasActiveFilter = Boolean(normalizedQuery || filter !== defaultFilter);

  return {
    clear,
    clearQuery,
    debouncedQuery,
    filter,
    handleInputKeyDown,
    hasActiveFilter,
    inputRef,
    normalizedQuery,
    query,
    setFilter,
    setQuery,
  };
};
