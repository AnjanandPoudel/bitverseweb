import { redirect } from 'next/navigation';
import { adminRoute } from '@/lib/routes';

export default function AdminConsoleIndexPage(): never {
  redirect(adminRoute('/users'));
}
