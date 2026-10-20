/** Shapes of the backend assignment DTOs the admin console reads (src/modules/assignment/assignment.types.ts). */

export type AssignmentStudentStatus = 'pending' | 'submitted' | 'reviewed';
export type AssignmentSubmissionMode = 'per_page' | 'per_assignment';

export interface IAssignmentImage {
  fileId: string;
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
  submissionCount: number;
  feedbackCount: number;
  answeredPageCount: number;
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
  submissionMode: AssignmentSubmissionMode;
  pageCount: number;
  recipientCount: number;
  submissionCount: number;
  coverImage: IAssignmentImage | null;
  progress: IAssignmentProgress | null;
  createdAt: string;
}

export interface IAssignmentPageRow {
  id: string;
  pageNumber: number;
  description: string;
  image: IAssignmentImage | null;
  submissionCount: number;
}

export interface IAssignmentFeedbackRow {
  id: string;
  submissionId: string;
  assignmentId: string;
  assignmentTitle: string;
  pageNumber: number | null;
  rating: number;
  comment: string;
  teacher: IAssignmentUser | null;
  student: IAssignmentUser | null;
  thumbnail: IAssignmentImage | null;
  updatedAt: string;
}

export interface IAssignmentSubmissionRow {
  id: string;
  assignmentId: string;
  assignmentTitle: string;
  pageNumber: number | null;
  student: IAssignmentUser | null;
  teacher: IAssignmentUser | null;
  images: IAssignmentImage[];
  note: string;
  isLate: boolean;
  hasFeedback: boolean;
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

export function stars(rating: number): string {
  const clamped = Math.max(0, Math.min(5, Math.round(rating)));
  return `${'★'.repeat(clamped)}${'☆'.repeat(5 - clamped)}`;
}

export function studentStatusLabel(status: AssignmentStudentStatus): string {
  if (status === 'reviewed') {
    return 'Reviewed';
  }
  return status === 'submitted' ? 'Submitted' : 'Not submitted';
}

export function submissionModeLabel(mode: AssignmentSubmissionMode): string {
  return mode === 'per_page' ? 'Per page' : 'Whole assignment';
}
