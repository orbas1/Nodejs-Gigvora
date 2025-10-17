import { useEffect, useState } from 'react';
import { Switch } from '@headlessui/react';
import { SparklesIcon, PaperAirplaneIcon, ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';

const CHANNEL_OPTIONS = [
  { id: 'direct', label: 'Direct messages' },
  { id: 'support', label: 'Support queue' },
  { id: 'project', label: 'Project rooms' },
  { id: 'contract', label: 'Contract threads' },
  { id: 'group', label: 'Group channels' },
];

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

export default function AgencyAutoReplySettings({ settings, disabled, busy, onSave }) {
  const [formState, setFormState] = useState({
    enabled: false,
    instructions: '',
    channels: ['direct', 'support'],
    temperature: 0.35,
    responseTimeGoalMinutes: 5,
    model: 'gpt-4o-mini',
  });
  const [status, setStatus] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!settings) {
      return;
    }
    setFormState({
      enabled: Boolean(settings.enabled),
      instructions: settings.instructions ?? '',
      channels: Array.isArray(settings.channels) && settings.channels.length ? settings.channels : ['direct', 'support'],
      temperature: Number.isFinite(settings.temperature) ? settings.temperature : 0.35,
      responseTimeGoalMinutes: Number.isFinite(settings.responseTimeGoalMinutes)
        ? settings.responseTimeGoalMinutes
        : 5,
      model: settings.model || 'gpt-4o-mini',
    });
    setStatus(null);
    setError(null);
  }, [settings]);

  const toggleChannel = (channelId) => {
    setFormState((previous) => {
      const next = new Set(previous.channels ?? []);
      if (next.has(channelId)) {
        next.delete(channelId);
      } else {
        next.add(channelId);
      }
      const values = Array.from(next);
      return { ...previous, channels: values.length ? values : [] };
    });
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
        autoReply: {
          ...formState,
          temperature: Number(formState.temperature),
          responseTimeGoalMinutes: Number(formState.responseTimeGoalMinutes),
        },
      });
      setStatus('Saved.');
    } catch (submissionError) {
      setError(submissionError?.message ?? 'Unable to save settings.');
    }
  };

  const handleTest = () => {
    window.open('/inbox?compose=ai-auto-reply-test', '_blank', 'noopener');
  };

  return (
    <section id="ai-auto-replies" className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
            <SparklesIcon className="h-6 w-6" aria-hidden="true" />
          </span>
          <h3 className="text-lg font-semibold text-slate-900">Auto replies</h3>
        </div>
        <button
          type="button"
          onClick={handleTest}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-blue-200 hover:text-blue-700"
        >
          <ArrowTopRightOnSquareIcon className="h-4 w-4" aria-hidden="true" />
          Test
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-medium text-slate-700">Enable</p>
          <Switch
            checked={formState.enabled}
            onChange={(value) => setFormState((previous) => ({ ...previous, enabled: value }))}
            disabled={disabled || busy}
            className={classNames(
              formState.enabled ? 'bg-blue-600' : 'bg-slate-200',
              'relative inline-flex h-6 w-11 items-center rounded-full transition',
              disabled || busy ? 'opacity-60' : 'cursor-pointer',
            )}
          >
            <span
              className={classNames(
                formState.enabled ? 'translate-x-6' : 'translate-x-1',
                'inline-block h-4 w-4 transform rounded-full bg-white transition',
              )}
            />
          </Switch>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="auto-reply-model" className="text-sm font-medium text-slate-700">
              Model name
            </label>
            <input
              id="auto-reply-model"
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-inner focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
              value={formState.model}
              onChange={(event) => setFormState((previous) => ({ ...previous, model: event.target.value }))}
              disabled={disabled || busy}
            />
          </div>
          <div>
            <label htmlFor="auto-reply-response-time" className="text-sm font-medium text-slate-700">
              Target response time (minutes)
            </label>
            <input
              id="auto-reply-response-time"
              type="number"
              min="1"
              max="240"
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-inner focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
              value={formState.responseTimeGoalMinutes}
              onChange={(event) =>
                setFormState((previous) => ({ ...previous, responseTimeGoalMinutes: Number(event.target.value) }))
              }
              disabled={disabled || busy}
            />
          </div>
        </div>

          <div>
            <label htmlFor="auto-reply-instructions" className="text-sm font-medium text-slate-700">
              Instructions
            </label>
            <textarea
              id="auto-reply-instructions"
              rows={4}
              className="mt-2 w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-inner focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
              placeholder="Mention tone, escalation guardrails, or data sources to reference."
              value={formState.instructions}
              onChange={(event) => setFormState((previous) => ({ ...previous, instructions: event.target.value }))}
              disabled={disabled || busy}
            />
          </div>

        <div className="grid gap-4 md:grid-cols-[1.3fr_1fr]">
          <div>
            <p className="text-sm font-medium text-slate-700">Channels</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {CHANNEL_OPTIONS.map((channel) => (
                <label
                  key={channel.id}
                  className={classNames(
                    'flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm transition',
                    formState.channels.includes(channel.id)
                      ? 'border-blue-200 bg-blue-50 text-blue-700'
                      : 'border-slate-200 bg-white text-slate-600',
                  )}
                >
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    checked={formState.channels.includes(channel.id)}
                    onChange={() => toggleChannel(channel.id)}
                    disabled={disabled || busy}
                  />
                  {channel.label}
                </label>
              ))}
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-700">Creativity</p>
            <div className="mt-4 rounded-3xl border border-slate-200 bg-slate-50 px-4 py-5">
              <p className="text-2xl font-semibold text-slate-900">{formState.temperature}</p>
              <input
                type="range"
                min="0"
                max="2"
                step="0.05"
                value={formState.temperature}
                onChange={(event) =>
                  setFormState((previous) => ({ ...previous, temperature: Number(event.target.value) }))
                }
                className="mt-4 w-full accent-blue-600"
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
            className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={disabled || busy}
          >
            <PaperAirplaneIcon className={`h-4 w-4 ${busy ? 'animate-pulse' : ''}`} aria-hidden="true" />
            Save
          </button>
        </div>
      </form>
    </section>
  );
}
