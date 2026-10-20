import type { IAdminSessionUser } from '@/stores/admin-auth.store';

/**
 * Superadmin has every module; staff admins only what their role's permission slugs
 * grant (by default tuition/teacher inquiries and classes — no users, roles or audit log).
 */
export function canAccessAdminPermission(user: IAdminSessionUser | null, permission: string): boolean {
  if (!user) {
    return false;
  }
  if (user.role === 'superadmin') {
    return true;
  }
  return user.permissions.includes(permission);
}
