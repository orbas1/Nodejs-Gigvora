import { useEffect, useMemo, useState, useId } from 'react';
import { ArrowsPointingOutIcon, ArrowDownTrayIcon, ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';
import ConversationMessage from '../../messaging/ConversationMessage.jsx';
import { classNames } from '../../../utils/classNames.js';
import { buildThreadTitle, formatThreadParticipants } from '../../../utils/messaging.js';

const THREAD_STATE_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'archived', label: 'Archived' },
  { value: 'locked', label: 'Locked' },
];

const SUPPORT_STATUS_OPTIONS = [
  { value: 'triage', label: 'Triage' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'waiting_on_customer', label: 'Waiting' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
];

const SUPPORT_PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

export default function AdminInboxThreadDetail({
  actorId,
  thread,
  messages,
  loading,
  error,
  composer,
  onComposerChange,
  onSendMessage,
  sending,
  onUpdateState,
  onAssign,
  assigning,
  agents,
  onUpdateSupport,
  updatingSupport,
  onEscalate,
  escalating,
  labels,
  onSetLabels,
  updatingLabels,
  onOpenNewWindow,
  onExpand,
  layout = 'inline',
}) {
  const idPrefix = useId();
  const sectionIds = useMemo(
    () => ({
      state: `${idPrefix}-state`,
      assignment: `${idPrefix}-assignment`,
      support: `${idPrefix}-support`,
      escalation: `${idPrefix}-escalation`,
      labels: `${idPrefix}-labels`,
    }),
    [idPrefix],
  );
  const [stateDraft, setStateDraft] = useState(thread?.state ?? 'active');
  const [assigneeDraft, setAssigneeDraft] = useState(thread?.supportCase?.assignedTo ?? '');
  const [supportStatusDraft, setSupportStatusDraft] = useState(thread?.supportCase?.status ?? 'triage');
  const [supportPriorityDraft, setSupportPriorityDraft] = useState(thread?.supportCase?.priority ?? 'medium');
  const [supportSummaryDraft, setSupportSummaryDraft] = useState(
    thread?.supportCase?.resolutionSummary ?? '',
  );
  const [escalationReason, setEscalationReason] = useState('');
  const [escalationPriority, setEscalationPriority] = useState(thread?.supportCase?.priority ?? 'high');

  useEffect(() => {
    setStateDraft(thread?.state ?? 'active');
    setAssigneeDraft(thread?.supportCase?.assignedTo ?? '');
    setSupportStatusDraft(thread?.supportCase?.status ?? 'triage');
    setSupportPriorityDraft(thread?.supportCase?.priority ?? 'medium');
    setEscalationPriority(thread?.supportCase?.priority ?? 'high');
    setSupportSummaryDraft(thread?.supportCase?.resolutionSummary ?? '');
  }, [
    thread?.id,
    thread?.state,
    thread?.supportCase?.assignedTo,
    thread?.supportCase?.status,
    thread?.supportCase?.priority,
    thread?.supportCase?.resolutionSummary,
  ]);

  const selectedLabelIds = useMemo(
    () => new Set((thread?.labels ?? []).map((label) => String(label.id))),
    [thread?.labels],
  );

  const participants = useMemo(() => formatThreadParticipants(thread, actorId), [thread, actorId]);

  const transcriptFileName = useMemo(() => {
    return thread?.id ? `gigvora-thread-${thread.id}.txt` : 'gigvora-thread.txt';
  }, [thread?.id]);

  const handleDownloadTranscript = () => {
    if (!thread) {
      return;
    }
    const header = [`Thread: ${buildThreadTitle(thread, actorId)}`, `Channel: ${thread.channelType ?? 'n/a'}`];
    if (participants.length) {
      header.push(`Participants: ${participants.join(', ')}`);
    }
    const messageLines = (messages ?? []).map((message) => {
      const author = message.author?.name ?? message.author?.email ?? message.authorId ?? 'Unknown';
      const timestamp = message.createdAt ? new Date(message.createdAt).toISOString() : 'Unknown time';
      const body = (message.body ?? message.message ?? '').replace(/\s+/g, ' ').trim();
      return `[${timestamp}] ${author}: ${body}`;
    });
    const payload = [...header, '', ...messageLines].join('\n');

    if (typeof window === 'undefined') {
      console.info('Thread transcript', payload);
      return;
    }

    try {
      const blob = new Blob([payload], { type: 'text/plain;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = transcriptFileName;
      anchor.rel = 'noopener';
      anchor.click();
      window.URL.revokeObjectURL(url);
    } catch (exportError) {
      console.error('Unable to export thread transcript', exportError);
    }
  };

  const toggleLabel = (labelId) => {
    const next = new Set(selectedLabelIds);
    if (next.has(labelId)) {
      next.delete(labelId);
    } else {
      next.add(labelId);
    }
    const nextLabels = Array.from(next);
    if (
      onSetLabels &&
      (thread?.labels ?? []).map((label) => String(label.id)).sort().join('|') !== nextLabels.slice().sort().join('|')
    ) {
      onSetLabels(nextLabels);
    }
  };

  const stateChanged = stateDraft !== (thread?.state ?? 'active');
  const assignmentChanged = assigneeDraft !== (thread?.supportCase?.assignedTo ?? '');
  const supportSummaryValue = supportSummaryDraft.trim();
  const supportChanged =
    supportStatusDraft !== (thread?.supportCase?.status ?? 'triage') ||
    supportPriorityDraft !== (thread?.supportCase?.priority ?? 'medium') ||
    supportSummaryValue !== (thread?.supportCase?.resolutionSummary ?? '');
  const canEscalate = escalationReason.trim().length > 0 && !escalating;

  if (!thread) {
    return (
      <section className="flex h-full min-h-[24rem] items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-white text-sm text-slate-500">
        Select a thread.
      </section>
    );
  }

  return (
    <section
      className={classNames(
        'flex h-full flex-col rounded-3xl border border-slate-200 bg-white shadow-soft',
        layout === 'inline' ? 'p-6' : 'p-4',
      )}
    >
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-slate-900">{buildThreadTitle(thread, actorId)}</h2>
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 font-semibold uppercase tracking-wide">{thread.channelType}</span>
            <span>{thread.createdAt ? new Date(thread.createdAt).toLocaleDateString() : '—'}</span>
            {thread.lastMessageAt ? <span>{new Date(thread.lastMessageAt).toLocaleTimeString()}</span> : null}
          </div>
          {participants.length ? (
            <div className="flex flex-wrap gap-2 text-xs text-slate-500">
              {participants.map((participant) => (
                <span key={participant} className="rounded-full bg-slate-100 px-2.5 py-0.5 font-semibold">
                  {participant}
                </span>
              ))}
            </div>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {onExpand && layout === 'inline' ? (
            <button
              type="button"
              onClick={onExpand}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-accent/60 hover:text-accent"
            >
              <ArrowsPointingOutIcon className="h-4 w-4" /> Expand
            </button>
          ) : null}
          <button
            type="button"
            onClick={handleDownloadTranscript}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-accent/60 hover:text-accent"
          >
            <ArrowDownTrayIcon className="h-4 w-4" /> Transcript
          </button>
          <button
            type="button"
            onClick={() => onOpenNewWindow?.(thread.id)}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-accent/60 hover:text-accent"
          >
            <ArrowTopRightOnSquareIcon className="h-4 w-4" /> Window
          </button>
        </div>
      </header>

      <div className="mt-5 grid flex-1 gap-4 lg:grid-cols-[minmax(220px,0.75fr),minmax(0,1.25fr)]">
        <div className="space-y-4 rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
          <section className="space-y-2" aria-labelledby={sectionIds.state}>
            <h3 id={sectionIds.state} className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              Thread state
            </h3>
            <select
              value={stateDraft}
              onChange={(event) => setStateDraft(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            >
              {THREAD_STATE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => stateChanged && onUpdateState?.(stateDraft)}
              disabled={!stateChanged || updatingSupport || assigning}
              className="inline-flex w-full items-center justify-center rounded-full bg-slate-900 px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Update
            </button>
          </section>

          <section className="space-y-2" aria-labelledby={sectionIds.assignment}>
            <h3 id={sectionIds.assignment} className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              Assignment
            </h3>
            <select
              value={assigneeDraft ?? ''}
              onChange={(event) => setAssigneeDraft(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            >
              <option value="">Unassigned</option>
              {agents.map((agent) => (
                <option key={agent.id} value={agent.id}>
                  {`${agent.firstName ?? ''} ${agent.lastName ?? ''}`.trim() || agent.email}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => assignmentChanged && onAssign?.({ agentId: assigneeDraft || undefined, notifyAgent: true })}
              disabled={!assignmentChanged || assigning}
              className="inline-flex w-full items-center justify-center rounded-full bg-accent px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-accentDark disabled:cursor-not-allowed disabled:opacity-60"
            >
              {assigning ? 'Assigning…' : 'Assign'}
            </button>
          </section>

          <section className="space-y-2" aria-labelledby={sectionIds.support}>
            <h3 id={sectionIds.support} className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              Support case
            </h3>
            <select
              value={supportStatusDraft}
              onChange={(event) => setSupportStatusDraft(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            >
              {SUPPORT_STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <select
              value={supportPriorityDraft}
              onChange={(event) => setSupportPriorityDraft(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            >
              {SUPPORT_PRIORITY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <textarea
              rows={3}
              value={supportSummaryDraft}
              onChange={(event) => setSupportSummaryDraft(event.target.value)}
              placeholder="Notes"
              className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
            <button
              type="button"
              onClick={() =>
                supportChanged &&
                onUpdateSupport?.({
                  status: supportStatusDraft,
                  metadata: { priority: supportPriorityDraft },
                  resolutionSummary: supportSummaryValue,
                })
              }
              disabled={!supportChanged || updatingSupport}
              className="inline-flex w-full items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-accent/60 hover:text-accent disabled:cursor-not-allowed disabled:opacity-60"
            >
              {updatingSupport ? 'Saving…' : 'Save'}
            </button>
          </section>

          <section className="space-y-2" aria-labelledby={sectionIds.escalation}>
            <h3 id={sectionIds.escalation} className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              Escalation
            </h3>
            <textarea
              rows={3}
              value={escalationReason}
              onChange={(event) => setEscalationReason(event.target.value)}
              placeholder="Reason"
              className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-200"
            />
            <select
              value={escalationPriority}
              onChange={(event) => setEscalationPriority(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-200"
            >
              {SUPPORT_PRIORITY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() =>
                canEscalate &&
                onEscalate?.({ reason: escalationReason.trim(), priority: escalationPriority })
              }
              disabled={!canEscalate}
              className="inline-flex w-full items-center justify-center rounded-full bg-rose-500 px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-rose-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {escalating ? 'Escalating…' : 'Escalate'}
            </button>
          </section>

          <section className="space-y-2" aria-labelledby={sectionIds.labels}>
            <h3 id={sectionIds.labels} className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              Labels
            </h3>
            <div className="flex flex-wrap gap-2">
              {labels.map((label) => {
                const active = selectedLabelIds.has(String(label.id));
                return (
                  <button
                    key={label.id}
                    type="button"
                    onClick={() => toggleLabel(String(label.id))}
                    disabled={updatingLabels}
                    className={classNames(
                      'rounded-full px-3 py-1 text-xs font-semibold transition',
                      active
                        ? 'text-white shadow-soft'
                        : 'border border-slate-200 bg-white text-slate-600 hover:border-slate-400',
                    )}
                    style={{
                      backgroundColor: active ? label.color ?? '#2563eb' : 'transparent',
                      color: active ? '#fff' : undefined,
                      borderColor: label.color ?? undefined,
                    }}
                  >
                    {label.name}
                  </button>
                );
              })}
              {!labels.length ? <span className="text-xs text-slate-500">No labels</span> : null}
            </div>
          </section>
        </div>

        <div className="flex flex-col gap-4">
          {error ? (
            <p className="rounded-2xl bg-rose-50 px-4 py-3 text-xs text-rose-600" role="alert">
              {error}
            </p>
          ) : null}
          <div className="flex-1 space-y-3 overflow-y-auto rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
            {loading && !messages.length ? (
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="h-16 rounded-2xl bg-slate-100 animate-pulse" />
                ))}
              </div>
            ) : null}
            {!loading && !messages.length ? (
              <p className="text-xs text-slate-500">No messages.</p>
            ) : null}
            {messages.map((message) => (
              <ConversationMessage key={message.id} message={message} actorId={actorId} onJoinCall={() => {}} joiningCall={false} />
            ))}
          </div>
          <form
            className="space-y-3"
            onSubmit={(event) => {
              event.preventDefault();
              onSendMessage();
            }}
          >
            <textarea
              rows={4}
              value={composer}
              onChange={(event) => onComposerChange(event.target.value)}
              placeholder="Reply"
              className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="submit"
                disabled={sending || !composer.trim()}
                className={classNames(
                  'inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white shadow-soft transition',
                  sending || !composer.trim() ? 'cursor-not-allowed opacity-60' : 'hover:bg-accentDark',
                )}
              >
                {sending ? 'Sending…' : 'Send'}
              </button>
              <button
                type="button"
                onClick={() => onComposerChange('')}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-accent/60 hover:text-accent"
              >
                Clear
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
