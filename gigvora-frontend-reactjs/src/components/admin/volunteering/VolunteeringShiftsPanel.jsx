import { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { PlusIcon, PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline';

const DEFAULT_FORM = {
  title: '',
  shiftDate: '',
  startTime: '',
  endTime: '',
  timezone: '',
  location: '',
  status: 'planned',
  capacity: '',
  reserved: '',
  notes: '',
  requirements: '',
};

const STATUS_OPTIONS = ['planned', 'open', 'locked', 'complete', 'cancelled'];

function Drawer({ open, title, children, onClose }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-stretch justify-end bg-slate-900/40 backdrop-blur-sm">
      <div className="h-full w-full max-w-2xl overflow-y-auto bg-white shadow-2xl">
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

export default function VolunteeringShiftsPanel({
  roles,
  selectedRoleId,
  onSelectRole,
  shifts,
  loading,
  onReload,
  onCreate,
  onUpdate,
  onDelete,
  onSelectShift,
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const selectedRole = useMemo(() => roles.find((role) => role.id === selectedRoleId) ?? null, [roles, selectedRoleId]);

  const openDrawer = (shift = null) => {
    if (!selectedRoleId) {
      setError('Select a role first.');
      return;
    }
    if (shift) {
      setForm({
        title: shift.title ?? '',
        shiftDate: shift.shiftDate ?? '',
        startTime: shift.startTime ?? '',
        endTime: shift.endTime ?? '',
        timezone: shift.timezone ?? '',
        location: shift.location ?? '',
        status: shift.status ?? 'planned',
        capacity: shift.capacity ?? '',
        reserved: shift.reserved ?? '',
        notes: shift.notes ?? '',
        requirements: Array.isArray(shift.requirements) ? shift.requirements.map((item) => item.label || '').join('\n') : '',
      });
      setEditingId(shift.id);
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
    if (!selectedRoleId) {
      setError('Select a role first.');
      return;
    }
    setSubmitting(true);
    setError('');
    const payload = {
      ...form,
      capacity: form.capacity === '' ? undefined : Number(form.capacity),
      reserved: form.reserved === '' ? undefined : Number(form.reserved),
      requirements: form.requirements
        ? form.requirements
            .split('\n')
            .map((value) => value.trim())
            .filter(Boolean)
            .map((label) => ({ label }))
        : [],
    };
    try {
      if (editingId) {
        await onUpdate(selectedRoleId, editingId, payload);
      } else {
        await onCreate(selectedRoleId, payload);
      }
      await onReload(selectedRoleId);
      setSubmitting(false);
      setDrawerOpen(false);
    } catch (err) {
      setSubmitting(false);
      setError(err?.message ?? 'Unable to save shift.');
    }
  };

  const handleDelete = async (shiftId) => {
    if (!window.confirm('Delete this shift?')) {
      return;
    }
    try {
      await onDelete(selectedRoleId, shiftId);
      await onReload(selectedRoleId);
    } catch (err) {
      setError(err?.message ?? 'Unable to delete shift.');
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Shifts</h2>
          {selectedRole ? (
            <p className="text-sm text-slate-500">{selectedRole.title}</p>
          ) : (
            <p className="text-sm text-slate-400">Choose a role to schedule shifts.</p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            value={selectedRoleId ?? ''}
            onChange={(event) => onSelectRole(event.target.value ? Number(event.target.value) : null)}
            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-900"
          >
            <option value="">Select role</option>
            {roles.map((role) => (
              <option key={role.id} value={role.id}>
                {role.title}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => openDrawer(null)}
            className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-slate-800"
          >
            <PlusIcon className="h-4 w-4" aria-hidden="true" />
            Add
          </button>
          <button
            type="button"
            onClick={() => onReload(selectedRoleId)}
            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
          >
            Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-20 animate-pulse rounded-2xl bg-slate-100" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {shifts.map((shift) => (
            <button
              type="button"
              key={shift.id}
              onClick={() => onSelectShift?.(shift)}
              className="flex w-full flex-col rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left shadow-sm transition hover:border-slate-300 hover:shadow"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{shift.title}</p>
                  <p className="text-xs text-slate-500">
                    {shift.shiftDate}
                    {shift.startTime ? ` • ${shift.startTime}` : ''}
                    {shift.endTime ? ` — ${shift.endTime}` : ''}
                    {shift.timezone ? ` ${shift.timezone}` : ''}
                  </p>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase text-slate-500">
                  {shift.status}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500">
                {shift.location ? <span>{shift.location}</span> : null}
                {shift.capacity ? <span>Capacity {shift.capacity}</span> : null}
                {shift.reserved ? <span>Reserved {shift.reserved}</span> : null}
                {shift.notes ? <span className="truncate">{shift.notes}</span> : null}
              </div>
              <div className="mt-4 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    openDrawer(shift);
                  }}
                  className="rounded-full border border-slate-200 p-1 text-slate-500 hover:bg-slate-100"
                >
                  <PencilSquareIcon className="h-4 w-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    handleDelete(shift.id);
                  }}
                  className="rounded-full border border-red-200 p-1 text-red-500 hover:bg-red-50"
                >
                  <TrashIcon className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </button>
          ))}
          {!shifts.length ? (
            <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-400">
              Plan a shift to begin scheduling volunteers.
            </div>
          ) : null}
        </div>
      )}

      {error ? <p className="text-sm font-semibold text-red-600">{error}</p> : null}

      <Drawer open={drawerOpen} title={editingId ? 'Edit shift' : 'New shift'} onClose={closeDrawer}>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Title
            <input
              name="title"
              required
              value={form.title}
              onChange={handleChange}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Date
              <input
                name="shiftDate"
                type="date"
                required
                value={form.shiftDate}
                onChange={handleChange}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </label>
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Timezone
              <input
                name="timezone"
                value={form.timezone}
                onChange={handleChange}
                placeholder="UTC"
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </label>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Start
              <input
                name="startTime"
                type="time"
                value={form.startTime}
                onChange={handleChange}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </label>
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              End
              <input
                name="endTime"
                type="time"
                value={form.endTime}
                onChange={handleChange}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </label>
          </div>
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Location
            <input
              name="location"
              value={form.location}
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
              Capacity
              <input
                name="capacity"
                type="number"
                min="0"
                value={form.capacity}
                onChange={handleChange}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </label>
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Reserved
              <input
                name="reserved"
                type="number"
                min="0"
                value={form.reserved}
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
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Requirements (one per line)
            <textarea
              name="requirements"
              rows="3"
              value={form.requirements}
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

VolunteeringShiftsPanel.propTypes = {
  roles: PropTypes.arrayOf(PropTypes.object).isRequired,
  selectedRoleId: PropTypes.number,
  onSelectRole: PropTypes.func.isRequired,
  shifts: PropTypes.arrayOf(PropTypes.object).isRequired,
  loading: PropTypes.bool,
  onReload: PropTypes.func.isRequired,
  onCreate: PropTypes.func.isRequired,
  onUpdate: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onSelectShift: PropTypes.func,
};
