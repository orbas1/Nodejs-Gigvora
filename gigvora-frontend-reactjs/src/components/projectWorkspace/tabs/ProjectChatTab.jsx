import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';

const INITIAL_FORM = {
  authorName: '',
  authorRole: '',
  body: '',
  channelId: null,
};

export default function ProjectChatTab({ project, actions, canManage }) {
  const channels = project.chat?.channels ?? [];
  const messages = project.chat?.messages ?? [];
  const [selectedChannelId, setSelectedChannelId] = useState(channels[0]?.id ?? null);
  const [form, setForm] = useState({ ...INITIAL_FORM, channelId: channels[0]?.id ?? null });
  const [editingId, setEditingId] = useState(null);
  const [editingBody, setEditingBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    if (channels.length && !channels.some((channel) => channel.id === selectedChannelId)) {
      const firstId = channels[0]?.id ?? null;
      setSelectedChannelId(firstId);
      setForm((current) => ({ ...current, channelId: firstId }));
    }
  }, [channels, selectedChannelId]);

  const filteredMessages = useMemo(() => {
    if (!selectedChannelId) {
      return [];
    }
    return messages
      .filter((message) => message.channelId === selectedChannelId)
      .sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
  }, [messages, selectedChannelId]);

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSend = async (event) => {
    event.preventDefault();
    if (!canManage || !form.channelId) {
      return;
    }
    setSubmitting(true);
    setFeedback(null);
    try {
      await actions.createChatMessage(project.id, {
        channelId: form.channelId,
        authorName: form.authorName || 'Project member',
        authorRole: form.authorRole || 'collaborator',
        body: form.body,
      });
      setForm((current) => ({ ...current, body: '' }));
      setFeedback({ status: 'success', message: 'Message sent.' });
    } catch (error) {
      setFeedback({ status: 'error', message: error?.message || 'Failed to send message.' });
    } finally {
      setSubmitting(false);
    }
  };

  const startEditing = (message) => {
    setEditingId(message.id);
    setEditingBody(message.body);
  };

  const handleUpdateMessage = async (event) => {
    event.preventDefault();
    if (!canManage) {
      return;
    }
    setSubmitting(true);
    setFeedback(null);
    try {
      await actions.updateChatMessage(project.id, editingId, { body: editingBody });
      setEditingId(null);
      setEditingBody('');
      setFeedback({ status: 'success', message: 'Message updated.' });
    } catch (error) {
      setFeedback({ status: 'error', message: error?.message || 'Unable to update message.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteMessage = async (messageId) => {
    if (!canManage) {
      return;
    }
    setSubmitting(true);
    setFeedback(null);
    try {
      await actions.deleteChatMessage(project.id, messageId);
      setFeedback({ status: 'success', message: 'Message removed.' });
    } catch (error) {
      setFeedback({ status: 'error', message: error?.message || 'Unable to delete message.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
      <div className="flex flex-col rounded-2xl border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <p className="text-sm font-semibold text-slate-900">Project channels</p>
            <p className="text-xs text-slate-500">Switch between collaboration spaces.</p>
          </div>
          <select
            value={selectedChannelId ?? ''}
            onChange={(event) => {
              const newChannelId = Number(event.target.value);
              setSelectedChannelId(newChannelId);
              setForm((current) => ({ ...current, channelId: newChannelId }));
            }}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
          >
            {channels.map((channel) => (
              <option key={channel.id} value={channel.id}>
                #{channel.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
          {filteredMessages.length ? (
            filteredMessages.map((message) => (
              <div key={message.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{message.authorName}</p>
                    {message.authorRole ? (
                      <p className="text-xs uppercase tracking-wide text-slate-500">{message.authorRole}</p>
                    ) : null}
                  </div>
                  <div className="flex gap-2 text-xs text-slate-500">
                    {message.createdAt ? new Date(message.createdAt).toLocaleString('en-GB') : 'Just now'}
                    {canManage ? (
                      <>
                        <button
                          type="button"
                          onClick={() => startEditing(message)}
                          className="rounded-full border border-slate-200 px-2 py-0.5 font-semibold text-slate-600 hover:border-accent hover:text-accent"
                          disabled={submitting}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteMessage(message.id)}
                          className="rounded-full border border-rose-200 px-2 py-0.5 font-semibold text-rose-600 hover:border-rose-400 hover:bg-rose-50"
                          disabled={submitting}
                        >
                          Delete
                        </button>
                      </>
                    ) : null}
                  </div>
                </div>
                <p className="mt-3 text-sm text-slate-700 whitespace-pre-line">{message.body}</p>
              </div>
            ))
          ) : (
            <p className="rounded-2xl border border-dashed border-slate-200 bg-white/70 p-4 text-sm text-slate-500">
              No messages in this channel yet. Start the conversation below.
            </p>
          )}
        </div>

        {editingId ? (
          <form onSubmit={handleUpdateMessage} className="border-t border-slate-200 bg-slate-100 px-5 py-4">
            <label className="flex flex-col gap-2 text-sm text-slate-700">
              Edit message
              <textarea
                value={editingBody}
                onChange={(event) => setEditingBody(event.target.value)}
                rows={3}
                className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
                disabled={submitting}
              />
            </label>
            <div className="mt-3 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setEditingBody('');
                }}
                className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:border-slate-300"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="rounded-full bg-accent px-5 py-2 text-xs font-semibold text-white shadow-soft transition hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {submitting ? 'Saving…' : 'Save message'}
              </button>
            </div>
          </form>
        ) : null}
      </div>

      <form onSubmit={handleSend} className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5">
        <h4 className="text-base font-semibold text-slate-900">Send a message</h4>
        <label className="mt-4 flex flex-col gap-2 text-sm text-slate-700">
          Display name
          <input
            name="authorName"
            value={form.authorName}
            onChange={handleFormChange}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
            placeholder="Your name"
            disabled={!canManage || submitting}
          />
        </label>
        <label className="mt-3 flex flex-col gap-2 text-sm text-slate-700">
          Role or team
          <input
            name="authorRole"
            value={form.authorRole}
            onChange={handleFormChange}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
            placeholder="Project manager"
            disabled={!canManage || submitting}
          />
        </label>
        <label className="mt-3 flex flex-col gap-2 text-sm text-slate-700">
          Message
          <textarea
            name="body"
            rows={6}
            value={form.body}
            onChange={handleFormChange}
            className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
            placeholder="Share an update, decision, or request."
            disabled={!canManage || submitting}
          />
        </label>
        <div className="mt-auto flex justify-end">
          <button
            type="submit"
            disabled={!canManage || submitting || !form.channelId || !form.body.trim()}
            className="rounded-full bg-accent px-6 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {submitting ? 'Sending…' : 'Send message'}
          </button>
        </div>
        {feedback ? (
          <p className={`mt-3 text-sm ${feedback.status === 'error' ? 'text-rose-600' : 'text-emerald-600'}`}>
            {feedback.message}
          </p>
        ) : null}
      </form>
    </div>
  );
}

ProjectChatTab.propTypes = {
  project: PropTypes.object.isRequired,
  actions: PropTypes.shape({
    createChatMessage: PropTypes.func.isRequired,
    updateChatMessage: PropTypes.func.isRequired,
    deleteChatMessage: PropTypes.func.isRequired,
  }).isRequired,
  canManage: PropTypes.bool,
};

ProjectChatTab.defaultProps = {
  canManage: true,
};
