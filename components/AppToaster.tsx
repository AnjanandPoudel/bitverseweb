'use client';

import { Toaster } from 'sonner';
import type { ReactElement } from 'react';


export function AppToaster(): ReactElement {
  return (
    <Toaster
      theme="dark"
      position="bottom-right"
      richColors
      closeButton
      expand
      visibleToasts={4}
      gap={12}
      toastOptions={{
        duration: 4000,
        className: 'backdrop-blur-xl',
        style: {
          background: 'rgba(21, 32, 59, 0.92)', // Slate glass effect
          color: '#f8fafc',
          border: '1px solid rgba(148, 163, 184, 0.18)',
          borderRadius: '16px',
          padding: '14px 16px',
          fontSize: '14px',
          fontWeight: 500,
          fontFamily: 'Inter, sans-serif',
          letterSpacing: '-0.01em',
          boxShadow:
            '0 10px 30px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.04)',
        },
      }}
      icons={{
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️',
      }}
    />
  );
}