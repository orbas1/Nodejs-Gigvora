import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import CommandDrawer from './CommandDrawer.jsx';

const EVENT_TYPES = [
  { value: 'milestone', label: 'Milestone' },
  { value: 'kickoff', label: 'Kickoff' },
  { value: 'checkpoint', label: 'Checkpoint' },
  { value: 'handoff', label: 'Handoff' },
  { value: 'qa_review', label: 'QA review' },
  { value: 'retro', label: 'Retro' },
  { value: 'note', label: 'Note' },
];

const EVENT_STATUSES = [
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

const INITIAL_VALUES = {
  orderId: '',
  title: '',
  type: 'milestone',
  status: 'scheduled',
  scheduledAt: '',
  completedAt: '',
  assignedTo: '',
  notes: '',
};

export default function TimelineComposer({ open, onClose, orderOptions, context, onSubmit }) {
  const [values, setValues] = useState(INITIAL_VALUES);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  useEffect(() => {
    if (open) {
      if (context?.event) {
        const event = context.event;
        setValues({
          orderId: String(context.orderId ?? event.orderId ?? ''),
          title: event.title ?? '',
          type: event.type ?? 'milestone',
          status: event.status ?? 'scheduled',
          scheduledAt: event.scheduledAt ? event.scheduledAt.slice(0, 10) : '',
          completedAt: event.completedAt ? event.completedAt.slice(0, 10) : '',
          assignedTo: event.assignedTo ?? '',
          notes: event.notes ?? '',
        });
      } else {
        setValues({
          ...INITIAL_VALUES,
          orderId: context?.orderId ? String(context.orderId) : '',
        });
      }
      setErrors({});
      setSubmitError(null);
    }
  }, [open, context]);

  const heading = useMemo(() => (context?.event ? 'Update milestone' : 'Add milestone'), [context]);

  const updateField = (event) => {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
  };

  const validate = () => {
    const nextErrors = {};
    if (!values.orderId) {
      nextErrors.orderId = 'Pick an order';
    }
    if (!values.title.trim()) {
      nextErrors.title = 'Required';
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) {
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      await onSubmit({
        orderId: Number(values.orderId),
        payload: {
          title: values.title.trim(),
          type: values.type,
          status: values.status,
          scheduledAt: values.scheduledAt || null,
          completedAt: values.completedAt || null,
          assignedTo: values.assignedTo || null,
          notes: values.notes || null,
        },
        event: context?.event ?? null,
      });
      onClose?.();
    } catch (error) {
      setSubmitError(error.message ?? 'Unable to save milestone.');
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = (name) =>
    `w-full rounded-2xl border px-4 py-2 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/30 ${
      errors[name] ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-200' : 'border-slate-200'
    }`;

  return (
    <CommandDrawer open={open} onClose={onClose} title={heading} subtitle="Keep the gig schedule tight." size="lg">
      <form onSubmit={handleSubmit} className="grid gap-5">
        <label className="space-y-2">
          <span className="text-sm font-medium text-slate-700">Order</span>
          <select name="orderId" value={values.orderId} onChange={updateField} className={inputClass('orderId')}>
            <option value="">Select</option>
            {orderOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">Title</span>
            <input name="title" value={values.title} onChange={updateField} className={inputClass('title')} />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">Type</span>
            <select name="type" value={values.type} onChange={updateField} className={inputClass('type')}>
              {EVENT_TYPES.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">Status</span>
            <select name="status" value={values.status} onChange={updateField} className={inputClass('status')}>
              {EVENT_STATUSES.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">Owner</span>
            <input name="assignedTo" value={values.assignedTo} onChange={updateField} className={inputClass('assignedTo')} />
          </label>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">Scheduled</span>
            <input
              type="date"
              name="scheduledAt"
              value={values.scheduledAt}
              onChange={updateField}
              className={inputClass('scheduledAt')}
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">Completed</span>
            <input
              type="date"
              name="completedAt"
              value={values.completedAt}
              onChange={updateField}
              className={inputClass('completedAt')}
            />
          </label>
        </div>
        <label className="space-y-2">
          <span className="text-sm font-medium text-slate-700">Notes</span>
          <textarea
            name="notes"
            value={values.notes}
            onChange={updateField}
            rows={3}
            className={`${inputClass('notes')} resize-none`}
          />
        </label>
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 px-4 py-1.5 text-sm font-medium text-slate-600 hover:border-accent hover:text-accent"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-full bg-accent px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {submitting ? 'Saving…' : context?.event ? 'Update' : 'Add'}
          </button>
        </div>
        {submitError ? <p className="text-sm text-rose-500">{submitError}</p> : null}
      </form>
    </CommandDrawer>
  );
}

TimelineComposer.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  orderOptions: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      label: PropTypes.string.isRequired,
    }),
  ),
  context: PropTypes.shape({
    orderId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    event: PropTypes.object,
  }),
  onSubmit: PropTypes.func.isRequired,
};

TimelineComposer.defaultProps = {
  open: false,
  onClose: undefined,
  orderOptions: [],
  context: null,
};
