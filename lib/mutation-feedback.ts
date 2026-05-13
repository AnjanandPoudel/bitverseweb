import { toast } from 'sonner';

import type { IApiSuccessEnvelope } from '@/lib/api';

export function toastApiSuccess<T>(envelope: IApiSuccessEnvelope<T>, fallbackMessage: string): void {
  const raw = envelope.message;
  const message = typeof raw === 'string' && raw.trim().length > 0 ? raw.trim() : fallbackMessage;
  toast.success(message);
}
