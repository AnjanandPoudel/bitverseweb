import { ApiCallError, apiRequest } from '@/lib/api';

export const TUITION_SUBJECT_OPTIONS = ['English', 'Nepali', 'Math', 'Science', 'Other'] as const;

export const TUITION_DAY_OPTIONS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const;

export type TTuitionSubjectOption = (typeof TUITION_SUBJECT_OPTIONS)[number];
export type TTuitionDayOption = (typeof TUITION_DAY_OPTIONS)[number];

export interface ITuitionInquirySubmitBody {
  parentFullName: string;
  studentFullNames: string;
  studentAge: string;
  studentClass: string;
  subjects: TTuitionSubjectOption[];
  subjectsOther?: string;
  /** ISO 8601 UTC instant for the preferred first session. */
  preferredStartAt: string;
  /** IANA time zone matching the country page (wall clock for date + time). */
  ianaTimeZone: string;
  /** Lowercase slug from the country landing URL. */
  countrySlug: string;
  availableDays: TTuitionDayOption[];
  messengerNumber: string;
}

export interface ITuitionInquirySubmitResponse {
  id: string;
}

export async function submitTuitionInquiry(
  body: ITuitionInquirySubmitBody,
): Promise<ITuitionInquirySubmitResponse> {
  const envelope = await apiRequest<ITuitionInquirySubmitResponse>('/tuition-inquiries', {
    method: 'POST',
    body,
    skipErrorToast: true,
  });
  const data = envelope.data;
  if (!data?.id) {
    throw new ApiCallError('Unexpected response from server.', 500, envelope);
  }
  return data;
}
