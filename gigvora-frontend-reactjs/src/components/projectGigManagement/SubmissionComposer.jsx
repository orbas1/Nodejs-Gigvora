import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import CommandDrawer from './CommandDrawer.jsx';

const SUBMISSION_STATUSES = [
  { value: 'draft', label: 'Draft' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'needs_changes', label: 'Needs changes' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
];

const INITIAL_VALUES = {
  orderId: '',
  title: '',
  status: 'submitted',
  submittedAt: new Date().toISOString().slice(0, 10),
  assetUrl: '',
  assetLabel: '',
  notes: '',
};

export default function SubmissionComposer({ open, onClose, orderOptions, context, onSubmit }) {
  const [values, setValues] = useState(INITIAL_VALUES);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  useEffect(() => {
    if (open) {
      if (context?.submission) {
        const submission = context.submission;
        setValues({
          orderId: String(context.orderId ?? submission.orderId ?? ''),
          title: submission.title ?? '',
          status: submission.status ?? 'submitted',
          submittedAt: submission.submittedAt ? submission.submittedAt.slice(0, 10) : new Date().toISOString().slice(0, 10),
          assetUrl: submission.assetUrl ?? '',
          assetLabel: submission.assetLabel ?? '',
          notes: submission.notes ?? '',
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

  const heading = useMemo(() => (context?.submission ? 'Update delivery' : 'Log delivery'), [context]);

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
          status: values.status,
          submittedAt: values.submittedAt || null,
          assetUrl: values.assetUrl || null,
          assetLabel: values.assetLabel || null,
          notes: values.notes || null,
        },
        submission: context?.submission ?? null,
      });
      onClose?.();
    } catch (error) {
      setSubmitError(error.message ?? 'Unable to save delivery.');
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = (name) =>
    `w-full rounded-2xl border px-4 py-2 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/30 ${
      errors[name] ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-200' : 'border-slate-200'
    }`;

  return (
    <CommandDrawer open={open} onClose={onClose} title={heading} subtitle="Capture what shipped." size="lg">
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
            <span className="text-sm font-medium text-slate-700">Status</span>
            <select name="status" value={values.status} onChange={updateField} className={inputClass('status')}>
              {SUBMISSION_STATUSES.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">Submitted</span>
            <input
              type="date"
              name="submittedAt"
              value={values.submittedAt}
              onChange={updateField}
              className={inputClass('submittedAt')}
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">File link</span>
            <input name="assetUrl" value={values.assetUrl} onChange={updateField} className={inputClass('assetUrl')} />
          </label>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">File label</span>
            <input name="assetLabel" value={values.assetLabel} onChange={updateField} className={inputClass('assetLabel')} />
          </label>
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
        </div>
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
            {submitting ? 'Saving…' : context?.submission ? 'Update' : 'Log'}
          </button>
        </div>
        {submitError ? <p className="text-sm text-rose-500">{submitError}</p> : null}
      </form>
    </CommandDrawer>
  );
}

SubmissionComposer.propTypes = {
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
    submission: PropTypes.object,
  }),
  onSubmit: PropTypes.func.isRequired,
};

SubmissionComposer.defaultProps = {
  open: false,
  onClose: undefined,
  orderOptions: [],
  context: null,
};
