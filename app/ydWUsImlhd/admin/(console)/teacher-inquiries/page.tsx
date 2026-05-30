'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { AdminListToolbar } from '@/components/AdminListToolbar';
import { PaginationBar } from '@/components/PaginationBar';
import { useAdminListFilters } from '@/hooks/use-admin-list-filters';
import { ApiCallError, apiRequest, type IListMeta } from '@/lib/api';
import { adminRoute } from '@/lib/routes';
import { teacherInquiryStatusLabel, type TeacherInquiryStatusValue } from '@/lib/teacher-inquiry-workflow';
import { useAdminAuthStore } from '@/stores/admin-auth.store';

interface ITeacherInquiryRow {
  _id?: string;
  fullName?: string;
  phone?: string;
  status?: string;
  createdAt?: string;
}

interface IListPayload {
  items: ITeacherInquiryRow[];
}

const PAGE_SIZE = 10;

function inquiryRowId(row: ITeacherInquiryRow): string {
  return typeof row._id === 'string' ? row._id : '';
}

const statusColor = (status: TeacherInquiryStatusValue): string | undefined => {
  switch (status) {
    case 'new_request':
      return 'orange';
    case 'contacting_candidate':
      return 'yellow';
    case 'interview_scheduled':
    case 'interview_completed':
      return 'skyblue';
    case 'profile_review':
      return 'violet';
    case 'finalized':
      return 'lightgreen';
    case 'closed_without_deal':
      return 'red';
    default:
      return undefined;
  }
};

export default function TeacherInquiriesListPage(): React.ReactElement {
  const accessToken = useAdminAuthStore((state) => state.accessToken);
  const [items, setItems] = useState<ITeacherInquiryRow[]>([]);
  const [meta, setMeta] = useState<IListMeta | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const {
    schema,
    schemaError,
    searchDraft,
    setSearchDraft,
    filterDraft,
    setFilterDraftValue,
    page,
    setPage,
    query,
    applyFilters,
    clearFilters,
    hasAppliedFilters,
  } = useAdminListFilters('teacher-inquiries', accessToken, PAGE_SIZE);

  const load = useCallback(async (): Promise<void> => {
    if (!accessToken) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const envelope = await apiRequest<IListPayload>('/teacher-inquiries', {
        token: accessToken,
        query,
      });
      const payload = envelope.data;
      setItems(payload?.items ?? []);
      setMeta(envelope.meta ?? null);
    } catch (err: unknown) {
      setError(err instanceof ApiCallError ? err.message : 'Failed to load teacher inquiries.');
    } finally {
      setLoading(false);
    }
  }, [accessToken, query]);

  useEffect(() => {
    void load();
  }, [load]);

  const totalPages = meta?.totalPages ?? 1;

  return (
    <div>
      <h1 className="page-title">Teacher inquiries</h1>
      <p className="meta" style={{ marginBottom: '1rem' }}>
        Teacher recruitment pipeline. Open a row to record interview notes, SWOT analysis, and finalize the teacher account.
      </p>
      <AdminListToolbar
        schema={schema}
        searchDraft={searchDraft}
        onSearchDraftChange={setSearchDraft}
        filterDraft={filterDraft}
        onFilterDraftChange={setFilterDraftValue}
        onApply={applyFilters}
        onClear={clearFilters}
        disabled={loading}
        hasAppliedFilters={hasAppliedFilters}
      />
      {schemaError ? <div className="error-banner">{schemaError}</div> : null}
      {error ? <div className="error-banner">{error}</div> : null}
      <div className="panel" style={{ padding: 0, overflow: 'auto' }}>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Candidate</th>
              <th>Phone</th>
              <th>Status</th>
              <th>Submitted</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {loading && items.length === 0 ? (
              <tr>
                <td colSpan={5} className="meta">
                  Loading…
                </td>
              </tr>
            ) : null}
            {!loading && items.length === 0 ? (
              <tr>
                <td colSpan={5} className="meta">
                  No inquiries found.
                </td>
              </tr>
            ) : null}
            {items.map((row) => {
              const id = inquiryRowId(row);
              const created = row.createdAt ? new Date(row.createdAt) : null;
              const createdLabel =
                created && !Number.isNaN(created.getTime())
                  ? created.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
                  : '—';
              const statusKey = typeof row.status === 'string' ? row.status : 'new_request';
              return (
                <tr key={id || row.fullName}>
                  <td>{row.fullName}</td>
                  <td>{row.phone}</td>
                  <td>
                    <span
                      className="badge badge-ok"
                      style={{ color: statusColor(statusKey as TeacherInquiryStatusValue) }}
                    >
                      {teacherInquiryStatusLabel(statusKey)}
                    </span>
                  </td>
                  <td className="meta">{createdLabel}</td>
                  <td>
                    <Link href={adminRoute(`/teacher-inquiries/${encodeURIComponent(id)}`)}>View</Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <PaginationBar page={page} totalPages={totalPages} disabled={loading} onPageChange={setPage} />
    </div>
  );
}
