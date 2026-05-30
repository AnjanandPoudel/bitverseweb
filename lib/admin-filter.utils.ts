import type { AdminFilterValues, IAdminFilterSchema } from '@/lib/admin-filter.types';

export const buildAdminFilterQuery = (
  schema: IAdminFilterSchema | null,
  values: AdminFilterValues,
  search: string,
  page: number,
  limit: number,
): Record<string, string | number | undefined> => {
  const query: Record<string, string | number | undefined> = {
    page,
    limit,
  };

  if (schema?.search && search.trim().length > 0) {
    query.search = search.trim();
  }

  for (const field of schema?.fields ?? []) {
    if (field.type === 'range') {
      const minValue = values[`${field.key}Min`]?.trim();
      const maxValue = values[`${field.key}Max`]?.trim();
      if (minValue) {
        query[`${field.key}Min`] = minValue;
      }
      if (maxValue) {
        query[`${field.key}Max`] = maxValue;
      }
      continue;
    }

    const value = values[field.key]?.trim();
    if (value) {
      query[field.key] = value;
    }
  }

  return query;
};

export const createEmptyFilterValues = (schema: IAdminFilterSchema | null): AdminFilterValues => {
  const values: AdminFilterValues = {};
  for (const field of schema?.fields ?? []) {
    if (field.type === 'range') {
      values[`${field.key}Min`] = '';
      values[`${field.key}Max`] = '';
      continue;
    }
    values[field.key] = '';
  }
  return values;
};

export const hasActiveFilters = (
  schema: IAdminFilterSchema | null,
  values: AdminFilterValues,
  search: string,
): boolean => {
  if (search.trim().length > 0) {
    return true;
  }

  for (const field of schema?.fields ?? []) {
    if (field.type === 'range') {
      if (values[`${field.key}Min`]?.trim() || values[`${field.key}Max`]?.trim()) {
        return true;
      }
      continue;
    }
    if (values[field.key]?.trim()) {
      return true;
    }
  }

  return false;
};
