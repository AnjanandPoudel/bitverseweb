'use client';

import Link from 'next/link';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ApiCallError, apiRequest, type IListMeta } from '@/lib/api';
import { toastApiSuccess } from '@/lib/mutation-feedback';
import { adminRoute } from '@/lib/routes';
import {
  TUITION_INQUIRY_STATUSES,
  tuitionInquiryStatusLabel,
  type TuitionInquiryStatusValue,
} from '@/lib/tuition-inquiry-workflow';
import { FieldDiff } from '@/components/FieldDiff';
import { useAdminAuthStore } from '@/stores/admin-auth.store';

interface ITuitionInquiryDetail {
  _id?: string;
  parentFullName?: string;
  studentFullNames?: string;
  studentAge?: string;
  studentClass?: string;
  subjects?: string[];
  subjectsOther?: string;
  preferredStartAt?: string;
  ianaTimeZone?: string;
  countrySlug?: string;
  preferredTime?: string;
  actualTime?: string;
  availableDays?: string[];
  messengerNumber?: string;
  status?: string;
  adminNotes?: string;
  createdAt?: string;
  updatedAt?: string;
}

type AuditLogAction = 'create' | 'update' | 'delete';

interface IAuditLogActor {
  userId: string;
  email?: string;
  role?: string;
}

interface IAuditLogEntry {
  _id?: string;
  actor: IAuditLogActor;
  action: AuditLogAction;
  previousState: Record<string, unknown> | null;
  nextState: Record<string, unknown> | null;
  createdAt?: string;
}

interface IAuditListPayload {
  items: IAuditLogEntry[];
}

function formatDateTime(value: string | undefined): string {
  if (!value) {
    return '—';
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

function toDatetimeLocal(iso: string | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

const ACTION_COLORS: Record<AuditLogAction, string> = {
  create: '#22c55e',
  update: '#ca8a04',
  delete: '#ef4444',
};

export default function TuitionInquiryDetailPage(): React.ReactElement {
  const params = useParams<{ inquiryId: string }>();
  const inquiryId = typeof params.inquiryId === 'string' ? params.inquiryId : '';
  const router = useRouter();
  const accessToken = useAdminAuthStore((state) => state.accessToken);

  const [inquiry, setInquiry] = useState<ITuitionInquiryDetail | null>(null);
  const [status, setStatus] = useState<TuitionInquiryStatusValue>('new_request');
  const [adminNotes, setAdminNotes] = useState('');
  const [preferredTime, setPreferredTime] = useState('');
  const [actualTime, setActualTime] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [auditLogs, setAuditLogs] = useState<IAuditLogEntry[]>([]);
  const [auditMeta, setAuditMeta] = useState<IListMeta | null>(null);
  const [auditPage, setAuditPage] = useState(1);
  const [auditLoading, setAuditLoading] = useState(false);
  const [expandedAuditIds, setExpandedAuditIds] = useState<Set<string>>(new Set());

  const loadInquiry = useCallback(async (): Promise<void> => {
    if (!accessToken || !inquiryId) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const envelope = await apiRequest<ITuitionInquiryDetail>(`/tuition-inquiries/${encodeURIComponent(inquiryId)}`, {
        token: accessToken,
      });
      const data = envelope.data;
      if (!data) {
        setError('Inquiry not found.');
        setInquiry(null);
        return;
      }
      setInquiry(data);
      const nextStatus = TUITION_INQUIRY_STATUSES.find((s) => s === data.status) ?? 'new_request';
      setStatus(nextStatus);
      setAdminNotes(data.adminNotes ?? '');
      setPreferredTime(data.preferredTime ?? '');
      setActualTime(toDatetimeLocal(data.actualTime));
    } catch (err: unknown) {
      setError(err instanceof ApiCallError ? err.message : 'Failed to load inquiry.');
      setInquiry(null);
    } finally {
      setLoading(false);
    }
  }, [accessToken, inquiryId]);

  const loadAuditLogs = useCallback(async (): Promise<void> => {
    if (!accessToken || !inquiryId) return;
    setAuditLoading(true);
    try {
      const envelope = await apiRequest<IAuditListPayload>('/audit-logs', {
        token: accessToken,
        query: { resourceType: 'TuitionInquiry', resourceId: inquiryId, page: auditPage, limit: 10 },
      });
      setAuditLogs(envelope.data?.items ?? []);
      setAuditMeta(envelope.meta ?? null);
    } catch {
      // audit history is best-effort; don't block the main page
    } finally {
      setAuditLoading(false);
    }
  }, [accessToken, inquiryId, auditPage]);

  useEffect(() => {
    void loadInquiry();
  }, [loadInquiry]);

  useEffect(() => {
    void loadAuditLogs();
  }, [loadAuditLogs]);

  const onSave = async (event: FormEvent): Promise<void> => {
    event.preventDefault();
    if (!accessToken || !inquiryId) {
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const body: Record<string, unknown> = { status, adminNotes, preferredTime: preferredTime || null };
      if (actualTime) {
        body.actualTime = new Date(actualTime).toISOString();
      } else {
        body.actualTime = null;
      }
      const envelope = await apiRequest<ITuitionInquiryDetail>(`/tuition-inquiries/${encodeURIComponent(inquiryId)}`, {
        method: 'PATCH',
        token: accessToken,
        body,
      });
      toastApiSuccess(envelope, 'Tuition inquiry updated.');
      await loadInquiry();
      void loadAuditLogs();
    } catch (err: unknown) {
      setError(err instanceof ApiCallError ? err.message : 'Save failed.');
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (): Promise<void> => {
    if (!accessToken || !inquiryId) {
      return;
    }
    if (!window.confirm('Delete this inquiry permanently? This cannot be undone.')) {
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const envelope = await apiRequest<unknown>(`/tuition-inquiries/${encodeURIComponent(inquiryId)}`, {
        method: 'DELETE',
        token: accessToken,
      });
      toastApiSuccess(envelope, 'Tuition inquiry deleted.');
      router.push(adminRoute('/tuition-inquiries'));
    } catch (err: unknown) {
      setError(err instanceof ApiCallError ? err.message : 'Delete failed.');
    } finally {
      setSaving(false);
    }
  };

  const toggleAuditExpand = (id: string): void => {
    setExpandedAuditIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const countChanges = (entry: IAuditLogEntry): number => {
    if (!entry.previousState && !entry.nextState) return 0;
    if (!entry.previousState) return Object.keys(entry.nextState ?? {}).length;
    if (!entry.nextState) return Object.keys(entry.previousState).length;
    const allKeys = new Set([...Object.keys(entry.previousState), ...Object.keys(entry.nextState)]);
    let n = 0;
    for (const key of allKeys) {
      if (key === '__v' || key === 'updatedAt') continue;
      if (JSON.stringify(entry.previousState[key]) !== JSON.stringify(entry.nextState[key])) n++;
    }
    return n;
  };

  return (
    <div>
      <h1 className="page-title">Tuition inquiry</h1>
      <p className="meta" style={{ marginBottom: '1rem' }}>
        <Link href={adminRoute('/tuition-inquiries')}>← Back to list</Link>
        {inquiry?._id ? (
          <>
            {' · '}
            <span className="meta">ID: {inquiry._id}</span>
          </>
        ) : null}
      </p>
      {error && <div className="error-banner">{error}</div>}
      {loading && !inquiry ? <p className="meta">Loading…</p> : null}
      {inquiry ? (
        <>
          <div className="panel" style={{ marginBottom: '1rem' }}>
            <h2 className="meta" style={{ marginTop: 0, fontSize: '0.95rem', fontWeight: 600 }}>
              Submitted information
            </h2>
            <dl style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: '0.5rem 1rem', margin: 0 }}>
              <dt className="meta">Parent</dt>
              <dd style={{ margin: 0 }}>{inquiry.parentFullName}</dd>
              <dt className="meta">Students</dt>
              <dd style={{ margin: 0 }}>{inquiry.studentFullNames}</dd>
              <dt className="meta">Age</dt>
              <dd style={{ margin: 0 }}>{inquiry.studentAge}</dd>
              <dt className="meta">Class</dt>
              <dd style={{ margin: 0 }}>{inquiry.studentClass}</dd>
              <dt className="meta">Subjects</dt>
              <dd style={{ margin: 0 }}>{(inquiry.subjects ?? []).join(', ') || '—'}</dd>
              {inquiry.subjectsOther ? (
                <>
                  <dt className="meta">Other subjects</dt>
                  <dd style={{ margin: 0 }}>{inquiry.subjectsOther}</dd>
                </>
              ) : null}
              <dt className="meta">Preferred start</dt>
              <dd style={{ margin: 0 }}>{formatDateTime(inquiry.preferredStartAt)}</dd>
              <dt className="meta">Time zone</dt>
              <dd style={{ margin: 0 }}>{inquiry.ianaTimeZone}</dd>
              <dt className="meta">Country</dt>
              <dd style={{ margin: 0 }}>{inquiry.countrySlug}</dd>
              <dt className="meta">Preferred time</dt>
              <dd style={{ margin: 0 }}>{inquiry.preferredTime || '—'}</dd>
              <dt className="meta">Actual time</dt>
              <dd style={{ margin: 0 }}>
                {inquiry.actualTime ? (
                  <strong style={{ color: 'var(--accent)' }}>{formatDateTime(inquiry.actualTime)}</strong>
                ) : (
                  <span style={{ color: 'var(--muted)' }}>Not set yet</span>
                )}
              </dd>
              <dt className="meta">Available days</dt>
              <dd style={{ margin: 0 }}>{(inquiry.availableDays ?? []).join(', ') || '—'}</dd>
              <dt className="meta">Messenger</dt>
              <dd style={{ margin: 0 }}>{inquiry.messengerNumber}</dd>
              <dt className="meta">Submitted at</dt>
              <dd style={{ margin: 0 }}>{formatDateTime(inquiry.createdAt)}</dd>
              <dt className="meta">Updated at</dt>
              <dd style={{ margin: 0 }}>{formatDateTime(inquiry.updatedAt)}</dd>
            </dl>
          </div>

          <form className="panel" style={{ maxWidth: 600, marginBottom: '1rem' }} onSubmit={(event) => void onSave(event)}>
            <h2 className="meta" style={{ marginTop: 0, fontSize: '0.95rem', fontWeight: 600 }}>
              Staff workflow
            </h2>
            <p className="meta" style={{ marginTop: 0 }}>
              Update the pipeline so other admins see where this family is in your process (review → contact →
              negotiate → finalize).
            </p>
            <div className="field">
              <label htmlFor="inq-status">Status</label>
              <select id="inq-status" value={status} onChange={(event) => setStatus(event.target.value as TuitionInquiryStatusValue)}>
                {TUITION_INQUIRY_STATUSES.map((value) => (
                  <option key={value} value={value}>
                    {tuitionInquiryStatusLabel(value)}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="inq-preferred-time">Preferred time</label>
              <input
                id="inq-preferred-time"
                value={preferredTime}
                onChange={(e) => setPreferredTime(e.target.value)}
                placeholder='e.g. Evening, Flexible, Weekends'
                maxLength={300}
              />
            </div>
            <div className="field">
              <label htmlFor="inq-actual-time">Actual time (confirmed by admin)</label>
              <input
                id="inq-actual-time"
                type="datetime-local"
                value={actualTime}
                onChange={(e) => setActualTime(e.target.value)}
              />
              <p className="meta" style={{ margin: '4px 0 0', fontSize: '0.78rem' }}>
                Set this once a session time is confirmed with the family.
              </p>
            </div>
            <div className="field">
              <label htmlFor="inq-notes">Internal notes</label>
              <textarea
                id="inq-notes"
                value={adminNotes}
                onChange={(event) => setAdminNotes(event.target.value)}
                rows={5}
                placeholder="Handoff context for teammates (not shown to parents)."
                maxLength={4000}
              />
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Saving…' : 'Save changes'}
              </button>
              <button type="button" className="btn" disabled={saving} onClick={() => void onDelete()}>
                Delete inquiry
              </button>
            </div>
          </form>

          {/* Inquiry history */}
          <div className="panel" style={{ marginBottom: '1rem' }}>
            <h2 className="meta" style={{ marginTop: 0, fontSize: '0.95rem', fontWeight: 600 }}>
              Change history
            </h2>
            {auditLoading && auditLogs.length === 0 ? (
              <p className="meta">Loading history…</p>
            ) : auditLogs.length === 0 ? (
              <p className="meta">No change history recorded yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {auditLogs.map((entry) => {
                  const id = entry._id ?? `${entry.createdAt}`;
                  const isExpanded = expandedAuditIds.has(id);
                  const diffCount = countChanges(entry);
                  const isMinimal = diffCount <= 1;
                  const actorLabel = entry.actor.email ?? entry.actor.userId;

                  return (
                    <div
                      key={id}
                      style={{
                        border: '1px solid var(--border)',
                        borderRadius: 8,
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          padding: '8px 12px',
                          background: 'var(--surface)',
                          cursor: isMinimal ? 'default' : 'pointer',
                          flexWrap: 'wrap',
                        }}
                        onClick={() => { if (!isMinimal) toggleAuditExpand(id); }}
                        role={isMinimal ? undefined : 'button'}
                        tabIndex={isMinimal ? undefined : 0}
                        onKeyDown={(e) => { if (!isMinimal && (e.key === 'Enter' || e.key === ' ')) toggleAuditExpand(id); }}
                      >
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '2px 8px',
                            borderRadius: 4,
                            background: `${ACTION_COLORS[entry.action]}22`,
                            color: ACTION_COLORS[entry.action],
                            fontWeight: 700,
                            fontSize: '0.72rem',
                            textTransform: 'uppercase',
                            letterSpacing: '0.04em',
                          }}
                        >
                          {entry.action}
                        </span>
                        <span style={{ fontSize: '0.82rem', fontWeight: 500 }}>{actorLabel}</span>
                        {entry.actor.role ? (
                          <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>({entry.actor.role})</span>
                        ) : null}
                        <span style={{ fontSize: '0.78rem', color: 'var(--muted)', marginLeft: 'auto' }}>
                          {formatDateTime(entry.createdAt)}
                        </span>
                        {!isMinimal ? (
                          <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
                            {isExpanded ? '▲' : `▼ ${diffCount} changes`}
                          </span>
                        ) : null}
                      </div>
                      {(isMinimal || isExpanded) && diffCount > 0 ? (
                        <div style={{ padding: '8px 12px', borderTop: '1px solid var(--border)' }}>
                          <FieldDiff
                            previousState={entry.previousState}
                            nextState={entry.nextState}
                            alwaysExpanded
                          />
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            )}
            {(auditMeta?.totalPages ?? 1) > 1 ? (
              <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  className="btn"
                  disabled={auditPage <= 1 || auditLoading}
                  onClick={() => setAuditPage((p) => p - 1)}
                >
                  ← Prev
                </button>
                <span className="meta" style={{ alignSelf: 'center' }}>
                  Page {auditPage} / {auditMeta?.totalPages ?? 1}
                </span>
                <button
                  type="button"
                  className="btn"
                  disabled={auditPage >= (auditMeta?.totalPages ?? 1) || auditLoading}
                  onClick={() => setAuditPage((p) => p + 1)}
                >
                  Next →
                </button>
              </div>
            ) : null}
          </div>
        </>
      ) : null}
    </div>
  );
}
