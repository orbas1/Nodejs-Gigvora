import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import {
  AdjustmentsHorizontalIcon,
  ArrowPathIcon,
  ChatBubbleLeftRightIcon,
  ClockIcon,
  EnvelopeOpenIcon,
  PaperAirplaneIcon,
  PlusIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import DataStatus from '../../DataStatus.jsx';
import useSession from '../../../hooks/useSession.js';
import useFreelancerInboxWorkspace from '../../../hooks/useFreelancerInboxWorkspace.js';
import { resolveActorId } from '../../../utils/session.js';
import { createThread, sendMessage, markThreadRead } from '../../../services/messaging.js';

function formatRelative(value) {
  if (!value) {
    return '—';
  }
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }
  const diff = date.getTime() - Date.now();
  const absMinutes = Math.abs(diff) / (1000 * 60);
  if (absMinutes < 60) {
    return `${Math.round(diff / (1000 * 60))} min`;
  }
  const absHours = absMinutes / 60;
  if (absHours < 48) {
    return `${Math.round(diff / (1000 * 60 * 60))} hr`;
  }
  return `${Math.round(diff / (1000 * 60 * 60 * 24))} d`;
}

function formatDateTime(value) {
  if (!value) {
    return null;
  }
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

function SummaryCard({ icon: Icon, label, value, hint }) {
  return (
    <div className="flex items-center gap-4 rounded-3xl border border-slate-200 bg-white/80 p-5 shadow-sm">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-soft">
        <Icon className="h-6 w-6" />
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
        <p className="text-2xl font-semibold text-slate-900">{value}</p>
        {hint ? <p className="text-xs text-slate-500">{hint}</p> : null}
      </div>
    </div>
  );
}

SummaryCard.propTypes = {
  icon: PropTypes.elementType.isRequired,
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  hint: PropTypes.string,
};

SummaryCard.defaultProps = {
  hint: null,
};

function ThreadListItem({ thread, isActive, onSelect, onMarkRead }) {
  const lastMessagePreview = thread.lastMessagePreview ?? thread.lastMessage?.body ?? 'Stay responsive to keep SLAs healthy.';
  const participants = Array.isArray(thread.participants) ? thread.participants : [];
  return (
    <button
      type="button"
      onClick={() => onSelect(thread)}
      className={`w-full rounded-3xl border px-4 py-3 text-left transition ${
        isActive ? 'border-indigo-300 bg-indigo-50 text-slate-900 shadow-sm' : 'border-slate-200 bg-white text-slate-600 hover:border-indigo-200'
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">{thread.subject || 'Untitled conversation'}</p>
          <p className="mt-1 text-xs text-slate-500">{thread.channelType || 'direct'}</p>
        </div>
        {thread.unread ? (
          <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-700">
            New
          </span>
        ) : null}
      </div>
      <p className="mt-2 line-clamp-2 text-sm text-slate-600">{lastMessagePreview}</p>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
        {participants.slice(0, 3).map((participant) => (
          <span key={participant.participantId ?? participant.userId ?? participant.email} className="rounded-full bg-slate-100 px-2 py-0.5">
            {participant.name ?? participant.email ?? `User ${participant.participantId ?? participant.userId ?? ''}`}
          </span>
        ))}
        <span className="ml-auto" title={thread.lastMessageAt ? new Date(thread.lastMessageAt).toLocaleString() : undefined}>
          {formatRelative(thread.lastMessageAt)}
        </span>
      </div>
      {thread.unread ? (
        <div className="mt-3">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onMarkRead?.(thread);
            }}
            className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600 transition hover:border-emerald-300"
          >
            Mark read
          </button>
        </div>
      ) : null}
    </button>
  );
}

ThreadListItem.propTypes = {
  thread: PropTypes.object.isRequired,
  isActive: PropTypes.bool,
  onSelect: PropTypes.func.isRequired,
  onMarkRead: PropTypes.func,
};

ThreadListItem.defaultProps = {
  isActive: false,
  onMarkRead: null,
};

export default function UserInboxSection({ userId }) {
  const { session } = useSession();
  const actorId = useMemo(() => resolveActorId(session) ?? (userId ? Number(userId) : null), [session, userId]);

  const {
    workspace,
    loading,
    error,
    fromCache,
    lastUpdated,
    refresh,
    addSavedReply,
    editSavedReply,
    removeSavedReply,
    updatePreferences,
    addRoutingRule,
    editRoutingRule,
    removeRoutingRule,
  } = useFreelancerInboxWorkspace({ userId, enabled: Boolean(userId) });

  const summary = workspace.summary ?? {};
  const threads = Array.isArray(workspace.activeThreads) ? workspace.activeThreads : [];
  const participants = Array.isArray(workspace.participantDirectory) ? workspace.participantDirectory : [];
  const preferences = workspace.preferences ?? {};
  const savedReplies = Array.isArray(workspace.savedReplies) ? workspace.savedReplies : [];
  const routingRules = Array.isArray(workspace.routingRules) ? workspace.routingRules : [];
  const supportCases = Array.isArray(workspace.supportCases) ? workspace.supportCases : [];

  const [selectedThreadId, setSelectedThreadId] = useState(null);
  const [composer, setComposer] = useState('');
  const [sending, setSending] = useState(false);
  const [createForm, setCreateForm] = useState({ subject: '', participantId: '' });
  const [creating, setCreating] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  const [replyForm, setReplyForm] = useState({ title: '', body: '', shortcut: '', category: '', isDefault: false });
  const [editingReplyId, setEditingReplyId] = useState(null);
  const [replySaving, setReplySaving] = useState(false);

  const [prefsSaving, setPrefsSaving] = useState(false);
  const [routingForm, setRoutingForm] = useState({ name: '', channel: 'inbox', condition: '', target: '', priority: 'medium' });
  const [editingRuleId, setEditingRuleId] = useState(null);
  const [routingSaving, setRoutingSaving] = useState(false);

  useEffect(() => {
    if (!threads.length) {
      setSelectedThreadId(null);
      return;
    }
    if (!threads.some((thread) => String(thread.id) === String(selectedThreadId))) {
      setSelectedThreadId(String(threads[0].id));
    }
  }, [threads, selectedThreadId]);

  const selectedThread = useMemo(
    () => threads.find((thread) => String(thread.id) === String(selectedThreadId)) ?? null,
    [threads, selectedThreadId],
  );

  const messageHistory = useMemo(() => {
    if (!selectedThread) {
      return [];
    }
    const messages = Array.isArray(selectedThread.messages)
      ? selectedThread.messages
      : Array.isArray(selectedThread.messageHistory)
        ? selectedThread.messageHistory
        : [];
    return [...messages].sort((a, b) => {
      const left = new Date(a.createdAt ?? a.sentAt ?? 0).getTime();
      const right = new Date(b.createdAt ?? b.sentAt ?? 0).getTime();
      return left - right;
    });
  }, [selectedThread]);

  const threadParticipants = useMemo(() => {
    if (!selectedThread) {
      return [];
    }
    if (Array.isArray(selectedThread.participants) && selectedThread.participants.length) {
      return selectedThread.participants;
    }
    if (Array.isArray(selectedThread.participantIds) && participants.length) {
      return participants.filter((participant) =>
        selectedThread.participantIds.includes(participant.userId ?? participant.id ?? participant.participantId),
      );
    }
    return [];
  }, [selectedThread, participants]);

  const threadTags = useMemo(() => {
    if (!selectedThread) {
      return [];
    }
    if (Array.isArray(selectedThread.tags)) {
      return selectedThread.tags;
    }
    if (typeof selectedThread.labels === 'string') {
      return selectedThread.labels.split(',').map((label) => label.trim()).filter(Boolean);
    }
    if (Array.isArray(selectedThread.labels)) {
      return selectedThread.labels;
    }
    return [];
  }, [selectedThread]);

  useEffect(() => {
    if (!statusMessage) {
      return undefined;
    }
    const timeout = setTimeout(() => setStatusMessage(null), 4000);
    return () => clearTimeout(timeout);
  }, [statusMessage]);

  useEffect(() => {
    if (!errorMessage) {
      return undefined;
    }
    const timeout = setTimeout(() => setErrorMessage(null), 5000);
    return () => clearTimeout(timeout);
  }, [errorMessage]);

  const handleSendMessage = async () => {
    if (!selectedThread || !composer.trim()) {
      return;
    }
    setSending(true);
    try {
      await sendMessage(selectedThread.id, { userId: actorId ?? undefined, body: composer.trim() });
      setComposer('');
      setStatusMessage('Message sent.');
      await refresh({ force: true });
    } catch (err) {
      setErrorMessage(err?.message ?? 'Failed to send message.');
    } finally {
      setSending(false);
    }
  };

  const handleCreateThread = async (event) => {
    event.preventDefault();
    if (!createForm.subject.trim() || !createForm.participantId) {
      setErrorMessage('Select a participant and add a subject.');
      return;
    }
    setCreating(true);
    try {
      const participantId = Number(createForm.participantId);
      const thread = await createThread({
        userId: actorId ?? undefined,
        subject: createForm.subject.trim(),
        participantIds: Number.isFinite(participantId) ? [participantId] : [],
        metadata: { origin: 'client_dashboard' },
      });
      setCreateForm({ subject: '', participantId: '' });
      setStatusMessage('Conversation created.');
      setSelectedThreadId(thread?.id ? String(thread.id) : null);
      await refresh({ force: true });
    } catch (err) {
      setErrorMessage(err?.message ?? 'Unable to start conversation.');
    } finally {
      setCreating(false);
    }
  };

  const handleMarkRead = async (thread) => {
    try {
      await markThreadRead(thread.id, { userId: actorId ?? undefined });
      await refresh({ force: true });
    } catch (err) {
      setErrorMessage(err?.message ?? 'Unable to mark as read.');
    }
  };

  const handleEditReply = (reply) => {
    setEditingReplyId(reply?.id ?? null);
    setReplyForm({
      title: reply?.title ?? '',
      body: reply?.body ?? '',
      shortcut: reply?.shortcut ?? '',
      category: reply?.category ?? '',
      isDefault: Boolean(reply?.isDefault),
    });
  };

  const resetReplyForm = () => {
    setEditingReplyId(null);
    setReplyForm({ title: '', body: '', shortcut: '', category: '', isDefault: false });
  };

  const handleSubmitReply = async (event) => {
    event.preventDefault();
    if (!replyForm.title.trim() || !replyForm.body.trim()) {
      setErrorMessage('Saved replies require a title and body.');
      return;
    }
    setReplySaving(true);
    try {
      const payload = {
        title: replyForm.title.trim(),
        body: replyForm.body.trim(),
        shortcut: replyForm.shortcut.trim() || undefined,
        category: replyForm.category.trim() || undefined,
        isDefault: Boolean(replyForm.isDefault),
      };
      if (editingReplyId) {
        await editSavedReply(editingReplyId, payload);
        setStatusMessage('Reply updated.');
      } else {
        await addSavedReply(payload);
        setStatusMessage('Reply saved.');
      }
      resetReplyForm();
    } catch (err) {
      setErrorMessage(err?.message ?? 'Unable to save reply.');
    } finally {
      setReplySaving(false);
    }
  };

  const handleDeleteReply = async (replyId) => {
    try {
      await removeSavedReply(replyId);
      setStatusMessage('Reply removed.');
      if (editingReplyId === replyId) {
        resetReplyForm();
      }
    } catch (err) {
      setErrorMessage(err?.message ?? 'Unable to delete reply.');
    }
  };

  const handlePreferencesToggle = async (field, value) => {
    setPrefsSaving(true);
    try {
      await updatePreferences({ [field]: value });
      setStatusMessage('Inbox preferences updated.');
    } catch (err) {
      setErrorMessage(err?.message ?? 'Unable to update preferences.');
    } finally {
      setPrefsSaving(false);
    }
  };

  const participantOptions = participants.map((participant) => ({
    value: participant.userId ?? participant.id ?? participant.participantId,
    label: participant.name ?? participant.email ?? `User ${participant.userId ?? participant.participantId ?? ''}`,
  }));

  const resetRoutingForm = () => {
    setEditingRuleId(null);
    setRoutingForm({ name: '', channel: 'inbox', condition: '', target: '', priority: 'medium' });
  };

  const handleEditRoutingRule = (rule) => {
    setEditingRuleId(rule?.id ?? null);
    setRoutingForm({
      name: rule?.name ?? '',
      channel: rule?.channel ?? 'inbox',
      condition: rule?.condition ?? rule?.conditions?.join?.(' AND ') ?? '',
      target: rule?.target ?? rule?.assignee ?? '',
      priority: rule?.priority ?? 'medium',
    });
  };

  const handleRoutingSubmit = async (event) => {
    event.preventDefault();
    if (!routingForm.name.trim() || !routingForm.target.trim()) {
      setErrorMessage('Routing rules require a name and target queue.');
      return;
    }
    setRoutingSaving(true);
    try {
      const payload = {
        name: routingForm.name.trim(),
        channel: routingForm.channel,
        condition: routingForm.condition.trim() || undefined,
        target: routingForm.target.trim(),
        priority: routingForm.priority,
        metadata: { origin: 'client_dashboard', autoEscalate: routingForm.priority === 'high' },
      };
      if (editingRuleId) {
        await editRoutingRule(editingRuleId, payload);
        setStatusMessage('Routing rule updated.');
      } else {
        await addRoutingRule(payload);
        setStatusMessage('Routing rule created.');
      }
      resetRoutingForm();
    } catch (err) {
      setErrorMessage(err?.message ?? 'Unable to save routing rule.');
    } finally {
      setRoutingSaving(false);
    }
  };

  const handleRoutingDelete = async (ruleId) => {
    if (!ruleId) {
      setErrorMessage('Unable to delete routing rule. Missing identifier.');
      return;
    }
    try {
      await removeRoutingRule(ruleId);
      setStatusMessage('Routing rule removed.');
      if (editingRuleId === ruleId) {
        resetRoutingForm();
      }
    } catch (err) {
      setErrorMessage(err?.message ?? 'Unable to delete routing rule.');
    }
  };

  return (
    <section
      id="client-inbox"
      className="space-y-6 rounded-3xl border border-indigo-200 bg-gradient-to-br from-indigo-50 via-white to-white p-6 shadow-sm"
    >
      <header className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-indigo-500">Inbox</p>
          <h2 className="text-3xl font-semibold text-slate-900">Conversation control tower</h2>
          <p className="mt-2 max-w-3xl text-sm text-slate-500">
            Monitor SLAs, triage stakeholders, and respond with automation-ready playbooks across projects, gigs, and support.
          </p>
        </div>
        <button
          type="button"
          onClick={() => refresh({ force: true })}
          className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-white px-4 py-2 text-sm font-semibold text-indigo-600 transition hover:border-indigo-300 hover:text-indigo-700"
        >
          <ArrowPathIcon className="h-4 w-4" /> Sync
        </button>
      </header>

      <DataStatus
        loading={loading}
        error={error}
        fromCache={fromCache}
        lastUpdated={lastUpdated}
        onRefresh={() => refresh({ force: true })}
        statusLabel="Inbox telemetry"
      />

      {statusMessage ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
          {statusMessage}
        </div>
      ) : null}
      {errorMessage ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
          {errorMessage}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard icon={ChatBubbleLeftRightIcon} label="Active threads" value={summary.awaitingReply ?? summary.activeThreads ?? 0} hint="Awaiting your response" />
        <SummaryCard icon={EnvelopeOpenIcon} label="Unread" value={summary.unreadThreads ?? 0} hint="Mark conversations handled" />
        <SummaryCard icon={PaperAirplaneIcon} label="Avg response" value={summary.avgResponseMinutes != null ? `${Math.round(summary.avgResponseMinutes)}m` : '—'} hint="Response time in minutes" />
        <SummaryCard icon={PlusIcon} label="Support cases" value={summary.openSupportCases ?? 0} hint="Escalations in progress" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr,3fr]">
        <div className="space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Threads</h3>
          <div className="space-y-3">
            {threads.length ? (
              threads.map((thread) => (
                <ThreadListItem
                  key={thread.id}
                  thread={thread}
                  isActive={String(thread.id) === String(selectedThreadId)}
                  onSelect={(value) => setSelectedThreadId(String(value.id))}
                  onMarkRead={handleMarkRead}
                />
              ))
            ) : (
              <div className="rounded-3xl border border-dashed border-slate-200 bg-white/70 p-6 text-sm text-slate-500">
                No active conversations — start one below to collaborate with your network.
              </div>
            )}
          </div>

          <form onSubmit={handleCreateThread} className="space-y-3 rounded-3xl border border-slate-200 bg-white/80 p-4 shadow-sm">
            <h4 className="text-sm font-semibold text-slate-900">Start a conversation</h4>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Subject
              <input
                type="text"
                required
                value={createForm.subject}
                onChange={(event) => setCreateForm((current) => ({ ...current, subject: event.target.value }))}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              />
            </label>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Participant
              <select
                required
                value={createForm.participantId}
                onChange={(event) => setCreateForm((current) => ({ ...current, participantId: event.target.value }))}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              >
                <option value="">Select participant</option>
                {participantOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="submit"
              disabled={creating}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 disabled:opacity-60"
            >
              <PlusIcon className="h-4 w-4" /> {creating ? 'Creating…' : 'Create thread'}
            </button>
          </form>

          <div className="space-y-3 rounded-3xl border border-slate-200 bg-white/80 p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-slate-900">Support cases</h4>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-600">
                Live
              </span>
            </div>
            {supportCases.length ? (
              <div className="space-y-3">
                {supportCases.slice(0, 4).map((supportCase) => (
                  <article
                    key={supportCase.id ?? supportCase.caseId ?? supportCase.reference}
                    className="space-y-2 rounded-2xl border border-slate-200 bg-white/70 p-3 text-sm text-slate-600 shadow-sm"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="font-semibold text-slate-900">
                        {supportCase.subject ?? supportCase.title ?? `Case #${supportCase.reference ?? supportCase.id}`}
                      </p>
                      <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-rose-600">
                        <ShieldCheckIcon className="h-3.5 w-3.5" />
                        {(supportCase.status ?? 'open').toString().replace(/[_-]+/g, ' ')}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      {supportCase.requester?.name ?? supportCase.requesterEmail ?? 'Stakeholder'} •
                      <span className="ml-1 uppercase tracking-wide text-slate-400">
                        Priority {String(supportCase.priority ?? 'standard').toUpperCase()}
                      </span>
                    </p>
                    {supportCase.slaDueAt ? (
                      <p className="text-xs text-slate-500">
                        <ClockIcon className="mr-1 inline h-3.5 w-3.5 text-indigo-400" />
                        SLA due {formatRelative(supportCase.slaDueAt)}
                      </p>
                    ) : null}
                    <p className="text-xs text-slate-500">
                      {supportCase.summary ?? supportCase.description ?? 'Track investigator updates and knowledge base alignment from this panel.'}
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-indigo-600">
                        {supportCase.channel ?? 'Inbox'}
                      </span>
                      {supportCase.url || supportCase.link ? (
                        <a
                          href={supportCase.url ?? supportCase.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded-full border border-indigo-200 px-3 py-1 text-xs font-semibold text-indigo-600 transition hover:border-indigo-300 hover:text-indigo-700"
                        >
                          View case
                        </a>
                      ) : null}
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">
                When stakeholders escalate, their cases appear here for triage and collaboration.
              </p>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-3xl border border-slate-200 bg-white/80 p-5 shadow-sm">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Conversation</h3>
            {selectedThread ? (
              <div className="space-y-4">
                <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4 text-sm text-slate-600">
                  <p className="font-semibold text-slate-900">{selectedThread.subject || 'Conversation'}</p>
                  <p className="mt-2 text-xs text-slate-500">Channel • {selectedThread.channelType ?? 'direct'}</p>
                </div>
                {threadParticipants.length ? (
                  <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-500">
                    <span className="uppercase tracking-wide text-slate-400">Participants</span>
                    {threadParticipants.map((participant) => (
                      <span
                        key={participant.participantId ?? participant.userId ?? participant.id ?? participant.email}
                        className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600"
                      >
                        {participant.name ?? participant.email ?? `User ${participant.participantId ?? participant.userId ?? ''}`}
                      </span>
                    ))}
                  </div>
                ) : null}
                {threadTags.length ? (
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    {threadTags.map((tag) => (
                      <span key={tag} className="rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 font-semibold text-indigo-600">
                        {tag}
                      </span>
                    ))}
                  </div>
                ) : null}
                <div className="max-h-80 space-y-3 overflow-y-auto rounded-2xl border border-slate-100 bg-white/70 p-4 shadow-inner">
                  {messageHistory.length ? (
                    messageHistory.map((message) => (
                      <article
                        key={message.id ?? `${message.createdAt ?? message.sentAt}-${message.senderId ?? message.authorId ?? 'system'}`}
                        className="space-y-2 rounded-2xl border border-slate-100 bg-white/90 p-3 text-sm text-slate-600 shadow-sm"
                      >
                        <div className="flex flex-wrap items-baseline justify-between gap-3">
                          <p className="font-semibold text-slate-900">{message.sender?.name ?? message.senderName ?? 'System'}</p>
                          <span className="text-xs text-slate-500" title={formatDateTime(message.createdAt ?? message.sentAt) ?? undefined}>
                            {formatRelative(message.createdAt ?? message.sentAt)}
                          </span>
                        </div>
                        {message.body ? (
                          <p className="whitespace-pre-wrap text-sm text-slate-600">{message.body}</p>
                        ) : null}
                        {Array.isArray(message.attachments) && message.attachments.length ? (
                          <ul className="space-y-1 text-xs text-slate-500">
                            {message.attachments.map((attachment) => (
                              <li
                                key={attachment.id ?? attachment.storageKey ?? attachment.name}
                                className="flex items-center gap-2"
                              >
                                <span className="inline-flex h-1.5 w-1.5 rounded-full bg-indigo-300" />
                                {attachment.downloadUrl || attachment.url ? (
                                  <a
                                    href={attachment.downloadUrl ?? attachment.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="truncate text-indigo-600 hover:underline"
                                  >
                                    {attachment.fileName ?? attachment.name ?? 'Attachment'}
                                  </a>
                                ) : (
                                  <span>{attachment.fileName ?? attachment.name ?? 'Attachment'}</span>
                                )}
                                {attachment.fileSize ? (
                                  <span className="text-[11px] uppercase tracking-wide text-slate-400">
                                    {(attachment.fileSize / (1024 * 1024)).toFixed(2)} MB
                                  </span>
                                ) : null}
                              </li>
                            ))}
                          </ul>
                        ) : null}
                      </article>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500">
                      Conversation history loads here once messages are exchanged. Start collaborating by sending an update below.
                    </p>
                  )}
                </div>
                <textarea
                  rows={5}
                  value={composer}
                  onChange={(event) => setComposer(event.target.value)}
                  placeholder="Write an update, share deliverables, or keep stakeholders aligned."
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                />
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    disabled={sending || !composer.trim()}
                    onClick={handleSendMessage}
                    className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 disabled:opacity-60"
                  >
                    <PaperAirplaneIcon className="h-4 w-4" />
                    {sending ? 'Sending…' : 'Send message'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setComposer((current) => `${current}${current && !current.endsWith('\n') ? '\n' : ''}${replyForm.body}`)}
                    className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-indigo-200 hover:text-indigo-600"
                    disabled={!replyForm.body.trim()}
                  >
                    Insert saved reply
                  </button>
                </div>
              </div>
            ) : (
              <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50/80 p-6 text-sm text-slate-500">
                Select a thread to compose a response or create a new conversation.
              </div>
            )}
          </div>

          <form onSubmit={handleSubmitReply} className="space-y-3 rounded-3xl border border-slate-200 bg-white/80 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Saved replies</h3>
              {editingReplyId ? (
                <button
                  type="button"
                  onClick={resetReplyForm}
                  className="text-xs font-semibold uppercase tracking-wide text-indigo-600"
                >
                  Cancel edit
                </button>
              ) : null}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Title
                <input
                  type="text"
                  required
                  value={replyForm.title}
                  onChange={(event) => setReplyForm((current) => ({ ...current, title: event.target.value }))}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                />
              </label>
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Shortcut
                <input
                  type="text"
                  value={replyForm.shortcut}
                  onChange={(event) => setReplyForm((current) => ({ ...current, shortcut: event.target.value }))}
                  placeholder="e.g. intro"
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                />
              </label>
            </div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Message
              <textarea
                rows={4}
                required
                value={replyForm.body}
                onChange={(event) => setReplyForm((current) => ({ ...current, body: event.target.value }))}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Category
                <input
                  type="text"
                  value={replyForm.category}
                  onChange={(event) => setReplyForm((current) => ({ ...current, category: event.target.value }))}
                  placeholder="Follow-up, onboarding"
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                />
              </label>
              <label className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <input
                  type="checkbox"
                  checked={replyForm.isDefault}
                  onChange={(event) => setReplyForm((current) => ({ ...current, isDefault: event.target.checked }))}
                  className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                Default reply
              </label>
            </div>
            <button
              type="submit"
              disabled={replySaving}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 disabled:opacity-60"
            >
              {replySaving ? 'Saving…' : editingReplyId ? 'Update reply' : 'Save reply'}
            </button>
            {savedReplies.length ? (
              <div className="space-y-2">
                {savedReplies.map((reply) => (
                  <div key={reply.id} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white/70 px-3 py-2 text-sm">
                    <div>
                      <p className="font-semibold text-slate-900">{reply.title}</p>
                      <p className="text-xs text-slate-500">{reply.shortcut ? `/${reply.shortcut}` : 'No shortcut'}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleEditReply(reply)}
                        className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-indigo-200 hover:text-indigo-600"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteReply(reply.id)}
                        className="rounded-full border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-600 transition hover:border-rose-300"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </form>

          <div className="space-y-3 rounded-3xl border border-slate-200 bg-white/80 p-5 shadow-sm">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Preferences</h3>
            <label className="flex items-center justify-between gap-4 text-sm text-slate-700">
              <span>Auto-responder enabled</span>
              <input
                type="checkbox"
                checked={Boolean(preferences.autoResponderEnabled)}
                onChange={(event) => handlePreferencesToggle('autoResponderEnabled', event.target.checked)}
                disabled={prefsSaving}
                className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
            </label>
            <label className="flex items-center justify-between gap-4 text-sm text-slate-700">
              <span>Email notifications</span>
              <input
                type="checkbox"
                checked={Boolean(preferences.notificationsEmail)}
                onChange={(event) => handlePreferencesToggle('notificationsEmail', event.target.checked)}
                disabled={prefsSaving}
                className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
            </label>
            <label className="flex items-center justify-between gap-4 text-sm text-slate-700">
              <span>Push notifications</span>
              <input
                type="checkbox"
                checked={Boolean(preferences.notificationsPush)}
                onChange={(event) => handlePreferencesToggle('notificationsPush', event.target.checked)}
                disabled={prefsSaving}
                className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
            </label>
            <p className="text-xs text-slate-500">
              Preferences sync with your mobile apps and ensure the right automation rules engage customers while you focus on delivery.
            </p>
          </div>

          <div className="space-y-4 rounded-3xl border border-slate-200 bg-white/80 p-5 shadow-sm">
            <form onSubmit={handleRoutingSubmit} className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Routing rules</h3>
                {editingRuleId ? (
                  <button
                    type="button"
                    onClick={resetRoutingForm}
                    className="text-xs font-semibold uppercase tracking-wide text-indigo-600"
                  >
                    Cancel edit
                  </button>
                ) : null}
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Rule name
                  <input
                    type="text"
                    required
                    value={routingForm.name}
                    onChange={(event) => setRoutingForm((current) => ({ ...current, name: event.target.value }))}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  />
                </label>
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Target queue
                  <input
                    type="text"
                    required
                    value={routingForm.target}
                    onChange={(event) => setRoutingForm((current) => ({ ...current, target: event.target.value }))}
                    placeholder="CX squad, Escalations, Billing"
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  />
                </label>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Channel
                  <select
                    value={routingForm.channel}
                    onChange={(event) => setRoutingForm((current) => ({ ...current, channel: event.target.value }))}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  >
                    <option value="inbox">Inbox</option>
                    <option value="support">Support</option>
                    <option value="gig">Gig</option>
                    <option value="project">Project</option>
                  </select>
                </label>
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Priority
                  <select
                    value={routingForm.priority}
                    onChange={(event) => setRoutingForm((current) => ({ ...current, priority: event.target.value }))}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </label>
              </div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Conditions
                <textarea
                  rows={3}
                  value={routingForm.condition}
                  onChange={(event) => setRoutingForm((current) => ({ ...current, condition: event.target.value }))}
                  placeholder="keyword:"billing" AND sentiment:"negative""
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                />
              </label>
              <button
                type="submit"
                disabled={routingSaving}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 disabled:opacity-60"
              >
                <AdjustmentsHorizontalIcon className="h-4 w-4" /> {routingSaving ? 'Saving…' : editingRuleId ? 'Update rule' : 'Add rule'}
              </button>
            </form>

            {routingRules.length ? (
              <div className="space-y-2">
                {routingRules.map((rule) => (
                  <div
                    key={rule.id ?? rule.ruleId ?? rule.name}
                    className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white/70 p-3 text-sm text-slate-600"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-900">{rule.name}</p>
                        <p className="text-xs text-slate-500">{rule.condition ?? rule.conditions?.join?.(' AND ') ?? 'Match all conversations.'}</p>
                      </div>
                      <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-indigo-600">
                        {rule.channel ?? 'Inbox'}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                      <span>Target • {rule.target ?? rule.assignee ?? rule.queue ?? 'Inbox team'}</span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 font-semibold uppercase tracking-wide text-emerald-600">
                        Priority {String(rule.priority ?? 'medium').toUpperCase()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleEditRoutingRule(rule)}
                        className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-indigo-200 hover:text-indigo-600"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRoutingDelete(rule.id ?? rule.ruleId)}
                        className="rounded-full border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-600 transition hover:border-rose-300"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">
                Configure routing rules so critical conversations reach the right delivery teams instantly.
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

UserInboxSection.propTypes = {
  userId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
};
