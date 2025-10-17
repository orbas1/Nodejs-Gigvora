import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import CommandDrawer from './CommandDrawer.jsx';

const ORDER_STATUSES = [
  { value: 'requirements', label: 'Requirements' },
  { value: 'in_delivery', label: 'Delivery' },
  { value: 'in_revision', label: 'Revision' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

const INITIAL_VALUES = {
  vendorName: '',
  serviceName: '',
  status: 'requirements',
  amount: '',
  currency: 'USD',
  kickoffAt: new Date().toISOString().slice(0, 10),
  dueAt: '',
  progressPercent: '0',
};

export default function GigOrderComposer({ open, onClose, order, onSubmit }) {
  const [values, setValues] = useState(INITIAL_VALUES);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  useEffect(() => {
    if (open) {
      if (order) {
        setValues({
          vendorName: order.vendorName ?? '',
          serviceName: order.serviceName ?? '',
          status: order.status ?? 'requirements',
          amount: order.amount != null ? String(order.amount) : '',
          currency: order.currency ?? 'USD',
          kickoffAt: order.kickoffAt ? order.kickoffAt.slice(0, 10) : new Date().toISOString().slice(0, 10),
          dueAt: order.dueAt ? order.dueAt.slice(0, 10) : '',
          progressPercent: order.progressPercent != null ? String(order.progressPercent) : '0',
        });
      } else {
        setValues(INITIAL_VALUES);
      }
      setErrors({});
      setSubmitError(null);
    }
  }, [open, order]);

  const heading = useMemo(() => (order ? 'Edit gig order' : 'New gig order'), [order]);

  const updateField = (event) => {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
  };

  const validate = () => {
    const nextErrors = {};
    if (!values.vendorName.trim()) {
      nextErrors.vendorName = 'Required';
    }
    if (!values.serviceName.trim()) {
      nextErrors.serviceName = 'Required';
    }
    if (values.amount) {
      const parsed = Number(values.amount);
      if (!Number.isFinite(parsed) || parsed < 0) {
        nextErrors.amount = 'Invalid amount';
      }
    }
    if (values.progressPercent) {
      const parsed = Number(values.progressPercent);
      if (!Number.isFinite(parsed) || parsed < 0 || parsed > 100) {
        nextErrors.progressPercent = '0-100 only';
      }
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
        vendorName: values.vendorName.trim(),
        serviceName: values.serviceName.trim(),
        status: values.status,
        amount: values.amount ? Number(values.amount) : 0,
        currency: values.currency,
        kickoffAt: values.kickoffAt || null,
        dueAt: values.dueAt || null,
        progressPercent: values.progressPercent ? Number(values.progressPercent) : 0,
      });
      onClose?.();
    } catch (error) {
      setSubmitError(error.message ?? 'Unable to save order.');
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = (name) =>
    `w-full rounded-2xl border px-4 py-2 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/30 ${
      errors[name] ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-200' : 'border-slate-200'
    }`;

  return (
    <CommandDrawer open={open} onClose={onClose} title={heading} subtitle="Track partner delivery." size="lg">
      <form onSubmit={handleSubmit} className="grid gap-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">Vendor</span>
            <input name="vendorName" value={values.vendorName} onChange={updateField} className={inputClass('vendorName')} />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">Service</span>
            <input name="serviceName" value={values.serviceName} onChange={updateField} className={inputClass('serviceName')} />
          </label>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">Amount</span>
            <input name="amount" value={values.amount} onChange={updateField} className={inputClass('amount')} />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">Currency</span>
            <select name="currency" value={values.currency} onChange={updateField} className={inputClass('currency')}>
              {['USD', 'EUR', 'GBP'].map((currency) => (
                <option key={currency} value={currency}>
                  {currency}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">Status</span>
            <select name="status" value={values.status} onChange={updateField} className={inputClass('status')}>
              {ORDER_STATUSES.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">Kickoff</span>
            <input
              type="date"
              name="kickoffAt"
              value={values.kickoffAt}
              onChange={updateField}
              className={inputClass('kickoffAt')}
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">Due</span>
            <input type="date" name="dueAt" value={values.dueAt} onChange={updateField} className={inputClass('dueAt')} />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">Progress %</span>
            <input
              name="progressPercent"
              value={values.progressPercent}
              onChange={updateField}
              className={inputClass('progressPercent')}
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
            {submitting ? 'Saving…' : order ? 'Update' : 'Create'}
          </button>
        </div>
        {submitError ? <p className="text-sm text-rose-500">{submitError}</p> : null}
      </form>
    </CommandDrawer>
  );
}

GigOrderComposer.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  order: PropTypes.shape({
    id: PropTypes.number,
    vendorName: PropTypes.string,
    serviceName: PropTypes.string,
    status: PropTypes.string,
    amount: PropTypes.number,
    currency: PropTypes.string,
    kickoffAt: PropTypes.string,
    dueAt: PropTypes.string,
    progressPercent: PropTypes.number,
  }),
  onSubmit: PropTypes.func.isRequired,
};

GigOrderComposer.defaultProps = {
  open: false,
  onClose: undefined,
  order: null,
};
