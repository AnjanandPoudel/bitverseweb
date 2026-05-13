export function formatRoleLabel(roleId: unknown): string {
  if (roleId && typeof roleId === 'object' && roleId !== null && 'name' in roleId) {
    return String((roleId as { name?: string }).name ?? '—');
  }
  return '—';
}

export function userDocumentId(user: { _id?: unknown }): string {
  if (user._id === undefined || user._id === null) {
    return '';
  }
  if (typeof user._id === 'string') {
    return user._id;
  }
  if (typeof user._id === 'object' && user._id !== null && 'toString' in user._id) {
    return String(user._id);
  }
  return String(user._id);
}

export function roleObjectId(roleId: unknown): string {
  if (typeof roleId === 'string') {
    return roleId;
  }
  if (roleId && typeof roleId === 'object' && roleId !== null && '_id' in roleId) {
    return String((roleId as { _id: unknown })._id);
  }
  return '';
}
