'use client';

import Link from 'next/link';
import React, { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
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

const SUBJECTS = ['English', 'Nepali', 'Math', 'Science', 'Other'] as const;
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;

const CHARSET = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

function generatePassword(length = 12): string {
  const arr = new Uint32Array(length);
  crypto.getRandomValues(arr);
  return Array.from(arr, (n) => CHARSET[n % CHARSET.length]).join('');
}

interface ITuitionInquiryDetail {
  _id?: string;
  parentFullName?: string;
  studentFullNames?: string;
  studentAge?: string;
  studentClass?: string;
  subjects?: string[];
  subjectsOther?: string;
  ianaTimeZone?: string;
  countrySlug?: string;
  preferredTime?: string;
  actualTime?: string;
  availableDays?: string[];
  messengerNumber?: string;
  status?: string;
  adminNotes?: string;
  parentEmail?: string;
  studentEmail?: string;
  parentTemporaryPassword?: string;
  studentTemporaryPassword?: string;
  parentUserId?: string;
  studentUserId?: string;
  isProvisioned?: boolean;
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

interface ICredentialDraft {
  parentEmail: string;
  studentEmail: string;
  parentTemporaryPassword: string;
  studentTemporaryPassword: string;
}

function formatDateTime(value: string | undefined): string {
  if (!value) return '—';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
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

// ─── Main page ────────────────────────────────────────────────────────────────

export default function TuitionInquiryDetailPage(): React.ReactElement {
  const params = useParams<{ inquiryId: string }>();
  const inquiryId = typeof params.inquiryId === 'string' ? params.inquiryId : '';
  const router = useRouter();
  const accessToken = useAdminAuthStore((state) => state.accessToken);

  const [inquiry, setInquiry] = useState<ITuitionInquiryDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // ── Info panel state ─────────────────────────────────────────────────────
  const [parentFullName, setParentFullName] = useState('');
  const [studentFullNames, setStudentFullNames] = useState('');
  const [studentAge, setStudentAge] = useState('');
  const [studentClass, setStudentClass] = useState('');
  const [subjects, setSubjects] = useState<string[]>([]);
  const [subjectsOther, setSubjectsOther] = useState('');
  const [ianaTimeZone, setIanaTimeZone] = useState('');
  const [countrySlug, setCountrySlug] = useState('');
  const [preferredTime, setPreferredTime] = useState('');
  const [actualTime, setActualTime] = useState('');
  const [availableDays, setAvailableDays] = useState<string[]>([]);
  const [messengerNumber, setMessengerNumber] = useState('');

  // ── Workflow panel state ─────────────────────────────────────────────────
  const [status, setStatus] = useState<TuitionInquiryStatusValue>('new_request');
  const [adminNotes, setAdminNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [workflowError, setWorkflowError] = useState<string | null>(null);

  // ── Credential state ─────────────────────────────────────────────────────
  const [credentials, setCredentials] = useState<ICredentialDraft>({
    parentEmail: '',
    studentEmail: '',
    parentTemporaryPassword: '',
    studentTemporaryPassword: '',
  });
  const [isProvisioned, setIsProvisioned] = useState(false);
  const [parentUserId, setParentUserId] = useState<string | undefined>();
  const [studentUserId, setStudentUserId] = useState<string | undefined>();

  // ── Audit log state ──────────────────────────────────────────────────────
  const [auditLogs, setAuditLogs] = useState<IAuditLogEntry[]>([]);
  const [auditMeta, setAuditMeta] = useState<IListMeta | null>(null);
  const [notesOpen, setNotesOpen] = useState(true);
  const [credentialsOpen, setCredentialsOpen] = useState(false);

  const [auditPage, setAuditPage] = useState(1);
  const [auditLoading, setAuditLoading] = useState(false);
  const [expandedAuditIds, setExpandedAuditIds] = useState<Set<string>>(new Set());

  const loadInquiry = useCallback(async (): Promise<void> => {
    if (!accessToken || !inquiryId) return;
    setLoading(true);
    setError(null);
    try {
      const envelope = await apiRequest<ITuitionInquiryDetail>(
        `/tuition-inquiries/${encodeURIComponent(inquiryId)}`,
        { token: accessToken },
      );
      const data = envelope.data;
      if (!data) {
        setError('Inquiry not found.');
        setInquiry(null);
        return;
      }
      setInquiry(data);

      setParentFullName(data.parentFullName ?? '');
      setStudentFullNames(data.studentFullNames ?? '');
      setStudentAge(data.studentAge ?? '');
      setStudentClass(data.studentClass ?? '');
      setSubjects(data.subjects ?? []);
      setSubjectsOther(data.subjectsOther ?? '');
      setIanaTimeZone(data.ianaTimeZone ?? '');
      setCountrySlug(data.countrySlug ?? '');
      setPreferredTime(data.preferredTime ?? '');
      setActualTime(toDatetimeLocal(data.actualTime));
      setAvailableDays(data.availableDays ?? []);
      setMessengerNumber(data.messengerNumber ?? '');

      const resolvedStatus = TUITION_INQUIRY_STATUSES.find((s) => s === data.status) ?? 'new_request';
      setStatus(resolvedStatus);
      setAdminNotes(data.adminNotes ?? '');

      setCredentials({
        parentEmail: data.parentEmail ?? '',
        studentEmail: data.studentEmail ?? '',
        parentTemporaryPassword: data.parentTemporaryPassword ?? '',
        studentTemporaryPassword: data.studentTemporaryPassword ?? '',
      });
      setIsProvisioned(data.isProvisioned ?? false);
      setParentUserId(data.parentUserId);
      setStudentUserId(data.studentUserId);
      if (data.isProvisioned) setCredentialsOpen(true);
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
      // audit history is best-effort
    } finally {
      setAuditLoading(false);
    }
  }, [accessToken, inquiryId, auditPage]);

  useEffect(() => { void loadInquiry(); }, [loadInquiry]);
  useEffect(() => { void loadAuditLogs(); }, [loadAuditLogs]);

  const arraysEqual = (a: string[], b: string[]): boolean => {
    if (a.length !== b.length) return false;
    const sortedA = [...a].sort();
    const sortedB = [...b].sort();
    return sortedA.every((value, index) => value === sortedB[index]);
  };

  const hasUnsavedChanges = useMemo((): boolean => {
    if (!inquiry) return false;

    const savedStatus =
      TUITION_INQUIRY_STATUSES.find((s) => s === inquiry.status) ?? 'new_request';

    const infoChanged =
      parentFullName !== (inquiry.parentFullName ?? '') ||
      studentFullNames !== (inquiry.studentFullNames ?? '') ||
      studentAge !== (inquiry.studentAge ?? '') ||
      studentClass !== (inquiry.studentClass ?? '') ||
      !arraysEqual(subjects, inquiry.subjects ?? []) ||
      subjectsOther !== (inquiry.subjectsOther ?? '') ||
      ianaTimeZone !== (inquiry.ianaTimeZone ?? '') ||
      countrySlug !== (inquiry.countrySlug ?? '') ||
      preferredTime !== (inquiry.preferredTime ?? '') ||
      actualTime !== toDatetimeLocal(inquiry.actualTime) ||
      !arraysEqual(availableDays, inquiry.availableDays ?? []) ||
      messengerNumber !== (inquiry.messengerNumber ?? '');

    const workflowChanged =
      status !== savedStatus ||
      adminNotes !== (inquiry.adminNotes ?? '') ||
      (!inquiry.isProvisioned &&
        (credentials.parentEmail !== (inquiry.parentEmail ?? '') ||
          credentials.studentEmail !== (inquiry.studentEmail ?? '') ||
          credentials.parentTemporaryPassword !== (inquiry.parentTemporaryPassword ?? '') ||
          credentials.studentTemporaryPassword !== (inquiry.studentTemporaryPassword ?? '')));

    return infoChanged || workflowChanged;
  }, [
    inquiry,
    parentFullName,
    studentFullNames,
    studentAge,
    studentClass,
    subjects,
    subjectsOther,
    ianaTimeZone,
    countrySlug,
    preferredTime,
    actualTime,
    availableDays,
    messengerNumber,
    status,
    adminNotes,
    credentials,
  ]);

  useEffect(() => {
    if (!hasUnsavedChanges) return;
    const onBeforeUnload = (event: BeforeUnloadEvent): void => {
      event.preventDefault();
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [hasUnsavedChanges]);

  const toggleSubject = (subject: string): void => {
    setSubjects((prev) =>
      prev.includes(subject) ? prev.filter((s) => s !== subject) : [...prev, subject],
    );
  };

  const toggleDay = (day: string): void => {
    setAvailableDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    );
  };

  const onStatusChange = (next: TuitionInquiryStatusValue): void => {
    setStatus(next);
    if (next === 'finalized' && !isProvisioned) {
      setCredentialsOpen(true);
    }
    setWorkflowError(null);
  };

  const onSaveAll = async (event: FormEvent): Promise<void> => {
    event.preventDefault();
    if (!accessToken || !inquiryId) return;

    if (status === 'finalized' && !isProvisioned) {
      const missing: string[] = [];
      if (!credentials.parentEmail.trim()) missing.push('parent email');
      if (!credentials.parentTemporaryPassword.trim()) missing.push('parent password');
      if (!credentials.studentEmail.trim()) missing.push('student email');
      if (!credentials.studentTemporaryPassword.trim()) missing.push('student password');
      if (missing.length > 0) {
        setWorkflowError(`Please fill in the following before finalizing: ${missing.join(', ')}.`);
        setCredentialsOpen(true);
        return;
      }
    }

    setSaving(true);
    setWorkflowError(null);
    setError(null);
    try {
      const body: Record<string, unknown> = {
        parentFullName: parentFullName || undefined,
        studentFullNames: studentFullNames || undefined,
        studentAge: studentAge || undefined,
        studentClass: studentClass || undefined,
        subjects: subjects.length > 0 ? subjects : undefined,
        subjectsOther: subjectsOther || null,
        ianaTimeZone: ianaTimeZone || undefined,
        countrySlug: countrySlug || undefined,
        preferredTime: preferredTime || null,
        actualTime: actualTime ? new Date(actualTime).toISOString() : null,
        availableDays: availableDays.length > 0 ? availableDays : undefined,
        messengerNumber: messengerNumber || undefined,
        status,
        adminNotes,
      };

      if (!isProvisioned) {
        body.parentEmail = credentials.parentEmail.trim() || null;
        body.studentEmail = credentials.studentEmail.trim() || null;
        body.parentTemporaryPassword = credentials.parentTemporaryPassword.trim() || null;
        body.studentTemporaryPassword = credentials.studentTemporaryPassword.trim() || null;
      }

      const envelope = await apiRequest<ITuitionInquiryDetail>(
        `/tuition-inquiries/${encodeURIComponent(inquiryId)}`,
        { method: 'PATCH', token: accessToken, body },
      );
      toastApiSuccess(envelope, 'Inquiry saved.');
      await loadInquiry();
      void loadAuditLogs();
    } catch (err: unknown) {
      setError(err instanceof ApiCallError ? err.message : 'Save failed.');
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (): Promise<void> => {
    if (!accessToken || !inquiryId) return;
    if (!window.confirm('Delete this inquiry permanently? This cannot be undone.')) return;
    setSaving(true);
    setError(null);
    try {
      const envelope = await apiRequest<unknown>(
        `/tuition-inquiries/${encodeURIComponent(inquiryId)}`,
        { method: 'DELETE', token: accessToken },
      );
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

  const checkboxRow: React.CSSProperties = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px 16px',
    marginTop: 6,
  };

  const checkboxLabel: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontSize: '0.88rem',
    cursor: 'pointer',
  };

  const credGroupLabelStyle: React.CSSProperties = {
    fontSize: '0.78rem',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: '#1e3a8a',
    margin: '0.75rem 0 0.4rem',
  };

  const accordionGenBtnStyle: React.CSSProperties = {
    flexShrink: 0,
    width: 34,
    height: 34,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid var(--border, #e2e8f0)',
    borderRadius: 6,
    background: 'var(--surface, #f8fafc)',
    cursor: 'pointer',
    fontSize: '1rem',
    color: 'var(--fg,rgb(255, 255, 255))',
    transition: 'background 0.15s',
  };

  return (
    <div>
        <h1 className="page-title">Tuition inquiry</h1>
        <p className="meta" style={{ marginBottom: '1rem' }}>
          <Link href={adminRoute('/tuition-inquiries')}>← Back to list</Link>
          {inquiry?._id ? (
            <> · <span className="meta">ID: {inquiry._id}</span></>
          ) : null}
        </p>

        {error && <div className="error-banner">{error}</div>}
        {loading && !inquiry ? <p className="meta">Loading…</p> : null}

        {inquiry ? (
          <>
            <form onSubmit={(e) => void onSaveAll(e)}>
            {/* ── 60/40 side-by-side layout ── */}
            <div
              style={{
                display: 'flex',
                gap: '1rem',
                alignItems: 'flex-start',
                marginBottom: '0.75rem',
              }}
            >
            {/* ── Module 1: Submitted information (60 %) ── */}
            <section
              className="panel"
              style={{ flex: '0 0 60%', minWidth: 0 }}
            >
              <h2 className="meta" style={{ marginTop: 0, fontSize: '0.95rem', fontWeight: 600 }}>
                Submitted information
              </h2>
              <p className="meta" style={{ marginTop: 0 }}>
                Edit the details submitted by the parent. Use <strong>Save changes</strong> below to persist information and workflow together.
              </p>

              <div className="field">
                <label htmlFor="inq-parent">Parent full name</label>
                <input
                  id="inq-parent"
                  value={parentFullName}
                  onChange={(e) => setParentFullName(e.target.value)}
                  maxLength={200}
                />
              </div>

              <div className="field">
                <label htmlFor="inq-students">Student full name(s)</label>
                <input
                  id="inq-students"
                  value={studentFullNames}
                  onChange={(e) => setStudentFullNames(e.target.value)}
                  maxLength={500}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 1rem' }}>
                <div className="field">
                  <label htmlFor="inq-age">Student age</label>
                  <input
                    id="inq-age"
                    value={studentAge}
                    onChange={(e) => setStudentAge(e.target.value)}
                    maxLength={100}
                  />
                </div>
                <div className="field">
                  <label htmlFor="inq-class">Student class / grade</label>
                  <input
                    id="inq-class"
                    value={studentClass}
                    onChange={(e) => setStudentClass(e.target.value)}
                    maxLength={200}
                  />
                </div>
              </div>

              <div className="field">
                <label>Subjects</label>
                <div style={checkboxRow}>
                  {SUBJECTS.map((s) => (
                    <label key={s} style={checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={subjects.includes(s)}
                        onChange={() => toggleSubject(s)}
                      />
                      {s}
                    </label>
                  ))}
                </div>
              </div>

              {subjects.includes('Other') ? (
                <div className="field">
                  <label htmlFor="inq-subjects-other">Other subjects (details)</label>
                  <input
                    id="inq-subjects-other"
                    value={subjectsOther}
                    onChange={(e) => setSubjectsOther(e.target.value)}
                    maxLength={300}
                    placeholder="Describe other subjects"
                  />
                </div>
              ) : null}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 1rem' }}>
                <div className="field">
                  <label htmlFor="inq-preferred-time">Preferred session time</label>
                  <input
                    id="inq-preferred-time"
                    value={preferredTime}
                    onChange={(e) => setPreferredTime(e.target.value)}
                    placeholder="e.g. Evening, Flexible, Weekends"
                    maxLength={300}
                  />
                </div>

                <div className="field">
                  <label htmlFor="inq-actual-time">Actual confirmed time</label>
                  <input
                    id="inq-actual-time"
                    type="datetime-local"
                    value={actualTime}
                    onChange={(e) => setActualTime(e.target.value)}
                  />
                  <p className="meta" style={{ margin: '4px 0 0', fontSize: '0.78rem' }}>
                    Set once a session time is confirmed with the family.
                  </p>
                </div>

                <div className="field">
                  <label htmlFor="inq-timezone">Time zone (IANA)</label>
                  <input
                    id="inq-timezone"
                    value={ianaTimeZone}
                    onChange={(e) => setIanaTimeZone(e.target.value)}
                    placeholder="e.g. Asia/Kathmandu"
                    maxLength={100}
                  />
                </div>
              </div>

              <div className="field">
                <label htmlFor="inq-country">Country slug</label>
                <input
                  id="inq-country"
                  value={countrySlug}
                  onChange={(e) => setCountrySlug(e.target.value)}
                  maxLength={120}
                />
              </div>

              <div className="field">
                <label>Available days</label>
                <div style={checkboxRow}>
                  {DAYS.map((d) => (
                    <label key={d} style={checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={availableDays.includes(d)}
                        onChange={() => toggleDay(d)}
                      />
                      {d}
                    </label>
                  ))}
                </div>
              </div>

              <div className="field">
                <label htmlFor="inq-messenger">Messenger / WhatsApp number</label>
                <input
                  id="inq-messenger"
                  value={messengerNumber}
                  onChange={(e) => setMessengerNumber(e.target.value)}
                  maxLength={80}
                />
              </div>

            </section>

            {/* ── Module 2: Staff workflow (40 %) ── */}
            <section
              className="panel"
              style={{ flex: '0 0 40%', minWidth: 0 }}
            >
              <h2 className="meta" style={{ marginTop: 0, fontSize: '0.95rem', fontWeight: 600 }}>
                Staff workflow
              </h2>

              {/* Status select — always visible */}
              <div className="field">
                <label htmlFor="inq-status">Status</label>
                <select
                  id="inq-status"
                  value={status}
                  onChange={(e) => onStatusChange(e.target.value as TuitionInquiryStatusValue)}
                  disabled={isProvisioned && status === 'finalized'}
                >
                  {TUITION_INQUIRY_STATUSES.map((value) => (
                    <option key={value} value={value}>
                      {tuitionInquiryStatusLabel(value)}
                    </option>
                  ))}
                </select>
                {isProvisioned ? (
                  <p className="meta" style={{ marginTop: 4, fontSize: '0.78rem' }}>
                    This inquiry has been provisioned — accounts are already created.
                  </p>
                ) : null}
              </div>

              {/* ── Accordion: Internal notes ── */}
              <div style={{ border: '1px solid var(--border, #e2e8f0)', borderRadius: 8, marginTop: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setNotesOpen((o) => !o)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    border: 'none',
                    borderRadius: notesOpen ? '8px 8px 0 0' : 8,
                    cursor: 'pointer',
                    textAlign: 'left',
                    background: 'var(--surface, #f8fafc)',
                  }}
                >
                  <span style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--fg,rgb(255, 255, 255))' }}>
                    Internal notes
                  </span>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 26,
                      height: 26,
                      borderRadius: '50%',
                      background: isProvisioned ? '#bbf7d0' : 'var(--border, #e2e8f0)',
                      fontSize: '0.7rem',
                      transition: 'transform 0.2s',
                      transform: notesOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                      flexShrink: 0,
                    }}
                    aria-hidden="true"
                  >
                    ▼
                  </span>
                </button>
                {notesOpen ? (
                  <div style={{ padding: '12px 14px', borderTop: '1px solid var(--border, #e2e8f0)' }}>
                    <textarea
                      id="inq-notes"
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      rows={4}
                      placeholder="Handoff context for teammates (not shown to parents)."
                      maxLength={4000}
                      style={{ width: '100%', boxSizing: 'border-box', resize: 'vertical', background: 'var(--surface, #f8fafc)' , color: 'var(--fg,rgb(255, 255, 255))'  }}
                    />
                  </div>
                ) : null}
              </div>

              {/* ── Accordion: Account credentials ── */}
              <div style={{ border: '1px solid var(--border, #e2e8f0)', borderRadius: 8, marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setCredentialsOpen((o) => !o)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    background: isProvisioned ? '#f0fdf4' : 'var(--surface, #f8fafc)',
                    border: 'none',
                    borderRadius: credentialsOpen ? '8px 8px 0 0' : 8,
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--fg,rgb(255, 255, 255))' }}>
                      Account credentials
                    </span>
                    {isProvisioned ? (
                      <span
                        style={{
                          padding: '2px 8px',
                          borderRadius: 5,
                          background: '#dcfce7',
                          color: '#15803d',
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          letterSpacing: '0.04em',
                          textTransform: 'uppercase',
                        }}
                      >
                        Provisioned
                      </span>
                    ) : (
                      <span
                        style={{
                          padding: '2px 8px',
                          borderRadius: 5,
                          background: '#fef9c3',
                          color: '#854d0e',
                          fontSize: '0.68rem',
                          fontWeight: 600,
                        }}
                      >
                        Required before finalizing
                      </span>
                    )}
                  </span>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 26,
                      height: 26,
                      borderRadius: '50%',
                      background: isProvisioned ? '#bbf7d0' : 'var(--border, #e2e8f0)',
                      fontSize: '0.7rem',
                      transition: 'transform 0.2s',
                      transform: credentialsOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                      flexShrink: 0,
                    }}
                    aria-hidden="true"
                  >
                    ▼
                  </span>
                </button>

                {credentialsOpen ? (
                  <div style={{ padding: '14px', borderTop: '1px solid var(--border, #e2e8f0)' }}>
                    {isProvisioned ? (
                      <p className="meta" style={{ marginTop: 0, marginBottom: '0.75rem', fontSize: '0.82rem' }}>
                        User accounts have been created. Fields are read-only.
                      </p>
                    ) : (
                      <p className="meta" style={{ marginTop: 0, marginBottom: '0.75rem', fontSize: '0.82rem' }}>
                        Fill in the credentials you will give the family. Accounts are created when you save with status&nbsp;<strong>Finalized</strong>.
                      </p>
                    )}

                    {/* Parent */}
                    <p style={credGroupLabelStyle}>Parent</p>
                    <div style={{ display: 'flex',flexWrap: 'wrap', gap: '0 1rem' }}>
                      <div className="field">
                        <label htmlFor="cred-parent-email">Email</label>
                        <input
                          id="cred-parent-email"
                          type="email"
                          value={credentials.parentEmail}
                          onChange={(e) =>
                            setCredentials((prev) => ({ ...prev, parentEmail: e.target.value }))
                          }
                          placeholder="parent@example.com"
                          maxLength={254}
                          readOnly={isProvisioned}
                          style={isProvisioned ? { background: '#f1f5f9', cursor: 'default' } : undefined}
                        />
                      </div>
                      <div className="field">
                        <label htmlFor="cred-parent-password">Temporary password</label>
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                          <input
                            id="cred-parent-password"
                            type="text"
                            value={credentials.parentTemporaryPassword}
                            onChange={(e) =>
                              setCredentials((prev) => ({ ...prev, parentTemporaryPassword: e.target.value }))
                            }
                            placeholder="Min 8 characters"
                            maxLength={128}
                            readOnly={isProvisioned}
                            style={{
                              flex: 1,
                              minWidth: 0,
                              ...(isProvisioned ? { background: '#f1f5f9', cursor: 'default' } : {}),
                            }}
                          />
                          {!isProvisioned ? (
                            <button
                              type="button"
                              title="Generate random password"
                              onClick={() =>
                                setCredentials((prev) => ({ ...prev, parentTemporaryPassword: generatePassword() }))
                              }
                              style={accordionGenBtnStyle}
                            >
                              ⟳
                            </button>
                          ) : null}
                        </div>
                      </div>
                    </div>
                    {isProvisioned && parentUserId ? (
                      <p className="meta" style={{ fontSize: '0.75rem', margin: '0 0 10px' }}>
                        User ID: <code>{parentUserId}</code>
                      </p>
                    ) : null}

                    {/* Student */}
                    <p style={{ ...credGroupLabelStyle, marginTop: '0.75rem' }}>Student</p>
                    <div style={{ display: 'flex',flexWrap: 'wrap', gap: '0 1rem' }}>
                      <div className="field">
                        <label htmlFor="cred-student-email">Email</label>
                        <input
                          id="cred-student-email"
                          type="email"
                          value={credentials.studentEmail}
                          onChange={(e) =>
                            setCredentials((prev) => ({ ...prev, studentEmail: e.target.value }))
                          }
                          placeholder="student@example.com"
                          maxLength={254}
                          readOnly={isProvisioned}
                          style={isProvisioned ? { background: '#f1f5f9', cursor: 'default' } : undefined}
                        />
                      </div>
                      <div className="field">
                        <label htmlFor="cred-student-password">Temporary password</label>
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                          <input
                            id="cred-student-password"
                            type="text"
                            value={credentials.studentTemporaryPassword}
                            onChange={(e) =>
                              setCredentials((prev) => ({ ...prev, studentTemporaryPassword: e.target.value }))
                            }
                            placeholder="Min 8 characters"
                            maxLength={128}
                            readOnly={isProvisioned}
                            style={{
                              flex: 1,
                              minWidth: 0,
                              ...(isProvisioned ? { background: '#f1f5f9', cursor: 'default' } : {}),
                            }}
                          />
                          {!isProvisioned ? (
                            <button
                              type="button"
                              title="Generate random password"
                              onClick={() =>
                                setCredentials((prev) => ({ ...prev, studentTemporaryPassword: generatePassword() }))
                              }
                              style={accordionGenBtnStyle}
                            >
                              ⟳
                            </button>
                          ) : null}
                        </div>
                      </div>
                    </div>
                    {isProvisioned && studentUserId ? (
                      <p className="meta" style={{ fontSize: '0.75rem', margin: '0 0 4px' }}>
                        User ID: <code>{studentUserId}</code>
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </div>

              {workflowError ? (
                <p
                  style={{
                    marginTop: '0.75rem',
                    marginBottom: 0,
                    padding: '8px 12px',
                    borderRadius: 7,
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    color: '#b91c1c',
                    fontSize: '0.83rem',
                  }}
                >
                  {workflowError}
                </p>
              ) : null}
            </section>
            </div>{/* end 60/40 row */}

            <div
              className="panel"
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                gap: 12,
                marginBottom: '1rem',
                position: 'sticky',
                bottom: 12,
                zIndex: 2,
              }}
            >
              <button
                type="submit"
                className="btn btn-primary"
                disabled={saving || !hasUnsavedChanges}
              >
                {saving ? 'Saving…' : hasUnsavedChanges ? 'Save changes' : 'All changes saved'}
              </button>
              <button
                type="button"
                className="btn"
                disabled={saving}
                onClick={() => void onDelete()}
              >
                Delete inquiry
              </button>
              {hasUnsavedChanges ? (
                <span className="meta" style={{ margin: 0, fontSize: '0.85rem' }}>
                  Unsaved changes in information and/or workflow — one save updates everything.
                </span>
              ) : (
                <span className="meta" style={{ margin: 0, fontSize: '0.85rem' }}>
                  Information and workflow are saved together.
                </span>
              )}
            </div>
            </form>

            {/* ── Change history ── */}
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
                        style={{ border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}
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
                          onKeyDown={(e) => {
                            if (!isMinimal && (e.key === 'Enter' || e.key === ' ')) toggleAuditExpand(id);
                          }}
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
                            <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
                              ({entry.actor.role})
                            </span>
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
