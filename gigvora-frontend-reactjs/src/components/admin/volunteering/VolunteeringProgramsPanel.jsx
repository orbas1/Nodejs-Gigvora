import { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { PlusIcon, PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline';

const EMPTY_FORM = {
  name: '',
  summary: '',
  status: 'draft',
  contactEmail: '',
  contactPhone: '',
  location: '',
  startsAt: '',
  endsAt: '',
  maxVolunteers: '',
  tags: '',
};

function Drawer({ open, title, children, onClose }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-stretch justify-end bg-slate-900/40 backdrop-blur-sm">
      <div className="h-full w-full max-w-xl overflow-y-auto bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 px-3 py-1 text-sm font-semibold text-slate-500 hover:bg-slate-50"
          >
            Close
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

Drawer.propTypes = {
  open: PropTypes.bool.isRequired,
  title: PropTypes.string.isRequired,
  children: PropTypes.node,
  onClose: PropTypes.func.isRequired,
};

export default function VolunteeringProgramsPanel({ programs, loading, onReload, onCreate, onUpdate, onDelete, onSelect }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');

  const statusCounts = useMemo(() => {
    return programs.reduce((acc, program) => {
      const key = program.status ?? 'draft';
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {});
  }, [programs]);

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setError('');
    setStatus('');
    setDrawerOpen(true);
  };

  const openEdit = (program) => {
    setForm({
      name: program.name ?? '',
      summary: program.summary ?? '',
      status: program.status ?? 'draft',
      contactEmail: program.contactEmail ?? '',
      contactPhone: program.contactPhone ?? '',
      location: program.location ?? '',
      startsAt: program.startsAt ? program.startsAt.slice(0, 10) : '',
      endsAt: program.endsAt ? program.endsAt.slice(0, 10) : '',
      maxVolunteers: program.maxVolunteers ?? '',
      tags: Array.isArray(program.tags) ? program.tags.join(', ') : '',
    });
    setEditingId(program.id);
    setError('');
    setStatus('');
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    if (submitting) return;
    setDrawerOpen(false);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    setStatus('');
    try {
      const payload = {
        ...form,
        maxVolunteers: form.maxVolunteers === '' ? undefined : Number(form.maxVolunteers),
        tags: form.tags
          ? form.tags
              .split(',')
              .map((tag) => tag.trim())
              .filter(Boolean)
          : [],
      };
      if (editingId) {
        await onUpdate(editingId, payload);
        setStatus('Program updated');
      } else {
        await onCreate(payload);
        setStatus('Program created');
      }
      await onReload();
      setSubmitting(false);
      setDrawerOpen(false);
    } catch (err) {
      setSubmitting(false);
      setError(err?.message ?? 'Unable to save program.');
    }
  };

  const handleDelete = async (programId) => {
    if (!window.confirm('Remove this program? This cannot be undone.')) {
      return;
    }
    try {
      await onDelete(programId);
      await onReload();
    } catch (err) {
      setError(err?.message ?? 'Unable to remove program.');
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-slate-900">Programs</h2>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-slate-800"
          >
            <PlusIcon className="h-4 w-4" aria-hidden="true" />
            Add
          </button>
          <button
            type="button"
            onClick={onReload}
            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
          >
            Refresh
          </button>
        </div>
      </div>

      {Object.keys(statusCounts).length ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Object.entries(statusCounts).map(([key, count]) => (
            <div key={key} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{key}</p>
              <p className="mt-2 text-xl font-semibold text-slate-900">{count}</p>
            </div>
          ))}
        </div>
      ) : null}

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-36 animate-pulse rounded-2xl bg-slate-100" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {programs.map((program) => (
            <button
              type="button"
              key={program.id}
              onClick={() => onSelect?.(program)}
              className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-slate-300 hover:shadow"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-base font-semibold text-slate-900">{program.name}</p>
                  <p className="text-xs uppercase tracking-wide text-slate-400">{program.status}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      openEdit(program);
                    }}
                    className="rounded-full border border-slate-200 p-1 text-slate-500 hover:bg-slate-100"
                  >
                    <PencilSquareIcon className="h-4 w-4" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      handleDelete(program.id);
                    }}
                    className="rounded-full border border-red-100 p-1 text-red-500 hover:bg-red-50"
                  >
                    <TrashIcon className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              </div>
              {program.summary ? (
                <p className="mt-3 line-clamp-3 text-sm text-slate-500">{program.summary}</p>
              ) : (
                <p className="mt-3 text-sm text-slate-400">No summary yet.</p>
              )}
              <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-500">
                {program.location ? <span>{program.location}</span> : null}
                {program.startsAt ? <span>Start {program.startsAt.slice(0, 10)}</span> : null}
                {program.endsAt ? <span>End {program.endsAt.slice(0, 10)}</span> : null}
                <span>{program.roleCount} roles</span>
                <span>{program.shiftCount} shifts</span>
              </div>
            </button>
          ))}
          {!programs.length ? (
            <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-400">
              Create a program to organise volunteering work.
            </div>
          ) : null}
        </div>
      )}

      {status ? <p className="text-sm font-semibold text-emerald-600">{status}</p> : null}
      {error ? <p className="text-sm font-semibold text-red-600">{error}</p> : null}

      <Drawer open={drawerOpen} title={editingId ? 'Edit program' : 'New program'} onClose={closeDrawer}>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="name" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Name
            </label>
            <input
              id="name"
              name="name"
              required
              value={form.name}
              onChange={handleChange}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>
          <div>
            <label htmlFor="summary" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Summary
            </label>
            <textarea
              id="summary"
              name="summary"
              rows="3"
              value={form.summary}
              onChange={handleChange}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="status" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Status
              </label>
              <select
                id="status"
                name="status"
                value={form.status}
                onChange={handleChange}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
              >
                <option value="draft">draft</option>
                <option value="active">active</option>
                <option value="paused">paused</option>
                <option value="archived">archived</option>
              </select>
            </div>
            <div>
              <label htmlFor="location" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Location
              </label>
              <input
                id="location"
                name="location"
                value={form.location}
                onChange={handleChange}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="startsAt" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Start date
              </label>
              <input
                id="startsAt"
                name="startsAt"
                type="date"
                value={form.startsAt}
                onChange={handleChange}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
            <div>
              <label htmlFor="endsAt" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                End date
              </label>
              <input
                id="endsAt"
                name="endsAt"
                type="date"
                value={form.endsAt}
                onChange={handleChange}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="contactEmail" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Email
              </label>
              <input
                id="contactEmail"
                name="contactEmail"
                type="email"
                value={form.contactEmail}
                onChange={handleChange}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
            <div>
              <label htmlFor="contactPhone" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Phone
              </label>
              <input
                id="contactPhone"
                name="contactPhone"
                value={form.contactPhone}
                onChange={handleChange}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="maxVolunteers" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Capacity
              </label>
              <input
                id="maxVolunteers"
                name="maxVolunteers"
                type="number"
                min="0"
                value={form.maxVolunteers}
                onChange={handleChange}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
            <div>
              <label htmlFor="tags" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Tags
              </label>
              <input
                id="tags"
                name="tags"
                placeholder="community, youth"
                value={form.tags}
                onChange={handleChange}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={closeDrawer}
              className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-50"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-slate-800"
              disabled={submitting}
            >
              {submitting ? 'Saving…' : 'Save'}
            </button>
          </div>
          {error ? <p className="text-sm font-semibold text-red-600">{error}</p> : null}
        </form>
      </Drawer>
    </div>
  );
}

VolunteeringProgramsPanel.propTypes = {
  programs: PropTypes.arrayOf(PropTypes.object).isRequired,
  loading: PropTypes.bool,
  onReload: PropTypes.func.isRequired,
  onCreate: PropTypes.func.isRequired,
  onUpdate: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onSelect: PropTypes.func,
};
