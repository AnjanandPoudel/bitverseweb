'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { PaginationBar } from '@/components/PaginationBar';
import { canAccessAdminPermission } from '@/lib/admin-access';
import { ApiCallError, apiRequest, type IListMeta } from '@/lib/api';
import {
  ASSIGNMENTS_VIEW_PERMISSION,
  formatHomeworkDate,
  stars,
  studentStatusLabel,
  type IAssignmentFile,
  type IAssignmentRecipientRow,
  type IAssignmentRow,
  type IAssignmentSubmissionRow,
  type IItemsPayload,
} from '@/lib/assignments';
import { adminRoute } from '@/lib/routes';
import { useAdminAuthStore } from '@/stores/admin-auth.store';

const LIST_PAGE_SIZE = 10;

interface IPaged<T> {
  items: T[];
  meta: IListMeta | null;
  loading: boolean;
  error: string | null;
  page: number;
  setPage: (page: number) => void;
}

/** One paginated list from the API, reloaded whenever its page or student filter changes. */
function usePagedList<T>(path: string | null, limit: number, studentId?: string): IPaged<T> {
  const accessToken = useAdminAuthStore((state) => state.accessToken);
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<T[]>([]);
  const [meta, setMeta] = useState<IListMeta | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!accessToken || !path) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const envelope = await apiRequest<IItemsPayload<T>>(path, {
        token: accessToken,
        query: { page, limit, studentId },
        skipErrorToast: true,
      });
      setItems(envelope.data?.items ?? []);
      setMeta(envelope.meta ?? null);
    } catch (err) {
      setError(err instanceof ApiCallError ? err.message : 'Failed to load.');
    } finally {
      setLoading(false);
    }
  }, [accessToken, limit, page, path, studentId]);

  useEffect(() => {
    void load();
  }, [load]);

  return { items, meta, loading, error, page, setPage };
}

const fileImageStyle: React.CSSProperties = {
  width: '100%',
  aspectRatio: '3 / 4',
  objectFit: 'contain',
  background: 'var(--bg)',
  borderRadius: 8,
  display: 'block',
};

const thumbStyle: React.CSSProperties = {
  width: 56,
  height: 72,
  objectFit: 'cover',
  borderRadius: 6,
  background: 'var(--bg)',
};

export default function AdminAssignmentDetailPage(): React.ReactElement {
  const params = useParams<{ assignmentId: string }>();
  const router = useRouter();
  const assignmentId = typeof params.assignmentId === 'string' ? params.assignmentId : '';
  const accessToken = useAdminAuthStore((state) => state.accessToken);
  const user = useAdminAuthStore((state) => state.user);
  const allowed = canAccessAdminPermission(user, ASSIGNMENTS_VIEW_PERMISSION);
  const [assignment, setAssignment] = useState<IAssignmentRow | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [studentFilter, setStudentFilter] = useState<{ id: string; name: string } | null>(null);

  const base = allowed && assignmentId ? `/assignments/${assignmentId}` : null;
  const students = usePagedList<IAssignmentRecipientRow>(base ? `${base}/students` : null, LIST_PAGE_SIZE);
  const submissions = usePagedList<IAssignmentSubmissionRow>(base ? `${base}/submissions` : null, LIST_PAGE_SIZE, studentFilter?.id);
  const { setPage: setSubmissionsPage } = submissions;

  useEffect(() => {
    if (!accessToken || !base) {
      return;
    }
    apiRequest<IAssignmentRow>(base, { token: accessToken, skipErrorToast: true })
      .then((envelope) => setAssignment(envelope.data ?? null))
      .catch((err: unknown) => setError(err instanceof ApiCallError ? err.message : 'Failed to load assignment.'));
  }, [accessToken, base]);

  const filterByStudent = useCallback(
    (student: { id: string; name: string } | null) => {
      setStudentFilter(student);
      setSubmissionsPage(1);
    },
    [setSubmissionsPage],
  );

  if (!allowed) {
    return (
      <div>
        <h1 className="page-title">Homework</h1>
        <div className="error-banner">You do not have permission to view homework.</div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="page-title">{assignment?.title ?? 'Homework'}</h1>
      <p className="meta" style={{ marginBottom: '1rem' }}>
        <button type="button" className="btn" onClick={() => router.back()}>
          ← Back
        </button>
      </p>
      {error ? <div className="error-banner">{error}</div> : null}

      {assignment ? (
        <div className="panel" style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.75rem 1.5rem' }}>
            <Info label="Teacher">
              {assignment.teacher ? (
                <Link href={adminRoute(`/users/${assignment.teacher.id}`)}>{assignment.teacher.name}</Link>
              ) : (
                '—'
              )}
            </Info>
            <Info label="Class">{assignment.className ?? '—'}</Info>
            <Info label="Subject">{assignment.subject || '—'}</Info>
            <Info label="Given">{formatHomeworkDate(assignment.assignedDate)}</Info>
            <Info label="Deadline">
              {formatHomeworkDate(assignment.deadline, true)}{' '}
              {assignment.isOverdue ? <span className="badge badge-off">Past due</span> : null}
            </Info>
            <Info label="Files">{assignment.attachments.length}</Info>
            <Info label="Students">{assignment.recipientCount}</Info>
            <Info label="Submissions">{assignment.submissionCount}</Info>
          </div>
          {assignment.description ? <p style={{ marginTop: '1rem', whiteSpace: 'pre-wrap' }}>{assignment.description}</p> : null}
        </div>
      ) : null}

      <div className="panel" style={{ marginBottom: '1rem' }}>
        <h2>Homework files</h2>
        <FileGrid files={assignment?.attachments ?? []} />
        {assignment && assignment.attachments.length === 0 ? <p className="meta">No files — instructions only.</p> : null}
      </div>

      <div className="admin-split" style={{ alignItems: 'stretch' }}>
        <div className="panel" style={{ flex: '1 1 320px' }}>
          <h2>Students</h2>
          {students.error ? <div className="error-banner">{students.error}</div> : null}
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Status</th>
                  <th>Sent</th>
                </tr>
              </thead>
              <tbody>
                {students.items.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="meta">{students.loading ? 'Loading…' : 'Nobody assigned.'}</td>
                  </tr>
                ) : (
                  students.items.map((r) => (
                    <tr key={r.student.id}>
                      <td>
                        <button
                          type="button"
                          className="btn"
                          style={{ padding: '0.2rem 0.5rem' }}
                          onClick={() => filterByStudent({ id: r.student.id, name: r.student.name })}
                          title="Show only this student's submissions"
                        >
                          {r.student.name || 'Student'}
                        </button>
                      </td>
                      <td>
                        <span className={`badge ${r.progress.status === 'pending' ? 'badge-off' : 'badge-ok'}`}>
                          {studentStatusLabel(r.progress.status)}
                        </span>
                        {r.progress.isLate ? <div className="meta">Late</div> : null}
                      </td>
                      <td>{r.progress.lastSubmittedAt ? formatHomeworkDate(r.progress.lastSubmittedAt, true) : '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <PaginationBar page={students.page} totalPages={students.meta?.totalPages ?? 1} disabled={students.loading} onPageChange={students.setPage} />
        </div>

        <div className="panel" style={{ flex: '2 1 480px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <h2 style={{ margin: 0 }}>Submissions{studentFilter ? ` · ${studentFilter.name}` : ''}</h2>
            {studentFilter ? (
              <button type="button" className="btn" onClick={() => filterByStudent(null)}>
                Show all
              </button>
            ) : null}
          </div>
          {submissions.error ? <div className="error-banner">{submissions.error}</div> : null}
          <div className="admin-table-wrap" style={{ marginTop: 8 }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Files</th>
                  <th>Student</th>
                  <th>Sent</th>
                  <th>Review</th>
                </tr>
              </thead>
              <tbody>
                {submissions.items.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="meta">{submissions.loading ? 'Loading…' : 'No submissions yet.'}</td>
                  </tr>
                ) : (
                  submissions.items.map((s) => (
                    <tr key={s.id}>
                      <td>
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', maxWidth: 200 }}>
                          {s.files.map((file) => (
                            <a key={file.fileId} href={file.url} target="_blank" rel="noreferrer" title={file.name}>
                              {file.category === 'image' ? (
                                /* eslint-disable-next-line @next/next/no-img-element -- signed storage URL */
                                <img src={file.url} alt="Answer photo" style={thumbStyle} />
                              ) : (
                                <span className="badge">PDF</span>
                              )}
                            </a>
                          ))}
                        </div>
                        {s.note ? <div className="meta" style={{ marginTop: 4 }}>{s.note}</div> : null}
                      </td>
                      <td>{s.student?.name ?? '—'}</td>
                      <td>
                        {formatHomeworkDate(s.lastSubmittedAt, true)}
                        {s.revisionCount > 0 ? <div className="meta">Edited {s.revisionCount}×</div> : null}
                        {s.isLate ? <div><span className="badge badge-off">Late</span></div> : null}
                      </td>
                      <td style={{ maxWidth: 260 }}>
                        <span className={`badge ${s.status === 'reviewed' ? 'badge-ok' : 'badge-off'}`}>{studentStatusLabel(s.status)}</span>
                        {s.feedback?.rating ? <div style={{ color: '#f59e0b', whiteSpace: 'nowrap' }}>{stars(s.feedback.rating)}</div> : null}
                        {s.feedback?.comment ? <div style={{ whiteSpace: 'pre-wrap' }}>{s.feedback.comment}</div> : null}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <PaginationBar
            page={submissions.page}
            totalPages={submissions.meta?.totalPages ?? 1}
            disabled={submissions.loading}
            onPageChange={submissions.setPage}
          />
        </div>
      </div>
    </div>
  );
}

/** Homework photos as a grid (click to open full size) and PDFs as links. */
function FileGrid({ files }: { files: IAssignmentFile[] }): React.ReactElement {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
      {files.map((file) => (
        <figure key={file.fileId} style={{ margin: 0 }}>
          <a href={file.url} target="_blank" rel="noreferrer">
            {file.category === 'image' ? (
              /* eslint-disable-next-line @next/next/no-img-element -- signed storage URL */
              <img src={file.url} alt={file.name} style={fileImageStyle} />
            ) : (
              <div style={{ ...fileImageStyle, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>PDF</div>
            )}
          </a>
          <figcaption className="meta" style={{ marginTop: 6 }}>{file.name}</figcaption>
        </figure>
      ))}
    </div>
  );
}

function Info({ label, children }: { label: string; children: React.ReactNode }): React.ReactElement {
  return (
    <div>
      <div className="meta" style={{ marginBottom: 2 }}>{label}</div>
      <div style={{ fontWeight: 600 }}>{children}</div>
    </div>
  );
}
