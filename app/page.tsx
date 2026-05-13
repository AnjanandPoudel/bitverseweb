'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAdminAuthStore } from '@/stores/admin-auth.store';

export default function RootRedirectPage(): React.ReactElement {
  const router = useRouter();
  const accessToken = useAdminAuthStore((state) => state.accessToken);
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
    if (!hydrated) {
      return;
    }
    router.replace(accessToken ? '/users' : '/login');
  }, [accessToken, hydrated, router]);

  return (
    <div style={{ padding: '2rem', color: 'var(--muted)' }} aria-busy="true">
      Redirecting…
    </div>
  );
}
