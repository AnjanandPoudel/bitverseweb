'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import { adminRoute } from '@/lib/routes';
import { useAdminAuthStore } from '@/stores/admin-auth.store';
import { ProfileMenu } from '@/components/ProfileMenu';

interface IAdminShellProps {
  children: ReactNode;
}

export function AdminShell(props: IAdminShellProps): React.ReactElement | null {
  const { children } = props;
  const router = useRouter();
  const pathname = usePathname();
  const accessToken = useAdminAuthStore((state) => state.accessToken);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (useAdminAuthStore.persist.hasHydrated()) {
      setHydrated(true);
    }
    const unsub = useAdminAuthStore.persist.onFinishHydration(() => {
      setHydrated(true);
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!hydrated) {
      return;
    }
    if (!accessToken) {
      router.replace(adminRoute('/login'));
    }
  }, [accessToken, hydrated, router]);

  if (!hydrated) {
    return (
      <div style={{ padding: '2rem', color: 'var(--muted)' }} aria-busy="true">
        Loading session…
      </div>
    );
  }

  if (!accessToken) {
    return null;
  }

  const navLink = (href: string, label: string): React.ReactElement => {
    const active = pathname === href || pathname.startsWith(`${href}/`);
    return (
      <Link
        href={href}
        style={{
          padding: '0.5rem 0.65rem',
          borderRadius: 8,
          color: 'var(--text)',
          fontSize: '0.9rem',
          background: active ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
          border: active ? '1px solid var(--accent)' : '1px solid transparent',
          textDecoration: 'none',
        }}
      >
        {label}
      </Link>
    );
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <aside
        style={{
          width: 220,
          flexShrink: 0,
          borderRight: '1px solid var(--border)',
          padding: '1rem',
          background: 'var(--surface)',
        }}
      >
        <div style={{ fontWeight: 700, marginBottom: '1rem', fontSize: '0.95rem' }}>Administration</div>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {navLink(adminRoute('/users'), 'Users')}
          {navLink(adminRoute('/roles'), 'Roles')}
        </nav>
      </aside>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <header
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: 12,
            padding: '0.65rem 1.25rem',
            borderBottom: '1px solid var(--border)',
            background: 'var(--surface)',
          }}
        >
          <ProfileMenu />
        </header>
        <div style={{ padding: '1.25rem', flex: 1 }}>{children}</div>
      </div>
    </div>
  );
}
