
import { useMemo, useState } from 'react';
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';

function formatTimestamp(value) {
  if (!value) return 'Just now';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Unknown time';
  }
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
}

export default function CandidateResponsesPanel({ responses, applications, onSend }) {
  const [formState, setFormState] = useState({ applicationId: '', channel: 'message', message: '' });
  const [sending, setSending] = useState(false);

  const applicationOptions = useMemo(() => {
    return (applications ?? []).map((application) => ({
      id: application.id,
      label:
        `${application.candidate?.name ?? application.candidateName ?? 'Candidate'} • ${application.jobTitle ?? ''}`.trim(),
    }));
  }, [applications]);

  const recentResponses = useMemo(() => {
    return (responses ?? [])
      .slice()
      .sort((a, b) => new Date(b.sentAt ?? 0) - new Date(a.sentAt ?? 0))
      .slice(0, 10);
  }, [responses]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!formState.applicationId || !formState.message.trim()) {
      return;
    }
    try {
      setSending(true);
      await onSend?.({
        applicationId: formState.applicationId,
        channel: formState.channel,
        message: formState.message,
      });
      setFormState({ applicationId: '', channel: 'message', message: '' });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <form className="rounded-3xl border border-slate-200 bg-white/70 p-4 shadow-sm" onSubmit={handleSubmit}>
        <h4 className="text-sm font-semibold text-slate-900">Send</h4>
        <div className="mt-3 grid gap-3">
          <label className="flex flex-col gap-1 text-sm">
            Candidate
            <select
              name="applicationId"
              value={formState.applicationId}
              onChange={handleChange}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              required
            >
              <option value="">Select</option>
              {applicationOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Channel
            <select
              name="channel"
              value={formState.channel}
              onChange={handleChange}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            >
              <option value="message">Message</option>
              <option value="email">Email</option>
              <option value="call">Call</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Message
            <textarea
              name="message"
              value={formState.message}
              onChange={handleChange}
              rows={4}
              className="rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              placeholder="Update"
              required
            />
          </label>
        </div>
        <div className="mt-4 flex items-center justify-end gap-3">
          <button
            type="submit"
            disabled={sending}
            className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
          >
            {sending ? 'Sending…' : 'Send'}
          </button>
        </div>
      </form>
      <div className="rounded-3xl border border-slate-200 bg-white/70 p-4 shadow-sm">
        <h4 className="text-sm font-semibold text-slate-900">Messages</h4>
        <ul className="mt-3 space-y-3">
          {recentResponses.length ? (
            recentResponses.map((response) => (
              <li key={response.id} className="rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
                <div className="flex items-start gap-3">
                  <span className="mt-1 rounded-full bg-blue-50 p-2 text-blue-600">
                    <ChatBubbleLeftRightIcon className="h-4 w-4" />
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-900">
                      {response.application?.applicant?.firstName ?? response.respondentName ?? 'Candidate'}
                    </p>
                    <p className="text-xs text-slate-500">
                      {response.direction === 'outbound' ? 'Sent' : 'Received'} • {response.channel ?? 'message'} • {formatTimestamp(response.sentAt)}
                    </p>
                    <p className="mt-2 text-sm text-slate-700">{response.message}</p>
                  </div>
                </div>
              </li>
            ))
          ) : (
            <li className="rounded-2xl border border-dashed border-slate-200 bg-white/60 px-3 py-6 text-sm text-slate-500">No messages.</li>
          )}
        </ul>
      </div>
    </div>
  );
}
