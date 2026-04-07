"use client";

import type { FilterCondition } from "@/components/filter-bar";
import { useCallback, useState } from "react";

export function useFilters() {
  const [filters, setFilters] = useState<FilterCondition[]>([]);

  const updateFilters = useCallback((newFilters: FilterCondition[]) => {
    setFilters(newFilters);
  }, []);

  const clearFilters = useCallback(() => {
    setFilters([]);
  }, []);

  return { filters, updateFilters, clearFilters };
}
