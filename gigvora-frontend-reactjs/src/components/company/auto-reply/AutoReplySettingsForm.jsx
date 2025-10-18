import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';

const CHANNEL_OPTIONS = [
  { value: 'direct', label: 'Direct messages' },
  { value: 'support', label: 'Support cases' },
  { value: 'project', label: 'Project rooms' },
  { value: 'contract', label: 'Contract threads' },
  { value: 'group', label: 'Group chats' },
];

const MODEL_OPTIONS = [
  { value: 'gpt-4o-mini', label: 'GPT-4o mini (recommended)' },
  { value: 'gpt-4o', label: 'GPT-4o' },
  { value: 'gpt-4.1-mini', label: 'GPT-4.1 mini' },
  { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
];

function normalizeSettings(settings) {
  if (!settings) {
    return {
      enabled: false,
      model: MODEL_OPTIONS[0].value,
      instructions: '',
      channels: ['direct', 'support'],
      temperature: 0.35,
    };
  }

  return {
    enabled: Boolean(settings.autoReplies?.enabled),
    model: settings.model || MODEL_OPTIONS[0].value,
    instructions: settings.autoReplies?.instructions ?? '',
    channels: Array.isArray(settings.autoReplies?.channels)
      ? settings.autoReplies.channels
      : ['direct', 'support'],
    temperature:
      typeof settings.autoReplies?.temperature === 'number'
        ? Math.max(0, Math.min(2, settings.autoReplies.temperature))
        : 0.35,
  };
}

export default function AutoReplySettingsForm({ settings, onSubmit, saving = false, className = '' }) {
  const [formState, setFormState] = useState(() => normalizeSettings(settings));
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    setFormState(normalizeSettings(settings));
  }, [settings]);

  const handleToggleChannel = (channel) => {
    setFormState((prev) => {
      const hasChannel = prev.channels.includes(channel);
      const nextChannels = hasChannel
        ? prev.channels.filter((item) => item !== channel)
        : [...prev.channels, channel];
      return { ...prev, channels: nextChannels };
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage(null);
    setError(null);
    try {
      if (typeof onSubmit === 'function') {
        await onSubmit({
          model: formState.model,
          autoReplies: {
            enabled: formState.enabled,
            instructions: formState.instructions,
            channels: formState.channels,
            temperature: formState.temperature,
          },
        });
        setMessage('Auto-reply preferences saved.');
      }
    } catch (submitError) {
      setError(submitError?.message || 'Unable to save preferences.');
    }
  };

  return (
    <div className={`rounded-3xl border border-slate-200 bg-white p-6 shadow-sm ${className}`}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-lg font-semibold text-slate-900">Reply rules</h3>
        <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
          <span>{formState.enabled ? 'On' : 'Off'}</span>
          <span className="relative inline-flex h-6 w-12 items-center rounded-full bg-slate-200">
            <input
              type="checkbox"
              className="peer absolute h-6 w-12 cursor-pointer opacity-0"
              checked={formState.enabled}
              onChange={() => setFormState((prev) => ({ ...prev, enabled: !prev.enabled }))}
            />
            <span className="absolute left-0 h-6 w-12 rounded-full transition peer-checked:bg-emerald-500" />
            <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition peer-checked:translate-x-6" />
          </span>
        </label>
      </div>

      <form className="mt-5 space-y-5" onSubmit={handleSubmit}>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            Model
            <select
              value={formState.model}
              onChange={(event) => setFormState((prev) => ({ ...prev, model: event.target.value }))}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            >
              {MODEL_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            Creativity (temperature)
            <input
              type="range"
              min="0"
              max="2"
              step="0.05"
              value={formState.temperature}
              onChange={(event) => setFormState((prev) => ({ ...prev, temperature: Number(event.target.value) }))}
              className="accent-emerald-500"
            />
            <span className="text-xs font-medium text-slate-500">{formState.temperature.toFixed(2)}</span>
          </label>
        </div>

        <fieldset className="space-y-2">
          <legend className="text-sm font-semibold text-slate-700">Channels</legend>
          <div className="flex flex-wrap gap-3">
            {CHANNEL_OPTIONS.map((channel) => {
              const checked = formState.channels.includes(channel.value);
              return (
                <label
                  key={channel.value}
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
                    onChange={() => handleToggleChannel(channel.value)}
                  />
                  {channel.label}
                </label>
              );
            })}
          </div>
        </fieldset>

        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Prompt
          <textarea
            value={formState.instructions}
            onChange={(event) => setFormState((prev) => ({ ...prev, instructions: event.target.value }))}
            rows={6}
            placeholder="Share context, tone, escalation rules, and how you want next steps communicated."
            className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
        </label>

        {error ? <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-600">{error}</p> : null}
        {message ? <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-600">{message}</p> : null}

        <button
          type="submit"
          className="inline-flex items-center justify-center rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-70"
          disabled={saving}
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
      </form>
    </div>
  );
}

AutoReplySettingsForm.propTypes = {
  settings: PropTypes.shape({
    model: PropTypes.string,
    autoReplies: PropTypes.shape({
      enabled: PropTypes.bool,
      instructions: PropTypes.string,
      channels: PropTypes.arrayOf(PropTypes.string),
      temperature: PropTypes.number,
    }),
  }),
  onSubmit: PropTypes.func,
  saving: PropTypes.bool,
  className: PropTypes.string,
};

AutoReplySettingsForm.defaultProps = {
  settings: null,
  onSubmit: null,
  saving: false,
  className: '',
};
