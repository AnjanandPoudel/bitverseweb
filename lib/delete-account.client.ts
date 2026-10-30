import { apiRequest } from '@/lib/api';

export interface IDeleteAccountBody {
  email: string;
  password: string;
}

export async function deleteAccount(body: IDeleteAccountBody): Promise<void> {
  await apiRequest<never>('/auth/delete-account', {
    method: 'POST',
    body,
    skipErrorToast: true,
  });
}
