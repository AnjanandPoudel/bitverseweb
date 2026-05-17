'use client';

import Link from 'next/link';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ApiCallError, apiRequest } from '@/lib/api';
import { toastApiSuccess } from '@/lib/mutation-feedback';
import { formatRoleLabel, roleObjectId, userDocumentId } from '@/lib/format-user';
import { adminRoute } from '@/lib/routes';
import { useAdminAuthStore } from '@/stores/admin-auth.store';

interface IUserDetail {
  _id?: unknown;
  name?: string;
  email?: string;
  phone?: string;
  isActive?: boolean;
  emailVerified?: boolean;
  roleId?: unknown;
  photo?: string;
  fcmToken?: string;
  subjects?: string[];
  dob?: string;
  enrolledAt?: string;
  parentId?: unknown;
  classId?: unknown;
  createdAt?: string;
  updatedAt?: string;
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

  const formatDate = (iso: string | undefined): string => {
    if (!iso) return '—';
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? iso : d.toLocaleString();
  };

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
      const envelope = await apiRequest<IUserDetail>(`/users/${encodeURIComponent(userId)}`, {
        method: 'PATCH',
        token: accessToken,
        body,
      });
      toastApiSuccess(envelope, 'User updated.');
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
      const envelope = await apiRequest<unknown>(`/users/${encodeURIComponent(userId)}`, {
        method: 'DELETE',
        token: accessToken,
      });
      toastApiSuccess(envelope, 'User deactivated.');
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
        <>
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

          <div className="panel" style={{ maxWidth: 520, marginTop: '1.5rem' }}>
            <h2 style={{ fontSize: '0.875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted, #6b7280)', marginBottom: '0.75rem' }}>
              Additional Details
            </h2>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <tbody>
                {[
                  { label: 'Email verified', value: user.emailVerified === true ? 'Yes' : user.emailVerified === false ? 'No' : '—' },
                  { label: 'Photo URL', value: user.photo ?? '—' },
                  { label: 'FCM Token', value: user.fcmToken ?? '—', mono: true },
                  { label: 'Subjects', value: Array.isArray(user.subjects) && user.subjects.length > 0 ? user.subjects.join(', ') : '—' },
                  { label: 'Date of birth', value: formatDate(user.dob) },
                  { label: 'Enrolled at', value: formatDate(user.enrolledAt) },
                  { label: 'Parent ID', value: user.parentId != null ? String(user.parentId) : '—', mono: true },
                  { label: 'Class ID', value: user.classId != null ? String(user.classId) : '—', mono: true },
                  { label: 'Created', value: formatDate(user.createdAt) },
                  { label: 'Updated', value: formatDate(user.updatedAt) },
                ].map(({ label, value, mono }) => (
                  <tr key={label} style={{ borderBottom: '1px solid var(--color-border, #e5e7eb)' }}>
                    <td style={{ padding: '0.5rem 0', color: 'var(--color-text-muted, #6b7280)', width: '40%', fontWeight: 500 }}>{label}</td>
                    <td style={{ padding: '0.5rem 0', wordBreak: 'break-all', fontFamily: mono ? 'monospace' : undefined, fontSize: mono ? '0.75rem' : undefined }}>{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {user.photo ? (
              <div style={{ marginTop: '0.75rem' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={user.photo} alt="User photo" style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover', border: '2px solid #e5e7eb' }} />
              </div>
            ) : null}
          </div>
        </>
      ) : null}
    </div>
  );
}
