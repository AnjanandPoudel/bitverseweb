import { ApiCallError, apiRequest } from '@/lib/api';

export const TEACHER_SUBJECT_OPTIONS = ['English', 'Nepali', 'Math', 'Science', 'Other'] as const;

export const TEACHER_DAY_OPTIONS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const;

export const TEACHER_GENDER_OPTIONS = ['male', 'female', 'other', 'prefer_not_to_say'] as const;

export type TTeacherSubjectOption = (typeof TEACHER_SUBJECT_OPTIONS)[number];
export type TTeacherDayOption = (typeof TEACHER_DAY_OPTIONS)[number];
export type TTeacherGenderOption = (typeof TEACHER_GENDER_OPTIONS)[number];

export interface ITeacherInquirySubmitBody {
  fullName: string;
  phone: string;
  teacherEmail: string;
  password: string;
  subjects: TTeacherSubjectOption[];
  subjectsOther?: string;
  preferredTime?: string;
  ianaTimeZone: string;
  countrySlug: string;
  availableDays: TTeacherDayOption[];
  gender?: TTeacherGenderOption;
  city?: string;
  education?: string;
  teachingExperience?: string;
  yearsOfExperience?: string;
  languagesSpoken?: string;
  messengerNumber?: string;
  dateOfBirth?: string;
  portfolioUrl?: string;
}

export interface ITeacherInquirySubmitResponse {
  id: string;
}

export async function submitTeacherInquiry(
  body: ITeacherInquirySubmitBody,
): Promise<ITeacherInquirySubmitResponse> {
  const envelope = await apiRequest<ITeacherInquirySubmitResponse>('/teacher-inquiries', {
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
