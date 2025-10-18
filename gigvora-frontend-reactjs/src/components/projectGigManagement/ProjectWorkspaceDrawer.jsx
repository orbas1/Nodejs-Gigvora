import PropTypes from 'prop-types';
import ActionDrawer from './ActionDrawer.jsx';

function Field({ label, children, error, description }) {
  return (
    <label className="flex flex-col gap-2 text-sm text-slate-700">
      <span className="font-semibold text-slate-900">{label}</span>
      {description ? <span className="text-xs font-normal text-slate-500">{description}</span> : null}
      {children}
      {error ? <span className="text-xs font-semibold text-rose-600">{error}</span> : null}
    </label>
  );
}

Field.propTypes = {
  label: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
  error: PropTypes.string,
  description: PropTypes.string,
};

export default function ProjectWorkspaceDrawer({
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
      title="New project"
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
            form="project-create-form"
            disabled={loading || !canManage}
            className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white transition hover:bg-accentDark disabled:cursor-not-allowed disabled:bg-accent/60"
          >
            {loading ? 'Saving…' : 'Create project'}
          </button>
        </div>
      }
    >
      <form id="project-create-form" className="space-y-5" onSubmit={onSubmit} noValidate>
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
        <Field label="Name" error={errors.title}>
          <input
            name="title"
            value={values.title}
            onChange={onChange}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
            placeholder="Website refresh"
            required
            disabled={!canManage || loading}
          />
        </Field>
        <Field label="Summary" error={errors.description}>
          <textarea
            name="description"
            value={values.description}
            onChange={onChange}
            className="min-h-[120px] rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
            placeholder="Goals, teams, success measures"
            required
            disabled={!canManage || loading}
          />
        </Field>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Budget" error={errors.budgetAllocated}>
            <input
              name="budgetAllocated"
              value={values.budgetAllocated}
              onChange={onChange}
              type="number"
              min="0"
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
              placeholder="25000"
              disabled={!canManage || loading}
            />
          </Field>
          <Field label="Currency">
            <select
              name="budgetCurrency"
              value={values.budgetCurrency}
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
        <Field label="Target date" error={errors.dueDate}>
          <input
            type="date"
            name="dueDate"
            value={values.dueDate}
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

ProjectWorkspaceDrawer.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  values: PropTypes.shape({
    title: PropTypes.string,
    description: PropTypes.string,
    budgetAllocated: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    budgetCurrency: PropTypes.string,
    dueDate: PropTypes.string,
  }).isRequired,
  errors: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  loading: PropTypes.bool.isRequired,
  feedback: PropTypes.shape({ status: PropTypes.string, message: PropTypes.string }),
  canManage: PropTypes.bool.isRequired,
};
