'use client';

import type { ReactNode } from 'react';
import { AdminFilterPanel } from '@/components/AdminFilterPanel';
import type { AdminFilterValues, IAdminFilterSchema } from '@/lib/admin-filter.types';

interface IAdminListToolbarProps {
  schema: IAdminFilterSchema | null;
  searchDraft: string;
  onSearchDraftChange: (value: string) => void;
  filterDraft: AdminFilterValues;
  onFilterDraftChange: (key: string, value: string) => void;
  onApply: () => void;
  onClear: () => void;
  disabled?: boolean;
  hasAppliedFilters?: boolean;
  children?: ReactNode;
}

export const AdminListToolbar = ({
  schema,
  searchDraft,
  onSearchDraftChange,
  filterDraft,
  onFilterDraftChange,
  onApply,
  onClear,
  disabled = false,
  hasAppliedFilters = false,
  children,
}: IAdminListToolbarProps): React.ReactElement => {
  return (
    <form
      className="admin-list-toolbar"
      onSubmit={(event) => {
        event.preventDefault();
        onApply();
      }}
    >
      {schema?.search ? (
        <div className="field admin-list-toolbar__search">
          <label htmlFor="admin-list-search">{schema.search.label}</label>
          <input
            id="admin-list-search"
            value={searchDraft}
            disabled={disabled}
            placeholder={schema.search.placeholder}
            onChange={(event) => onSearchDraftChange(event.target.value)}
          />
        </div>
      ) : null}

      <AdminFilterPanel
        fields={schema?.fields ?? []}
        values={filterDraft}
        onChange={onFilterDraftChange}
        disabled={disabled}
      />

      <div className="admin-list-toolbar__actions">
        <button type="submit" className="btn btn-primary" disabled={disabled}>
          Apply
        </button>
        {hasAppliedFilters ? (
          <button type="button" className="btn" disabled={disabled} onClick={onClear}>
            Clear
          </button>
        ) : null}
        {children}
      </div>
    </form>
  );
};
