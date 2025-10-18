import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { FunnelIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

const STATUS_OPTIONS = [
  { value: 'open', label: 'Open' },
  { value: 'awaiting_customer', label: 'Awaiting customer' },
  { value: 'under_review', label: 'Under review' },
  { value: 'settled', label: 'Settled' },
  { value: 'closed', label: 'Closed' },
];

const STAGE_OPTIONS = [
  { value: 'intake', label: 'Intake' },
  { value: 'mediation', label: 'Mediation' },
  { value: 'arbitration', label: 'Arbitration' },
  { value: 'resolved', label: 'Resolved' },
];

const PRIORITY_OPTIONS = [
  { value: 'urgent', label: 'Urgent' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
];

const SORT_OPTIONS = [
  { value: 'updatedAt', label: 'Last updated' },
  { value: 'openedAt', label: 'Date opened' },
  { value: 'priority', label: 'Priority' },
  { value: 'stage', label: 'Stage' },
  { value: 'status', label: 'Status' },
  { value: 'amount', label: 'Escrow amount' },
];

const SORT_DIRECTIONS = [
  { value: 'desc', label: 'Descending' },
  { value: 'asc', label: 'Ascending' },
];

function normaliseMultiValue(input) {
  if (!input) {
    return [];
  }
  if (Array.isArray(input)) {
    return input;
  }
  if (typeof input === 'string') {
    return input.split(',').map((item) => item.trim()).filter(Boolean);
  }
  return [];
}

export default function DisputeFiltersPanel({ value, onChange, onApply, onReset, loading, sessionUserId, title }) {
  const [draft, setDraft] = useState(() => ({
    search: '',
    status: ['open', 'awaiting_customer', 'under_review'],
    stage: [],
    priority: [],
    assignedToId: 'any',
    sortBy: 'updatedAt',
    sortDirection: 'desc',
    openOnly: true,
  }));

  useEffect(() => {
    if (!value) {
      return;
    }
    setDraft((previous) => ({
      ...previous,
      ...value,
      status: normaliseMultiValue(value.status),
      stage: normaliseMultiValue(value.stage),
      priority: normaliseMultiValue(value.priority),
    }));
  }, [value]);

  const assignedOptions = useMemo(() => {
    const options = [
      { value: 'any', label: 'All assignments' },
      { value: 'unassigned', label: 'Unassigned' },
    ];
    if (sessionUserId) {
      options.push({ value: String(sessionUserId), label: 'Assigned to me' });
    }
    return options;
  }, [sessionUserId]);

  const handleMultiChange = (event) => {
    const { name, selectedOptions } = event.target;
    const values = Array.from(selectedOptions).map((option) => option.value);
    const nextDraft = { ...draft, [name]: values };
    setDraft(nextDraft);
    onChange?.(nextDraft);
  };

  const handleChange = (event) => {
    const { name, type, checked, value: rawValue } = event.target;
    const valueToStore = type === 'checkbox' ? checked : rawValue;
    const nextDraft = { ...draft, [name]: valueToStore };
    if (name === 'assignedToId' && rawValue === 'any') {
      nextDraft.assignedToId = 'any';
    }
    setDraft(nextDraft);
    onChange?.(nextDraft);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const payload = {
      ...draft,
      status: draft.status,
      stage: draft.stage,
      priority: draft.priority,
    };
    if (draft.assignedToId === 'any') {
      delete payload.assignedToId;
    } else if (draft.assignedToId === 'unassigned') {
      payload.assignedToId = 'unassigned';
    }
    onApply?.(payload);
  };

  const handleReset = () => {
    const resetFilters = {
      search: '',
      status: ['open', 'awaiting_customer', 'under_review'],
      stage: [],
      priority: [],
      assignedToId: 'any',
      sortBy: 'updatedAt',
      sortDirection: 'desc',
      openOnly: true,
    };
    setDraft(resetFilters);
    onReset?.(resetFilters);
  };

  return (
    <form onSubmit={handleSubmit} className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <h2 className="text-base font-semibold text-slate-900">{title || 'Filters'}</h2>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
          >
            <ArrowPathIcon className="h-4 w-4" aria-hidden="true" />
            Reset
          </button>
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-full border border-blue-500 bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
            disabled={loading}
          >
            <FunnelIcon className="h-4 w-4" aria-hidden="true" />
            {loading ? 'Apply…' : 'Apply'}
          </button>
        </div>
      </div>
      <div className="mt-6 grid flex-1 gap-4 overflow-y-auto pb-6 md:grid-cols-2 xl:grid-cols-3">
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Search keywords
          <input
            type="search"
            name="search"
            value={draft.search}
            onChange={handleChange}
            placeholder="Search case, reference, or summary"
            className="rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 shadow-inner focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Status
          <select
            name="status"
            multiple
            value={draft.status}
            onChange={handleMultiChange}
            className="h-32 rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-inner focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Stage
          <select
            name="stage"
            multiple
            value={draft.stage}
            onChange={handleMultiChange}
            className="h-32 rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-inner focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
          >
            {STAGE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Priority
          <select
            name="priority"
            multiple
            value={draft.priority}
            onChange={handleMultiChange}
            className="h-32 rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-inner focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
          >
            {PRIORITY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Assignment
          <select
            name="assignedToId"
            value={draft.assignedToId}
            onChange={handleChange}
            className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-inner focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
          >
            {assignedOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            Sort by
            <select
              name="sortBy"
              value={draft.sortBy}
              onChange={handleChange}
              className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-inner focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            Direction
            <select
              name="sortDirection"
              value={draft.sortDirection}
              onChange={handleChange}
              className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-inner focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
            >
              {SORT_DIRECTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="mt-6 flex items-center gap-3 text-sm font-medium text-slate-700">
          <input
            type="checkbox"
            name="openOnly"
            checked={Boolean(draft.openOnly)}
            onChange={handleChange}
            className="h-5 w-5 rounded border border-slate-300 text-blue-600 focus:ring-blue-200"
          />
          Active only
        </label>
      </div>
    </form>
  );
}

DisputeFiltersPanel.propTypes = {
  value: PropTypes.object,
  onChange: PropTypes.func,
  onApply: PropTypes.func,
  onReset: PropTypes.func,
  loading: PropTypes.bool,
  sessionUserId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  title: PropTypes.string,
};

DisputeFiltersPanel.defaultProps = {
  value: undefined,
  onChange: undefined,
  onApply: undefined,
  onReset: undefined,
  loading: false,
  sessionUserId: null,
  title: 'Filters',
};
