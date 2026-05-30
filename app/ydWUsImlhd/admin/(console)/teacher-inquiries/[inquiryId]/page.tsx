'use client';

import Link from 'next/link';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ApiCallError, apiRequest } from '@/lib/api';
import { toastApiSuccess } from '@/lib/mutation-feedback';
import { adminRoute } from '@/lib/routes';
import {
  GENDER_VALUES,
  TEACHER_INQUIRY_STATUSES,
  genderLabel,
  teacherInquiryStatusLabel,
  type GenderValue,
  type TeacherInquiryStatusValue,
} from '@/lib/teacher-inquiry-workflow';
import { useAdminAuthStore } from '@/stores/admin-auth.store';

interface ITeacherInquiryDetail {
  _id?: string;
  fullName?: string;
  phone?: string;
  subjects?: string[];
  subjectsOther?: string;
  ianaTimeZone?: string;
  countrySlug?: string;
  preferredTime?: string;
  actualTime?: string;
  availableDays?: string[];
  gender?: string;
  status?: string;
  adminNotes?: string;
  strengths?: string;
  weaknesses?: string;
  opportunities?: string;
  threats?: string;
  teacherEmail?: string;
  teacherTemporaryPassword?: string;
  teacherUserId?: string;
  isProvisioned?: boolean;
  createdAt?: string;
}

export default function TeacherInquiryDetailPage(): React.ReactElement {
  const params = useParams<{ inquiryId: string }>();
  const inquiryId = typeof params.inquiryId === 'string' ? params.inquiryId : '';
  const router = useRouter();
  const accessToken = useAdminAuthStore((state) => state.accessToken);

  const [inquiry, setInquiry] = useState<ITeacherInquiryDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [workflowError, setWorkflowError] = useState<string | null>(null);

  const [status, setStatus] = useState<TeacherInquiryStatusValue>('new_request');
  const [gender, setGender] = useState<GenderValue | ''>('');
  const [adminNotes, setAdminNotes] = useState('');
  const [strengths, setStrengths] = useState('');
  const [weaknesses, setWeaknesses] = useState('');
  const [opportunities, setOpportunities] = useState('');
  const [threats, setThreats] = useState('');
  const [teacherEmail, setTeacherEmail] = useState('');
  const [teacherTemporaryPassword, setTeacherTemporaryPassword] = useState('');
  const [isProvisioned, setIsProvisioned] = useState(false);

  const loadInquiry = useCallback(async (): Promise<void> => {
    if (!accessToken || !inquiryId) return;
    setLoading(true);
    setError(null);
    try {
      const envelope = await apiRequest<ITeacherInquiryDetail>(
        `/teacher-inquiries/${encodeURIComponent(inquiryId)}`,
        { token: accessToken },
      );
      const data = envelope.data;
      if (!data) {
        setError('Inquiry not found.');
        setInquiry(null);
        return;
      }
      setInquiry(data);
      setStatus((data.status as TeacherInquiryStatusValue) ?? 'new_request');
      setGender((data.gender as GenderValue) ?? '');
      setAdminNotes(data.adminNotes ?? '');
      setStrengths(data.strengths ?? '');
      setWeaknesses(data.weaknesses ?? '');
      setOpportunities(data.opportunities ?? '');
      setThreats(data.threats ?? '');
      setTeacherEmail(data.teacherEmail ?? '');
      setTeacherTemporaryPassword(data.teacherTemporaryPassword ?? '');
      setIsProvisioned(data.isProvisioned === true);
    } catch (err: unknown) {
      setError(err instanceof ApiCallError ? err.message : 'Failed to load inquiry.');
    } finally {
      setLoading(false);
    }
  }, [accessToken, inquiryId]);

  useEffect(() => {
    void loadInquiry();
  }, [loadInquiry]);

  const onSave = async (event: FormEvent): Promise<void> => {
    event.preventDefault();
    if (!accessToken || !inquiryId) return;

    if (status === 'finalized' && !isProvisioned) {
      const missing: string[] = [];
      if (!teacherEmail.trim()) missing.push('teacher email');
      if (!teacherTemporaryPassword.trim()) missing.push('teacher password');
      if (!gender) missing.push('gender');
      if (missing.length > 0) {
        setWorkflowError(`Please fill in: ${missing.join(', ')}.`);
        return;
      }
    }

    setSaving(true);
    setWorkflowError(null);
    try {
      const envelope = await apiRequest<ITeacherInquiryDetail>(
        `/teacher-inquiries/${encodeURIComponent(inquiryId)}`,
        {
          token: accessToken,
          method: 'PATCH',
          body: {
            status,
            gender: gender || null,
            adminNotes,
            strengths: strengths.trim() || null,
            weaknesses: weaknesses.trim() || null,
            opportunities: opportunities.trim() || null,
            threats: threats.trim() || null,
            teacherEmail: teacherEmail.trim() || null,
            teacherTemporaryPassword: teacherTemporaryPassword.trim() || null,
          },
        },
      );
      toastApiSuccess(envelope.message ?? 'Inquiry updated');
      await loadInquiry();
    } catch (err: unknown) {
      setWorkflowError(err instanceof ApiCallError ? err.message : 'Failed to save inquiry.');
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (): Promise<void> => {
    if (!accessToken || !inquiryId) return;
    if (!window.confirm('Permanently delete this teacher inquiry?')) return;
    try {
      await apiRequest(`/teacher-inquiries/${encodeURIComponent(inquiryId)}`, {
        token: accessToken,
        method: 'DELETE',
      });
      router.push(adminRoute('/teacher-inquiries'));
    } catch (err: unknown) {
      setWorkflowError(err instanceof ApiCallError ? err.message : 'Failed to delete inquiry.');
    }
  };

  if (loading && !inquiry) {
    return <p className="meta">Loading…</p>;
  }

  if (error) {
    return <div className="error-banner">{error}</div>;
  }

  if (!inquiry) {
    return <p className="meta">Inquiry not found.</p>;
  }

  return (
    <div>
      <div style={{ marginBottom: '1rem' }}>
        <Link href={adminRoute('/teacher-inquiries')} className="meta">
          ← Teacher inquiries
        </Link>
      </div>
      <h1 className="page-title">{inquiry.fullName ?? 'Teacher inquiry'}</h1>

      <form onSubmit={(e) => { void onSave(e); }} className="panel" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <section>
          <h2 style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted)' }}>Pipeline</h2>
          <select value={status} onChange={(e) => { setStatus(e.target.value as TeacherInquiryStatusValue); }} className="input">
            {TEACHER_INQUIRY_STATUSES.map((s) => (
              <option key={s} value={s}>{teacherInquiryStatusLabel(s)}</option>
            ))}
          </select>
        </section>

        <section>
          <h2 style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted)' }}>Gender</h2>
          <select value={gender} onChange={(e) => { setGender(e.target.value as GenderValue | ''); }} className="input">
            <option value="">— Select —</option>
            {GENDER_VALUES.map((g) => (
              <option key={g} value={g}>{genderLabel(g)}</option>
            ))}
          </select>
        </section>

        <section>
          <h2 style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted)' }}>SWOT analysis</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 8 }}>
            {([
              ['Strengths', strengths, setStrengths],
              ['Weaknesses', weaknesses, setWeaknesses],
              ['Opportunities', opportunities, setOpportunities],
              ['Threats', threats, setThreats],
            ] as const).map(([label, value, setter]) => (
              <label key={label} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>{label}</span>
                <textarea className="input" rows={3} value={value} onChange={(e) => { setter(e.target.value); }} />
              </label>
            ))}
          </div>
        </section>

        <section>
          <h2 style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted)' }}>Internal notes</h2>
          <textarea className="input" rows={4} value={adminNotes} onChange={(e) => { setAdminNotes(e.target.value); }} />
        </section>

        <section>
          <h2 style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted)' }}>
            Account credentials {isProvisioned ? '(provisioned)' : ''}
          </h2>
          {!isProvisioned ? (
            <p className="meta">Required before finalizing — creates the teacher user automatically.</p>
          ) : null}
          <label style={{ display: 'block', marginBottom: 8 }}>
            <span className="meta">Email</span>
            <input className="input" type="email" value={teacherEmail} disabled={isProvisioned} onChange={(e) => { setTeacherEmail(e.target.value); }} />
          </label>
          <label style={{ display: 'block' }}>
            <span className="meta">Temporary password</span>
            <input className="input" value={teacherTemporaryPassword} disabled={isProvisioned} onChange={(e) => { setTeacherTemporaryPassword(e.target.value); }} />
          </label>
          {isProvisioned && inquiry.teacherUserId ? (
            <p className="meta" style={{ marginTop: 8 }}>Teacher user: {inquiry.teacherUserId}</p>
          ) : null}
        </section>

        <section className="meta" style={{ lineHeight: 1.6 }}>
          <div><strong>Phone:</strong> {inquiry.phone}</div>
          <div><strong>Subjects:</strong> {(inquiry.subjects ?? []).join(', ')}</div>
          <div><strong>Time zone:</strong> {inquiry.ianaTimeZone}</div>
          <div><strong>Available days:</strong> {(inquiry.availableDays ?? []).join(', ')}</div>
        </section>

        {workflowError ? <div className="error-banner">{workflowError}</div> : null}

        <div style={{ display: 'flex', gap: 8 }}>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving…' : 'Save changes'}
          </button>
          <button type="button" className="btn btn-danger" onClick={() => { void onDelete(); }}>
            Delete
          </button>
        </div>
      </form>
    </div>
  );
}
