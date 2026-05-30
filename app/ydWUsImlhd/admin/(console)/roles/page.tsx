'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { AdminListToolbar } from '@/components/AdminListToolbar';
import { PaginationBar } from '@/components/PaginationBar';
import { useAdminListFilters } from '@/hooks/use-admin-list-filters';
import { ApiCallError, apiRequest, type IListMeta } from '@/lib/api';
import { adminRoute } from '@/lib/routes';
import { useAdminAuthStore } from '@/stores/admin-auth.store';

interface IRoleRow {
  _id?: unknown;
  name?: string;
  permissionSlugs?: string[];
}

interface IRolesListPayload {
  items: IRoleRow[];
}

function roleId(row: IRoleRow): string {
  if (row._id === undefined || row._id === null) {
    return '';
  }
  return typeof row._id === 'string' ? row._id : String(row._id);
}

const PAGE_SIZE = 10;

export default function RolesListPage(): React.ReactElement {
  const accessToken = useAdminAuthStore((state) => state.accessToken);
  const [items, setItems] = useState<IRoleRow[]>([]);
  const [meta, setMeta] = useState<IListMeta | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const {
    schema,
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
  } = useAdminListFilters('roles', accessToken, PAGE_SIZE);

  const load = useCallback(async (): Promise<void> => {
    if (!accessToken) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const envelope = await apiRequest<IRolesListPayload>('/roles', {
        token: accessToken,
        query,
      });
      setItems(envelope.data?.items ?? []);
      setMeta(envelope.meta ?? null);
    } catch (err: unknown) {
      setError(err instanceof ApiCallError ? err.message : 'Failed to load roles.');
    } finally {
      setLoading(false);
    }
  }, [accessToken, query]);

  useEffect(() => {
    void load();
  }, [load]);

  const totalPages = meta?.totalPages ?? 1;

  return (
    <div>
      <h1 className="page-title">Roles</h1>
      <p className="meta" style={{ marginBottom: '1rem' }}>
        Manage permission bundles. Click a role to edit or delete.
      </p>
      <AdminListToolbar
        schema={schema}
        searchDraft={searchDraft}
        onSearchDraftChange={setSearchDraft}
        filterDraft={filterDraft}
        onFilterDraftChange={setFilterDraftValue}
        onApply={applyFilters}
        onClear={clearFilters}
        disabled={loading}
        hasAppliedFilters={hasAppliedFilters}
      >
        <Link href={adminRoute('/roles/new')} className="btn btn-primary" style={{ textDecoration: 'none' }}>
          New role
        </Link>
      </AdminListToolbar>
      {schemaError ? <div className="error-banner">{schemaError}</div> : null}
      {error ? <div className="error-banner">{error}</div> : null}
      <div className="panel" style={{ padding: 0, overflow: 'auto' }}>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Permissions</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {loading && items.length === 0 ? (
              <tr>
                <td colSpan={3} className="meta">
                  Loading…
                </td>
              </tr>
            ) : null}
            {!loading && items.length === 0 ? (
              <tr>
                <td colSpan={3} className="meta">
                  No roles found.
                </td>
              </tr>
            ) : null}
            {items.map((row) => {
              const id = roleId(row);
              return (
                <tr key={id}>
                  <td>{row.name}</td>
                  <td className="meta">{row.permissionSlugs?.length ?? 0}</td>
                  <td>
                    <Link href={adminRoute(`/roles/${encodeURIComponent(id)}`)}>View</Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <PaginationBar page={page} totalPages={totalPages} disabled={loading} onPageChange={setPage} />
    </div>
  );
}
