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
  name: string;
  email: string;
  roleName: string;
  isActive: boolean;
  isSelf?: boolean;
  href?: string;
  caption?: string;
}

function RelationBox({
  name,
  email,
  roleName,
  isActive,
  isSelf = false,
  href,
  caption,
}: IRelationBoxProps): React.ReactElement {
  const inner = (
    <RelationCardShell isSelf={isSelf}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: isActive ? '#22c55e' : '#ef4444',
            flexShrink: 0,
            display: 'inline-block',
          }}
        />
        <span
          style={{
            fontWeight: 700,
            fontSize: '0.875rem',
            color: isSelf ? '#1d4ed8' : '#111827',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {name}
        </span>
      </div>
      <div
        style={{
          fontSize: '0.75rem',
          color: '#6b7280',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {email}
      </div>
      <div style={{ fontSize: '0.7rem', color: '#3b82f6', fontWeight: 600, textTransform: 'capitalize', marginTop: 2 }}>
        {roleName || '—'}
      </div>
      {caption ? <RelationCardShell isSelf={false}><div style={{ fontSize: '0.65rem', color: '#9ca3af', marginTop: 4 }}>{caption}</div></RelationCardShell> : null}
    </RelationCardShell>
  );

  if (href) {
    return (
      <a href={href} style={{ textDecoration: 'none' }}>
        {inner}
      </a>
    );
  }
  return inner;
}

function RelationCardShell({ isSelf, children }: { isSelf: boolean; children: React.ReactNode }): React.ReactElement {
  return (
    <div
      style={{
        border: isSelf ? '2px solid #3b82f6' : '1px solid #e5e7eb',
        borderRadius: 8,
        padding: '10px 14px',
        background: isSelf ? '#eff6ff' : '#fff',
        minWidth: 200,
        maxWidth: 280,
      }}
    >
      {children}
    </div>
  );
}

function toDateTimeLocalValue(iso: string | undefined): string {
  if (!iso) {
    return '';
  }
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return '';
  }
  const pad = (n: number): string => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromDateTimeLocalValue(value: string): string | null {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return null;
  }
  const d = new Date(trimmed);
  if (Number.isNaN(d.getTime())) {
    return null;
  }
  return d.toISOString();
}

function objectIdString(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }
  return String(value);
}

function relationUserId(user: IRelationUser): string {
  return String((user as Record<string, unknown>)._id ?? '');
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
  const [emailVerified, setEmailVerified] = useState(true);
  const [photo, setPhoto] = useState('');
  const [fcmToken, setFcmToken] = useState('');
  const [subjectsText, setSubjectsText] = useState('');
  const [dobLocal, setDobLocal] = useState('');
  const [enrolledAtLocal, setEnrolledAtLocal] = useState('');
  const [parentId, setParentId] = useState('');
  const [classId, setClassId] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [relations, setRelations] = useState<IRelationsPayload | null>(null);

  const formatDate = (iso: string | undefined): string => {
    if (!iso) {
      return '—';
    }
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
      setEmailVerified(data.emailVerified !== false);
      setPhoto(data.photo ?? '');
      setFcmToken(data.fcmToken ?? '');
      setSubjectsText(Array.isArray(data.subjects) && data.subjects.length > 0 ? data.subjects.join(', ') : '');
      setDobLocal(toDateTimeLocalValue(data.dob));
      setEnrolledAtLocal(toDateTimeLocalValue(data.enrolledAt));
      setParentId(objectIdString(data.parentId));
      setClassId(objectIdString(data.classId));
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
      const subjects = subjectsText
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      const body: Record<string, unknown> = {
        name,
        email,
        phone,
        roleId,
        isActive,
        emailVerified,
        photo,
        fcmToken,
        subjects,
      };

      const dobIso = fromDateTimeLocalValue(dobLocal);
      if (dobIso) {
        body.dob = dobIso;
      }

      const enrolledIso = fromDateTimeLocalValue(enrolledAtLocal);
      if (enrolledIso) {
        body.enrolledAt = enrolledIso;
      }

      const trimmedParentId = parentId.trim();
      body.parentId = trimmedParentId.length > 0 ? trimmedParentId : null;

      const trimmedClassId = classId.trim();
      body.classId = trimmedClassId.length > 0 ? trimmedClassId : null;

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
      void loadRelations();
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
      {error ? <div className="error-banner">{error}</div> : null}
      {loading && !user ? <p className="meta">Loading…</p> : null}
      {user ? (
        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
          <form className="panel" style={{ maxWidth: 720, minWidth: 320, flex: '1 1 420px' }} onSubmit={(event) => void onSave(event)}>
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
            <RelationCardShell isSelf={false}>
              <label htmlFor="photo">Photo URL</label>
              <input id="photo" value={photo} onChange={(event) => setPhoto(event.target.value)} placeholder="https://…" />
              {photo.trim().length > 0 ? (
                <div style={{ marginTop: 8 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo}
                    alt="User photo preview"
                    style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover', border: '2px solid #e5e7eb' }}
                  />
                </div>
              ) : null}
            </RelationCardShell>
            <div className="field">
              <label htmlFor="fcm-token">FCM token</label>
              <input id="fcm-token" value={fcmToken} onChange={(event) => setFcmToken(event.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="subjects">Subjects (comma-separated)</label>
              <input
                id="subjects"
                value={subjectsText}
                onChange={(event) => setSubjectsText(event.target.value)}
                placeholder="English, Math"
              />
            </div>
            <div className="field">
              <label htmlFor="dob">Date of birth</label>
              <input id="dob" type="datetime-local" value={dobLocal} onChange={(event) => setDobLocal(event.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="enrolled-at">Enrolled at</label>
              <input
                id="enrolled-at"
                type="datetime-local"
                value={enrolledAtLocal}
                onChange={(event) => setEnrolledAtLocal(event.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="parent-id">Parent ID</label>
              <input
                id="parent-id"
                value={parentId}
                onChange={(event) => setParentId(event.target.value)}
                placeholder="24-char ObjectId or empty"
                style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}
              />
            </div>
            <div className="field">
              <label htmlFor="class-id">Class ID</label>
              <input
                id="class-id"
                value={classId}
                onChange={(event) => setClassId(event.target.value)}
                placeholder="24-char ObjectId or empty"
                style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}
              />
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
              <label htmlFor="email-verified">
                <input
                  id="email-verified"
                  type="checkbox"
                  checked={emailVerified}
                  onChange={(event) => setEmailVerified(event.target.checked)}
                />{' '}
                Email verified
              </label>
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
            <p className="meta" style={{ marginTop: '0.5rem' }}>
              Created: {formatDate(user.createdAt)} · Updated: {formatDate(user.updatedAt)}
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: '1rem' }}>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Saving…' : 'Save changes'}
              </button>
              <button type="button" className="btn" disabled={saving || isSelf} onClick={() => void onDeactivate()}>
                Deactivate user
              </button>
            </div>
          </form>

          {relations !== null && (relations.parent !== null || relations.children.length > 0) ? (
            <div className="panel" style={{ maxWidth: 360, minWidth: 280, flex: '0 1 320px' }}>
              <h2
                style={{
                  fontSize: '0.875rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: 'var(--color-text-muted, #6b7280)',
                  marginBottom: '1rem',
                }}
              >
                Account relations
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {relations.parent !== null ? (
                  <div style={{ marginBottom: 8 }}>
                    <div
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        color: '#9ca3af',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        marginBottom: 6,
                      }}
                    >
                      Parent
                    </div>
                    <RelationBox
                      name={String(relations.parent.name ?? '—')}
                      email={String(relations.parent.email ?? '')}
                      roleName={formatRoleLabel(relations.parent.roleId)}
                      isActive={relations.parent.isActive !== false}
                      href={adminRoute(`/users/${relationUserId(relations.parent)}`)}
                    />
                    <div style={{ width: 2, height: 20, background: '#d1d5db', marginLeft: 20, marginTop: 8 }} />
                  </div>
                ) : null}

                <RelationBox
                  name={user.name ?? '—'}
                  email={user.email ?? ''}
                  roleName={formatRoleLabel(user.roleId)}
                  isActive={isActive}
                  isSelf
                  caption="This account"
                />

                {relations.children.length > 0 ? (
                  <div style={{ marginTop: 8 }}>
                    <RelationCardShell isSelf={false}>
                      <RelationCardShell isSelf={false}>
                        <div
                          style={{
                            width: 2,
                            height: 16,
                            background: '#d1d5db',
                            marginLeft: 20,
                            marginBottom: 8,
                          }}
                        />
                      </RelationCardShell>
                      <div
                        style={{
                          fontSize: '0.7rem',
                          fontWeight: 600,
                          color: '#9ca3af',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          marginBottom: 8,
                          paddingLeft: 24,
                        }}
                      >
                        {relations.children.length === 1 ? 'Child' : `Children (${relations.children.length})`}
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 8,
                          paddingLeft: 24,
                          borderLeft: '2px solid #d1d5db',
                          marginLeft: 20,
                        }}
                      >
                        {relations.children.map((child) => (
                          <RelationBox
                            key={relationUserId(child)}
                            name={String(child.name ?? '—')}
                            email={String(child.email ?? '')}
                            roleName={formatRoleLabel(child.roleId)}
                            isActive={child.isActive !== false}
                            href={adminRoute(`/users/${relationUserId(child)}`)}
                          />
                        ))}
                      </div>
                    </RelationCardShell>
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
