import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import CommandDrawer from './CommandDrawer.jsx';

const PROJECT_STATUSES = [
  { value: 'planning', label: 'Planning' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'on_hold', label: 'On hold' },
  { value: 'completed', label: 'Completed' },
];

const PROJECT_RISKS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];

const INITIAL_VALUES = {
  title: '',
  description: '',
  dueDate: '',
  budgetAllocated: '',
  budgetCurrency: 'USD',
  status: 'planning',
  risk: 'low',
};

export default function ProjectWizard({ open, onClose, onSubmit, templates }) {
  const [step, setStep] = useState(0);
  const [values, setValues] = useState(INITIAL_VALUES);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  useEffect(() => {
    if (open) {
      setStep(0);
      setValues(INITIAL_VALUES);
      setErrors({});
      setSubmitError(null);
    }
  }, [open]);

  const suggestions = useMemo(() => templates.slice(0, 3), [templates]);

  const updateField = (event) => {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
  };

  const validateStep = (currentStep) => {
    const nextErrors = {};
    if (currentStep === 0) {
      if (!values.title.trim()) {
        nextErrors.title = 'Required';
      }
      if (!values.description.trim()) {
        nextErrors.description = 'Required';
      }
    }
    if (currentStep === 1) {
      if (values.budgetAllocated) {
        const parsed = Number(values.budgetAllocated);
        if (!Number.isFinite(parsed) || parsed < 0) {
          nextErrors.budgetAllocated = 'Invalid amount';
        }
      }
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const goNext = () => {
    if (validateStep(step)) {
      setStep((current) => Math.min(current + 1, 1));
    }
  };

  const goBack = () => {
    setStep((current) => Math.max(current - 1, 0));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validateStep(step)) {
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      await onSubmit({
        title: values.title.trim(),
        description: values.description.trim(),
        dueDate: values.dueDate || null,
        budgetCurrency: values.budgetCurrency,
        budgetAllocated: values.budgetAllocated ? Number(values.budgetAllocated) : 0,
        budgetSpent: 0,
        status: values.status,
        workspace: {
          status: values.status,
          riskLevel: values.risk,
        },
      });
      onClose?.();
    } catch (error) {
      setSubmitError(error.message ?? 'Unable to save project.');
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = (name) =>
    `w-full rounded-2xl border px-4 py-2 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/30 ${
      errors[name] ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-200' : 'border-slate-200'
    }`;

  return (
    <CommandDrawer open={open} onClose={onClose} title="New project" subtitle="Spin up a fresh workspace." size="lg">
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {[0, 1].map((index) => (
              <span
                key={index}
                className={`h-2 w-14 rounded-full ${index <= step ? 'bg-accent' : 'bg-slate-200'}`}
              />
            ))}
          </div>
          <div className="flex gap-2">
            {step > 0 ? (
              <button
                type="button"
                onClick={goBack}
                className="rounded-full border border-slate-200 px-4 py-1.5 text-sm font-medium text-slate-600 hover:border-accent hover:text-accent"
              >
                Back
              </button>
            ) : null}
            {step < 1 ? (
              <button
                type="button"
                onClick={goNext}
                className="rounded-full bg-slate-900 px-4 py-1.5 text-sm font-semibold text-white hover:bg-slate-800"
              >
                Next
              </button>
            ) : null}
            {step === 1 ? (
              <button
                type="submit"
                disabled={submitting}
                className="rounded-full bg-accent px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {submitting ? 'Saving…' : 'Create'}
              </button>
            ) : null}
          </div>
        </div>

        {step === 0 ? (
          <div className="grid gap-4">
            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">Title</span>
              <input name="title" value={values.title} onChange={updateField} className={inputClass('title')} />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">Description</span>
              <textarea
                name="description"
                value={values.description}
                onChange={updateField}
                rows={4}
                className={`${inputClass('description')} resize-none`}
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">Due</span>
              <input
                type="date"
                name="dueDate"
                value={values.dueDate}
                onChange={updateField}
                className={inputClass('dueDate')}
              />
            </label>
          </div>
        ) : null}

        {step === 1 ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">Budget</span>
              <input
                name="budgetAllocated"
                value={values.budgetAllocated}
                onChange={updateField}
                placeholder="0"
                className={inputClass('budgetAllocated')}
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">Currency</span>
              <select name="budgetCurrency" value={values.budgetCurrency} onChange={updateField} className={inputClass('budgetCurrency')}>
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
                {PROJECT_STATUSES.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">Risk</span>
              <select name="risk" value={values.risk} onChange={updateField} className={inputClass('risk')}>
                {PROJECT_RISKS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        ) : null}

        {suggestions.length ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Templates</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              {suggestions.map((template) => (
                <div key={template.id ?? template.name} className="rounded-xl bg-white p-3 text-sm text-slate-600 shadow-sm">
                  <p className="font-medium text-slate-800">{template.name}</p>
                  <p className="mt-1 text-xs text-slate-500">{template.summary ?? template.description}</p>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {submitError ? <p className="text-sm text-rose-500">{submitError}</p> : null}
      </form>
    </CommandDrawer>
  );
}

ProjectWizard.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  onSubmit: PropTypes.func.isRequired,
  templates: PropTypes.arrayOf(PropTypes.object),
};

ProjectWizard.defaultProps = {
  open: false,
  onClose: undefined,
  templates: [],
};
