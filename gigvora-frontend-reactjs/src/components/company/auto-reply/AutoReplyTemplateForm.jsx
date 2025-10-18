import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { CHANNEL_OPTIONS, STATUS_OPTIONS, TONE_OPTIONS, normalizeTemplate } from './templateOptions.js';

const FORM_STEPS = [
  { id: 'basics', label: 'Basics' },
  { id: 'content', label: 'Content' },
  { id: 'delivery', label: 'Delivery' },
];

export default function AutoReplyTemplateForm({
  mode,
  initialValue,
  submitting = false,
  deleting = false,
  onSubmit,
  onDelete,
  onCancel,
}) {
  const [draft, setDraft] = useState(() => normalizeTemplate(initialValue));
  const [stepIndex, setStepIndex] = useState(0);
  const [error, setError] = useState(null);

  useEffect(() => {
    setDraft(normalizeTemplate(initialValue));
    setStepIndex(0);
    setError(null);
  }, [initialValue]);

  const step = FORM_STEPS[stepIndex];

  const disableNext = useMemo(() => {
    if (step.id === 'basics') {
      return !draft.title.trim();
    }
    if (step.id === 'content') {
      return !draft.instructions.trim();
    }
    if (step.id === 'delivery') {
      return !draft.channels.length;
    }
    return false;
  }, [draft, step.id]);

  const goNext = () => {
    if (stepIndex < FORM_STEPS.length - 1) {
      setStepIndex((prev) => prev + 1);
    }
  };

  const goPrev = () => {
    if (stepIndex > 0) {
      setStepIndex((prev) => prev - 1);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (stepIndex !== FORM_STEPS.length - 1) {
      goNext();
      return;
    }

    setError(null);
    try {
      await onSubmit?.(draft);
    } catch (submitError) {
      setError(submitError?.message || 'Unable to save template.');
    }
  };

  const handleDelete = async () => {
    setError(null);
    try {
      await onDelete?.();
    } catch (deleteError) {
      setError(deleteError?.message || 'Unable to delete template.');
    }
  };

  const renderStep = () => {
    switch (step.id) {
      case 'basics':
        return (
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
              Title
              <input
                type="text"
                value={draft.title}
                onChange={(event) => setDraft((prev) => ({ ...prev, title: event.target.value }))}
                maxLength={120}
                required
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                placeholder="Interview follow-up"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
              Summary
              <input
                type="text"
                value={draft.summary}
                onChange={(event) => setDraft((prev) => ({ ...prev, summary: event.target.value }))}
                maxLength={200}
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                placeholder="24h reply for scheduling"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
              Tone
              <select
                value={draft.tone}
                onChange={(event) => setDraft((prev) => ({ ...prev, tone: event.target.value }))}
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              >
                <option value="">Select tone</option>
                {TONE_OPTIONS.map((tone) => (
                  <option key={tone} value={tone.toLowerCase()}>
                    {tone}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
              Status
              <select
                value={draft.status}
                onChange={(event) => setDraft((prev) => ({ ...prev, status: event.target.value }))}
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              >
                {STATUS_OPTIONS.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        );
      case 'content':
        return (
          <div className="space-y-4">
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
              Instructions
              <textarea
                value={draft.instructions}
                onChange={(event) => setDraft((prev) => ({ ...prev, instructions: event.target.value }))}
                rows={6}
                required
                className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                placeholder="Outline the goal, tone, and escalation rules."
              />
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
              Sample reply
              <textarea
                value={draft.sampleReply}
                onChange={(event) => setDraft((prev) => ({ ...prev, sampleReply: event.target.value }))}
                rows={4}
                className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                placeholder="Thanks for the update..."
              />
            </label>
          </div>
        );
      case 'delivery':
        return (
          <div className="space-y-4">
            <div>
              <p className="text-sm font-semibold text-slate-700">Channels</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {CHANNEL_OPTIONS.map((option) => {
                  const checked = draft.channels.includes(option.value);
                  return (
                    <label
                      key={option.value}
                      className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition ${
                        checked
                          ? 'border-emerald-400 bg-emerald-50 text-emerald-700'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500"
                        checked={checked}
                        onChange={() => {
                          const next = checked
                            ? draft.channels.filter((item) => item !== option.value)
                            : [...draft.channels, option.value];
                          setDraft((prev) => ({ ...prev, channels: next }));
                        }}
                      />
                      {option.label}
                    </label>
                  );
                })}
              </div>
            </div>
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
              Creativity
              <input
                type="range"
                min="0"
                max="2"
                step="0.05"
                value={draft.temperature}
                onChange={(event) => setDraft((prev) => ({ ...prev, temperature: Number(event.target.value) }))}
                className="accent-emerald-500"
              />
              <span className="text-xs font-medium text-slate-500">{draft.temperature.toFixed(2)}</span>
            </label>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <input
                type="checkbox"
                checked={draft.isDefault}
                onChange={(event) => setDraft((prev) => ({ ...prev, isDefault: event.target.checked }))}
                className="h-4 w-4 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500"
              />
              Set as default reply
            </label>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <div className="flex flex-wrap items-center gap-2">
        {FORM_STEPS.map((item, index) => {
          const active = index === stepIndex;
          return (
            <span
              key={item.id}
              className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
                active ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {item.label}
            </span>
          );
        })}
      </div>

      {renderStep()}

      {error ? <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-600">{error}</p> : null}

      <div className="flex flex-wrap items-center gap-3">
        {stepIndex > 0 ? (
          <button
            type="button"
            onClick={goPrev}
            className="inline-flex items-center justify-center rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
          >
            Back
          </button>
        ) : null}

        <button
          type="submit"
          disabled={disableNext || submitting}
          className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {stepIndex === FORM_STEPS.length - 1 ? (submitting ? 'Saving…' : mode === 'edit' ? 'Save' : 'Create') : 'Next'}
        </button>

        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center justify-center rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-900"
        >
          Cancel
        </button>

        {mode === 'edit' && onDelete ? (
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="ml-auto inline-flex items-center justify-center rounded-full border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-600 transition hover:border-rose-300 hover:text-rose-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {deleting ? 'Removing…' : 'Delete'}
          </button>
        ) : null}
      </div>
    </form>
  );
}

AutoReplyTemplateForm.propTypes = {
  mode: PropTypes.oneOf(['create', 'edit']),
  initialValue: PropTypes.shape({
    title: PropTypes.string,
    summary: PropTypes.string,
    tone: PropTypes.string,
    instructions: PropTypes.string,
    sampleReply: PropTypes.string,
    channels: PropTypes.arrayOf(PropTypes.string),
    temperature: PropTypes.number,
    status: PropTypes.string,
    isDefault: PropTypes.bool,
  }),
  submitting: PropTypes.bool,
  deleting: PropTypes.bool,
  onSubmit: PropTypes.func,
  onDelete: PropTypes.func,
  onCancel: PropTypes.func,
};

AutoReplyTemplateForm.defaultProps = {
  mode: 'create',
  initialValue: null,
  submitting: false,
  deleting: false,
  onSubmit: null,
  onDelete: null,
  onCancel: null,
};
