import { useMemo, useState } from 'react';
import { FunnelIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { classNames } from '../../../utils/classNames.js';

const CHANNEL_OPTIONS = [
  { value: 'support', label: 'Support' },
  { value: 'project', label: 'Project' },
  { value: 'contract', label: 'Contract' },
  { value: 'group', label: 'Group' },
  { value: 'direct', label: 'Direct' },
];

const STATE_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'archived', label: 'Archived' },
  { value: 'locked', label: 'Locked' },
];

const SUPPORT_STATUS_OPTIONS = [
  { value: 'triage', label: 'Triage' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'waiting_on_customer', label: 'Waiting' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
];

const SUPPORT_PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

function TogglePill({ active, label, onClick, tone = 'default' }) {
  const toneClasses = {
    default: active
      ? 'bg-accent text-white shadow-soft'
      : 'border border-slate-200 bg-white text-slate-600 hover:border-accent/60 hover:text-accent',
    neutral: active
      ? 'bg-slate-900 text-white shadow-soft'
      : 'border border-slate-200 bg-white text-slate-600 hover:border-slate-400 hover:text-slate-800',
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={classNames('rounded-full px-3 py-1 text-xs font-semibold transition', toneClasses[tone] ?? toneClasses.default)}
    >
      {label}
    </button>
  );
}

export default function AdminInboxFilters({ filters, onChange, labels, agents, onReset }) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const assignedOptions = useMemo(
    () => [{ value: '', label: 'All' }, ...agents.map((agent) => ({
      value: agent.id,
      label: `${agent.firstName ?? ''} ${agent.lastName ?? ''}`.trim() || agent.email,
    }))],
    [agents],
  );

  const selectedLabelIds = new Set(filters.labelIds ?? []);

  const handleChange = (key, value) => {
    onChange({ [key]: value });
  };

  const toggleMulti = (key, value) => {
    const current = new Set(filters[key] ?? []);
    if (current.has(value)) {
      current.delete(value);
    } else {
      current.add(value);
    }
    onChange({ [key]: Array.from(current) });
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="admin-inbox-search">
            Search
          </label>
          <input
            id="admin-inbox-search"
            type="search"
            value={filters.search ?? ''}
            onChange={(event) => handleChange('search', event.target.value)}
            placeholder="Keyword"
            className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="admin-inbox-assigned">
            Assignee
          </label>
          <select
            id="admin-inbox-assigned"
            value={filters.assignedTo ?? ''}
            onChange={(event) => handleChange('assignedTo', event.target.value || null)}
            className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          >
            {assignedOptions.map((option) => (
              <option key={option.value ?? 'all'} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Channel</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {CHANNEL_OPTIONS.map((option) => {
              const active = (filters.channelTypes ?? []).includes(option.value);
              return (
                <TogglePill
                  key={option.value}
                  label={option.label}
                  active={active}
                  onClick={() => toggleMulti('channelTypes', option.value)}
                />
              );
            })}
          </div>
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">State</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {STATE_OPTIONS.map((option) => {
              const active = (filters.states ?? []).includes(option.value);
              return (
                <TogglePill
                  key={option.value}
                  label={option.label}
                  active={active}
                  onClick={() => toggleMulti('states', option.value)}
                  tone="neutral"
                />
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <TogglePill
          label="Unassigned"
          active={Boolean(filters.unassignedOnly)}
          onClick={() => handleChange('unassignedOnly', !filters.unassignedOnly)}
        />
        <TogglePill
          label="Escalated"
          active={Boolean(filters.escalatedOnly)}
          onClick={() => handleChange('escalatedOnly', !filters.escalatedOnly)}
        />
        <TogglePill
          label={filters.hasSupportCase === true ? 'Case' : filters.hasSupportCase === false ? 'No case' : 'Case filter'}
          active={filters.hasSupportCase !== null}
          onClick={() => {
            const next = filters.hasSupportCase === null ? true : filters.hasSupportCase === true ? false : null;
            handleChange('hasSupportCase', next);
          }}
        />
        <button
          type="button"
          onClick={() => setShowAdvanced((prev) => !prev)}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-accent/60 hover:text-accent"
        >
          <FunnelIcon className="h-4 w-4" /> {showAdvanced ? 'Basic' : 'More'}
        </button>
        {filters.search ? (
          <button
            type="button"
            onClick={() => handleChange('search', '')}
            className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-rose-200 hover:text-rose-500"
          >
            <XMarkIcon className="h-3 w-3" /> Clear search
          </button>
        ) : null}
      </div>

      {showAdvanced ? (
        <div className="space-y-4 rounded-3xl border border-slate-100 bg-slate-50/70 p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Support</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {SUPPORT_STATUS_OPTIONS.map((option) => {
                  const active = (filters.supportStatuses ?? []).includes(option.value);
                  return (
                    <TogglePill
                      key={option.value}
                      label={option.label}
                      active={active}
                      onClick={() => toggleMulti('supportStatuses', option.value)}
                    />
                  );
                })}
              </div>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Priority</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {SUPPORT_PRIORITY_OPTIONS.map((option) => {
                  const active = (filters.supportPriorities ?? []).includes(option.value);
                  return (
                    <TogglePill
                      key={option.value}
                      label={option.label}
                      active={active}
                      onClick={() => toggleMulti('supportPriorities', option.value)}
                    />
                  );
                })}
              </div>
            </div>
          </div>

          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Labels</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {labels.map((label) => {
                const active = selectedLabelIds.has(String(label.id));
                return (
                  <button
                    key={label.id}
                    type="button"
                    onClick={() => toggleMulti('labelIds', String(label.id))}
                    className={classNames(
                      'rounded-full px-3 py-1 text-xs font-semibold transition',
                      active
                        ? 'shadow-soft'
                        : 'border border-slate-200 bg-white text-slate-600 hover:border-accent/60 hover:text-accent',
                    )}
                    style={{
                      backgroundColor: active ? label.color ?? '#2563eb' : 'transparent',
                      color: active ? '#fff' : undefined,
                      borderColor: label.color ?? undefined,
                    }}
                  >
                    {label.name}
                  </button>
                );
              })}
              {!labels.length ? (
                <span className="text-xs text-slate-500">No labels</span>
              ) : null}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="admin-inbox-from">
                From
              </label>
              <input
                id="admin-inbox-from"
                type="date"
                value={filters.dateFrom ?? ''}
                onChange={(event) => handleChange('dateFrom', event.target.value || null)}
                className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="admin-inbox-to">
                To
              </label>
              <input
                id="admin-inbox-to"
                type="date"
                value={filters.dateTo ?? ''}
                onChange={(event) => handleChange('dateTo', event.target.value || null)}
                className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </div>
          </div>
        </div>
      ) : null}

      <div className="flex justify-end">
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:border-rose-200 hover:text-rose-500"
        >
          Reset
        </button>
      </div>
    </div>
  );
}
