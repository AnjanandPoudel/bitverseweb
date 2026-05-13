'use client';

import Link from 'next/link';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ApiCallError, apiRequest } from '@/lib/api';
import { useAdminAuthStore } from '@/stores/admin-auth.store';

interface IPermissionRow {
  _id: string;
  name: string;
  slug: string;
}

interface IRoleDetail {
  _id?: unknown;
  name?: string;
  permissionSlugs?: string[];
}

function roleIdString(role: IRoleDetail): string {
  if (role._id === undefined || role._id === null) {
    return '';
  }
  return typeof role._id === 'string' ? role._id : String(role._id);
}

export default function RoleDetailPage(): React.ReactElement {
  const params = useParams<{ roleId: string }>();
  const roleIdParam = typeof params.roleId === 'string' ? params.roleId : '';
  const router = useRouter();
  const accessToken = useAdminAuthStore((state) => state.accessToken);

  const [role, setRole] = useState<IRoleDetail | null>(null);
  const [permissions, setPermissions] = useState<IPermissionRow[]>([]);
  const [name, setName] = useState('');
  const [selectedSlugs, setSelectedSlugs] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadRole = useCallback(async (): Promise<void> => {
    if (!accessToken || !roleIdParam) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const envelope = await apiRequest<IRoleDetail>(`/roles/${encodeURIComponent(roleIdParam)}`, {
        token: accessToken,
      });
      const data = envelope.data;
      if (!data) {
        setRole(null);
        setError('Role not found.');
        return;
      }
      setRole(data);
      setName(data.name ?? '');
      setSelectedSlugs(new Set(data.permissionSlugs ?? []));
    } catch (err: unknown) {
      setError(err instanceof ApiCallError ? err.message : 'Failed to load role.');
      setRole(null);
    } finally {
      setLoading(false);
    }
  }, [accessToken, roleIdParam]);

  const loadPermissions = useCallback(async (): Promise<void> => {
    if (!accessToken) {
      return;
    }
    try {
      const envelope = await apiRequest<IPermissionRow[]>('/permissions', { token: accessToken });
      setPermissions(envelope.data ?? []);
    } catch {
      setPermissions([]);
    }
  }, [accessToken]);

  useEffect(() => {
    void loadRole();
  }, [loadRole]);

  useEffect(() => {
    void loadPermissions();
  }, [loadPermissions]);

  const toggleSlug = (slug: string): void => {
    setSelectedSlugs((previous) => {
      const next = new Set(previous);
      if (next.has(slug)) {
        next.delete(slug);
      } else {
        next.add(slug);
      }
      return next;
    });
  };

  const onSave = async (event: FormEvent): Promise<void> => {
    event.preventDefault();
    if (!accessToken || !roleIdParam) {
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await apiRequest<IRoleDetail>(`/roles/${encodeURIComponent(roleIdParam)}`, {
        method: 'PATCH',
        token: accessToken,
        body: { name, permissionSlugs: [...selectedSlugs] },
      });
      await loadRole();
    } catch (err: unknown) {
      setError(err instanceof ApiCallError ? err.message : 'Save failed.');
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (): Promise<void> => {
    if (!accessToken || !roleIdParam) {
      return;
    }
    if (!window.confirm('Delete this role permanently? Users still assigned to it may be affected.')) {
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await apiRequest<unknown>(`/roles/${encodeURIComponent(roleIdParam)}`, {
        method: 'DELETE',
        token: accessToken,
      });
      router.push('/roles');
    } catch (err: unknown) {
      setError(err instanceof ApiCallError ? err.message : 'Delete failed.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h1 className="page-title">Edit role</h1>
      <p className="meta" style={{ marginBottom: '1rem' }}>
        <Link href="/roles">← Back to roles</Link>
        {role ? (
          <>
            {' · '}
            <span className="meta">ID: {roleIdString(role)}</span>
          </>
        ) : null}
      </p>
      {error && <div className="error-banner">{error}</div>}
      {loading && !role ? <p className="meta">Loading…</p> : null}
      {role ? (
        <form className="panel" style={{ maxWidth: 720 }} onSubmit={(event) => void onSave(event)}>
          <div className="field">
            <label htmlFor="name">Role name</label>
            <input id="name" value={name} onChange={(event) => setName(event.target.value)} required minLength={2} />
          </div>
          <div className="field">
            <span className="meta">Permissions</span>
            <div
              style={{
                maxHeight: 320,
                overflow: 'auto',
                border: '1px solid var(--border)',
                borderRadius: 8,
                padding: '0.5rem',
              }}
            >
              {permissions.map((permission) => (
                <label
                  key={permission.slug}
                  style={{
                    display: 'flex',
                    gap: 8,
                    alignItems: 'center',
                    padding: '0.25rem 0',
                    fontSize: '0.85rem',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selectedSlugs.has(permission.slug)}
                    onChange={() => toggleSlug(permission.slug)}
                  />
                  <code>{permission.slug}</code>
                  <span className="meta">{permission.name}</span>
                </label>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving…' : 'Save changes'}
            </button>
            <button type="button" className="btn" disabled={saving} onClick={() => void onDelete()}>
              Delete role
            </button>
          </div>
        </form>
      ) : null}
    </div>
  );
}
