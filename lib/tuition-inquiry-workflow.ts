export type TuitionInquiryStatusValue =
  | 'new_request'
  | 'internal_review'
  | 'contacting_parent'
  | 'negotiating'
  | 'finalized'
  | 'closed_without_deal';

export const TUITION_INQUIRY_STATUSES: readonly TuitionInquiryStatusValue[] = [
  'new_request',
  'internal_review',
  'contacting_parent',
  'negotiating',
  'finalized',
  'closed_without_deal',
] as const;

const STATUS_LABELS: Record<TuitionInquiryStatusValue, string> = {
  new_request: 'New request',
  internal_review: 'Internal review',
  contacting_parent: 'Contacting parent',
  negotiating: 'Negotiating',
  finalized: 'Finalized',
  closed_without_deal: 'Closed (no deal)',
};

export function tuitionInquiryStatusLabel(status: string): string {
  if (status in STATUS_LABELS) {
    return STATUS_LABELS[status as TuitionInquiryStatusValue];
  }
  return status;
}
