import { useState } from 'react';
import PropTypes from 'prop-types';
import { PlusIcon, PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline';

const DEFAULT_FORM = {
  volunteerId: '',
  fullName: '',
  email: '',
  phone: '',
  status: 'invited',
  notes: '',
  checkInAt: '',
  checkOutAt: '',
};

const STATUS_OPTIONS = ['invited', 'confirmed', 'checked_in', 'checked_out', 'declined', 'no_show'];

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

export default function VolunteeringAssignmentsPanel({
  selectedShift,
  assignments,
  loading,
  onReload,
  onCreate,
  onUpdate,
  onDelete,
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const openDrawer = (assignment = null) => {
    if (assignment) {
      setForm({
        volunteerId: assignment.volunteerId ?? '',
        fullName: assignment.fullName ?? '',
        email: assignment.email ?? '',
        phone: assignment.phone ?? '',
        status: assignment.status ?? 'invited',
        notes: assignment.notes ?? '',
        checkInAt: assignment.checkInAt ? assignment.checkInAt.slice(0, 16) : '',
        checkOutAt: assignment.checkOutAt ? assignment.checkOutAt.slice(0, 16) : '',
      });
      setEditingId(assignment.id);
    } else {
      setForm(DEFAULT_FORM);
      setEditingId(null);
    }
    setError('');
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
    if (!selectedShift) {
      setError('Choose a shift first.');
      return;
    }
    setSubmitting(true);
    setError('');
    const payload = {
      ...form,
      volunteerId: form.volunteerId ? Number(form.volunteerId) : undefined,
    };
    try {
      if (editingId) {
        await onUpdate(selectedShift.id, editingId, payload);
      } else {
        await onCreate(selectedShift.id, payload);
      }
      await onReload(selectedShift.id);
      setSubmitting(false);
      setDrawerOpen(false);
    } catch (err) {
      setSubmitting(false);
      setError(err?.message ?? 'Unable to save assignment.');
    }
  };

  const handleDelete = async (assignmentId) => {
    if (!window.confirm('Remove this volunteer?')) {
      return;
    }
    try {
      await onDelete(selectedShift.id, assignmentId);
      await onReload(selectedShift.id);
    } catch (err) {
      setError(err?.message ?? 'Unable to remove volunteer.');
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">People</h2>
          {selectedShift ? (
            <p className="text-sm text-slate-500">{selectedShift.title}</p>
          ) : (
            <p className="text-sm text-slate-400">Select a shift to manage volunteers.</p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => (selectedShift ? openDrawer(null) : setError('Choose a shift first.'))}
            className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-slate-800"
            disabled={!selectedShift}
          >
            <PlusIcon className="h-4 w-4" aria-hidden="true" />
            Invite
          </button>
          <button
            type="button"
            onClick={() => selectedShift && onReload(selectedShift.id)}
            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
            disabled={!selectedShift}
          >
            Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-20 animate-pulse rounded-2xl bg-slate-100" />
          ))}
        </div>
      ) : selectedShift ? (
        <div className="space-y-3">
          {assignments.map((assignment) => (
            <div
              key={assignment.id}
              className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{assignment.fullName ?? 'Unassigned'}</p>
                  <p className="text-xs text-slate-500">{assignment.email ?? 'No email'}</p>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase text-slate-500">
                  {assignment.status}
                </span>
              </div>
              <div className="flex flex-wrap gap-3 text-xs text-slate-500">
                {assignment.phone ? <span>{assignment.phone}</span> : null}
                {assignment.checkInAt ? <span>In {assignment.checkInAt.slice(0, 16)}</span> : null}
                {assignment.checkOutAt ? <span>Out {assignment.checkOutAt.slice(0, 16)}</span> : null}
              </div>
              {assignment.notes ? <p className="text-xs text-slate-500">{assignment.notes}</p> : null}
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => openDrawer(assignment)}
                  className="rounded-full border border-slate-200 p-1 text-slate-500 hover:bg-slate-100"
                >
                  <PencilSquareIcon className="h-4 w-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(assignment.id)}
                  className="rounded-full border border-red-200 p-1 text-red-500 hover:bg-red-50"
                >
                  <TrashIcon className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          ))}
          {!assignments.length ? (
            <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-400">
              Invite volunteers to fill this shift.
            </div>
          ) : null}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-400">
          Select a shift to see assignments.
        </div>
      )}

      {error ? <p className="text-sm font-semibold text-red-600">{error}</p> : null}

      <Drawer open={drawerOpen} title={editingId ? 'Update volunteer' : 'Invite volunteer'} onClose={closeDrawer}>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Full name
            <input
              name="fullName"
              value={form.fullName}
              onChange={handleChange}
              required={!form.volunteerId}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </label>
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Email
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </label>
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Phone
            <input
              name="phone"
              value={form.phone}
              onChange={handleChange}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </label>
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Status
            <select
              name="status"
              value={form.status}
              onChange={handleChange}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Check-in
              <input
                name="checkInAt"
                type="datetime-local"
                value={form.checkInAt}
                onChange={handleChange}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </label>
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Check-out
              <input
                name="checkOutAt"
                type="datetime-local"
                value={form.checkOutAt}
                onChange={handleChange}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </label>
          </div>
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Notes
            <textarea
              name="notes"
              rows="3"
              value={form.notes}
              onChange={handleChange}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </label>
          <div className="flex items-center justify-end gap-2">
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

VolunteeringAssignmentsPanel.propTypes = {
  selectedShift: PropTypes.object,
  assignments: PropTypes.arrayOf(PropTypes.object).isRequired,
  loading: PropTypes.bool,
  onReload: PropTypes.func.isRequired,
  onCreate: PropTypes.func.isRequired,
  onUpdate: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
};
