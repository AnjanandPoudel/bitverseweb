import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface IAdminSessionUser {
  id: string;
  name: string;
  email: string;
  role: string;
  permissions: string[];
}

interface IAdminAuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: IAdminSessionUser | null;
  setSession: (payload: {
    accessToken: string;
    refreshToken: string;
    user: IAdminSessionUser;
  }) => void;
  clearSession: () => void;
}

export const useAdminAuthStore = create<IAdminAuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      setSession: (payload) =>
        set({
          accessToken: payload.accessToken,
          refreshToken: payload.refreshToken,
          user: payload.user,
        }),
      clearSession: () => set({ accessToken: null, refreshToken: null, user: null }),
    }),
    { name: 'bitverse-admin-session' },
  ),
);
