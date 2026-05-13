import type { IAdminSessionUser } from '@/stores/admin-auth.store';

export interface IAdminUserApiShape {
  id: unknown;
  name: string;
  email: string;
  role: string;
  permissions: string[];
}

export function mapAdminSessionUserFromApi(raw: IAdminUserApiShape): IAdminSessionUser {
  let id = '';
  if (typeof raw.id === 'string') {
    id = raw.id;
  } else if (raw.id && typeof raw.id === 'object' && '_id' in (raw.id as object)) {
    id = String((raw.id as { _id: unknown })._id);
  }
  return {
    id,
    name: raw.name,
    email: raw.email,
    role: raw.role,
    permissions: Array.isArray(raw.permissions) ? raw.permissions : [],
  };
}
