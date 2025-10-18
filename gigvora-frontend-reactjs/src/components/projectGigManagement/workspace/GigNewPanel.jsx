import { useMemo, useState } from 'react';
import PropTypes from 'prop-types';

const STEP_SEQUENCE = ['Basics', 'Scope'];

function parseNumber(value) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : undefined;
}

function StepIndicator({ currentStep }) {
  return (
    <div className="flex items-center gap-3 text-xs font-semibold text-slate-500">
      {STEP_SEQUENCE.map((label, index) => {
        const isActive = index === currentStep;
        const isComplete = index < currentStep;
        return (
          <span key={label} className="flex items-center gap-2">
            <span
              className={`flex h-7 w-7 items-center justify-center rounded-full border text-[11px] ${
                isActive
                  ? 'border-accent bg-accent text-white'
                  : isComplete
                  ? 'border-accent/50 bg-accent/10 text-accent'
                  : 'border-slate-200 bg-white text-slate-500'
              }`}
            >
              {index + 1}
            </span>
            <span className={isActive ? 'text-accent' : isComplete ? 'text-slate-700' : ''}>{label}</span>
            {index < STEP_SEQUENCE.length - 1 ? <span className="text-slate-300">/</span> : null}
          </span>
        );
      })}
    </div>
  );
}

StepIndicator.propTypes = {
  currentStep: PropTypes.number.isRequired,
};

export default function GigNewPanel({ canManage, onCreate, defaultCurrency }) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    vendorName: '',
    serviceName: '',
    amount: '',
    currency: defaultCurrency,
    dueAt: '',
    kickoffAt: '',
    deliverables: [{ title: '', dueAt: '' }],
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const isFinalStep = step === STEP_SEQUENCE.length - 1;

  const canAdvance = useMemo(() => {
    if (step === 0) {
      return Boolean(form.vendorName.trim()) && Boolean(form.serviceName.trim());
    }
    if (step === 1) {
      return form.deliverables.every((item) => item.title.trim());
    }
    return true;
  }, [step, form]);

  const updateField = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const updateDeliverable = (index, key, value) => {
    setForm((current) => {
      const next = [...current.deliverables];
      next[index] = { ...next[index], [key]: value };
      return { ...current, deliverables: next };
    });
  };

  const addDeliverable = () => {
    setForm((current) => ({ ...current, deliverables: [...current.deliverables, { title: '', dueAt: '' }] }));
  };

  const removeDeliverable = (index) => {
    setForm((current) => ({
      ...current,
      deliverables: current.deliverables.filter((_, itemIndex) => itemIndex !== index),
    }));
  };

  const validate = () => {
    const nextErrors = {};
    if (!form.vendorName.trim()) {
      nextErrors.vendorName = 'Add vendor name.';
    }
    if (!form.serviceName.trim()) {
      nextErrors.serviceName = 'Add service name.';
    }
    if (form.amount) {
      const amount = parseNumber(form.amount);
      if (amount == null || amount < 0) {
        nextErrors.amount = 'Amount must be positive.';
      }
    }
    if (form.deliverables.some((item) => !item.title.trim())) {
      nextErrors.deliverables = 'Name every deliverable.';
    }
    return nextErrors;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validation = validate();
    setErrors(validation);
    if (Object.keys(validation).length > 0) {
      setFeedback({ tone: 'error', message: 'Fix highlighted fields.' });
      return;
    }
    setSubmitting(true);
    setFeedback(null);
    try {
      await onCreate({
        vendorName: form.vendorName.trim(),
        serviceName: form.serviceName.trim(),
        amount: parseNumber(form.amount) ?? 0,
        currency: form.currency,
        dueAt: form.dueAt || undefined,
        kickoffAt: form.kickoffAt || undefined,
        deliverables: form.deliverables
          .filter((item) => item.title.trim())
          .map((item, index) => ({
            ordinal: index + 1,
            title: item.title.trim(),
            dueAt: item.dueAt || undefined,
          })),
      });
      setFeedback({ tone: 'success', message: 'Gig created.' });
      setForm({
        vendorName: '',
        serviceName: '',
        amount: '',
        currency: defaultCurrency,
        dueAt: '',
        kickoffAt: '',
        deliverables: [{ title: '', dueAt: '' }],
      });
      setStep(0);
    } catch (error) {
      setFeedback({ tone: 'error', message: error?.message ?? 'Unable to create gig.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="flex h-full flex-col gap-6" onSubmit={handleSubmit} noValidate>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900">New gig</h3>
        <StepIndicator currentStep={step} />
      </div>
      <div className="flex-1 overflow-y-auto rounded-3xl border border-slate-200 bg-white p-5">
        {step === 0 ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm text-slate-700">
              Vendor
              <input
                name="vendorName"
                value={form.vendorName}
                onChange={updateField}
                className={`rounded-xl border px-3 py-2 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 ${
                  errors.vendorName ? 'border-rose-400 focus:ring-rose-200' : 'border-slate-200'
                }`}
                placeholder="Studio One"
                disabled={!canManage || submitting}
              />
            </label>
            <label className="flex flex-col gap-2 text-sm text-slate-700">
              Service
              <input
                name="serviceName"
                value={form.serviceName}
                onChange={updateField}
                className={`rounded-xl border px-3 py-2 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 ${
                  errors.serviceName ? 'border-rose-400 focus:ring-rose-200' : 'border-slate-200'
                }`}
                placeholder="Brand refresh"
                disabled={!canManage || submitting}
              />
            </label>
            <label className="flex flex-col gap-2 text-sm text-slate-700">
              Amount
              <input
                name="amount"
                value={form.amount}
                onChange={updateField}
                className={`rounded-xl border px-3 py-2 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 ${
                  errors.amount ? 'border-rose-400 focus:ring-rose-200' : 'border-slate-200'
                }`}
                placeholder="4800"
                type="number"
                min="0"
                disabled={!canManage || submitting}
              />
            </label>
            <label className="flex flex-col gap-2 text-sm text-slate-700">
              Currency
              <select
                name="currency"
                value={form.currency}
                onChange={updateField}
                className="rounded-xl border border-slate-200 px-3 py-2 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                disabled={!canManage || submitting}
              >
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
              </select>
            </label>
            <label className="flex flex-col gap-2 text-sm text-slate-700">
              Kickoff
              <input
                type="date"
                name="kickoffAt"
                value={form.kickoffAt}
                onChange={updateField}
                className="rounded-xl border border-slate-200 px-3 py-2 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                disabled={!canManage || submitting}
              />
            </label>
            <label className="flex flex-col gap-2 text-sm text-slate-700">
              Delivery
              <input
                type="date"
                name="dueAt"
                value={form.dueAt}
                onChange={updateField}
                className="rounded-xl border border-slate-200 px-3 py-2 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                disabled={!canManage || submitting}
              />
            </label>
          </div>
        ) : null}
        {step === 1 ? (
          <div className="flex flex-col gap-4">
            {form.deliverables.map((item, index) => (
              <div key={`deliverable-${index}`} className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50/60 p-4 sm:grid-cols-[minmax(0,1fr)_160px_auto]">
                <label className="flex flex-col gap-2 text-sm text-slate-700">
                  Name
                  <input
                    value={item.title}
                    onChange={(event) => updateDeliverable(index, 'title', event.target.value)}
                    className="rounded-xl border border-slate-200 px-3 py-2 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                    placeholder="Brand board"
                    disabled={!canManage || submitting}
                  />
                </label>
                <label className="flex flex-col gap-2 text-sm text-slate-700">
                  Due
                  <input
                    type="date"
                    value={item.dueAt}
                    onChange={(event) => updateDeliverable(index, 'dueAt', event.target.value)}
                    className="rounded-xl border border-slate-200 px-3 py-2 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                    disabled={!canManage || submitting}
                  />
                </label>
                <button
                  type="button"
                  onClick={() => removeDeliverable(index)}
                  className="mt-6 inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 px-3 text-xs font-semibold text-slate-600 transition hover:border-rose-300 hover:text-rose-500 disabled:cursor-not-allowed"
                  disabled={form.deliverables.length === 1 || submitting}
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addDeliverable}
              className="inline-flex w-fit items-center justify-center rounded-xl border border-dashed border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-accent hover:text-accent"
              disabled={!canManage || submitting}
            >
              Add deliverable
            </button>
            {errors.deliverables ? (
              <p className="text-sm text-rose-600">{errors.deliverables}</p>
            ) : null}
          </div>
        ) : null}
      </div>
      {feedback ? (
        <p className={`text-sm ${feedback.tone === 'success' ? 'text-emerald-600' : 'text-rose-600'}`}>{feedback.message}</p>
      ) : null}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setStep((current) => Math.max(0, current - 1))}
          className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300"
          disabled={step === 0 || submitting}
        >
          Back
        </button>
        {isFinalStep ? (
          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-500"
            disabled={!canManage || submitting}
          >
            {submitting ? 'Saving…' : 'Create gig'}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setStep((current) => Math.min(STEP_SEQUENCE.length - 1, current + 1))}
            className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-500"
            disabled={!canManage || !canAdvance}
          >
            Next
          </button>
        )}
      </div>
    </form>
  );
}

GigNewPanel.propTypes = {
  canManage: PropTypes.bool,
  onCreate: PropTypes.func.isRequired,
  defaultCurrency: PropTypes.string,
};

GigNewPanel.defaultProps = {
  canManage: false,
  defaultCurrency: 'USD',
};
