'use client';

import Link from 'next/link';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import { ApiCallError, apiRequest } from '@/lib/api';
import { useAdminAuthStore } from '@/stores/admin-auth.store';

interface IPermissionRow {
  _id: string;
  name: string;
  slug: string;
}

export default function NewRolePage(): React.ReactElement {
  const accessToken = useAdminAuthStore((state) => state.accessToken);
  const [permissions, setPermissions] = useState<IPermissionRow[]>([]);
  const [name, setName] = useState('');
  const [selectedSlugs, setSelectedSlugs] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const loadPermissions = useCallback(async (): Promise<void> => {
    if (!accessToken) {
      return;
    }
    try {
      const envelope = await apiRequest<IPermissionRow[]>('/permissions', { token: accessToken });
      const rows = envelope.data ?? [];
      setPermissions(rows);
    } catch {
      setPermissions([]);
    }
  }, [accessToken]);

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

  const onSubmit = async (event: FormEvent): Promise<void> => {
    event.preventDefault();
    if (!accessToken) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await apiRequest<unknown>('/roles', {
        method: 'POST',
        token: accessToken,
        body: { name, permissionSlugs: [...selectedSlugs] },
      });
      window.location.href = '/roles';
    } catch (err: unknown) {
      setError(err instanceof ApiCallError ? err.message : 'Could not create role.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="page-title">New role</h1>
      <p className="meta" style={{ marginBottom: '1rem' }}>
        <Link href="/roles">← Back to roles</Link>
      </p>
      {error && <div className="error-banner">{error}</div>}
      <form className="panel" onSubmit={(event) => void onSubmit(event)} style={{ maxWidth: 720 }}>
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
                style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '0.25rem 0', fontSize: '0.85rem' }}
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
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Creating…' : 'Create role'}
        </button>
      </form>
    </div>
  );
}
