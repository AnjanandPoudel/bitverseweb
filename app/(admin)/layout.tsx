import { AdminShell } from '@/components/AdminShell';

export default function AdminSectionLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): React.ReactElement {
  return <AdminShell>{children}</AdminShell>;
}
