import { useMemo, useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

const CHANNEL_OPTIONS = [
  { value: 'support', label: 'Support' },
  { value: 'project', label: 'Project' },
  { value: 'contract', label: 'Contract' },
  { value: 'group', label: 'Group' },
  { value: 'direct', label: 'Direct' },
];

export default function AdminInboxCreateThreadForm({ open, onClose, onCreate, busy }) {
  const [subject, setSubject] = useState('');
  const [channelType, setChannelType] = useState('support');
  const [participantIds, setParticipantIds] = useState('');
  const [metadata, setMetadata] = useState('');
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');

  const disableInputs = Boolean(busy);

  const parsedParticipants = useMemo(() => {
    return participantIds
      .split(',')
      .map((value) => Number(value.trim()))
      .filter((value, index, list) => Number.isFinite(value) && value > 0 && list.indexOf(value) === index);
  }, [participantIds]);

  const reset = ({ preserveFeedback = false } = {}) => {
    setSubject('');
    setChannelType('support');
    setParticipantIds('');
    setMetadata('');
    setError('');
    if (!preserveFeedback) {
      setFeedback('');
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setFeedback('');

    if (!parsedParticipants.length) {
      setError('Add at least one participant ID.');
      return;
    }

    let metadataValue;
    if (metadata.trim()) {
      try {
        metadataValue = JSON.parse(metadata);
      } catch (parseError) {
        setError('Metadata must be valid JSON.');
        return;
      }
    }

    const payload = {
      subject: subject.trim() || undefined,
      channelType,
      participantIds: parsedParticipants,
      metadata: metadataValue,
    };

    try {
      await onCreate?.(payload);
      reset({ preserveFeedback: true });
      setFeedback('Conversation created.');
    } catch (submitError) {
      setError(submitError?.message ?? 'Unable to create conversation.');
    }
  };

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 px-4 py-8">
      <div className="relative w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
        <button
          type="button"
          onClick={() => {
            reset();
            onClose();
          }}
          className="absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-slate-300 hover:text-slate-700"
          aria-label="Close new thread form"
        >
          <XMarkIcon className="h-4 w-4" />
        </button>
        <h3 className="text-lg font-semibold text-slate-900">New conversation</h3>
        {(error || feedback) ? (
          <div
            role="status"
            aria-live="assertive"
            className={`mt-3 rounded-2xl border px-3 py-2 text-sm ${
              error ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'
            }`}
          >
            {error || feedback}
          </div>
        ) : null}
        <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="admin-thread-subject">
              Subject
            </label>
            <input
              id="admin-thread-subject"
              type="text"
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              placeholder="Subject"
              disabled={disableInputs}
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="admin-thread-channel">
              Channel
            </label>
            <select
              id="admin-thread-channel"
              value={channelType}
              onChange={(event) => setChannelType(event.target.value)}
              className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              disabled={disableInputs}
            >
              {CHANNEL_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="admin-thread-participants">
              Participants
            </label>
            <input
              id="admin-thread-participants"
              type="text"
              value={participantIds}
              onChange={(event) => setParticipantIds(event.target.value)}
              className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              placeholder="IDs"
              disabled={disableInputs}
            />
            <p className="mt-1 text-xs text-slate-500">Comma separate user IDs. You can paste from CRM exports.</p>
            <p className="text-xs text-slate-500">Parsed IDs: {parsedParticipants.join(', ') || '—'}</p>
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="admin-thread-metadata">
              Metadata
            </label>
            <textarea
              id="admin-thread-metadata"
              rows={3}
              value={metadata}
              onChange={(event) => setMetadata(event.target.value)}
              className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              placeholder='{"priority":"urgent"}'
              disabled={disableInputs}
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={busy}
              className="inline-flex items-center justify-center rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-accentDark disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busy ? 'Creating…' : 'Create'}
            </button>
            <button
              type="button"
              onClick={() => {
                reset();
                onClose();
              }}
              className="inline-flex items-center justify-center rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-accent/60 hover:text-accent"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
