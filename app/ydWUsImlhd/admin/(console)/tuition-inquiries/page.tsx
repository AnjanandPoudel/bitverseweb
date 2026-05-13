'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { ApiCallError, apiRequest, type IListMeta } from '@/lib/api';
import { adminRoute } from '@/lib/routes';
import {
  TUITION_INQUIRY_STATUSES,
  tuitionInquiryStatusLabel,
  type TuitionInquiryStatusValue,
} from '@/lib/tuition-inquiry-workflow';
import { PaginationBar } from '@/components/PaginationBar';
import { useAdminAuthStore } from '@/stores/admin-auth.store';

interface ITuitionInquiryRow {
  _id?: string;
  parentFullName?: string;
  messengerNumber?: string;
  status?: string;
  createdAt?: string;
}

interface IListPayload {
  items: ITuitionInquiryRow[];
}

const PAGE_SIZE = 10;

function inquiryRowId(row: ITuitionInquiryRow): string {
  return typeof row._id === 'string' ? row._id : '';
}

const statusColor = (status: TuitionInquiryStatusValue): string | undefined => {
  switch (status) {
    case 'new_request':
      return 'orange';
    case 'contacting_parent':
      return 'yellow';
    case 'negotiating':
      return 'skyblue';
    case 'finalized':
      return 'lightgreen';
    case 'closed_without_deal':
      return 'red';
  }
};

export default function TuitionInquiriesListPage(): React.ReactElement {
  const accessToken = useAdminAuthStore((state) => state.accessToken);
  const [items, setItems] = useState<ITuitionInquiryRow[]>([]);
  const [meta, setMeta] = useState<IListMeta | null>(null);
  const [page, setPage] = useState(1);
  const [searchDraft, setSearchDraft] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<TuitionInquiryStatusValue | ''>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (): Promise<void> => {
    if (!accessToken) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const envelope = await apiRequest<IListPayload>('/tuition-inquiries', {
        token: accessToken,
        query: {
          page,
          limit: PAGE_SIZE,
          search: search || undefined,
          status: statusFilter || undefined,
        },
      });
      const payload = envelope.data;
      setItems(payload?.items ?? []);
      setMeta(envelope.meta ?? null);
    } catch (err: unknown) {
      setError(err instanceof ApiCallError ? err.message : 'Failed to load tuition inquiries.');
    } finally {
      setLoading(false);
    }
  }, [accessToken, page, search, statusFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  const totalPages = meta?.totalPages ?? 1;

  return (
    <div>
      <h1 className="page-title">Tuition inquiries</h1>
      <p className="meta" style={{ marginBottom: '1rem' }}>
        Online tuition leads from the public form. Open a row to update status and internal notes for your team.
      </p>
      <div className="toolbar">
        <div className="field" style={{ flex: '1 1 200px', marginBottom: 0 }}>
          <label htmlFor="inq-search">Search</label>
          <input
            id="inq-search"
            value={searchDraft}
            onChange={(event) => setSearchDraft(event.target.value)}
            placeholder="Parent name, messenger, students"
          />
        </div>
        <div className="field" style={{ flex: '0 1 200px', marginBottom: 0 }}>
          <label htmlFor="inq-status">Status</label>
          <select
            id="inq-status"
            value={statusFilter}
            style={{ color: statusColor(statusFilter as TuitionInquiryStatusValue), border: '1px solid #2d3a4a', margin: '0.5rem', padding: '0.5rem 0.65rem' }}
            onChange={(event) => {
              setStatusFilter(event.target.value as TuitionInquiryStatusValue | '');
              setPage(1);
            }}
          >
            <option value="">All</option>
            {TUITION_INQUIRY_STATUSES.map((value) => (
              <option key={value} value={value}>
                {tuitionInquiryStatusLabel(value)}
              </option>
            ))}
          </select>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => {
            setSearch(searchDraft.trim());
            setPage(1);
          }}
        >
          Apply
        </button>
      </div>
      {error && <div className="error-banner">{error}</div>}
      <div className="panel" style={{ padding: 0, overflow: 'auto' }}>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Parent</th>
              <th>Messenger</th>
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
                <tr key={id || row.parentFullName}>
                  <td>{row.parentFullName}</td>
                  <td>{row.messengerNumber}</td>
                  <td>
                    <span className="badge badge-ok" style={{ color: statusColor(statusKey as TuitionInquiryStatusValue) }}>{tuitionInquiryStatusLabel(statusKey)}</span>
                  </td>
                  <td className="meta">{createdLabel}</td>
                  <td>
                    <Link href={adminRoute(`/tuition-inquiries/${encodeURIComponent(id)}`)}>View</Link>
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
