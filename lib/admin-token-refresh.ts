import { getApiBaseUrl } from '@/lib/env';
import { mapAdminSessionUserFromApi, type IAdminUserApiShape } from '@/lib/map-admin-session-user';
import { useAdminAuthStore } from '@/stores/admin-auth.store';

interface IRefreshResponseData {
  accessToken: string;
  user: IAdminUserApiShape;
}

interface IRefreshEnvelope {
  success: boolean;
  message?: string;
  data?: IRefreshResponseData;
}

let refreshPromise: Promise<string | null> | null = null;

function isRefreshExemptPath(normalizedPath: string): boolean {
  return (
    normalizedPath.includes('/auth/refresh-token') ||
    normalizedPath.includes('/auth/logout') ||
    normalizedPath.includes('/auth/admin/login')
  );
}

async function performRefresh(): Promise<string | null> {
  const { refreshToken, clearSession } = useAdminAuthStore.getState();
  if (!refreshToken) {
    return null;
  }
  const base = getApiBaseUrl();
  const url = `${base}/api/v1/auth/refresh-token`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ refreshToken }),
  });
  let json: IRefreshEnvelope;
  try {
    json = (await response.json()) as IRefreshEnvelope;
  } catch {
    clearSession();
    return null;
  }
  const payload = json.data;
  if (!response.ok || json.success === false || !payload?.accessToken || !payload.user) {
    clearSession();
    return null;
  }
  const user = mapAdminSessionUserFromApi(payload.user);
  useAdminAuthStore.getState().setSession({
    accessToken: payload.accessToken,
    refreshToken,
    user,
  });
  return payload.accessToken;
}

/** Exchanges the persisted refresh token for a new access token and updates the admin session store. */
export async function refreshAdminAccessToken(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = performRefresh().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

export function shouldAttemptAdminTokenRefresh(
  status: number,
  hadBearerToken: boolean,
  normalizedPath: string,
  alreadyRetried: boolean,
): boolean {
  return status === 401 && hadBearerToken && !alreadyRetried && !isRefreshExemptPath(normalizedPath);
}
