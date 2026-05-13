'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import { ApiCallError, apiRequest, type IListMeta } from '@/lib/api';
import { useAdminAuthStore } from '@/stores/admin-auth.store';

interface IRoleOption {
  _id: string;
  name: string;
}

interface IRolesPayload {
  items: IRoleOption[];
}

export default function NewUserPage(): React.ReactElement {
  const accessToken = useAdminAuthStore((state) => state.accessToken);
  const [roles, setRoles] = useState<IRoleOption[]>([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [roleId, setRoleId] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadRoles = async (): Promise<void> => {
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
        setRoleId((previous) => previous || (list[0] ? String(list[0]._id) : ''));
      } catch {
        setRoles([]);
      }
    };
    void loadRoles();
  }, [accessToken]);

  const onSubmit = async (event: FormEvent): Promise<void> => {
    event.preventDefault();
    if (!accessToken) {
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await apiRequest<unknown>('/users', {
        method: 'POST',
        token: accessToken,
        body: {
          name,
          email,
          roleId,
          password: password.length > 0 ? password : undefined,
          phone: phone.trim().length > 0 ? phone : undefined,
        },
      });
      window.location.href = '/users';
    } catch (err: unknown) {
      setError(err instanceof ApiCallError ? err.message : 'Could not create user.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="page-title">New user</h1>
      <p className="meta" style={{ marginBottom: '1rem' }}>
        <Link href="/users">← Back to users</Link>
      </p>
      {error && <div className="error-banner">{error}</div>}
      <form className="panel" onSubmit={(event) => void onSubmit(event)} style={{ maxWidth: 480 }}>
        <div className="field">
          <label htmlFor="name">Name</label>
          <input id="name" value={name} onChange={(event) => setName(event.target.value)} required minLength={2} />
        </div>
        <div className="field">
          <label htmlFor="email">Email</label>
          <input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
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
          <label htmlFor="password">Password (optional)</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            minLength={6}
          />
        </div>
        <div className="field">
          <label htmlFor="phone">Phone (optional)</label>
          <input id="phone" value={phone} onChange={(event) => setPhone(event.target.value)} />
        </div>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Creating…' : 'Create user'}
        </button>
      </form>
    </div>
  );
}
