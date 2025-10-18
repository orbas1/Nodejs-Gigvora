import { useEffect, useState } from 'react';
import { RESPONSE_TYPE_OPTIONS } from '../constants.js';
import { formatDateInput } from '../utils.js';

export default function ResponseForm({ value, onSubmit, onCancel, busy }) {
  const [responseType, setResponseType] = useState(value?.responseType ?? 'message');
  const [message, setMessage] = useState(value?.message ?? '');
  const [requestedAction, setRequestedAction] = useState(value?.requestedAction ?? '');
  const [respondedAt, setRespondedAt] = useState(formatDateInput(value?.respondedAt));
  const [error, setError] = useState(null);

  useEffect(() => {
    setResponseType(value?.responseType ?? 'message');
    setMessage(value?.message ?? '');
    setRequestedAction(value?.requestedAction ?? '');
    setRespondedAt(formatDateInput(value?.respondedAt));
    setError(null);
  }, [value]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!message.trim()) {
      setError('Message required');
      return;
    }
    setError(null);
    await onSubmit({
      responseType,
      message: message.trim(),
      requestedAction: requestedAction || null,
      respondedAt: respondedAt || null,
    });
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
        Type
        <select
          className="rounded-2xl border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
          value={responseType}
          onChange={(event) => setResponseType(event.target.value)}
          disabled={busy}
        >
          {RESPONSE_TYPE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
        Message
        <textarea
          className="min-h-[120px] rounded-2xl border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          disabled={busy}
        />
      </label>

      <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
        Request
        <input
          type="text"
          className="rounded-2xl border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
          value={requestedAction}
          onChange={(event) => setRequestedAction(event.target.value)}
          disabled={busy}
        />
      </label>

      <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
        Logged
        <input
          type="date"
          className="rounded-2xl border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
          value={respondedAt}
          onChange={(event) => setRespondedAt(event.target.value)}
          disabled={busy}
        />
      </label>

      {error ? <p className="text-sm text-rose-600">{error}</p> : null}

      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          className="rounded-2xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
          onClick={onCancel}
          disabled={busy}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:bg-emerald-300"
          disabled={busy}
        >
          Save
        </button>
      </div>
    </form>
  );
}
