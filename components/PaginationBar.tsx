'use client';

import type { ReactElement } from 'react';

interface IPaginationBarProps {
  page: number;
  totalPages: number;
  onPageChange: (nextPage: number) => void;
  disabled?: boolean;
}

export function PaginationBar(props: IPaginationBarProps): ReactElement {
  const { page, totalPages, onPageChange, disabled = false } = props;
  const canPrev = page > 1;
  const canNext = page < totalPages;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: '1rem' }}>
      <button type="button" className="btn" disabled={disabled || !canPrev} onClick={() => onPageChange(page - 1)}>
        Previous
      </button>
      <span className="meta">
        Page {page} of {totalPages}
      </span>
      <button type="button" className="btn" disabled={disabled || !canNext} onClick={() => onPageChange(page + 1)}>
        Next
      </button>
    </div>
  );
}
