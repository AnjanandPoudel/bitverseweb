'use client';

import { useRouter } from 'next/navigation';
import { useState, type ReactElement } from 'react';
import { apiRequest } from '@/lib/api';
import { useAdminAuthStore } from '@/stores/admin-auth.store';

export function ProfileMenu(): ReactElement {
  const router = useRouter();
  const user = useAdminAuthStore((state) => state.user);
  const accessToken = useAdminAuthStore((state) => state.accessToken);
  const refreshToken = useAdminAuthStore((state) => state.refreshToken);
  const clearSession = useAdminAuthStore((state) => state.clearSession);
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const logout = async (): Promise<void> => {
    if (!refreshToken) {
      clearSession();
      router.replace('/login');
      return;
    }
    setLoggingOut(true);
    try {
      await apiRequest<unknown>('/auth/logout', {
        method: 'POST',
        body: { refreshToken },
        token: accessToken,
        skipErrorToast: true,
      });
    } catch {
      // still clear local session
    } finally {
      clearSession();
      setLoggingOut(false);
      router.replace('/login');
    }
  };

  if (!user) {
    return <span className="meta">Signed in</span>;
  }

  return (
    <div style={{ position: 'relative' }}>
      <button
        type="button"
        className="btn"
        onClick={() => setOpen((previous) => !previous)}
        aria-expanded={open}
        aria-haspopup="true"
      >
        {user.name}
      </button>
      {open && (
        <div
          className="panel"
          style={{
            position: 'absolute',
            right: 0,
            top: '110%',
            minWidth: 260,
            zIndex: 20,
            boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
          }}
        >
          <div style={{ fontSize: '0.85rem', marginBottom: 6 }}>
            <strong>{user.name}</strong>
          </div>
          <div className="meta" style={{ marginBottom: 4 }}>
            {user.email}
          </div>
          <div className="meta" style={{ marginBottom: 12 }}>
            Role: {user.role}
          </div>
          <button type="button" className="btn btn-primary" disabled={loggingOut} onClick={() => void logout()}>
            {loggingOut ? 'Signing out…' : 'Logout'}
          </button>
        </div>
      )}
    </div>
  );
}
