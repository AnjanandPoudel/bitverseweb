'use client';

import Link from 'next/link';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ApiCallError, apiRequest } from '@/lib/api';
import { formatRoleLabel, roleObjectId, userDocumentId } from '@/lib/format-user';
import { adminRoute } from '@/lib/routes';
import { useAdminAuthStore } from '@/stores/admin-auth.store';

interface IUserDetail {
  _id?: unknown;
  name?: string;
  email?: string;
  phone?: string;
  isActive?: boolean;
  roleId?: unknown;
}

interface IRoleOption {
  _id: string;
  name: string;
}

interface IRolesPayload {
  items: IRoleOption[];
}

export default function UserDetailPage(): React.ReactElement {
  const params = useParams<{ userId: string }>();
  const userId = typeof params.userId === 'string' ? params.userId : '';
  const router = useRouter();
  const accessToken = useAdminAuthStore((state) => state.accessToken);
  const currentUserId = useAdminAuthStore((state) => state.user?.id ?? '');

  const [user, setUser] = useState<IUserDetail | null>(null);
  const [roles, setRoles] = useState<IRoleOption[]>([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [roleId, setRoleId] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadUser = useCallback(async (): Promise<void> => {
    if (!accessToken || !userId) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const envelope = await apiRequest<IUserDetail>(`/users/${encodeURIComponent(userId)}`, {
        token: accessToken,
      });
      const data = envelope.data;
      if (!data) {
        setError('User not found.');
        setUser(null);
        return;
      }
      setUser(data);
      setName(data.name ?? '');
      setEmail(data.email ?? '');
      setPhone(data.phone ?? '');
      setRoleId(roleObjectId(data.roleId));
      setIsActive(data.isActive !== false);
    } catch (err: unknown) {
      setError(err instanceof ApiCallError ? err.message : 'Failed to load user.');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [accessToken, userId]);

  const loadRoles = useCallback(async (): Promise<void> => {
    if (!accessToken) {
      return;
    }
    try {
      const envelope = await apiRequest<IRolesPayload>('/roles', {
        token: accessToken,
        query: { page: 1, limit: 100 },
      });
      const list = envelope.data?.items ?? [];
      setRoles(list.map((r) => ({ _id: String(r._id), name: r.name })));
    } catch {
      setRoles([]);
    }
  }, [accessToken]);

  useEffect(() => {
    void loadUser();
  }, [loadUser]);

  useEffect(() => {
    void loadRoles();
  }, [loadRoles]);

  const onSave = async (event: FormEvent): Promise<void> => {
    event.preventDefault();
    if (!accessToken || !userId) {
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const body: Record<string, unknown> = {
        name,
        email,
        phone,
        roleId,
        isActive,
      };
      if (newPassword.trim().length > 0) {
        body.password = newPassword;
      }
      await apiRequest<IUserDetail>(`/users/${encodeURIComponent(userId)}`, {
        method: 'PATCH',
        token: accessToken,
        body,
      });
      setNewPassword('');
      await loadUser();
    } catch (err: unknown) {
      setError(err instanceof ApiCallError ? err.message : 'Save failed.');
    } finally {
      setSaving(false);
    }
  };

  const onDeactivate = async (): Promise<void> => {
    if (!accessToken || !userId) {
      return;
    }
    if (!window.confirm('Deactivate this user? They will not be able to sign in.')) {
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await apiRequest<unknown>(`/users/${encodeURIComponent(userId)}`, {
        method: 'DELETE',
        token: accessToken,
      });
      router.push(adminRoute('/users'));
    } catch (err: unknown) {
      setError(err instanceof ApiCallError ? err.message : 'Deactivate failed.');
    } finally {
      setSaving(false);
    }
  };

  const isSelf = currentUserId !== '' && currentUserId === userId;

  return (
    <div>
      <h1 className="page-title">Edit user</h1>
      <p className="meta" style={{ marginBottom: '1rem' }}>
        <Link href={adminRoute('/users')}>← Back to users</Link>
        {user ? (
          <>
            {' · '}
            <span className="meta">ID: {userDocumentId(user)}</span>
            {' · '}
            <span className="meta">Current role: {formatRoleLabel(user.roleId)}</span>
          </>
        ) : null}
      </p>
      {error && <div className="error-banner">{error}</div>}
      {loading && !user ? <p className="meta">Loading…</p> : null}
      {user ? (
        <form className="panel" style={{ maxWidth: 520 }} onSubmit={(event) => void onSave(event)}>
          <div className="field">
            <label htmlFor="name">Name</label>
            <input id="name" value={name} onChange={(event) => setName(event.target.value)} required minLength={2} />
          </div>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </div>
          <div className="field">
            <label htmlFor="phone">Phone</label>
            <input id="phone" value={phone} onChange={(event) => setPhone(event.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="roleId">Role</label>
            <select id="roleId" value={roleId} onChange={(event) => setRoleId(event.target.value)} required>
              {roles.map((role) => (
                <option key={role._id} value={role._id}>
                  {role.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="active">
              <input
                id="active"
                type="checkbox"
                checked={isActive}
                disabled={isSelf}
                onChange={(event) => setIsActive(event.target.checked)}
              />{' '}
              Active
            </label>
            {isSelf ? <div className="meta">You cannot deactivate your own account here.</div> : null}
          </div>
          <div className="field">
            <label htmlFor="new-password">New password (optional)</label>
            <input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              minLength={6}
              placeholder="Leave blank to keep current password"
            />
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving…' : 'Save changes'}
            </button>
            <button
              type="button"
              className="btn"
              disabled={saving || isSelf}
              onClick={() => void onDeactivate()}
            >
              Deactivate user
            </button>
          </div>
        </form>
      ) : null}
    </div>
  );
}
