/** Shapes of the backend assignment DTOs the admin console reads (src/modules/assignment/assignment.types.ts). */

export type AssignmentStudentStatus = 'pending' | 'submitted' | 'redo_requested' | 'reviewed';
export type AssignmentSubmissionStatus = 'submitted' | 'redo_requested' | 'reviewed';

/** A homework photo or PDF with a signed URL. */
export interface IAssignmentFile {
  fileId: string;
  category: 'image' | 'document';
  mimeType: string;
  name: string;
  size: number;
  width: number | null;
  height: number | null;
  url: string;
}

export interface IAssignmentUser {
  id: string;
  name: string;
  photo: string;
}

export interface IAssignmentProgress {
  status: AssignmentStudentStatus;
  submissionId: string | null;
  isLate: boolean;
  lastSubmittedAt: string | null;
  assignedAt: string;
}

export interface IAssignmentRow {
  id: string;
  title: string;
  description: string;
  subject: string;
  className: string | null;
  teacher: IAssignmentUser | null;
  assignedDate: string;
  deadline: string;
  isOverdue: boolean;
  attachments: IAssignmentFile[];
  recipientCount: number;
  submissionCount: number;
  progress: IAssignmentProgress | null;
  createdAt: string;
}

export interface IAssignmentFeedbackRow {
  id: string;
  submissionId: string;
  assignmentId: string;
  assignmentTitle: string;
  outcome: 'reviewed' | 'redo';
  rating: number | null;
  comment: string;
  teacher: IAssignmentUser | null;
  student: IAssignmentUser | null;
  thumbnail: IAssignmentFile | null;
  updatedAt: string;
}

export interface IAssignmentSubmissionRow {
  id: string;
  assignmentId: string;
  assignmentTitle: string;
  student: IAssignmentUser | null;
  teacher: IAssignmentUser | null;
  files: IAssignmentFile[];
  note: string;
  status: AssignmentSubmissionStatus;
  isLate: boolean;
  revisionCount: number;
  submittedAt: string;
  lastSubmittedAt: string;
  feedback: IAssignmentFeedbackRow | null;
  createdAt: string;
}

export interface IAssignmentRecipientRow {
  student: IAssignmentUser;
  progress: IAssignmentProgress;
}

export interface IItemsPayload<T> {
  items: T[];
}

export const ASSIGNMENTS_VIEW_PERMISSION = 'assignments.view';

export function formatHomeworkDate(iso: string | null | undefined, withTime = false): string {
  if (!iso) {
    return '—';
  }
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }
  return date.toLocaleString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    ...(withTime ? { hour: 'numeric', minute: '2-digit' } : {}),
  });
}

export function stars(rating: number | null): string {
  if (!rating) {
    return '—';
  }
  const clamped = Math.max(0, Math.min(5, Math.round(rating)));
  return `${'★'.repeat(clamped)}${'☆'.repeat(5 - clamped)}`;
}

const STUDENT_STATUS_LABELS: Record<AssignmentStudentStatus, string> = {
  pending: 'Not submitted',
  submitted: 'Submitted',
  redo_requested: 'Redo requested',
  reviewed: 'Reviewed',
};

export function studentStatusLabel(status: AssignmentStudentStatus): string {
  return STUDENT_STATUS_LABELS[status] ?? status;
}

/** First image among the files, for table thumbnails. */
export function firstImageUrl(files: IAssignmentFile[] | undefined): string | undefined {
  return files?.find((file) => file.category === 'image')?.url;
}
