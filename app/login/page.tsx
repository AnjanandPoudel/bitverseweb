'use client';

import { useRouter } from 'next/navigation';
import { FormEvent, useEffect, useState } from 'react';
import { ApiCallError, apiRequest } from '@/lib/api';
import { useAdminAuthStore, type IAdminSessionUser } from '@/stores/admin-auth.store';

interface IAdminLoginResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: unknown;
    name: string;
    email: string;
    role: string;
    permissions: string[];
  };
}

function mapSessionUser(raw: IAdminLoginResponse['user']): IAdminSessionUser {
  let id = '';
  if (typeof raw.id === 'string') {
    id = raw.id;
  } else if (raw.id && typeof raw.id === 'object' && '_id' in (raw.id as object)) {
    id = String((raw.id as { _id: unknown })._id);
  }
  return {
    id,
    name: raw.name,
    email: raw.email,
    role: raw.role,
    permissions: Array.isArray(raw.permissions) ? raw.permissions : [],
  };
}

export default function LoginPage(): React.ReactElement {
  const router = useRouter();
  const setSession = useAdminAuthStore((state) => state.setSession);
  const accessToken = useAdminAuthStore((state) => state.accessToken);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (useAdminAuthStore.persist.hasHydrated()) {
      setHydrated(true);
    }
    return useAdminAuthStore.persist.onFinishHydration(() => {
      setHydrated(true);
    });
  }, []);

  useEffect(() => {
    if (hydrated && accessToken) {
      router.replace('/users');
    }
  }, [accessToken, hydrated, router]);

  const onSubmit = async (event: FormEvent): Promise<void> => {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const envelope = await apiRequest<IAdminLoginResponse>('/auth/admin/login', {
        method: 'POST',
        body: { email, password },
      });
      const payload = envelope.data;
      if (!payload?.accessToken || !payload.refreshToken || !payload.user) {
        setError('Unexpected response from server.');
        return;
      }
      if (payload.user.role !== 'admin') {
        setError('This console is only for school administrators.');
        return;
      }
      setSession({
        accessToken: payload.accessToken,
        refreshToken: payload.refreshToken,
        user: mapSessionUser(payload.user),
      });
      router.replace('/users');
    } catch (err: unknown) {
      const message = err instanceof ApiCallError ? err.message : 'Login failed.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24 }}>
      <div className="panel" style={{ width: '100%', maxWidth: 400 }}>
        <h1 className="page-title" style={{ fontSize: '1.25rem' }}>
          Admin sign in
        </h1>
        <p className="meta" style={{ marginBottom: '1rem' }}>
          Use your school admin account (same flow as <code>/auth/admin/login</code>).
        </p>
        {error && <div className="error-banner">{error}</div>}
        <form onSubmit={(event) => void onSubmit(event)}>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}
