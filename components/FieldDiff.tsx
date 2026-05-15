'use client';

import { useState } from 'react';

type JsonValue = unknown;

interface IFieldDiffProps {
  previousState: Record<string, JsonValue> | null;
  nextState: Record<string, JsonValue> | null;
  /** When true the diff is always expanded; no toggle button is rendered. */
  alwaysExpanded?: boolean;
}

const IGNORED_KEYS = new Set(['__v', 'updatedAt']);

function formatValue(value: JsonValue): string {
  if (value === null || value === undefined) return '—';
  if (Array.isArray(value)) return value.join(', ') || '—';
  if (typeof value === 'object') return JSON.stringify(value);
  if (typeof value === 'string' && value.trim() === '') return '(empty)';
  return String(value);
}

function humanKey(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (c) => c.toUpperCase())
    .replace(/_/g, ' ')
    .trim();
}

interface IDiffLine {
  key: string;
  label: string;
  type: 'added' | 'removed' | 'changed' | 'unchanged';
  before: string;
  after: string;
}

function buildDiffLines(
  prev: Record<string, JsonValue> | null,
  next: Record<string, JsonValue> | null,
): IDiffLine[] {
  const allKeys = new Set([...Object.keys(prev ?? {}), ...Object.keys(next ?? {})]);
  const lines: IDiffLine[] = [];

  for (const key of allKeys) {
    if (IGNORED_KEYS.has(key)) continue;
    const beforeVal = prev ? prev[key] : undefined;
    const afterVal = next ? next[key] : undefined;
    const before = formatValue(beforeVal);
    const after = formatValue(afterVal);

    if (prev === null) {
      lines.push({ key, label: humanKey(key), type: 'added', before: '—', after });
    } else if (next === null) {
      lines.push({ key, label: humanKey(key), type: 'removed', before, after: '—' });
    } else if (JSON.stringify(beforeVal) !== JSON.stringify(afterVal)) {
      lines.push({ key, label: humanKey(key), type: 'changed', before, after });
    }
  }

  return lines;
}

const STYLES = {
  added: {
    row: { background: 'rgba(34,197,94,0.08)', borderLeft: '3px solid #22c55e' } as React.CSSProperties,
    badge: { background: '#22c55e', color: '#fff', fontSize: '0.7rem', padding: '1px 5px', borderRadius: 4, fontWeight: 700 } as React.CSSProperties,
  },
  removed: {
    row: { background: 'rgba(239,68,68,0.08)', borderLeft: '3px solid #ef4444' } as React.CSSProperties,
    badge: { background: '#ef4444', color: '#fff', fontSize: '0.7rem', padding: '1px 5px', borderRadius: 4, fontWeight: 700 } as React.CSSProperties,
  },
  changed: {
    row: { background: 'rgba(234,179,8,0.07)', borderLeft: '3px solid #eab308' } as React.CSSProperties,
    badge: { background: '#eab308', color: '#000', fontSize: '0.7rem', padding: '1px 5px', borderRadius: 4, fontWeight: 700 } as React.CSSProperties,
  },
  unchanged: {
    row: {} as React.CSSProperties,
    badge: {} as React.CSSProperties,
  },
};

export function FieldDiff({ previousState, nextState, alwaysExpanded = false }: IFieldDiffProps): React.ReactElement {
  const [expanded, setExpanded] = useState(alwaysExpanded);
  const lines = buildDiffLines(previousState, nextState);

  const changedCount = lines.filter((l) => l.type !== 'unchanged').length;

  if (changedCount === 0) {
    return (
      <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>No field changes recorded.</span>
    );
  }

  const isMinimal = changedCount === 1;

  if (isMinimal || alwaysExpanded) {
    return <DiffTable lines={lines} />;
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        style={{
          background: 'none',
          border: '1px solid var(--border)',
          borderRadius: 6,
          padding: '3px 10px',
          cursor: 'pointer',
          fontSize: '0.8rem',
          color: 'var(--text)',
          marginBottom: expanded ? 8 : 0,
        }}
      >
        {expanded ? '▲ Hide diff' : `▼ Show ${changedCount} changes`}
      </button>
      {expanded && <DiffTable lines={lines} />}
    </div>
  );
}

interface IDiffTableProps {
  lines: IDiffLine[];
}

function DiffTable({ lines }: IDiffTableProps): React.ReactElement {
  return (
    <table
      style={{
        width: '100%',
        borderCollapse: 'collapse',
        fontSize: '0.82rem',
        tableLayout: 'fixed',
      }}
    >
      <colgroup>
        <col style={{ width: '140px' }} />
        <col style={{ width: '80px' }} />
        <col />
        <col />
      </colgroup>
      <thead>
        <tr style={{ borderBottom: '1px solid var(--border)' }}>
          <th style={{ textAlign: 'left', padding: '4px 8px', color: 'var(--muted)', fontWeight: 600 }}>Field</th>
          <th style={{ textAlign: 'left', padding: '4px 8px', color: 'var(--muted)', fontWeight: 600 }}>Change</th>
          <th style={{ textAlign: 'left', padding: '4px 8px', color: '#ef4444', fontWeight: 600 }}>Before</th>
          <th style={{ textAlign: 'left', padding: '4px 8px', color: '#22c55e', fontWeight: 600 }}>After</th>
        </tr>
      </thead>
      <tbody>
        {lines.map((line) => {
          const s = STYLES[line.type];
          return (
            <tr key={line.key} style={{ ...s.row, borderBottom: '1px solid var(--border)' }}>
              <td style={{ padding: '5px 8px', fontWeight: 500, wordBreak: 'break-word' }}>{line.label}</td>
              <td style={{ padding: '5px 8px' }}>
                <span style={s.badge}>{line.type.toUpperCase()}</span>
              </td>
              <td
                style={{
                  padding: '5px 8px',
                  color: line.type === 'removed' || line.type === 'changed' ? '#ef4444' : 'var(--muted)',
                  wordBreak: 'break-word',
                  textDecoration: line.type === 'changed' ? 'line-through' : undefined,
                  opacity: line.type === 'added' ? 0.4 : 1,
                }}
              >
                {line.before}
              </td>
              <td
                style={{
                  padding: '5px 8px',
                  color: line.type === 'added' || line.type === 'changed' ? '#22c55e' : 'var(--muted)',
                  wordBreak: 'break-word',
                  fontWeight: line.type === 'changed' || line.type === 'added' ? 600 : undefined,
                  opacity: line.type === 'removed' ? 0.4 : 1,
                }}
              >
                {line.after}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
