'use client';

import type { AdminFilterValues, IAdminFilterField } from '@/lib/admin-filter.types';

interface IAdminFilterPanelProps {
  fields: IAdminFilterField[];
  values: AdminFilterValues;
  onChange: (key: string, value: string) => void;
  disabled?: boolean;
}

export const AdminFilterPanel = ({
  fields,
  values,
  onChange,
  disabled = false,
}: IAdminFilterPanelProps): React.ReactElement | null => {
  if (fields.length === 0) {
    return null;
  }

  return (
    <div className="admin-filter-panel">
      {fields.map((field) => {
        if (field.type === 'range') {
          const minKey = `${field.key}Min`;
          const maxKey = `${field.key}Max`;
          return (
            <div key={field.key} className="field admin-filter-panel__range">
              <label htmlFor={`filter-${field.key}-min`}>{field.label}</label>
              <div className="admin-filter-panel__range-inputs">
                <input
                  id={`filter-${field.key}-min`}
                  type="number"
                  min={field.min}
                  max={field.max}
                  value={values[minKey] ?? ''}
                  disabled={disabled}
                  placeholder="Min"
                  onChange={(event) => onChange(minKey, event.target.value)}
                />
                <span className="admin-filter-panel__range-separator">to</span>
                <input
                  id={`filter-${field.key}-max`}
                  type="number"
                  min={field.min}
                  max={field.max}
                  value={values[maxKey] ?? ''}
                  disabled={disabled}
                  placeholder="Max"
                  onChange={(event) => onChange(maxKey, event.target.value)}
                />
              </div>
            </div>
          );
        }

        if (field.type === 'select') {
          return (
            <div key={field.key} className="field">
              <label htmlFor={`filter-${field.key}`}>{field.label}</label>
              <select
                id={`filter-${field.key}`}
                value={values[field.key] ?? ''}
                disabled={disabled}
                onChange={(event) => onChange(field.key, event.target.value)}
              >
                <option value="">All</option>
                {field.options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          );
        }

        return (
          <div key={field.key} className="field">
            <label htmlFor={`filter-${field.key}`}>{field.label}</label>
            <input
              id={`filter-${field.key}`}
              type="text"
              value={values[field.key] ?? ''}
              disabled={disabled}
              placeholder={field.placeholder ?? field.label}
              onChange={(event) => onChange(field.key, event.target.value)}
            />
          </div>
        );
      })}
    </div>
  );
};
