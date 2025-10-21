import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import DataStatus from '../../../../components/DataStatus.jsx';
import useSession from '../../../../hooks/useSession.js';
import useAgencyInboxWorkspace from '../../../../hooks/useAgencyInboxWorkspace.js';
import { resolveActorId } from '../../../../utils/session.js';
import {
  createThread,
  sendMessage,
  markThreadRead,
  updateThreadState,
  escalateThread,
  assignSupport,
} from '../../../../services/messaging.js';

function formatDuration(minutes) {
  if (minutes == null || Number.isNaN(Number(minutes))) {
    return '—';
  }
  const total = Number(minutes);
  if (total < 60) {
    return `${Math.round(total)} min`;
  }
  const hours = Math.floor(total / 60);
  const mins = Math.round(total % 60);
  if (mins === 0) {
    return `${hours} hr`;
  }
  return `${hours} hr ${mins} min`;
}

function formatDateTime(value) {
  if (!value) {
    return '—';
  }
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }
  return new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

function formatRelative(value) {
  if (!value) {
    return '—';
  }
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }
  const diff = Date.now() - date.getTime();
  const absMinutes = Math.abs(diff) / (1000 * 60);
  if (absMinutes < 60) {
    return `${Math.round(diff / (1000 * 60))} min ago`;
  }
  const absHours = absMinutes / 60;
  if (absHours < 48) {
    return `${Math.round(diff / (1000 * 60 * 60))} hr ago`;
  }
  return `${Math.round(diff / (1000 * 60 * 60 * 24))} d ago`;
}

function SummaryCard({ label, value, hint }) {
  return (
    <div className="rounded-3xl border border-indigo-100 bg-white/90 p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-indigo-500/80">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
      {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
}

SummaryCard.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  hint: PropTypes.string,
};

SummaryCard.defaultProps = {
  hint: null,
};

function ThreadListItem({ thread, isActive, onSelect, onMarkRead, onArchive }) {
  const participants = Array.isArray(thread.participants) ? thread.participants : [];
  const badge = thread.unread
    ? 'bg-emerald-100 text-emerald-700'
    : thread.state === 'archived'
    ? 'bg-slate-100 text-slate-600'
    : 'bg-indigo-100 text-indigo-700';

  return (
    <button
      type="button"
      onClick={() => onSelect(thread)}
      className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
        isActive ? 'border-indigo-300 bg-indigo-50 text-slate-900 shadow-sm' : 'border-slate-200 bg-white text-slate-600 hover:border-indigo-200'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">{thread.subject || 'Untitled thread'}</p>
          <p className="mt-1 text-xs uppercase tracking-wide text-indigo-400">{thread.channelType || 'direct'}</p>
        </div>
        <span
          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${badge}`}
        >
          {thread.unread ? 'New' : thread.state === 'archived' ? 'Archived' : thread.priority || 'Active'}
        </span>
      </div>
      <p className="mt-2 line-clamp-2 text-sm text-slate-600">
        {thread.lastMessagePreview || thread.preview || 'Keep this conversation active to protect SLAs.'}
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
        {participants.slice(0, 3).map((participant) => (
          <span key={participant.participantId ?? participant.userId ?? participant.email} className="rounded-full bg-slate-100 px-2 py-0.5">
            {participant.name ?? participant.email ?? `User ${participant.participantId ?? participant.userId ?? ''}`}
          </span>
        ))}
        <span className="ml-auto" title={formatDateTime(thread.lastMessageAt)}>
          {formatRelative(thread.lastMessageAt)}
        </span>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {thread.unread ? (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onMarkRead?.(thread);
            }}
            className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600 transition hover:border-emerald-300"
          >
            Mark read
          </button>
        ) : null}
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onArchive?.(thread);
          }}
          className="inline-flex items-center rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-indigo-200 hover:text-indigo-600"
        >
          {thread.state === 'archived' ? 'Restore' : 'Archive'}
        </button>
      </div>
    </button>
  );
}

ThreadListItem.propTypes = {
  thread: PropTypes.object.isRequired,
  isActive: PropTypes.bool,
  onSelect: PropTypes.func.isRequired,
  onMarkRead: PropTypes.func,
  onArchive: PropTypes.func,
};

ThreadListItem.defaultProps = {
  isActive: false,
  onMarkRead: null,
  onArchive: null,
};

export default function AgencyInboxSection({ workspaceId, statusLabel, initialSummary }) {
  const { session } = useSession();
  const actorId = useMemo(() => resolveActorId(session), [session]);
  const [selectedThreadId, setSelectedThreadId] = useState(null);
  const [composer, setComposer] = useState('');
  const [sending, setSending] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [composeOpen, setComposeOpen] = useState(false);
  const [composeForm, setComposeForm] = useState({ subject: '', participantIds: '', channelType: 'direct', initialMessage: '' });
  const [creatingThread, setCreatingThread] = useState(false);
  const [replyDraft, setReplyDraft] = useState({ title: '', body: '', shortcut: '', category: 'general', isDefault: false });
  const [editingReplyId, setEditingReplyId] = useState(null);
  const [replySaving, setReplySaving] = useState(false);
  const [routingDraft, setRoutingDraft] = useState({ name: '', channel: 'all', condition: '', target: 'operations', priority: 'medium' });
  const [editingRuleId, setEditingRuleId] = useState(null);
  const [routingSaving, setRoutingSaving] = useState(false);
  const [preferencesDraft, setPreferencesDraft] = useState({ notificationsEmail: true, notificationsPush: true, autoResponderEnabled: false, autoResponderMessage: '' });
  const [preferencesSaving, setPreferencesSaving] = useState(false);
  const [automationDraft, setAutomationDraft] = useState({ autoEscalateUrgent: false, shareDailyDigest: true, notifyTalent: false });
  const [automationSaving, setAutomationSaving] = useState(false);

  const {
    workspace,
    loading,
    error,
    fromCache,
    lastUpdated,
    refresh,
    updatePreferences,
    addSavedReply,
    editSavedReply,
    removeSavedReply,
    addRoutingRule,
    editRoutingRule,
    removeRoutingRule,
    saveAutomations,
  } = useAgencyInboxWorkspace({ workspaceId, enabled: Boolean(workspaceId) });

  useEffect(() => {
    if (!workspace?.preferences) {
      return;
    }
    setPreferencesDraft((current) => ({
      ...current,
      notificationsEmail: Boolean(workspace.preferences.notificationsEmail),
      notificationsPush: Boolean(workspace.preferences.notificationsPush),
      autoResponderEnabled: Boolean(workspace.preferences.autoResponderEnabled),
      autoResponderMessage: workspace.preferences.autoResponderMessage ?? '',
    }));
  }, [workspace?.preferences]);

  useEffect(() => {
    if (!workspace?.automations) {
      return;
    }
    setAutomationDraft((current) => ({
      ...current,
      autoEscalateUrgent: Boolean(workspace.automations.autoEscalateUrgent ?? workspace.automations.escalateUrgent),
      shareDailyDigest: Boolean(workspace.automations.shareDailyDigest ?? workspace.automations.digestEmails),
      notifyTalent: Boolean(workspace.automations.notifyTalent ?? workspace.automations.talentAlerts?.length),
    }));
  }, [workspace?.automations]);

  useEffect(() => {
    if (!workspace?.savedReplies?.length) {
      setEditingReplyId(null);
      setReplyDraft({ title: '', body: '', shortcut: '', category: 'general', isDefault: false });
    }
  }, [workspace?.savedReplies?.length]);

  useEffect(() => {
    if (!workspace?.routingRules?.length) {
      setEditingRuleId(null);
      setRoutingDraft({ name: '', channel: 'all', condition: '', target: 'operations', priority: 'medium' });
    }
  }, [workspace?.routingRules?.length]);

  useEffect(() => {
    if (!statusMessage) {
      return undefined;
    }
    const timeout = window.setTimeout(() => setStatusMessage(null), 4000);
    return () => window.clearTimeout(timeout);
  }, [statusMessage]);

  useEffect(() => {
    if (!errorMessage) {
      return undefined;
    }
    const timeout = window.setTimeout(() => setErrorMessage(null), 5000);
    return () => window.clearTimeout(timeout);
  }, [errorMessage]);

  const summary = useMemo(() => ({ ...(initialSummary ?? {}), ...(workspace?.summary ?? {}) }), [initialSummary, workspace?.summary]);
  const threads = useMemo(
    () =>
      (workspace?.activeThreads ?? []).map((thread) => ({
        ...thread,
        id: thread.id ?? thread.threadId ?? thread.conversationId,
      })),
    [workspace?.activeThreads],
  );

  useEffect(() => {
    if (!threads.some((thread) => `${thread.id}` === `${selectedThreadId}`)) {
      setSelectedThreadId(threads[0]?.id ?? null);
      setComposer('');
    }
  }, [threads, selectedThreadId]);

  const selectedThread = useMemo(
    () => threads.find((thread) => `${thread.id}` === `${selectedThreadId}`) ?? null,
    [threads, selectedThreadId],
  );

  const savedReplies = Array.isArray(workspace?.savedReplies) ? workspace.savedReplies : [];
  const routingRules = Array.isArray(workspace?.routingRules) ? workspace.routingRules : [];
  const supportCases = Array.isArray(workspace?.supportCases) ? workspace.supportCases : [];
  const participantsDirectory = Array.isArray(workspace?.participantDirectory) ? workspace.participantDirectory : [];

  const metrics = [
    { label: 'Unread threads', value: summary.unreadThreads ?? 0, hint: 'Action required conversations.' },
    { label: 'Awaiting reply', value: summary.awaitingReply ?? 0, hint: 'Threads where the agency owns the next response.' },
    { label: 'Avg. response', value: formatDuration(summary.avgResponseMinutes), hint: 'Median first-response time.' },
    { label: 'Active assignments', value: summary.assignmentsActive ?? 0, hint: 'Live operator handoffs.' },
    { label: 'Support cases', value: summary.openSupportCases ?? supportCases.length ?? 0, hint: 'Open help desk tickets.' },
    {
      label: 'Escalations open',
      value: summary.escalationsOpen ?? supportCases.filter((item) => item.priority === 'high' || item.status === 'escalated').length,
      hint: 'Situations requiring leadership visibility.',
    },
    {
      label: 'Sentiment score',
      value:
        summary.sentimentScore != null && Number.isFinite(Number(summary.sentimentScore))
          ? `${Number(summary.sentimentScore).toFixed(1)}/5`
          : '—',
      hint: 'Latest AI triaged sentiment across replies.',
    },
  ];

  const handleSendMessage = async () => {
    if (!selectedThread?.id || !composer.trim()) {
      return;
    }
    if (!actorId) {
      setErrorMessage('Unable to resolve your messaging identity.');
      return;
    }
    setSending(true);
    try {
      await sendMessage(selectedThread.id, { userId: actorId, body: composer.trim() });
      setComposer('');
      setStatusMessage('Reply sent.');
      await refresh({ force: true });
    } catch (sendError) {
      setErrorMessage(sendError?.message ?? 'Failed to send reply.');
    } finally {
      setSending(false);
    }
  };

  const handleMarkRead = async (thread) => {
    if (!thread?.id || !actorId) {
      return;
    }
    try {
      await markThreadRead(thread.id, { userId: actorId });
      setStatusMessage('Thread marked as read.');
      await refresh({ force: true });
    } catch (markError) {
      setErrorMessage(markError?.message ?? 'Unable to mark thread as read.');
    }
  };

  const handleArchiveToggle = async (thread) => {
    if (!thread?.id || !actorId) {
      return;
    }
    try {
      const nextState = thread.state === 'archived' ? 'active' : 'archived';
      await updateThreadState(thread.id, { userId: actorId, state: nextState });
      setStatusMessage(nextState === 'archived' ? 'Thread archived.' : 'Thread restored.');
      await refresh({ force: true });
    } catch (archiveError) {
      setErrorMessage(archiveError?.message ?? 'Unable to update thread state.');
    }
  };

  const handleEscalate = async (thread, reason) => {
    if (!thread?.id || !actorId || !reason) {
      return;
    }
    try {
      await escalateThread(thread.id, { userId: actorId, reason, priority: 'high' });
      setStatusMessage('Escalation created.');
      await refresh({ force: true });
    } catch (escalateError) {
      setErrorMessage(escalateError?.message ?? 'Unable to escalate thread.');
    }
  };

  const handleAssign = async (thread, assigneeId) => {
    if (!thread?.id || !actorId || !assigneeId) {
      return;
    }
    try {
      await assignSupport(thread.id, { userId: actorId, agentId: assigneeId, notifyAgent: true });
      setStatusMessage('Thread reassigned.');
      await refresh({ force: true });
    } catch (assignError) {
      setErrorMessage(assignError?.message ?? 'Unable to assign teammate.');
    }
  };

  const handleCreateThread = async () => {
    if (!actorId) {
      setErrorMessage('Unable to resolve your messaging identity.');
      return;
    }
    if (!composeForm.subject.trim()) {
      setErrorMessage('A subject is required to start a new thread.');
      return;
    }
    const participantIds = composeForm.participantIds
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean);
    if (participantIds.length === 0) {
      setErrorMessage('Please include at least one participant.');
      return;
    }
    setCreatingThread(true);
    try {
      const created = await createThread({
        userId: actorId,
        subject: composeForm.subject.trim(),
        channelType: composeForm.channelType,
        participantIds,
      });
      if (composeForm.initialMessage.trim()) {
        await sendMessage(created?.id ?? created?.threadId, {
          userId: actorId,
          body: composeForm.initialMessage.trim(),
        });
      }
      setStatusMessage('Thread created.');
      setComposeOpen(false);
      setComposeForm({ subject: '', participantIds: '', channelType: 'direct', initialMessage: '' });
      await refresh({ force: true });
      setSelectedThreadId(created?.id ?? created?.threadId ?? null);
    } catch (createError) {
      setErrorMessage(createError?.message ?? 'Unable to create thread.');
    } finally {
      setCreatingThread(false);
    }
  };

  const handleSaveReply = async () => {
    if (!replyDraft.title.trim() || !replyDraft.body.trim()) {
      setErrorMessage('Saved replies require a title and body.');
      return;
    }
    setReplySaving(true);
    try {
      if (editingReplyId) {
        await editSavedReply(editingReplyId, replyDraft);
        setStatusMessage('Reply updated.');
      } else {
        await addSavedReply(replyDraft);
        setStatusMessage('Reply created.');
      }
      setReplyDraft({ title: '', body: '', shortcut: '', category: 'general', isDefault: false });
      setEditingReplyId(null);
    } catch (replyError) {
      setErrorMessage(replyError?.message ?? 'Unable to save reply.');
    } finally {
      setReplySaving(false);
    }
  };

  const handleDeleteReply = async (replyId) => {
    if (!replyId) {
      return;
    }
    try {
      await removeSavedReply(replyId);
      setStatusMessage('Reply removed.');
    } catch (deleteError) {
      setErrorMessage(deleteError?.message ?? 'Unable to delete reply.');
    }
  };

  const handleSaveRoutingRule = async () => {
    if (!routingDraft.name.trim() || !routingDraft.condition.trim()) {
      setErrorMessage('Routing rules require a name and condition.');
      return;
    }
    setRoutingSaving(true);
    try {
      const payload = {
        ...routingDraft,
        channels: routingDraft.channel === 'all' ? [] : [routingDraft.channel],
      };
      if (editingRuleId) {
        await editRoutingRule(editingRuleId, payload);
        setStatusMessage('Routing rule updated.');
      } else {
        await addRoutingRule(payload);
        setStatusMessage('Routing rule created.');
      }
      setRoutingDraft({ name: '', channel: 'all', condition: '', target: 'operations', priority: 'medium' });
      setEditingRuleId(null);
    } catch (routingError) {
      setErrorMessage(routingError?.message ?? 'Unable to save routing rule.');
    } finally {
      setRoutingSaving(false);
    }
  };

  const handleDeleteRoutingRule = async (ruleId) => {
    if (!ruleId) {
      return;
    }
    try {
      await removeRoutingRule(ruleId);
      setStatusMessage('Routing rule removed.');
    } catch (routingError) {
      setErrorMessage(routingError?.message ?? 'Unable to delete routing rule.');
    }
  };

  const handleSavePreferences = async () => {
    setPreferencesSaving(true);
    try {
      await updatePreferences(preferencesDraft);
      setStatusMessage('Inbox preferences updated.');
    } catch (prefsError) {
      setErrorMessage(prefsError?.message ?? 'Unable to update preferences.');
    } finally {
      setPreferencesSaving(false);
    }
  };

  const handleSaveAutomations = async () => {
    setAutomationSaving(true);
    try {
      await saveAutomations({
        autoEscalateUrgent: automationDraft.autoEscalateUrgent,
        shareDailyDigest: automationDraft.shareDailyDigest,
        notifyTalent: automationDraft.notifyTalent,
      });
      setStatusMessage('Automations updated.');
    } catch (automationError) {
      setErrorMessage(automationError?.message ?? 'Unable to update automations.');
    } finally {
      setAutomationSaving(false);
    }
  };

  return (
    <section id="agency-inbox" className="space-y-6 rounded-3xl border border-indigo-200 bg-gradient-to-br from-white via-white to-indigo-50 p-6 shadow-sm">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-indigo-500">Inbox</p>
          <h2 className="text-3xl font-semibold text-slate-900">Agency conversation control</h2>
          <p className="mt-2 max-w-3xl text-sm text-slate-500">
            Route client, partner, and talent messages with saved replies, automations, and assignment workflows tuned for production operations.
          </p>
        </div>
        <div className="flex flex-col items-start gap-3">
          <DataStatus
            loading={loading}
            error={error}
            lastUpdated={lastUpdated ?? workspace?.lastSyncedAt ?? null}
            fromCache={fromCache}
            onRefresh={() => refresh({ force: true })}
            statusLabel={statusLabel}
          />
          <button
            type="button"
            onClick={() => setComposeOpen(true)}
            className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500"
          >
            New thread
          </button>
        </div>
      </header>

      {statusMessage ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 shadow-sm">
          {statusMessage}
        </div>
      ) : null}

      {errorMessage ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600 shadow-sm">
          {errorMessage}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <SummaryCard key={metric.label} label={metric.label} value={metric.value} hint={metric.hint} />
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Priority queue</h3>
                <p className="text-sm text-slate-500">Monitor high-signal conversations and maintain SLA health.</p>
              </div>
              <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-600">
                {threads.length} threads
              </span>
            </div>
            <div className="mt-4 grid gap-3">
              {threads.length ? (
                threads.map((thread) => (
                  <ThreadListItem
                    key={thread.id}
                    thread={thread}
                    isActive={`${thread.id}` === `${selectedThreadId}`}
                    onSelect={(item) => setSelectedThreadId(item?.id ?? item)}
                    onMarkRead={handleMarkRead}
                    onArchive={handleArchiveToggle}
                  />
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">
                  No conversations queued. Invite clients and talent into a thread to get started.
                </div>
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <h3 className="text-lg font-semibold text-slate-900">Thread detail</h3>
              {selectedThread ? (
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span>Last updated</span>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 font-semibold text-slate-600">
                    {formatRelative(selectedThread.lastMessageAt)}
                  </span>
                </div>
              ) : null}
            </div>
            {selectedThread ? (
              <div className="mt-4 space-y-4">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{selectedThread.subject || 'Untitled conversation'}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {selectedThread.channelType || 'direct'} • {selectedThread.priority || 'standard'} priority
                  </p>
                </div>
                <div className="space-y-2 text-sm text-slate-600">
                  <p>{selectedThread.lastMessagePreview || selectedThread.preview || 'No messages yet. Share an update to kick things off.'}</p>
                  <p className="text-xs text-slate-400">Last message • {formatDateTime(selectedThread.lastMessageAt)}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Participants</p>
                  <div className="flex flex-wrap gap-2 text-xs text-slate-600">
                    {(selectedThread.participants ?? []).map((participant) => (
                      <span key={participant.participantId ?? participant.userId ?? participant.email} className="rounded-full bg-slate-100 px-3 py-1">
                        {participant.name ?? participant.email ?? participant.handle ?? participant.participantId}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="space-y-3">
                  <textarea
                    value={composer}
                    onChange={(event) => setComposer(event.target.value)}
                    placeholder="Share an update, drop a saved reply, or coordinate next steps."
                    className="h-32 w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-inner focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  />
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={handleSendMessage}
                      disabled={sending || !composer.trim()}
                      className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-slate-300"
                    >
                      {sending ? 'Sending…' : 'Send reply'}
                    </button>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <button
                        type="button"
                        onClick={() => handleEscalate(selectedThread, 'Client flagged risk')}
                        className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 font-semibold text-amber-600 transition hover:border-amber-300"
                      >
                        Escalate
                      </button>
                      <div className="flex items-center gap-1">
                        <span>Assign:</span>
                        <select
                          value=""
                          onChange={(event) => {
                            const assignee = event.target.value;
                            if (assignee) {
                              handleAssign(selectedThread, assignee);
                              event.target.value = '';
                            }
                          }}
                          className="rounded-full border border-slate-200 px-2 py-1 text-xs text-slate-600 focus:border-indigo-300 focus:outline-none"
                        >
                          <option value="">Select teammate</option>
                          {participantsDirectory.map((participant) => (
                            <option key={participant.id ?? participant.userId} value={participant.id ?? participant.userId}>
                              {participant.name ?? participant.email ?? participant.handle ?? participant.id}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-4 rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">
                Select a thread from the queue to review participants, automate a response, and keep the conversation active.
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900">Support cases</h3>
            <p className="mt-1 text-sm text-slate-500">High priority tickets synced from finance and delivery workflows.</p>
            <div className="mt-4 grid gap-3">
              {supportCases.length ? (
                supportCases.map((supportCase) => (
                  <div key={supportCase.id} className="rounded-2xl border border-slate-200 p-4 text-sm text-slate-600">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-semibold text-slate-900">{supportCase.subject || supportCase.title || 'Untitled case'}</p>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${
                          supportCase.priority === 'high'
                            ? 'bg-rose-100 text-rose-600'
                            : supportCase.priority === 'medium'
                            ? 'bg-amber-100 text-amber-600'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {supportCase.priority || 'standard'}
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-slate-500">{formatDateTime(supportCase.updatedAt ?? supportCase.createdAt)}</p>
                    <p className="mt-2 text-sm text-slate-600 line-clamp-3">{supportCase.summary || supportCase.description}</p>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">
                  No escalations are open. Your support specialists will appear here as tickets arrive.
                </div>
              )}
            </div>
          </div>
        </div>

        <aside className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900">Inbox preferences</h3>
            <p className="mt-1 text-sm text-slate-500">Tune notifications and autoresponders for the whole agency workspace.</p>
            <div className="mt-4 space-y-3 text-sm text-slate-600">
              <label className="flex items-center justify-between gap-3">
                <span>Email notifications</span>
                <input
                  type="checkbox"
                  checked={preferencesDraft.notificationsEmail}
                  onChange={(event) => setPreferencesDraft((current) => ({ ...current, notificationsEmail: event.target.checked }))}
                  className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
              </label>
              <label className="flex items-center justify-between gap-3">
                <span>Push notifications</span>
                <input
                  type="checkbox"
                  checked={preferencesDraft.notificationsPush}
                  onChange={(event) => setPreferencesDraft((current) => ({ ...current, notificationsPush: event.target.checked }))}
                  className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
              </label>
              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={preferencesDraft.autoResponderEnabled}
                  onChange={(event) =>
                    setPreferencesDraft((current) => ({ ...current, autoResponderEnabled: event.target.checked }))
                  }
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <div className="flex-1">
                  <span className="font-medium text-slate-900">Enable autoresponder</span>
                  <textarea
                    value={preferencesDraft.autoResponderMessage}
                    onChange={(event) => setPreferencesDraft((current) => ({ ...current, autoResponderMessage: event.target.value }))}
                    placeholder="Thanks for reaching out! Our producers will reply within business hours."
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 focus:border-indigo-300 focus:outline-none"
                    rows={3}
                    disabled={!preferencesDraft.autoResponderEnabled}
                  />
                </div>
              </label>
            </div>
            <button
              type="button"
              onClick={handleSavePreferences}
              disabled={preferencesSaving}
              className="mt-4 inline-flex items-center justify-center rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {preferencesSaving ? 'Saving…' : 'Save preferences'}
            </button>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900">Saved replies</h3>
            <p className="mt-1 text-sm text-slate-500">Codify expert responses and deploy them across the team.</p>
            <div className="mt-4 space-y-3">
              {savedReplies.length ? (
                savedReplies.map((reply) => (
                  <div key={reply.id} className="rounded-2xl border border-slate-200 p-4 text-sm text-slate-600">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-semibold text-slate-900">{reply.title}</p>
                      <div className="flex items-center gap-2 text-xs">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingReplyId(reply.id);
                            setReplyDraft({
                              title: reply.title ?? '',
                              body: reply.body ?? '',
                              shortcut: reply.shortcut ?? '',
                              category: reply.category ?? 'general',
                              isDefault: Boolean(reply.isDefault),
                            });
                          }}
                          className="rounded-full border border-slate-200 px-3 py-1 font-semibold text-slate-600 transition hover:border-indigo-200 hover:text-indigo-600"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteReply(reply.id)}
                          className="rounded-full border border-rose-200 px-3 py-1 font-semibold text-rose-500 transition hover:border-rose-300 hover:text-rose-600"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    <p className="mt-2 text-xs uppercase tracking-wide text-indigo-400">Shortcut • {reply.shortcut || '—'}</p>
                    <p className="mt-2 text-sm text-slate-600 whitespace-pre-line">{reply.body}</p>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
                  No saved replies yet. Capture your best answers to reply in seconds.
                </div>
              )}
            </div>
            <div className="mt-5 space-y-3 rounded-2xl border border-indigo-100 bg-indigo-50/50 p-4">
              <p className="text-sm font-semibold text-slate-900">{editingReplyId ? 'Update reply' : 'Create new reply'}</p>
              <input
                type="text"
                value={replyDraft.title}
                onChange={(event) => setReplyDraft((current) => ({ ...current, title: event.target.value }))}
                placeholder="Title"
                className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-indigo-300 focus:outline-none"
              />
              <textarea
                value={replyDraft.body}
                onChange={(event) => setReplyDraft((current) => ({ ...current, body: event.target.value }))}
                placeholder="Reply content"
                rows={3}
                className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-indigo-300 focus:outline-none"
              />
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
                <input
                  type="text"
                  value={replyDraft.shortcut}
                  onChange={(event) => setReplyDraft((current) => ({ ...current, shortcut: event.target.value }))}
                  placeholder="Shortcut (e.g. /kickoff)"
                  className="flex-1 rounded-full border border-slate-200 px-3 py-2 focus:border-indigo-300 focus:outline-none"
                />
                <select
                  value={replyDraft.category}
                  onChange={(event) => setReplyDraft((current) => ({ ...current, category: event.target.value }))}
                  className="rounded-full border border-slate-200 px-3 py-2 focus:border-indigo-300 focus:outline-none"
                >
                  <option value="general">General</option>
                  <option value="sales">Sales</option>
                  <option value="support">Support</option>
                  <option value="talent">Talent</option>
                </select>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={replyDraft.isDefault}
                    onChange={(event) => setReplyDraft((current) => ({ ...current, isDefault: event.target.checked }))}
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  Default
                </label>
              </div>
              <button
                type="button"
                onClick={handleSaveReply}
                disabled={replySaving}
                className="inline-flex items-center justify-center rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                {replySaving ? 'Saving…' : editingReplyId ? 'Update reply' : 'Create reply'}
              </button>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900">Routing rules</h3>
            <p className="mt-1 text-sm text-slate-500">Dispatch conversations automatically based on channel, keywords, or SLA signals.</p>
            <div className="mt-4 space-y-3">
              {routingRules.length ? (
                routingRules.map((rule) => (
                  <div key={rule.id} className="rounded-2xl border border-slate-200 p-4 text-sm text-slate-600">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-semibold text-slate-900">{rule.name}</p>
                      <div className="flex items-center gap-2 text-xs">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingRuleId(rule.id);
                            setRoutingDraft({
                              name: rule.name ?? '',
                              channel: Array.isArray(rule.channels) && rule.channels.length ? rule.channels[0] : 'all',
                              condition: rule.condition ?? '',
                              target: rule.target ?? 'operations',
                              priority: rule.priority ?? 'medium',
                            });
                          }}
                          className="rounded-full border border-slate-200 px-3 py-1 font-semibold text-slate-600 transition hover:border-indigo-200 hover:text-indigo-600"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteRoutingRule(rule.id)}
                          className="rounded-full border border-rose-200 px-3 py-1 font-semibold text-rose-500 transition hover:border-rose-300 hover:text-rose-600"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    <p className="mt-2 text-xs uppercase tracking-wide text-indigo-400">Channels • {(rule.channels ?? ['all']).join(', ') || 'all'}</p>
                    <p className="mt-2 text-sm text-slate-600">{rule.condition}</p>
                    <p className="mt-2 text-xs text-slate-500">Target • {rule.target || 'operations'} • Priority {rule.priority || 'medium'}</p>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
                  No routing rules configured. Create rules to automatically hand off to finance, delivery, or leadership.
                </div>
              )}
            </div>
            <div className="mt-5 space-y-3 rounded-2xl border border-indigo-100 bg-indigo-50/50 p-4">
              <p className="text-sm font-semibold text-slate-900">{editingRuleId ? 'Update rule' : 'Create new rule'}</p>
              <input
                type="text"
                value={routingDraft.name}
                onChange={(event) => setRoutingDraft((current) => ({ ...current, name: event.target.value }))}
                placeholder="Rule name"
                className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-indigo-300 focus:outline-none"
              />
              <textarea
                value={routingDraft.condition}
                onChange={(event) => setRoutingDraft((current) => ({ ...current, condition: event.target.value }))}
                placeholder="Condition (e.g. includes:invoice || channel:support)"
                rows={3}
                className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-indigo-300 focus:outline-none"
              />
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
                <select
                  value={routingDraft.channel}
                  onChange={(event) => setRoutingDraft((current) => ({ ...current, channel: event.target.value }))}
                  className="rounded-full border border-slate-200 px-3 py-2 focus:border-indigo-300 focus:outline-none"
                >
                  <option value="all">All channels</option>
                  <option value="sales">Sales</option>
                  <option value="support">Support</option>
                  <option value="project">Project</option>
                  <option value="talent">Talent</option>
                </select>
                <select
                  value={routingDraft.target}
                  onChange={(event) => setRoutingDraft((current) => ({ ...current, target: event.target.value }))}
                  className="rounded-full border border-slate-200 px-3 py-2 focus:border-indigo-300 focus:outline-none"
                >
                  <option value="operations">Operations</option>
                  <option value="finance">Finance</option>
                  <option value="success">Client success</option>
                  <option value="talent">Talent</option>
                </select>
                <select
                  value={routingDraft.priority}
                  onChange={(event) => setRoutingDraft((current) => ({ ...current, priority: event.target.value }))}
                  className="rounded-full border border-slate-200 px-3 py-2 focus:border-indigo-300 focus:outline-none"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <button
                type="button"
                onClick={handleSaveRoutingRule}
                disabled={routingSaving}
                className="inline-flex items-center justify-center rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                {routingSaving ? 'Saving…' : editingRuleId ? 'Update rule' : 'Create rule'}
              </button>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900">Automations</h3>
            <p className="mt-1 text-sm text-slate-500">Keep your inbox in sync with AI triage and proactive broadcasts.</p>
            <div className="mt-4 space-y-3 text-sm text-slate-600">
              <label className="flex items-center justify-between gap-3">
                <span>Escalate urgent sentiment automatically</span>
                <input
                  type="checkbox"
                  checked={automationDraft.autoEscalateUrgent}
                  onChange={(event) => setAutomationDraft((current) => ({ ...current, autoEscalateUrgent: event.target.checked }))}
                  className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
              </label>
              <label className="flex items-center justify-between gap-3">
                <span>Send daily digest to leadership</span>
                <input
                  type="checkbox"
                  checked={automationDraft.shareDailyDigest}
                  onChange={(event) => setAutomationDraft((current) => ({ ...current, shareDailyDigest: event.target.checked }))}
                  className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
              </label>
              <label className="flex items-center justify-between gap-3">
                <span>Alert mentors on talent wins</span>
                <input
                  type="checkbox"
                  checked={automationDraft.notifyTalent}
                  onChange={(event) => setAutomationDraft((current) => ({ ...current, notifyTalent: event.target.checked }))}
                  className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
              </label>
            </div>
            <button
              type="button"
              onClick={handleSaveAutomations}
              disabled={automationSaving}
              className="mt-4 inline-flex items-center justify-center rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {automationSaving ? 'Saving…' : 'Update automations'}
            </button>
          </div>
        </aside>
      </div>

      {composeOpen ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Start new thread</h3>
                <p className="text-sm text-slate-500">Invite clients, partners, or talent into a new conversation.</p>
              </div>
              <button
                type="button"
                onClick={() => setComposeOpen(false)}
                className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-indigo-200 hover:text-indigo-600"
              >
                Close
              </button>
            </div>
            <div className="mt-4 space-y-3">
              <input
                type="text"
                value={composeForm.subject}
                onChange={(event) => setComposeForm((current) => ({ ...current, subject: event.target.value }))}
                placeholder="Subject"
                className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-indigo-300 focus:outline-none"
              />
              <input
                type="text"
                value={composeForm.participantIds}
                onChange={(event) => setComposeForm((current) => ({ ...current, participantIds: event.target.value }))}
                placeholder="Participant IDs (comma separated)"
                className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-indigo-300 focus:outline-none"
              />
              <select
                value={composeForm.channelType}
                onChange={(event) => setComposeForm((current) => ({ ...current, channelType: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-indigo-300 focus:outline-none"
              >
                <option value="direct">Direct</option>
                <option value="project">Project</option>
                <option value="support">Support</option>
                <option value="talent">Talent</option>
              </select>
              <textarea
                value={composeForm.initialMessage}
                onChange={(event) => setComposeForm((current) => ({ ...current, initialMessage: event.target.value }))}
                placeholder="Kickoff message (optional)"
                rows={4}
                className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-indigo-300 focus:outline-none"
              />
            </div>
            <div className="mt-5 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={() => setComposeOpen(false)}
                className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-indigo-200 hover:text-indigo-600"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateThread}
                disabled={creatingThread}
                className="inline-flex items-center justify-center rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                {creatingThread ? 'Creating…' : 'Create thread'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

AgencyInboxSection.propTypes = {
  workspaceId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  statusLabel: PropTypes.string,
  initialSummary: PropTypes.object,
};

AgencyInboxSection.defaultProps = {
  workspaceId: null,
  statusLabel: 'Inbox telemetry',
  initialSummary: null,
};
