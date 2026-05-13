'use client';

import Link from 'next/link';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ApiCallError, apiRequest } from '@/lib/api';
import { adminRoute } from '@/lib/routes';
import {
  TUITION_INQUIRY_STATUSES,
  tuitionInquiryStatusLabel,
  type TuitionInquiryStatusValue,
} from '@/lib/tuition-inquiry-workflow';
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
  availableDays?: string[];
  messengerNumber?: string;
  status?: string;
  adminNotes?: string;
  createdAt?: string;
  updatedAt?: string;
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

export default function TuitionInquiryDetailPage(): React.ReactElement {
  const params = useParams<{ inquiryId: string }>();
  const inquiryId = typeof params.inquiryId === 'string' ? params.inquiryId : '';
  const router = useRouter();
  const accessToken = useAdminAuthStore((state) => state.accessToken);

  const [inquiry, setInquiry] = useState<ITuitionInquiryDetail | null>(null);
  const [status, setStatus] = useState<TuitionInquiryStatusValue>('new_request');
  const [adminNotes, setAdminNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

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
    } catch (err: unknown) {
      setError(err instanceof ApiCallError ? err.message : 'Failed to load inquiry.');
      setInquiry(null);
    } finally {
      setLoading(false);
    }
  }, [accessToken, inquiryId]);

  useEffect(() => {
    void loadInquiry();
  }, [loadInquiry]);

  const onSave = async (event: FormEvent): Promise<void> => {
    event.preventDefault();
    if (!accessToken || !inquiryId) {
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await apiRequest<ITuitionInquiryDetail>(`/tuition-inquiries/${encodeURIComponent(inquiryId)}`, {
        method: 'PATCH',
        token: accessToken,
        body: { status, adminNotes },
      });
      await loadInquiry();
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
      await apiRequest<unknown>(`/tuition-inquiries/${encodeURIComponent(inquiryId)}`, {
        method: 'DELETE',
        token: accessToken,
      });
      router.push(adminRoute('/tuition-inquiries'));
    } catch (err: unknown) {
      setError(err instanceof ApiCallError ? err.message : 'Delete failed.');
    } finally {
      setSaving(false);
    }
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
              {inquiry.preferredTime ? (
                <>
                  <dt className="meta">Preferred time (legacy)</dt>
                  <dd style={{ margin: 0 }}>{inquiry.preferredTime}</dd>
                </>
              ) : null}
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

          <form className="panel" style={{ maxWidth: 560 }} onSubmit={(event) => void onSave(event)}>
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
        </>
      ) : null}
    </div>
  );
}
