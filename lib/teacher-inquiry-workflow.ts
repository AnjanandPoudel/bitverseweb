export type TeacherInquiryStatusValue =
  | 'new_request'
  | 'internal_review'
  | 'contacting_candidate'
  | 'interview_scheduled'
  | 'interview_completed'
  | 'profile_review'
  | 'finalized'
  | 'closed_without_deal';

export const TEACHER_INQUIRY_STATUSES: readonly TeacherInquiryStatusValue[] = [
  'new_request',
  'internal_review',
  'contacting_candidate',
  'interview_scheduled',
  'interview_completed',
  'profile_review',
  'finalized',
  'closed_without_deal',
] as const;

export type GenderValue = 'male' | 'female' | 'other' | 'prefer_not_to_say';

export const GENDER_VALUES: readonly GenderValue[] = [
  'male',
  'female',
  'other',
  'prefer_not_to_say',
] as const;

const STATUS_LABELS: Record<TeacherInquiryStatusValue, string> = {
  new_request: 'New request',
  internal_review: 'Internal review',
  contacting_candidate: 'Contacting candidate',
  interview_scheduled: 'Interview scheduled',
  interview_completed: 'Interview completed',
  profile_review: 'Profile review',
  finalized: 'Finalized',
  closed_without_deal: 'Closed (no deal)',
};

const GENDER_LABELS: Record<GenderValue, string> = {
  male: 'Male',
  female: 'Female',
  other: 'Other',
  prefer_not_to_say: 'Prefer not to say',
};

export function teacherInquiryStatusLabel(status: string): string {
  if (status in STATUS_LABELS) {
    return STATUS_LABELS[status as TeacherInquiryStatusValue];
  }
  return status;
}

export function genderLabel(gender: string): string {
  if (gender in GENDER_LABELS) {
    return GENDER_LABELS[gender as GenderValue];
  }
  return gender;
}
