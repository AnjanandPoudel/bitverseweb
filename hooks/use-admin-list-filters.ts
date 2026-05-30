'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ApiCallError, apiRequest } from '@/lib/api';
import type { AdminFilterValues, IAdminFilterSchema } from '@/lib/admin-filter.types';
import {
  buildAdminFilterQuery,
  createEmptyFilterValues,
  hasActiveFilters,
} from '@/lib/admin-filter.utils';

interface IUseAdminListFiltersResult {
  schema: IAdminFilterSchema | null;
  schemaLoading: boolean;
  schemaError: string | null;
  searchDraft: string;
  setSearchDraft: (value: string) => void;
  filterDraft: AdminFilterValues;
  setFilterDraftValue: (key: string, value: string) => void;
  page: number;
  setPage: (page: number) => void;
  query: Record<string, string | number | undefined>;
  applyFilters: () => void;
  clearFilters: () => void;
  hasAppliedFilters: boolean;
}

export const useAdminListFilters = (
  resourceKey: string,
  accessToken: string | null,
  pageSize: number,
): IUseAdminListFiltersResult => {
  const [schema, setSchema] = useState<IAdminFilterSchema | null>(null);
  const [schemaLoading, setSchemaLoading] = useState(false);
  const [schemaError, setSchemaError] = useState<string | null>(null);
  const [searchDraft, setSearchDraft] = useState('');
  const [search, setSearch] = useState('');
  const [filterDraft, setFilterDraft] = useState<AdminFilterValues>({});
  const [appliedFilters, setAppliedFilters] = useState<AdminFilterValues>({});
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!accessToken) {
      return;
    }

    let cancelled = false;
    const loadSchema = async (): Promise<void> => {
      setSchemaLoading(true);
      setSchemaError(null);
      try {
        const envelope = await apiRequest<IAdminFilterSchema>(`/admin/filters/${resourceKey}`, {
          token: accessToken,
        });
        if (cancelled) {
          return;
        }
        const nextSchema = envelope.data ?? null;
        setSchema(nextSchema);
        const emptyValues = createEmptyFilterValues(nextSchema);
        setFilterDraft(emptyValues);
        setAppliedFilters(emptyValues);
      } catch (err: unknown) {
        if (cancelled) {
          return;
        }
        setSchemaError(err instanceof ApiCallError ? err.message : 'Failed to load filter schema.');
      } finally {
        if (!cancelled) {
          setSchemaLoading(false);
        }
      }
    };

    void loadSchema();
    return () => {
      cancelled = true;
    };
  }, [accessToken, resourceKey]);

  const setFilterDraftValue = useCallback((key: string, value: string): void => {
    setFilterDraft((current) => ({ ...current, [key]: value }));
  }, []);

  const applyFilters = useCallback((): void => {
    setSearch(searchDraft.trim());
    setAppliedFilters({ ...filterDraft });
    setPage(1);
  }, [filterDraft, searchDraft]);

  const clearFilters = useCallback((): void => {
    const emptyValues = createEmptyFilterValues(schema);
    setSearchDraft('');
    setSearch('');
    setFilterDraft(emptyValues);
    setAppliedFilters(emptyValues);
    setPage(1);
  }, [schema]);

  const query = useMemo(
    () => buildAdminFilterQuery(schema, appliedFilters, search, page, pageSize),
    [appliedFilters, page, pageSize, schema, search],
  );

  const hasAppliedFilters = useMemo(
    () => hasActiveFilters(schema, appliedFilters, search),
    [appliedFilters, schema, search],
  );

  return {
    schema,
    schemaLoading,
    schemaError,
    searchDraft,
    setSearchDraft,
    filterDraft,
    setFilterDraftValue,
    page,
    setPage,
    query,
    applyFilters,
    clearFilters,
    hasAppliedFilters,
  };
};
