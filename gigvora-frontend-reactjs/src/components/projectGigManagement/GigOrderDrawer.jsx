import PropTypes from 'prop-types';
import ActionDrawer from './ActionDrawer.jsx';

function Field({ label, children, error }) {
  return (
    <label className="flex flex-col gap-2 text-sm text-slate-700">
      <span className="font-semibold text-slate-900">{label}</span>
      {children}
      {error ? <span className="text-xs font-semibold text-rose-600">{error}</span> : null}
    </label>
  );
}

Field.propTypes = {
  label: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
  error: PropTypes.string,
};

export default function GigOrderDrawer({
  open,
  onClose,
  values,
  errors,
  onChange,
  onSubmit,
  loading,
  feedback,
  canManage,
}) {
  return (
    <ActionDrawer
      open={open}
      onClose={loading ? () => {} : onClose}
      title="Log vendor gig"
      footer={
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="gig-create-form"
            disabled={loading || !canManage}
            className="rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {loading ? 'Saving…' : 'Save gig'}
          </button>
        </div>
      }
    >
      <form id="gig-create-form" className="space-y-5" onSubmit={onSubmit} noValidate>
        {feedback ? (
          <div
            className={`rounded-2xl border px-4 py-3 text-sm ${
              feedback.status === 'success'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : 'border-rose-200 bg-rose-50 text-rose-700'
            }`}
          >
            {feedback.message}
          </div>
        ) : null}
        <Field label="Vendor" error={errors.vendorName}>
          <input
            name="vendorName"
            value={values.vendorName}
            onChange={onChange}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
            placeholder="Design studio"
            required
            disabled={!canManage || loading}
          />
        </Field>
        <Field label="Service" error={errors.serviceName}>
          <input
            name="serviceName"
            value={values.serviceName}
            onChange={onChange}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
            placeholder="UI overhaul"
            required
            disabled={!canManage || loading}
          />
        </Field>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Amount" error={errors.amount}>
            <input
              name="amount"
              value={values.amount}
              onChange={onChange}
              type="number"
              min="0"
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
              placeholder="4800"
              disabled={!canManage || loading}
            />
          </Field>
          <Field label="Currency">
            <select
              name="currency"
              value={values.currency}
              onChange={onChange}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
              disabled={!canManage || loading}
            >
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
            </select>
          </Field>
        </div>
        <Field label="Delivery date" error={errors.dueAt}>
          <input
            type="date"
            name="dueAt"
            value={values.dueAt}
            onChange={onChange}
            min={new Date().toISOString().split('T')[0]}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
            disabled={!canManage || loading}
          />
        </Field>
      </form>
    </ActionDrawer>
  );
}

GigOrderDrawer.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  values: PropTypes.shape({
    vendorName: PropTypes.string,
    serviceName: PropTypes.string,
    amount: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    currency: PropTypes.string,
    dueAt: PropTypes.string,
  }).isRequired,
  errors: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  loading: PropTypes.bool.isRequired,
  feedback: PropTypes.shape({ status: PropTypes.string, message: PropTypes.string }),
  canManage: PropTypes.bool.isRequired,
};
