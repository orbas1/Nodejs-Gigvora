import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import CommandDrawer from './CommandDrawer.jsx';

const INITIAL_VALUES = {
  orderId: '',
  authorName: '',
  authorRole: '',
  body: '',
};

export default function ChatComposer({ open, onClose, orderOptions, context, onSubmit }) {
  const [values, setValues] = useState(INITIAL_VALUES);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  useEffect(() => {
    if (open) {
      setValues({
        ...INITIAL_VALUES,
        orderId: context?.orderId ? String(context.orderId) : '',
        authorName: context?.authorName ?? '',
        authorRole: context?.authorRole ?? '',
      });
      setErrors({});
      setSubmitError(null);
    }
  }, [open, context]);

  const updateField = (event) => {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
  };

  const validate = () => {
    const nextErrors = {};
    if (!values.orderId) {
      nextErrors.orderId = 'Pick an order';
    }
    if (!values.body.trim()) {
      nextErrors.body = 'Required';
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
          authorName: values.authorName || null,
          authorRole: values.authorRole || null,
          body: values.body.trim(),
        },
      });
      onClose?.();
    } catch (error) {
      setSubmitError(error.message ?? 'Unable to send message.');
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = (name) =>
    `w-full rounded-2xl border px-4 py-2 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/30 ${
      errors[name] ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-200' : 'border-slate-200'
    }`;

  return (
    <CommandDrawer open={open} onClose={onClose} title="Send message" subtitle="Keep the thread moving." size="md">
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
            <span className="text-sm font-medium text-slate-700">Name</span>
            <input name="authorName" value={values.authorName} onChange={updateField} className={inputClass('authorName')} />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">Role</span>
            <input name="authorRole" value={values.authorRole} onChange={updateField} className={inputClass('authorRole')} />
          </label>
        </div>
        <label className="space-y-2">
          <span className="text-sm font-medium text-slate-700">Message</span>
          <textarea
            name="body"
            value={values.body}
            onChange={updateField}
            rows={5}
            className={`${inputClass('body')} resize-none`}
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
            {submitting ? 'Sending…' : 'Send'}
          </button>
        </div>
        {submitError ? <p className="text-sm text-rose-500">{submitError}</p> : null}
      </form>
    </CommandDrawer>
  );
}

ChatComposer.propTypes = {
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
    authorName: PropTypes.string,
    authorRole: PropTypes.string,
  }),
  onSubmit: PropTypes.func.isRequired,
};

ChatComposer.defaultProps = {
  open: false,
  onClose: undefined,
  orderOptions: [],
  context: null,
};
