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

interface INavItem {
  href: string;
  label: string;
}

const NAV_ITEMS: readonly INavItem[] = [
  { href: adminRoute('/users'), label: 'Users' },
  { href: adminRoute('/roles'), label: 'Roles' },
  { href: adminRoute('/tuition-inquiries'), label: 'Tuition inquiries' },
  { href: adminRoute('/teacher-inquiries'), label: 'Teacher inquiries' },
  { href: adminRoute('/audit-logs'), label: 'Audit Log' },
] as const;

export function AdminShell(props: IAdminShellProps): React.ReactElement | null {
  const { children } = props;
  const router = useRouter();
  const pathname = usePathname();
  const accessToken = useAdminAuthStore((state) => state.accessToken);
  const [hydrated, setHydrated] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

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

  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileNavOpen) {
      return;
    }
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        setMobileNavOpen(false);
      }
    };
    document.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
    };
  }, [mobileNavOpen]);

  if (!hydrated) {
    return (
      <div className="admin-shell-loading" aria-busy="true">
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
        className={`admin-nav-link${active ? ' admin-nav-link--active' : ''}`}
        onClick={() => setMobileNavOpen(false)}
      >
        {label}
      </Link>
    );
  };

  const navContent = (
    <>
      <div className="admin-sidebar-title">Administration</div>
      <nav className="admin-sidebar-nav" aria-label="Admin">
        {NAV_ITEMS.map((item) => navLink(item.href, item.label))}
      </nav>
    </>
  );

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar admin-sidebar--desktop">{navContent}</aside>

      {mobileNavOpen ? (
        <div className="admin-drawer-root">
          <button
            type="button"
            className="admin-drawer-backdrop"
            aria-label="Close navigation"
            onClick={() => setMobileNavOpen(false)}
          />
          <aside className="admin-sidebar admin-sidebar--drawer" id="admin-mobile-nav">
            <div className="admin-drawer-header">
              <span className="admin-sidebar-title">Administration</span>
              <button
                type="button"
                className="btn admin-drawer-close"
                aria-label="Close navigation"
                onClick={() => setMobileNavOpen(false)}
              >
                ✕
              </button>
            </div>
            <nav className="admin-sidebar-nav" aria-label="Admin">
              {NAV_ITEMS.map((item) => navLink(item.href, item.label))}
            </nav>
          </aside>
        </div>
      ) : null}

      <div className="admin-shell-main">
        <header className="admin-topbar">
          <button
            type="button"
            className="btn admin-menu-btn"
            aria-label="Open navigation"
            aria-expanded={mobileNavOpen}
            aria-controls="admin-mobile-nav"
            onClick={() => setMobileNavOpen(true)}
          >
            ☰ Menu
          </button>
          <div className="admin-topbar-spacer" />
          <ProfileMenu />
        </header>
        <div className="admin-content">{children}</div>
      </div>
    </div>
  );
}
