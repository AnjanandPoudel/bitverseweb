'use client';
import React from 'react';
import { useCallback, useEffect, useState } from 'react';
import { ApiCallError, apiRequest, type IListMeta } from '@/lib/api';
import { PaginationBar } from '@/components/PaginationBar';
import { FieldDiff } from '@/components/FieldDiff';
import { useAdminAuthStore } from '@/stores/admin-auth.store';
import { adminRoute } from '@/lib/routes';
import Link from 'next/link';

type AuditLogAction = 'create' | 'update' | 'delete';

interface IAuditLogActor {
  userId: string;
  email?: string;
  role?: string;
}

interface IAuditLogRow {
  _id?: string;
  actor: IAuditLogActor;
  action: AuditLogAction;
  resourceType: string;
  resourceId: string;
  previousState: Record<string, unknown> | null;
  nextState: Record<string, unknown> | null;
  createdAt?: string;
}

interface IListPayload {
  items: IAuditLogRow[];
}

const PAGE_SIZE = 20;

const ACTION_COLORS: Record<AuditLogAction, { bg: string; color: string }> = {
  create: { bg: 'rgba(34,197,94,0.15)', color: '#22c55e' },
  update: { bg: 'rgba(234,179,8,0.15)', color: '#ca8a04' },
  delete: { bg: 'rgba(239,68,68,0.15)', color: '#ef4444' },
};

function ActionBadge({ action }: { action: AuditLogAction }): React.ReactElement {
  const style = ACTION_COLORS[action] ?? ACTION_COLORS.update;
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 8px',
        borderRadius: 4,
        background: style.bg,
        color: style.color,
        fontWeight: 700,
        fontSize: '0.75rem',
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
      }}
    >
      {action}
    </span>
  );
}

function formatDate(value: string | undefined): string {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

function resourceLink(resourceType: string, resourceId: string): string | null {
  if (resourceType === 'TuitionInquiry') {
    return adminRoute(`/tuition-inquiries/${encodeURIComponent(resourceId)}`);
  }
  return null;
}

export default function AuditLogsPage(): React.ReactElement {
  const accessToken = useAdminAuthStore((state) => state.accessToken);
  const [items, setItems] = useState<IAuditLogRow[]>([]);
  const [meta, setMeta] = useState<IListMeta | null>(null);
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState<AuditLogAction | ''>('');
  const [resourceTypeFilter, setResourceTypeFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const load = useCallback(async (): Promise<void> => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const envelope = await apiRequest<IListPayload>('/audit-logs', {
        token: accessToken,
        query: {
          page,
          limit: PAGE_SIZE,
          action: actionFilter || undefined,
          resourceType: resourceTypeFilter.trim() || undefined,
        },
      });
      setItems(envelope.data?.items ?? []);
      setMeta(envelope.meta ?? null);
    } catch (err: unknown) {
      setError(err instanceof ApiCallError ? err.message : 'Failed to load audit logs.');
    } finally {
      setLoading(false);
    }
  }, [accessToken, page, actionFilter, resourceTypeFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  const toggleExpand = (id: string): void => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const changedFieldCount = (row: IAuditLogRow): number => {
    if (!row.previousState && !row.nextState) return 0;
    if (!row.previousState) return Object.keys(row.nextState ?? {}).length;
    if (!row.nextState) return Object.keys(row.previousState).length;
    const allKeys = new Set([...Object.keys(row.previousState), ...Object.keys(row.nextState)]);
    let count = 0;
    for (const key of allKeys) {
      if (key === '__v' || key === 'updatedAt') continue;
      if (JSON.stringify(row.previousState[key]) !== JSON.stringify(row.nextState[key])) {
        count++;
      }
    }
    return count;
  };

  const totalPages = meta?.totalPages ?? 1;

  return (
    <div>
      <h1 className="page-title">Audit Log</h1>
      <p className="meta" style={{ marginBottom: '1rem' }}>
        Chronological history of all system changes — who changed what data and when.
      </p>

      <form
        className="toolbar"
        style={{ marginBottom: '1rem' }}
        onSubmit={(event) => {
          event.preventDefault();
          setPage(1);
          void load();
        }}
>
        <div className="field" style={{ flex: '0 1 180px', marginBottom: 0 }}>
          <label htmlFor="al-action">Action</label>
          <select
            id="al-action"
            value={actionFilter}
            onChange={(e) => { setActionFilter(e.target.value as AuditLogAction | ''); setPage(1); }}
          >
            <option value="">All actions</option>
            <option value="create">Create</option>
            <option value="update">Update</option>
            <option value="delete">Delete</option>
          </select>
        </div>
        <div className="field" style={{ flex: '0 1 220px', marginBottom: 0 }}>
          <label htmlFor="al-resource">Resource type</label>
          <select
            id="al-resource"
            value={resourceTypeFilter}
            onChange={(e) => { setResourceTypeFilter(e.target.value); setPage(1); }}
          >
            <option value="">All resources</option>
            <option value="TuitionInquiry">Tuition Inquiry</option>
            <option value="User">User</option>
            <option value="Role">Role</option>
          </select>
        </div>
        <button type="submit" className="btn btn-primary">
          Apply
        </button>
      </form>

      {error && <div className="error-banner">{error}</div>}

      <div className="panel" style={{ padding: 0 }}>
        <table className="admin-table" style={{ tableLayout: 'fixed', width: '100%' }}>
          <colgroup>
            <col style={{ width: '80px' }} />
            <col style={{ width: '130px' }} />
            <col style={{ width: '120px' }} />
            <col />
            <col style={{ width: '160px' }} />
            <col style={{ width: '80px' }} />
          </colgroup>
          <thead>
            <tr>
              <th>Action</th>
              <th>Actor</th>
              <th>Resource</th>
              <th>Resource ID</th>
              <th>When</th>
              <th>Diff</th>
            </tr>
          </thead>
          <tbody>
            {loading && items.length === 0 ? (
              <tr><td colSpan={6} className="meta">Loading…</td></tr>
            ) : null}
            {!loading && items.length === 0 ? (
              <tr><td colSpan={6} className="meta">No audit log entries found.</td></tr>
            ) : null}
            {items.map((row) => {
              const id = row._id ?? `${row.resourceId}-${row.createdAt}`;
              const isExpanded = expandedIds.has(id);
              const diffCount = changedFieldCount(row);
              const isMinimal = diffCount === 0;
              const link = resourceLink(row.resourceType, row.resourceId);

              return (
                <React.Fragment key={id}>
                  <tr key={id} style={{ verticalAlign: 'top' }}>
                    <td style={{ paddingTop: 10 }}>
                      <ActionBadge action={row.action} />
                    </td>
                    <td style={{ wordBreak: 'break-all' }}>
                      <div style={{ fontWeight: 500, fontSize: '0.85rem' }}>
                        {row.actor.email ?? row.actor.userId}
                      </div>
                      {row.actor.role ? (
                        <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{row.actor.role}</div>
                      ) : null}
                    </td>
                    <td style={{ fontSize: '0.85rem' }}>{row.resourceType}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.78rem', wordBreak: 'break-all' }}>
                      {link ? (
                        <Link href={link} style={{ color: 'var(--accent)' }}>
                          {row.resourceId}
                        </Link>
                      ) : (
                        row.resourceId
                      )}
                    </td>
                    <td style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>{formatDate(row.createdAt)}</td>
                    <td>
                      {diffCount === 0 ? (
                        <span style={{ color: 'var(--muted)', fontSize: '0.78rem' }}>—</span>
                      ) : isMinimal ? (
                        <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>1 field</span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => toggleExpand(id)}
                          style={{
                            background: 'none',
                            border: '1px solid var(--border)',
                            borderRadius: 5,
                            padding: '2px 7px',
                            cursor: 'pointer',
                            fontSize: '0.75rem',
                            color: 'var(--text)',
                          }}
                        >
                          {isExpanded ? '▲' : `▼ ${diffCount}`}
                        </button>
                      )}
                    </td>
                  </tr>
                  {(isMinimal || isExpanded) && diffCount > 0 ? (
                    <tr key={`${id}-diff`} style={{ background: 'var(--surface)' }}>
                      <td colSpan={6} style={{ padding: '4px 12px 10px' }}>
                        <FieldDiff
                          previousState={row.previousState}
                          nextState={row.nextState}
                          alwaysExpanded
                        />
                      </td>
                    </tr>
                  ) : null}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      <PaginationBar page={page} totalPages={totalPages} disabled={loading} onPageChange={setPage} />
    </div>
  );
}
