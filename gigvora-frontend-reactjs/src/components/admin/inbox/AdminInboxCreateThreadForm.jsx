import { useState } from 'react';
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

  const reset = () => {
    setSubject('');
    setChannelType('support');
    setParticipantIds('');
    setMetadata('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const ids = participantIds
      .split(',')
      .map((value) => Number(value.trim()))
      .filter((value) => Number.isFinite(value) && value > 0);
    const metadataValue = (() => {
      if (!metadata.trim()) return undefined;
      try {
        return JSON.parse(metadata);
      } catch (error) {
        return undefined;
      }
    })();
    await onCreate({ subject: subject.trim() || undefined, channelType, participantIds: ids, metadata: metadataValue });
    reset();
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
            />
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
