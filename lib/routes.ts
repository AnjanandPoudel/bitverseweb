/**
 * Obfuscated URL prefix for the school admin console (not a substitute for proper access control).
 */
export const ADMIN_CONSOLE_BASE_PATH = '/ydWUsImlhd/admin';

export function adminRoute(suffix: string): string {
  const normalized = suffix.startsWith('/') ? suffix : `/${suffix}`;
  return `${ADMIN_CONSOLE_BASE_PATH}${normalized}`;
}
