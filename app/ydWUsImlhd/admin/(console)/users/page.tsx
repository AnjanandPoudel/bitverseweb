'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { ApiCallError, apiRequest, type IListMeta } from '@/lib/api';
import { formatRoleLabel, userDocumentId } from '@/lib/format-user';
import { adminRoute } from '@/lib/routes';
import { PaginationBar } from '@/components/PaginationBar';
import { useAdminAuthStore } from '@/stores/admin-auth.store';

interface IUserRow {
  _id?: unknown;
  name?: string;
  email?: string;
  isActive?: boolean;
  roleId?: unknown;
}

interface IUsersListPayload {
  items: IUserRow[];
}

const PAGE_SIZE = 10;

export default function UsersListPage(): React.ReactElement {
  const accessToken = useAdminAuthStore((state) => state.accessToken);
  const [items, setItems] = useState<IUserRow[]>([]);
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
      const envelope = await apiRequest<IUsersListPayload>('/users', {
        token: accessToken,
        query: { page, limit: PAGE_SIZE, search: search || undefined },
      });
      const payload = envelope.data;
      setItems(payload?.items ?? []);
      setMeta(envelope.meta ?? null);
    } catch (err: unknown) {
      setError(err instanceof ApiCallError ? err.message : 'Failed to load users.');
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
      <h1 className="page-title">Users</h1>
      <p className="meta" style={{ marginBottom: '1rem' }}>
        Manage accounts, roles, and passwords. Click a row to edit details.
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
          <label htmlFor="user-search">Search</label>
          <input
            id="user-search"
            value={searchDraft}
            onChange={(event) => setSearchDraft(event.target.value)}
            placeholder="Name or email"
          />
        </div>
        <button type="submit" className="btn btn-primary">
          Apply
        </button>
        <Link href={adminRoute('/users/new')} className="btn btn-primary" style={{ textDecoration: 'none' }}>
          New user
        </Link>
      </form>
      {error && <div className="error-banner">{error}</div>}
      <div className="panel" style={{ padding: 0, overflow: 'auto' }}>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {loading && items.length === 0 ? (
              <tr>
                <td colSpan={5} className="meta">
                  Loading…
                </td>
              </tr>
            ) : null}
            {!loading && items.length === 0 ? (
              <tr>
                <td colSpan={5} className="meta">
                  No users found.
                </td>
              </tr>
            ) : null}
            {items.map((row) => {
              const id = userDocumentId(row);
              return (
                <tr key={id}>
                  <td>{row.name}</td>
                  <td>{row.email}</td>
                  <td>{formatRoleLabel(row.roleId)}</td>
                  <td>
                    {row.isActive === false ? (
                      <span className="badge badge-off">Inactive</span>
                    ) : (
                      <span className="badge badge-ok">Active</span>
                    )}
                  </td>
                  <td>
                    <Link href={adminRoute(`/users/${encodeURIComponent(id)}`)}>View</Link>
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
