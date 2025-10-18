import { useEffect, useState } from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';

const CHANNEL_OPTIONS = [
  { value: 'direct', label: 'Direct' },
  { value: 'group', label: 'Group' },
  { value: 'project', label: 'Project' },
  { value: 'support', label: 'Support' },
  { value: 'contract', label: 'Contract' },
];

export default function NewThreadModal({ open, onClose, onCreate, members, busy, error }) {
  const [subject, setSubject] = useState('');
  const [channelType, setChannelType] = useState('direct');
  const [initialMessage, setInitialMessage] = useState('');
  const [participantIds, setParticipantIds] = useState([]);

  useEffect(() => {
    if (!open) {
      setSubject('');
      setChannelType('direct');
      setInitialMessage('');
      setParticipantIds([]);
    }
  }, [open]);

  const toggleParticipant = (userId) => {
    setParticipantIds((prev) => (prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!subject.trim()) {
      return;
    }
    onCreate?.({ subject: subject.trim(), channelType, participantIds, initialMessage: initialMessage.trim() });
  };

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 px-4 py-8">
      <div className="w-full max-w-3xl rounded-3xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Start a conversation</h2>
            <p className="text-sm text-slate-500">Draft a new workspace conversation and notify collaborators.</p>
          </div>
          <button type="button" onClick={onClose} className="text-sm font-semibold text-slate-500 hover:text-slate-700">
            Close
          </button>
        </div>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <label className="flex flex-col text-sm text-slate-600">
            Subject
            <input
              type="text"
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              className="mt-1 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              placeholder="Candidate follow-up"
              required
            />
          </label>
          <label className="flex flex-col text-sm text-slate-600">
            Channel
            <select
              value={channelType}
              onChange={(event) => setChannelType(event.target.value)}
              className="mt-1 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            >
              {CHANNEL_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <fieldset className="rounded-2xl border border-slate-200 p-4">
            <legend className="px-2 text-sm font-semibold text-slate-700">Participants</legend>
            {error ? (
              <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-600">{error.message}</p>
            ) : null}
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {members.length ? (
                members.map((member) => (
                  <label key={member.id} className="flex items-center gap-2 text-sm text-slate-600">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-slate-300 text-accent focus:ring-accent"
                      checked={participantIds.includes(member.userId)}
                      onChange={() => toggleParticipant(member.userId)}
                    />
                    <span>
                      {member.user?.firstName} {member.user?.lastName}
                      {member.user?.email ? <span className="ml-1 text-xs text-slate-400">({member.user.email})</span> : null}
                    </span>
                  </label>
                ))
              ) : (
                <p className="text-sm text-slate-500">No active members found.</p>
              )}
            </div>
          </fieldset>
          <label className="flex flex-col text-sm text-slate-600">
            First message (optional)
            <textarea
              rows={3}
              value={initialMessage}
              onChange={(event) => setInitialMessage(event.target.value)}
              className="mt-1 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              placeholder="Welcome message or agenda"
            />
          </label>
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-slate-400">Notifications are sent to all selected participants.</p>
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-accentDark disabled:opacity-60"
              disabled={busy}
            >
              <PlusIcon className="h-4 w-4" /> Create conversation
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
