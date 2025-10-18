import { useMemo } from 'react';

function StatusToggle({ value, label, active, onToggle }) {
  return (
    <button
      type="button"
      onClick={() => onToggle(value)}
      className={`rounded-full border px-3 py-1 text-sm font-medium transition ${
        active
          ? 'border-sky-300 bg-sky-100 text-sky-800 shadow-sm'
          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
      }`}
    >
      {label}
    </button>
  );
}

export default function MentoringSessionFilters({ filters, catalog, onChange, onReset, loading }) {
  const statuses = catalog?.statuses ?? [];
  const mentors = useMemo(() => catalog?.mentors ?? [], [catalog?.mentors]);
  const mentees = useMemo(() => catalog?.mentees ?? [], [catalog?.mentees]);
  const owners = useMemo(() => catalog?.owners ?? [], [catalog?.owners]);
  const serviceLines = useMemo(() => catalog?.serviceLines ?? [], [catalog?.serviceLines]);

  const selectedStatuses = useMemo(() => new Set((filters?.status ?? []).map((value) => value.toLowerCase())), [filters?.status]);

  const handleStatusToggle = (value) => {
    const normalized = `${value}`.toLowerCase();
    const next = new Set(selectedStatuses);
    if (next.has(normalized)) {
      next.delete(normalized);
    } else {
      next.add(normalized);
    }
    onChange?.({ status: Array.from(next) });
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    onChange?.({ [name]: value || undefined });
  };

  return (
    <div className="flex flex-col gap-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-lg shadow-blue-100/20">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-base font-semibold text-slate-900">Filters</h3>
        <button
          type="button"
          onClick={() => onReset?.()}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600 hover:border-slate-300"
        >
          Reset
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {statuses.map((status) => (
          <StatusToggle
            key={status.value}
            value={status.value}
            label={status.label}
            active={selectedStatuses.has(status.value.toLowerCase())}
            onToggle={handleStatusToggle}
          />
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <label className="flex flex-col gap-1 text-sm text-slate-600">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Mentor</span>
          <select
            name="mentorId"
            value={filters?.mentorId ?? ''}
            onChange={handleInputChange}
            className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
            disabled={loading}
          >
            <option value="">All mentors</option>
            {mentors.map((mentor) => (
              <option key={mentor.id} value={mentor.id}>
                {mentor.firstName} {mentor.lastName}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm text-slate-600">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Mentee</span>
          <select
            name="menteeId"
            value={filters?.menteeId ?? ''}
            onChange={handleInputChange}
            className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
            disabled={loading}
          >
            <option value="">All mentees</option>
            {mentees.map((mentee) => (
              <option key={mentee.id} value={mentee.id}>
                {mentee.firstName} {mentee.lastName}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm text-slate-600">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Service line</span>
          <select
            name="serviceLineId"
            value={filters?.serviceLineId ?? ''}
            onChange={handleInputChange}
            className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
            disabled={loading}
          >
            <option value="">All service lines</option>
            {serviceLines.map((line) => (
              <option key={line.id ?? line.slug} value={line.id ?? ''}>
                {line.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm text-slate-600">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Admin owner</span>
          <select
            name="ownerId"
            value={filters?.ownerId ?? ''}
            onChange={handleInputChange}
            className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
            disabled={loading}
          >
            <option value="">All admins</option>
            {owners.map((owner) => (
              <option key={owner.id} value={owner.id}>
                {owner.firstName} {owner.lastName}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm text-slate-600">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">From</span>
          <input
            type="date"
            name="from"
            value={filters?.from ?? ''}
            onChange={handleInputChange}
            className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
            disabled={loading}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-slate-600">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">To</span>
          <input
            type="date"
            name="to"
            value={filters?.to ?? ''}
            onChange={handleInputChange}
            className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
            disabled={loading}
          />
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-[2fr,1fr]">
        <label className="flex flex-col gap-1 text-sm text-slate-600">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Search</span>
          <input
            type="search"
            name="search"
            value={filters?.search ?? ''}
            onChange={handleInputChange}
            placeholder="Search by topic, mentor, mentee, or meeting provider"
            className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
            disabled={loading}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-slate-600">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Sort by</span>
          <select
            name="sort"
            value={filters?.sort ?? 'scheduledAt:desc'}
            onChange={handleInputChange}
            className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
            disabled={loading}
          >
            <option value="scheduledAt:desc">Latest first</option>
            <option value="scheduledAt:asc">Earliest first</option>
            <option value="status:asc">Status (A → Z)</option>
            <option value="createdAt:desc">Created (latest)</option>
          </select>
        </label>
      </div>
    </div>
  );
}
