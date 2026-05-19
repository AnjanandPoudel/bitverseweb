'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { ApiCallError, apiRequest, type IListMeta } from '@/lib/api';
import { adminRoute } from '@/lib/routes';
import { PaginationBar } from '@/components/PaginationBar';
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
  const [page, setPage] = useState(1);
  const [searchDraft, setSearchDraft] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (): Promise<void> => {
    if (!accessToken) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const envelope = await apiRequest<IRolesListPayload>('/roles', {
        token: accessToken,
        query: { page, limit: PAGE_SIZE, search: search || undefined },
      });
      setItems(envelope.data?.items ?? []);
      setMeta(envelope.meta ?? null);
    } catch (err: unknown) {
      setError(err instanceof ApiCallError ? err.message : 'Failed to load roles.');
    } finally {
      setLoading(false);
    }
  }, [accessToken, page, search]);

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
      <form
        className="toolbar"
        onSubmit={(event) => {
          event.preventDefault();
          setSearch(searchDraft.trim());
          setPage(1);
        }}
      >
        <div className="field" style={{ flex: '1 1 200px', marginBottom: 0 }}>
          <label htmlFor="role-search">Search</label>
          <input
            id="role-search"
            value={searchDraft}
            onChange={(event) => setSearchDraft(event.target.value)}
            placeholder="Role name"
          />
        </div>
        <button type="submit" className="btn btn-primary">
          Apply
        </button>
        <Link href={adminRoute('/roles/new')} className="btn btn-primary" style={{ textDecoration: 'none' }}>
          New role
        </Link>
      </form>
      {error && <div className="error-banner">{error}</div>}
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
              const count = row.permissionSlugs?.length ?? 0;
              return (
                <tr key={id}>
                  <td>{row.name}</td>
                  <td className="meta">{count} permission(s)</td>
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
