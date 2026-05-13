'use client';

import { Toaster } from 'sonner';
import type { ReactElement } from 'react';

export function AppToaster(): ReactElement {
  return <Toaster richColors theme="dark" position="top-center" closeButton />;
}
