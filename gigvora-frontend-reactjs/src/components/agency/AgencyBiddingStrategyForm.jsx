import { useEffect, useState } from 'react';
import { Switch } from '@headlessui/react';
import { ScaleIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';

const STRATEGY_OPTIONS = [
  { id: 'balanced', label: 'Balanced' },
  { id: 'aggressive', label: 'Aggressive' },
  { id: 'conservative', label: 'Conservative' },
];

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

export default function AgencyBiddingStrategyForm({ bidding, disabled, busy, onSave }) {
  const [formState, setFormState] = useState({
    enabled: false,
    strategy: 'balanced',
    minBudget: '',
    maxBudget: '',
    markupPercent: 18,
    autoSubmit: false,
    guardrails: { requireHumanReview: true, notifyOwner: true, maxConcurrentBids: 5, minRatingThreshold: 4.2 },
  });
  const [status, setStatus] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!bidding) {
      return;
    }
    setFormState({
      enabled: Boolean(bidding.enabled),
      strategy: bidding.strategy || 'balanced',
      minBudget: bidding.minBudget ?? '',
      maxBudget: bidding.maxBudget ?? '',
      markupPercent: Number.isFinite(bidding.markupPercent) ? bidding.markupPercent : 18,
      autoSubmit: Boolean(bidding.autoSubmit),
      guardrails: {
        requireHumanReview: bidding.guardrails?.requireHumanReview ?? true,
        notifyOwner: bidding.guardrails?.notifyOwner ?? true,
        maxConcurrentBids: bidding.guardrails?.maxConcurrentBids ?? 5,
        minRatingThreshold: bidding.guardrails?.minRatingThreshold ?? 4.2,
      },
    });
    setStatus(null);
    setError(null);
  }, [bidding]);

  const handleGuardrailChange = (key, value) => {
    setFormState((previous) => ({
      ...previous,
      guardrails: {
        ...previous.guardrails,
        [key]: value,
      },
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!onSave) {
      return;
    }
    setStatus(null);
    setError(null);
    try {
      await onSave({
        bidding: {
          enabled: formState.enabled,
          strategy: formState.strategy,
          minBudget: formState.minBudget === '' ? null : Number(formState.minBudget),
          maxBudget: formState.maxBudget === '' ? null : Number(formState.maxBudget),
          markupPercent: Number(formState.markupPercent),
          autoSubmit: formState.autoSubmit,
          guardrails: formState.guardrails,
        },
      });
      setStatus('Saved.');
    } catch (submissionError) {
      setError(submissionError?.message ?? 'Unable to update bidding settings.');
    }
  };

  return (
    <section id="ai-bidding" className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
      <div className="flex items-center gap-3">
        <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
          <ScaleIcon className="h-6 w-6" aria-hidden="true" />
        </span>
        <h3 className="text-lg font-semibold text-slate-900">Auto bidding</h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-medium text-slate-700">Enable</p>
          <Switch
            checked={formState.enabled}
            onChange={(value) => setFormState((previous) => ({ ...previous, enabled: value }))}
            className={classNames(
              formState.enabled ? 'bg-emerald-600' : 'bg-slate-200',
              'relative inline-flex h-6 w-11 items-center rounded-full transition',
              disabled || busy ? 'opacity-60' : 'cursor-pointer',
            )}
            disabled={disabled || busy}
            aria-label="Enable auto bidding"
          >
            <span
              className={classNames(
                formState.enabled ? 'translate-x-6' : 'translate-x-1',
                'inline-block h-4 w-4 transform rounded-full bg-white transition',
              )}
            />
          </Switch>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {STRATEGY_OPTIONS.map((option) => (
            <label
              key={option.id}
              className={classNames(
                'flex h-full cursor-pointer flex-col rounded-3xl border p-4 transition',
                formState.strategy === option.id
                  ? 'border-emerald-200 bg-emerald-50'
                  : 'border-slate-200 bg-white text-slate-600',
                disabled || busy ? 'opacity-60' : 'hover:border-emerald-200 hover:shadow-sm',
              )}
            >
              <input
                type="radio"
                name="bidding-strategy"
                value={option.id}
                className="sr-only"
                checked={formState.strategy === option.id}
                onChange={() => setFormState((previous) => ({ ...previous, strategy: option.id }))}
                disabled={disabled || busy}
              />
              <span className="text-sm font-semibold text-slate-900">{option.label}</span>
            </label>
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label htmlFor="bidding-min-budget" className="text-sm font-medium text-slate-700">
              Minimum budget ($)
            </label>
            <input
              id="bidding-min-budget"
              type="number"
              min="0"
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-inner focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-200"
              value={formState.minBudget}
              onChange={(event) => setFormState((previous) => ({ ...previous, minBudget: event.target.value }))}
              disabled={disabled || busy}
            />
          </div>
          <div>
            <label htmlFor="bidding-max-budget" className="text-sm font-medium text-slate-700">
              Maximum budget ($)
            </label>
            <input
              id="bidding-max-budget"
              type="number"
              min="0"
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-inner focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-200"
              value={formState.maxBudget}
              onChange={(event) => setFormState((previous) => ({ ...previous, maxBudget: event.target.value }))}
              disabled={disabled || busy}
            />
          </div>
          <div>
            <label htmlFor="bidding-markup" className="text-sm font-medium text-slate-700">
              Target markup (%)
            </label>
            <input
              id="bidding-markup"
              type="number"
              min="0"
              step="0.5"
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-inner focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-200"
              value={formState.markupPercent}
              onChange={(event) => setFormState((previous) => ({ ...previous, markupPercent: event.target.value }))}
              disabled={disabled || busy}
            />
          </div>
        </div>

        <div className="space-y-4 rounded-3xl border border-slate-200 bg-slate-50 p-5">
          <div className="flex items-center gap-2">
            <ShieldCheckIcon className="h-5 w-5 text-emerald-600" aria-hidden="true" />
            <p className="text-sm font-semibold text-slate-900">Submission guardrails</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm">
              <span>Require human review</span>
              <Switch
                checked={formState.guardrails.requireHumanReview}
                onChange={(value) => handleGuardrailChange('requireHumanReview', value)}
                className={classNames(
                  formState.guardrails.requireHumanReview ? 'bg-emerald-600' : 'bg-slate-200',
                  'relative inline-flex h-5 w-10 items-center rounded-full transition',
                  disabled || busy ? 'opacity-60' : 'cursor-pointer',
                )}
                disabled={disabled || busy}
              >
                <span
                  className={classNames(
                    formState.guardrails.requireHumanReview ? 'translate-x-5' : 'translate-x-1',
                    'inline-block h-4 w-4 transform rounded-full bg-white transition',
                  )}
                />
              </Switch>
            </label>
            <label className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm">
              <span>Notify owner on submission</span>
              <Switch
                checked={formState.guardrails.notifyOwner}
                onChange={(value) => handleGuardrailChange('notifyOwner', value)}
                className={classNames(
                  formState.guardrails.notifyOwner ? 'bg-emerald-600' : 'bg-slate-200',
                  'relative inline-flex h-5 w-10 items-center rounded-full transition',
                  disabled || busy ? 'opacity-60' : 'cursor-pointer',
                )}
                disabled={disabled || busy}
              >
                <span
                  className={classNames(
                    formState.guardrails.notifyOwner ? 'translate-x-5' : 'translate-x-1',
                    'inline-block h-4 w-4 transform rounded-full bg-white transition',
                  )}
                />
              </Switch>
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="max-concurrent-bids" className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Concurrent bids
              </label>
              <input
                id="max-concurrent-bids"
                type="number"
                min="1"
                max="25"
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 shadow-inner focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                value={formState.guardrails.maxConcurrentBids}
                onChange={(event) => handleGuardrailChange('maxConcurrentBids', Number(event.target.value))}
                disabled={disabled || busy}
              />
            </div>
            <div>
              <label htmlFor="min-rating-threshold" className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Minimum client rating
              </label>
              <input
                id="min-rating-threshold"
                type="number"
                min="0"
                max="5"
                step="0.1"
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 shadow-inner focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                value={formState.guardrails.minRatingThreshold}
                onChange={(event) => handleGuardrailChange('minRatingThreshold', Number(event.target.value))}
                disabled={disabled || busy}
              />
            </div>
          </div>
        </div>

        {status ? <p className="text-sm font-medium text-emerald-600">{status}</p> : null}
        {error ? <p className="text-sm font-medium text-rose-600">{error}</p> : null}

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={disabled || busy}
          >
            Save bidding
          </button>
        </div>
      </form>
    </section>
  );
}
