'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { PaginationBar } from '@/components/PaginationBar';
import { canAccessAdminPermission } from '@/lib/admin-access';
import { ApiCallError, apiRequest, type IListMeta } from '@/lib/api';
import {
  ASSIGNMENTS_VIEW_PERMISSION,
  firstImageUrl,
  formatHomeworkDate,
  stars,
  studentStatusLabel,
  type IAssignmentFeedbackRow,
  type IAssignmentRow,
  type IAssignmentSubmissionRow,
  type IItemsPayload,
} from '@/lib/assignments';
import { adminRoute } from '@/lib/routes';
import { useAdminAuthStore } from '@/stores/admin-auth.store';

type Segment = 'assignments' | 'submissions' | 'feedback';

const SEGMENTS: Array<{ value: Segment; label: string }> = [
  { value: 'assignments', label: 'Assignments' },
  { value: 'submissions', label: 'Submissions' },
  { value: 'feedback', label: 'Feedback' },
];

const PAGE_SIZE = 10;

interface IAssignmentsPanelProps {
  userId: string;
  /** Teachers: homework they gave. Students: homework they received. Anyone else: nothing. */
  role: string;
}

const tabStyle = (selected: boolean): React.CSSProperties => ({
  padding: '0.35rem 0.8rem',
  borderRadius: 8,
  border: `1px solid ${selected ? 'var(--accent)' : 'var(--border)'}`,
  background: selected ? 'var(--accent)' : 'var(--surface)',
  color: selected ? '#fff' : 'var(--text)',
  fontSize: '0.85rem',
  fontWeight: 600,
  cursor: 'pointer',
});

const thumbStyle: React.CSSProperties = {
  width: 44,
  height: 56,
  objectFit: 'cover',
  borderRadius: 6,
  background: 'var(--bg)',
  display: 'block',
};

function Thumb({ url }: { url: string | undefined }): React.ReactElement {
  // eslint-disable-next-line @next/next/no-img-element -- short-lived signed storage URLs, not optimizable
  return url ? <img src={url} alt="" style={thumbStyle} /> : <div style={thumbStyle} />;
}

/** Paginated homework for one teacher or student on the user detail page. */
export function AssignmentsPanel({ userId, role }: IAssignmentsPanelProps): React.ReactElement | null {
  const accessToken = useAdminAuthStore((state) => state.accessToken);
  const user = useAdminAuthStore((state) => state.user);
  const [segment, setSegment] = useState<Segment>('assignments');
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<unknown[]>([]);
  const [meta, setMeta] = useState<IListMeta | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const normalizedRole = role.toLowerCase();
  const scopeKey = normalizedRole === 'teacher' ? 'teacherId' : normalizedRole === 'student' ? 'studentId' : null;
  const allowed = scopeKey !== null && canAccessAdminPermission(user, ASSIGNMENTS_VIEW_PERMISSION);

  const load = useCallback(async () => {
    if (!accessToken || !allowed || !scopeKey) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const path = segment === 'assignments' ? '/admin/assignments' : `/admin/assignments/${segment}`;
      const envelope = await apiRequest<IItemsPayload<unknown>>(path, {
        token: accessToken,
        query: { page, limit: PAGE_SIZE, [scopeKey]: userId },
        skipErrorToast: true,
      });
      setItems(envelope.data?.items ?? []);
      setMeta(envelope.meta ?? null);
    } catch (err) {
      setError(err instanceof ApiCallError ? err.message : 'Failed to load homework.');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [accessToken, allowed, page, scopeKey, segment, userId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!allowed) {
    return null;
  }

  const onSegment = (next: Segment): void => {
    setSegment(next);
    setPage(1);
    setItems([]);
    setMeta(null);
  };

  const isTeacher = normalizedRole === 'teacher';
  const emptyLabel = loading ? 'Loading…' : 'Nothing here yet.';

  return (
    <div className="panel" style={{ flex: '1 1 100%', minWidth: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <h2 style={{ margin: 0 }}>{isTeacher ? 'Homework given' : 'Homework received'}</h2>
        <div style={{ display: 'flex', gap: 6 }} role="tablist">
          {SEGMENTS.map((s) => (
            <button
              key={s.value}
              type="button"
              role="tab"
              aria-selected={segment === s.value}
              style={tabStyle(segment === s.value)}
              onClick={() => onSegment(s.value)}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>
      <p className="meta" style={{ marginTop: 6 }}>
        {meta ? `${meta.total} total · newest first` : ' '}
      </p>
      {error ? <div className="error-banner">{error}</div> : null}

      <div className="admin-table-wrap">
        {segment === 'assignments' ? (
          <table className="admin-table">
            <thead>
              <tr>
                <th />
                <th>Title</th>
                <th>{isTeacher ? 'Class' : 'Teacher'}</th>
                <th>Given</th>
                <th>Deadline</th>
                <th>Files</th>
                <th>{isTeacher ? 'Submitted' : 'Status'}</th>
              </tr>
            </thead>
            <tbody>
              {(items as IAssignmentRow[]).length === 0 ? (
                <tr>
                  <td colSpan={7} className="meta">{emptyLabel}</td>
                </tr>
              ) : (
                (items as IAssignmentRow[]).map((a) => (
                  <tr key={a.id}>
                    <td><Thumb url={firstImageUrl(a.attachments)} /></td>
                    <td>
                      <Link href={adminRoute(`/assignments/${a.id}`)}>{a.title}</Link>
                      {a.subject ? <div className="meta">{a.subject}</div> : null}
                    </td>
                    <td>{isTeacher ? a.className ?? '—' : a.teacher?.name ?? '—'}</td>
                    <td>{formatHomeworkDate(a.assignedDate)}</td>
                    <td>
                      {formatHomeworkDate(a.deadline, true)}
                      {a.isOverdue ? <div><span className="badge badge-off">Past due</span></div> : null}
                    </td>
                    <td>{a.attachments.length}</td>
                    <td>
                      {a.progress ? (
                        <>
                          <span className={`badge ${a.progress.status === 'pending' ? 'badge-off' : 'badge-ok'}`}>
                            {studentStatusLabel(a.progress.status)}
                          </span>
                          {a.progress.isLate ? <div className="meta">Late</div> : null}
                        </>
                      ) : (
                        `${a.submissionCount} · ${a.recipientCount} students`
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        ) : null}

        {segment === 'submissions' ? (
          <table className="admin-table">
            <thead>
              <tr>
                <th />
                <th>Assignment</th>
                <th>{isTeacher ? 'Student' : 'Teacher'}</th>
                <th>Submitted</th>
                <th>Files</th>
                <th>Review</th>
              </tr>
            </thead>
            <tbody>
              {(items as IAssignmentSubmissionRow[]).length === 0 ? (
                <tr>
                  <td colSpan={6} className="meta">{emptyLabel}</td>
                </tr>
              ) : (
                (items as IAssignmentSubmissionRow[]).map((s) => (
                  <tr key={s.id}>
                    <td><Thumb url={firstImageUrl(s.files)} /></td>
                    <td>
                      <Link href={adminRoute(`/assignments/${s.assignmentId}`)}>{s.assignmentTitle}</Link>
                      {s.revisionCount > 0 ? <div className="meta">Edited {s.revisionCount}×</div> : null}
                    </td>
                    <td>{isTeacher ? s.student?.name ?? '—' : s.teacher?.name ?? '—'}</td>
                    <td>
                      {formatHomeworkDate(s.lastSubmittedAt, true)}
                      {s.isLate ? <div><span className="badge badge-off">Late</span></div> : null}
                    </td>
                    <td>{s.files.length}</td>
                    <td>
                      <span className={`badge ${s.status === 'reviewed' ? 'badge-ok' : 'badge-off'}`} title={s.feedback?.comment}>
                        {studentStatusLabel(s.status)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        ) : null}

        {segment === 'feedback' ? (
          <table className="admin-table">
            <thead>
              <tr>
                <th />
                <th>Assignment</th>
                <th>{isTeacher ? 'Student' : 'Teacher'}</th>
                <th>Rating</th>
                <th>Comment</th>
                <th>Updated</th>
              </tr>
            </thead>
            <tbody>
              {(items as IAssignmentFeedbackRow[]).length === 0 ? (
                <tr>
                  <td colSpan={6} className="meta">{emptyLabel}</td>
                </tr>
              ) : (
                (items as IAssignmentFeedbackRow[]).map((f) => (
                  <tr key={f.id}>
                    <td><Thumb url={f.thumbnail?.category === 'image' ? f.thumbnail.url : undefined} /></td>
                    <td>
                      <Link href={adminRoute(`/assignments/${f.assignmentId}`)}>{f.assignmentTitle}</Link>
                      {f.outcome === 'redo' ? <div className="meta">Redo requested</div> : null}
                    </td>
                    <td>{isTeacher ? f.student?.name ?? '—' : f.teacher?.name ?? '—'}</td>
                    <td style={{ color: '#f59e0b', whiteSpace: 'nowrap' }}>{stars(f.rating)}</td>
                    <td style={{ maxWidth: 320, whiteSpace: 'pre-wrap' }}>{f.comment || '—'}</td>
                    <td>{formatHomeworkDate(f.updatedAt, true)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        ) : null}
      </div>

      <PaginationBar page={page} totalPages={meta?.totalPages ?? 1} disabled={loading} onPageChange={setPage} />
    </div>
  );
}
