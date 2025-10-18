import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import SlideOverPanel from './SlideOverPanel.jsx';

const STATUS_OPTIONS = [
  { value: 'planned', label: 'Planned' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'blocked', label: 'Blocked' },
];

function formatInputDateTime(value) {
  if (!value) {
    return '';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  const tzOffset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - tzOffset).toISOString().slice(0, 16);
}

export default function EventDrawer({ open, mode, initialValue, saving, error, onClose, onSubmit }) {
  const [form, setForm] = useState({
    title: '',
    status: 'planned',
    category: '',
    ownerId: '',
    startDate: '',
    dueDate: '',
    description: '',
  });

  useEffect(() => {
    if (open) {
      setForm({
        title: initialValue?.title ?? '',
        status: initialValue?.status ?? 'planned',
        category: initialValue?.category ?? '',
        ownerId: initialValue?.ownerId ? String(initialValue.ownerId) : '',
        startDate: formatInputDateTime(initialValue?.startDate),
        dueDate: formatInputDateTime(initialValue?.dueDate),
        description: initialValue?.description ?? '',
      });
    }
  }, [open, initialValue]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit({
      title: form.title.trim(),
      status: form.status,
      category: form.category.trim() || null,
      ownerId: form.ownerId ? Number(form.ownerId) : null,
      startDate: form.startDate || null,
      dueDate: form.dueDate || null,
      description: form.description.trim() || null,
    });
  };

  return (
    <SlideOverPanel
      open={open}
      title={mode === 'create' ? 'New event' : 'Edit event'}
      onClose={onClose}
      width="34rem"
      footer={
        <div className="flex justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-4 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-700"
            disabled={saving}
          >
            Cancel
          </button>
          <button
            type="submit"
            form="timeline-event-form"
            className="inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400"
            disabled={saving}
          >
            {saving ? 'Saving…' : 'Save event'}
          </button>
        </div>
      }
    >
      <form id="timeline-event-form" className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="event-title" className="text-sm font-medium text-slate-700">
            Title
          </label>
          <input
            id="event-title"
            name="title"
            value={form.title}
            onChange={handleChange}
            required
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
            placeholder="Launch kickoff"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="event-status" className="text-sm font-medium text-slate-700">
              Status
            </label>
            <select
              id="event-status"
              name="status"
              value={form.status}
              onChange={handleChange}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="event-category" className="text-sm font-medium text-slate-700">
              Category
            </label>
            <input
              id="event-category"
              name="category"
              value={form.category}
              onChange={handleChange}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
              placeholder="Announcement"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="event-start" className="text-sm font-medium text-slate-700">
              Start
            </label>
            <input
              id="event-start"
              name="startDate"
              type="datetime-local"
              value={form.startDate}
              onChange={handleChange}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
            />
          </div>
          <div>
            <label htmlFor="event-due" className="text-sm font-medium text-slate-700">
              Due
            </label>
            <input
              id="event-due"
              name="dueDate"
              type="datetime-local"
              value={form.dueDate}
              onChange={handleChange}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
            />
          </div>
        </div>

        <div>
          <label htmlFor="event-owner" className="text-sm font-medium text-slate-700">
            Owner ID
          </label>
          <input
            id="event-owner"
            name="ownerId"
            value={form.ownerId}
            onChange={handleChange}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
            placeholder="123"
            inputMode="numeric"
            pattern="[0-9]*"
          />
        </div>

        <div>
          <label htmlFor="event-description" className="text-sm font-medium text-slate-700">
            Notes
          </label>
          <textarea
            id="event-description"
            name="description"
            value={form.description}
            onChange={handleChange}
            rows={4}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
            placeholder="Key talking points"
          />
        </div>

        {error ? <p className="text-sm font-semibold text-rose-600">{error}</p> : null}
      </form>
    </SlideOverPanel>
  );
}

EventDrawer.propTypes = {
  open: PropTypes.bool,
  mode: PropTypes.oneOf(['create', 'edit']).isRequired,
  initialValue: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    title: PropTypes.string,
    status: PropTypes.string,
    category: PropTypes.string,
    ownerId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    startDate: PropTypes.string,
    dueDate: PropTypes.string,
    description: PropTypes.string,
  }),
  saving: PropTypes.bool,
  error: PropTypes.string,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
};

EventDrawer.defaultProps = {
  open: false,
  initialValue: null,
  saving: false,
  error: null,
};
