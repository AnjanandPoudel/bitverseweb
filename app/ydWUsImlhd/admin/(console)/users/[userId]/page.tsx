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

interface IRelationUser {
  _id?: unknown;
  name?: string;
  email?: string;
  roleId?: unknown;
  isActive?: boolean;
}

interface IRelationsPayload {
  parent: IRelationUser | null;
  children: IRelationUser[];
}

interface IRelationBoxProps {
  label: string;
  name: string;
  email: string;
  roleName: string;
  isActive: boolean;
  isSelf?: boolean;
  href?: string;
}

function RelationBox({ name, email, roleName, isActive, isSelf = false, href }: IRelationBoxProps): React.ReactElement {
  const inner = (
    <div style={{
      border: isSelf ? '2px solid #3b82f6' : '1px solid #e5e7eb',
      borderRadius: 8,
      padding: '10px 14px',
      background: isSelf ? '#eff6ff' : '#fff',
      minWidth: 180,
      maxWidth: 240,
      cursor: href ? 'pointer' : 'default',
      transition: 'box-shadow 0.15s',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: isActive ? '#22c55e' : '#ef4444', flexShrink: 0, display: 'inline-block' }} />
        <span style={{ fontWeight: 700, fontSize: '0.875rem', color: isSelf ? '#1d4ed8' : '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
      </div>
      <div style={{ fontSize: '0.75rem', color: '#6b7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{email}</div>
      <div style={{ fontSize: '0.7rem', color: '#3b82f6', fontWeight: 600, textTransform: 'capitalize', marginTop: 2 }}>{roleName || '—'}</div>
    </div>
  );
  if (href) {
    return <a href={href} style={{ textDecoration: 'none' }}>{inner}</a>;
  }
  return inner;
}

function RelationConnector({ count, hasParent }: { count: number; hasParent: boolean }): React.ReactElement {
  const rowH = 72;
  const gap = 12;
  const totalH = Math.max(1, count + (hasParent ? 1 : 0)) * (rowH + gap) - gap;
  const midY = totalH / 2;
  const w = 64;

  const paths: string[] = [];
  let y = rowH / 2;
  const nodeCount = (hasParent ? 1 : 0) + count;
  for (let i = 0; i < nodeCount; i++) {
    const cx1 = w * 0.4;
    const cx2 = w * 0.6;
    paths.push(`M 0 ${midY} C ${cx1} ${midY}, ${cx2} ${y}, ${w} ${y}`);
    y += rowH + gap;
  }

  return (
    <svg width={w} height={totalH} style={{ overflow: 'visible', flexShrink: 0 }}>
      {paths.map((d, i) => (
        <path
          key={i}
          d={d}
          fill="none"
          stroke="#d1d5db"
          strokeWidth={2}
          markerEnd="url(#arrow)"
        />
      ))}
      <defs>
        <marker id="arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0,0 L0,6 L6,3 z" fill="#d1d5db" />
        </marker>
      </defs>
    </svg>
  );
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
  const [relations, setRelations] = useState<IRelationsPayload | null>(null);

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

  const loadRelations = useCallback(async (): Promise<void> => {
    if (!accessToken || !userId) {
      return;
    }
    try {
      const envelope = await apiRequest<IRelationsPayload>(`/users/${encodeURIComponent(userId)}/relations`, {
        token: accessToken,
      });
      setRelations(envelope.data ?? null);
    } catch {
      setRelations(null);
    }
  }, [accessToken, userId]);

  useEffect(() => {
    void loadUser();
  }, [loadUser]);

  useEffect(() => {
    void loadRoles();
  }, [loadRoles]);

  useEffect(() => {
    void loadRelations();
  }, [loadRelations]);

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
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <form className="panel" style={{ maxWidth: 620, minWidth:420, flex: 4 }} onSubmit={(event) => void onSave(event)}>
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

          <div className="panel" style={{ maxWidth: 620,  minWidth:320, marginTop: '1.5rem', flex: 3 }}>
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

          {relations !== null && (relations.parent !== null || relations.children.length > 0) ? (
            <div className="panel" style={{ maxWidth: 640,  minWidth:420, marginTop: '1.5rem', flex: 3 }}>
              <h2 style={{ fontSize: '0.875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted, #6b7280)', marginBottom: '1.25rem' }}>
                Account Relations
              </h2>
              <div style={{ display: 'flex', gap: 32, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                {/* Left column — centre node */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
                  <RelationBox
                    label="This account"
                    name={user.name ?? '—'}
                    email={user.email ?? ''}
                    roleName={formatRoleLabel(user.roleId)}
                    isActive={isActive}
                    isSelf
                  />
                </div>

                {/* SVG connector + right column */}
                {relations.parent !== null || relations.children.length > 0 ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 0, flexWrap: 'wrap' }}>
                    <RelationConnector count={Math.max(1, relations.children.length)} hasParent={relations.parent !== null} />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {relations.parent !== null ? (
                        <div>
                          <div style={{ fontSize: '0.7rem', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Parent</div>
                          <RelationBox
                            label=""
                            name={String(relations.parent.name ?? '—')}
                            email={String(relations.parent.email ?? '')}
                            roleName={formatRoleLabel(relations.parent.roleId)}
                            isActive={relations.parent.isActive !== false}
                            href={adminRoute(`/users/${String((relations.parent as Record<string, unknown>)._id ?? '')}`)}
                          />
                        </div>
                      ) : null}
                      {relations.children.length > 0 ? (
                        <div>
                          <div style={{ fontSize: '0.7rem', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
                            {relations.children.length === 1 ? 'Child' : `Children (${relations.children.length})`}
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {relations.children.map((child) => (
                              <RelationBox
                                key={String((child as Record<string, unknown>)._id ?? '')}
                                label=""
                                name={String(child.name ?? '—')}
                                email={String(child.email ?? '')}
                                roleName={formatRoleLabel(child.roleId)}
                                isActive={child.isActive !== false}
                                href={adminRoute(`/users/${String((child as Record<string, unknown>)._id ?? '')}`)}
                              />
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
