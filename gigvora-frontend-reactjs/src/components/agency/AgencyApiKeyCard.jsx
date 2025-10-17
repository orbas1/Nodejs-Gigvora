import { useState } from 'react';
import { KeyIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

export default function AgencyApiKeyCard({ apiKey, onSave, onRemove, disabled, busy }) {
  const [value, setValue] = useState('');
  const [status, setStatus] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!onSave || !value.trim()) {
      return;
    }
    setStatus(null);
    setError(null);
    try {
      await onSave({ apiKey: value.trim() });
      setValue('');
      setStatus('Key saved.');
    } catch (submissionError) {
      setError(submissionError?.message ?? 'Unable to update key.');
    }
  };

  const handleRemove = async () => {
    if (!onRemove) {
      return;
    }
    setStatus(null);
    setError(null);
    try {
      await onRemove();
      setStatus('Key removed.');
    } catch (removalError) {
      setError(removalError?.message ?? 'Unable to remove key.');
    }
  };

  return (
    <section id="ai-api-key" className="rounded-3xl border border-violet-200 bg-gradient-to-br from-white via-violet-50 to-violet-100/60 p-6 shadow-soft">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-100 text-violet-600">
            <KeyIcon className="h-6 w-6" aria-hidden="true" />
          </span>
          <h3 className="text-lg font-semibold text-slate-900">OpenAI key</h3>
        </div>
        <div className="text-right text-xs text-slate-500">
          <p className="font-semibold uppercase tracking-[0.3em] text-violet-700">Fingerprint</p>
          <p className="mt-1 font-semibold text-slate-900">{apiKey?.fingerprint ?? 'Not configured'}</p>
          <p className="mt-1">{apiKey?.updatedAt ? new Date(apiKey.updatedAt).toLocaleString() : 'Awaiting first upload'}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label htmlFor="workspace-openai-key" className="text-sm font-medium text-slate-700">
            Upload new key
          </label>
          <input
            id="workspace-openai-key"
            type="password"
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-inner focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-200"
            placeholder="sk-live-..."
            value={value}
            onChange={(event) => setValue(event.target.value)}
            disabled={disabled || busy}
            autoComplete="off"
          />
        </div>

        {status ? <p className="text-sm font-medium text-emerald-600">{status}</p> : null}
        {error ? <p className="text-sm font-medium text-rose-600">{error}</p> : null}

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-full bg-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={disabled || busy || !value.trim()}
          >
            <ArrowPathIcon className={`h-4 w-4 ${busy ? 'animate-spin' : ''}`} aria-hidden="true" />
            Save
          </button>
          <button
            type="button"
            onClick={handleRemove}
            className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-white px-4 py-2 text-sm font-semibold text-violet-700 transition hover:border-violet-300 hover:text-violet-900 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={disabled || busy || !apiKey?.configured}
          >
            Remove key
          </button>
        </div>
      </form>
    </section>
  );
}
