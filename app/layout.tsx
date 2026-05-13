import type { Metadata } from 'next';
import { AppToaster } from '@/components/AppToaster';
import './globals.css';

export const metadata: Metadata = {
  title: 'Bitverse Academy — Admin',
  description: 'School administration console',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): React.ReactElement {
  return (
    <html lang="en">
      <body>
        {children}
        <AppToaster />
      </body>
    </html>
  );
}
