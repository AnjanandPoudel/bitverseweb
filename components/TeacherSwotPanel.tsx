'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { ApiCallError, apiRequest } from '@/lib/api';
import { toastApiSuccess } from '@/lib/mutation-feedback';
import { useAdminAuthStore } from '@/stores/admin-auth.store';

interface ITeacherSwotStats {
  strengths?: string;
  weaknesses?: string;
  opportunities?: string;
  threats?: string;
}

interface ITeacherSwotPanelProps {
  userId: string;
  isTeacher: boolean;
}

interface ISwotFieldProps {
  label: string;
  accent: string;
  value: string;
  editing: boolean;
  onChange: (value: string) => void;
}

function SwotField({ label, accent, value, editing, onChange }: ISwotFieldProps): React.ReactElement {
  return (
    <div
      style={{
        flex: '1 1 45%',
        minWidth: 160,
        background: 'var(--surface, #f8fafc)',
        border: '1px solid var(--border, #e2e8f0)',
        borderTop: `3px solid ${accent}`,
        borderRadius: 10,
        padding: '0.65rem 0.75rem',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
      }}
    >
      <div style={{ fontSize: '0.68rem', fontWeight: 700, color: accent, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        {label}
      </div>
      {editing ? (
        <textarea
          value={value}
          onChange={(e) => { onChange(e.target.value); }}
          rows={3}
          placeholder="—"
          style={{
            resize: 'vertical',
            border: 'none',
            background: 'transparent',
            fontSize: '0.85rem',
            color: 'var(--text)',
            outline: 'none',
            minHeight: 52,
          }}
        />
      ) : (
        <div style={{ fontSize: '0.85rem', color: 'var(--muted, #64748b)', lineHeight: 1.45, whiteSpace: 'pre-wrap' }}>
          {value.trim().length > 0 ? value : '—'}
        </div>
      )}
    </div>
  );
}

export function TeacherSwotPanel(props: ITeacherSwotPanelProps): React.ReactElement | null {
  const { userId, isTeacher } = props;
  const accessToken = useAdminAuthStore((state) => state.accessToken);
  const [stats, setStats] = useState<ITeacherSwotStats>({ strengths: '', weaknesses: '', opportunities: '', threats: '' });
  const [draft, setDraft] = useState<ITeacherSwotStats>({ strengths: '', weaknesses: '', opportunities: '', threats: '' });
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (): Promise<void> => {
    if (!accessToken || !isTeacher) return;
    setLoading(true);
    setError(null);
    try {
      const envelope = await apiRequest<ITeacherSwotStats>(
        `/users/${encodeURIComponent(userId)}/teacher-stats`,
        { token: accessToken },
      );
      const data = envelope.data ?? {};
      const next = {
        strengths: data.strengths ?? '',
        weaknesses: data.weaknesses ?? '',
        opportunities: data.opportunities ?? '',
        threats: data.threats ?? '',
      };
      setStats(next);
      setDraft(next);
    } catch (err: unknown) {
      setError(err instanceof ApiCallError ? err.message : 'Failed to load teacher stats.');
    } finally {
      setLoading(false);
    }
  }, [accessToken, isTeacher, userId]);

  useEffect(() => {
    void load();
  }, [load]);

  const onSubmit = async (event: FormEvent): Promise<void> => {
    event.preventDefault();
    if (!accessToken) return;
    setSaving(true);
    setError(null);
    try {
      const envelope = await apiRequest<ITeacherSwotStats>(
        `/users/${encodeURIComponent(userId)}/teacher-stats`,
        {
          token: accessToken,
          method: 'PATCH',
          body: {
            strengths: draft.strengths?.trim() || null,
            weaknesses: draft.weaknesses?.trim() || null,
            opportunities: draft.opportunities?.trim() || null,
            threats: draft.threats?.trim() || null,
          },
        },
      );
      const data = envelope.data ?? {};
      const next = {
        strengths: data.strengths ?? '',
        weaknesses: data.weaknesses ?? '',
        opportunities: data.opportunities ?? '',
        threats: data.threats ?? '',
      };
      setStats(next);
      setDraft(next);
      setEditing(false);
      toastApiSuccess(envelope, 'Teacher stats updated');
    } catch (err: unknown) {
      setError(err instanceof ApiCallError ? err.message : 'Failed to save teacher stats.');
    } finally {
      setSaving(false);
    }
  };

  if (!isTeacher) {
    return null;
  }

  return (
    <div
      className="panel"
      style={{
        marginTop: '1.25rem',
        padding: '1rem 1.1rem',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: '0.85rem' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>Teacher stats</h2>
          <p className="meta" style={{ margin: '0.2rem 0 0' }}>SWOT analysis from interview profile</p>
        </div>
        {!editing ? (
          <button type="button" className="btn btn-secondary" onClick={() => { setEditing(true); }}>
            Edit
          </button>
        ) : null}
      </div>

      {loading ? <p className="meta">Loading…</p> : null}
      {error ? <div className="error-banner">{error}</div> : null}

      {editing ? (
        <form onSubmit={(e) => { void onSubmit(e); }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            <SwotField label="Strengths" accent="#15803d" value={draft.strengths ?? ''} editing onChange={(v) => { setDraft((p) => ({ ...p, strengths: v })); }} />
            <SwotField label="Weaknesses" accent="#b91c1c" value={draft.weaknesses ?? ''} editing onChange={(v) => { setDraft((p) => ({ ...p, weaknesses: v })); }} />
            <SwotField label="Opportunities" accent="#1d4ed8" value={draft.opportunities ?? ''} editing onChange={(v) => { setDraft((p) => ({ ...p, opportunities: v })); }} />
            <SwotField label="Threats" accent="#a16207" value={draft.threats ?? ''} editing onChange={(v) => { setDraft((p) => ({ ...p, threats: v })); }} />
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setDraft(stats);
                setEditing(false);
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <SwotField label="Strengths" accent="#15803d" value={stats.strengths ?? ''} editing={false} onChange={() => {}} />
          <SwotField label="Weaknesses" accent="#b91c1c" value={stats.weaknesses ?? ''} editing={false} onChange={() => {}} />
          <SwotField label="Opportunities" accent="#1d4ed8" value={stats.opportunities ?? ''} editing={false} onChange={() => {}} />
          <SwotField label="Threats" accent="#a16207" value={stats.threats ?? ''} editing={false} onChange={() => {}} />
        </div>
      )}
    </div>
  );
}
