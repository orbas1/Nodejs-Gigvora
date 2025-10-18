import PropTypes from 'prop-types';
import WorkspaceDialog from './WorkspaceDialog.jsx';

export default function CreateWorkspaceDialog({
  open,
  onClose,
  form,
  errors,
  feedback,
  onChange,
  onSubmit,
  submitting,
}) {
  return (
    <WorkspaceDialog open={open} onClose={onClose} title="New workspace" size="lg">
      <form onSubmit={onSubmit} className="space-y-5">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm text-slate-700">
            Name
            <input
              name="title"
              value={form.title}
              onChange={onChange}
              className={`rounded-xl border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent ${
                errors.title ? 'border-rose-400' : 'border-slate-200'
              }`}
              placeholder="Workspace name"
              required
            />
            {errors.title ? <span className="text-xs text-rose-500">{errors.title}</span> : null}
          </label>
          <label className="flex flex-col gap-2 text-sm text-slate-700">
            Status
            <select
              name="status"
              value={form.status}
              onChange={onChange}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
            >
              <option value="planning">Planning</option>
              <option value="active">Active</option>
              <option value="on_hold">On hold</option>
              <option value="complete">Complete</option>
            </select>
          </label>
          <label className="md:col-span-2 flex flex-col gap-2 text-sm text-slate-700">
            Summary
            <textarea
              name="description"
              value={form.description}
              onChange={onChange}
              rows={3}
              className={`rounded-2xl border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent ${
                errors.description ? 'border-rose-400' : 'border-slate-200'
              }`}
              placeholder="What is the focus?"
              required
            />
            {errors.description ? <span className="text-xs text-rose-500">{errors.description}</span> : null}
          </label>
          <label className="flex flex-col gap-2 text-sm text-slate-700">
            Budget currency
            <select
              name="budgetCurrency"
              value={form.budgetCurrency}
              onChange={onChange}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
            >
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
              <option value="CAD">CAD</option>
              <option value="AUD">AUD</option>
            </select>
          </label>
          <label className="flex flex-col gap-2 text-sm text-slate-700">
            Planned budget
            <input
              name="budgetAllocated"
              type="number"
              value={form.budgetAllocated}
              onChange={onChange}
              className={`rounded-xl border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent ${
                errors.budgetAllocated ? 'border-rose-400' : 'border-slate-200'
              }`}
              placeholder="0"
              min="0"
            />
            {errors.budgetAllocated ? (
              <span className="text-xs text-rose-500">{errors.budgetAllocated}</span>
            ) : null}
          </label>
          <label className="flex flex-col gap-2 text-sm text-slate-700">
            Deadline
            <input
              name="dueDate"
              type="date"
              value={form.dueDate}
              onChange={onChange}
              className={`rounded-xl border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent ${
                errors.dueDate ? 'border-rose-400' : 'border-slate-200'
              }`}
            />
            {errors.dueDate ? <span className="text-xs text-rose-500">{errors.dueDate}</span> : null}
          </label>
        </div>
        {feedback ? (
          <p
            className={`text-sm ${feedback.status === 'error' ? 'text-rose-500' : 'text-emerald-600'}`}
          >
            {feedback.message}
          </p>
        ) : null}
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:border-slate-300"
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-70"
            disabled={submitting}
          >
            {submitting ? 'Saving…' : 'Create workspace'}
          </button>
        </div>
      </form>
    </WorkspaceDialog>
  );
}

CreateWorkspaceDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  form: PropTypes.shape({
    title: PropTypes.string,
    description: PropTypes.string,
    status: PropTypes.string,
    budgetCurrency: PropTypes.string,
    budgetAllocated: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    dueDate: PropTypes.string,
  }).isRequired,
  errors: PropTypes.shape({
    title: PropTypes.string,
    description: PropTypes.string,
    budgetAllocated: PropTypes.string,
    dueDate: PropTypes.string,
  }).isRequired,
  feedback: PropTypes.shape({
    status: PropTypes.string,
    message: PropTypes.string,
  }),
  onChange: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  submitting: PropTypes.bool.isRequired,
};

CreateWorkspaceDialog.defaultProps = {
  feedback: null,
};
