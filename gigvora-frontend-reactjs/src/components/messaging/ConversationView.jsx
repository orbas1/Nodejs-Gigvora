import { useMemo } from 'react';
import PropTypes from 'prop-types';
import {
  ArrowTrendingDownIcon,
  ArrowTrendingUpIcon,
  BoltIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  ClockIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  FlagIcon,
  InformationCircleIcon,
  LinkIcon,
  PhoneIcon,
  SparklesIcon,
  UserGroupIcon,
  VideoCameraIcon,
} from '@heroicons/react/24/outline';
import { classNames } from '../../utils/classNames.js';
import VirtualizedMessageList from './VirtualizedMessageList.jsx';
import ConversationMessage from './ConversationMessage.jsx';
import TypingIndicator from './TypingIndicator.jsx';
import AgoraCallPanel from './AgoraCallPanel.jsx';
import MessageComposerBar from './MessageComposerBar.jsx';
import {
  buildThreadTitle,
  formatThreadParticipants,
  formatReadReceiptSummary,
  formatTypingParticipants,
} from '../../utils/messaging.js';
import { formatRelativeTime } from '../../utils/date.js';

function parseDate(value) {
  if (!value) {
    return null;
  }
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatCurrencyValue(value, currency = 'USD') {
  if (!Number.isFinite(value)) {
    return null;
  }
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: value >= 1000 ? 0 : 2,
    }).format(value);
  } catch (error) {
    return `$${Number(value).toLocaleString()}`;
  }
}

function InsightCard({ icon: Icon, title, items, emptyLabel }) {
  if (!items?.length) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white/60 p-4 shadow-sm">
        <div className="flex items-center gap-2 text-slate-500">
          <Icon className="h-4 w-4" />
          <p className="text-xs font-semibold uppercase tracking-wide">{title}</p>
        </div>
        <p className="mt-2 text-xs text-slate-400">{emptyLabel}</p>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white/80 p-4 shadow-sm">
      <div className="flex items-center gap-2 text-slate-500">
        <Icon className="h-4 w-4" />
        <p className="text-xs font-semibold uppercase tracking-wide">{title}</p>
      </div>
      <ul className="mt-3 space-y-2 text-sm text-slate-600">
        {items.map((item, index) => (
          <li key={item.id ?? index} className="flex items-start gap-2">
            <span className="mt-0.5 inline-flex h-2.5 w-2.5 flex-none rounded-full bg-accent" aria-hidden="true" />
            <span>{item.label ?? item.title ?? item.summary ?? item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

InsightCard.propTypes = {
  icon: PropTypes.elementType.isRequired,
  title: PropTypes.string.isRequired,
  items: PropTypes.array,
  emptyLabel: PropTypes.string,
};

InsightCard.defaultProps = {
  items: [],
  emptyLabel: 'No items available yet.',
};

function mapToInsightItems(source, fallbackKey) {
  if (!source) {
    return [];
  }
  if (Array.isArray(source)) {
    return source
      .map((entry) => {
        if (typeof entry === 'string') {
          return { label: entry };
        }
        if (entry && typeof entry === 'object') {
          return {
            id: entry.id ?? entry[fallbackKey]?.id ?? entry.title,
            label: entry.label ?? entry.title ?? entry.summary ?? entry.text ?? entry[fallbackKey] ?? null,
          };
        }
        return null;
      })
      .filter(Boolean);
  }
  if (typeof source === 'object') {
    return Object.entries(source)
      .filter(([, value]) => Boolean(value))
      .map(([key, value]) => ({ id: key, label: typeof value === 'string' ? value : key }));
  }
  return [];
}

export default function ConversationView({
  actorId,
  thread,
  messages,
  messagesLoading,
  messagesError,
  hasMoreHistory,
  onLoadOlder,
  typingParticipants,
  onStartCall,
  onJoinCall,
  onCloseCall,
  callSession,
  callLoading,
  callError,
  composerValue,
  onComposerChange,
  onSendMessage,
  sending,
  savedReplies,
  savedRepliesLoading,
  onSavedReplyUsed,
}) {
  const disabled = !thread;
  const title = thread ? buildThreadTitle(thread, actorId) : 'Conversation';
  const participantSummary = thread ? formatThreadParticipants(thread, actorId).join(', ') : '';
  const latestMessage = useMemo(
    () => (Array.isArray(messages) && messages.length ? messages[messages.length - 1] : null),
    [messages],
  );
  const readReceipts = useMemo(
    () => (latestMessage ? formatReadReceiptSummary(latestMessage.readReceipts, actorId) : null),
    [actorId, latestMessage],
  );
  const typingSummary = useMemo(
    () => formatTypingParticipants(typingParticipants, actorId),
    [actorId, typingParticipants],
  );

  const executiveSummary = useMemo(() => {
    if (!thread) {
      return null;
    }
    return (
      thread?.summary?.executiveSummary ??
      thread?.insights?.executiveSummary ??
      thread?.metadata?.executiveSummary ??
      thread?.summary?.statement ??
      thread?.summary?.text ??
      null
    );
  }, [thread]);

  const highlights = useMemo(() => {
    if (!thread) {
      return [];
    }
    const primary =
      thread.metadata?.highlights ??
      thread.insights?.highlights ??
      thread.summary?.highlights ??
      (thread.summary ? [thread.summary] : []);
    const mapped = mapToInsightItems(primary, 'label');
    if (mapped.length) {
      return mapped.slice(0, 5);
    }
    const fallback = [];
    if (thread.subject) {
      fallback.push({ label: `Focus: ${thread.subject}` });
    }
    if (thread.lastMessagePreview) {
      fallback.push({ label: thread.lastMessagePreview });
    }
    return fallback;
  }, [thread]);

  const nextSteps = useMemo(() => {
    if (!thread) {
      return [];
    }
    const source =
      thread.metadata?.nextSteps ??
      thread.insights?.nextSteps ??
      thread.tasks ??
      thread.metadata?.actionItems ??
      [];
    const mapped = mapToInsightItems(source, 'title');
    if (mapped.length) {
      return mapped;
    }
    if (thread.metadata?.status === 'awaiting_response') {
      return [{ label: 'Awaiting partner response' }];
    }
    if (thread.metadata?.status === 'needs_action') {
      return [{ label: 'Action required from your team' }];
    }
    return [];
  }, [thread]);

  const documents = useMemo(() => {
    if (!thread) {
      return [];
    }
    const source =
      thread.metadata?.documents ??
      thread.metadata?.attachments ??
      thread.attachments ??
      [];
    const mapped = mapToInsightItems(source, 'title');
    if (mapped.length) {
      return mapped.map((item) => ({
        ...item,
        href: item.href ?? item.url ?? item.link ?? null,
      }));
    }
    return [];
  }, [thread]);

  const stage = thread?.metadata?.pipelineStage ?? thread?.metadata?.dealStage ?? thread?.stage ?? null;
  const priority = thread?.supportCase?.priority ?? thread?.metadata?.priority ?? thread?.priority ?? null;
  const relationshipTier = thread?.metadata?.relationshipTier ?? thread?.metadata?.accountTier ?? null;
  const confidence = thread?.metadata?.confidence ?? thread?.insights?.confidence ?? null;
  const formattedDealValue = formatCurrencyValue(
    thread?.metadata?.dealValue ?? thread?.dealValue ?? null,
    thread?.metadata?.currency ?? 'USD',
  );
  const momentumSummary = useMemo(() => {
    if (!thread) {
      return null;
    }
    const rawProgress =
      thread?.metrics?.progressPercent ??
      thread?.metadata?.progressPercent ??
      thread?.progressPercent ??
      null;
    const progress = Number.isFinite(rawProgress)
      ? Math.max(0, Math.min(100, Math.round(Number(rawProgress))))
      : null;
    const previousProgress =
      thread?.metrics?.previousProgressPercent ??
      thread?.metadata?.previousProgressPercent ??
      thread?.insights?.previousProgressPercent ??
      null;
    const change =
      Number.isFinite(rawProgress) && Number.isFinite(previousProgress)
        ? Math.round(Number(rawProgress) - Number(previousProgress))
        : null;
    const pace =
      thread?.metrics?.momentum ??
      thread?.metadata?.momentum ??
      thread?.insights?.momentum ??
      null;
    const slaDueAt =
      parseDate(thread?.metadata?.nextResponseDueAt) ??
      parseDate(thread?.supportCase?.nextResponseDueAt) ??
      parseDate(thread?.sla?.nextResponseDueAt) ??
      null;
    let slaLabel = null;
    if (slaDueAt) {
      const diff = slaDueAt.getTime() - Date.now();
      if (diff <= 0) {
        slaLabel = `Response overdue ${formatRelativeTime(slaDueAt)}`;
      } else if (diff <= 2 * 24 * 60 * 60 * 1000) {
        slaLabel = `Respond ${formatRelativeTime(slaDueAt)}`;
      }
    }
    return { progress, change, pace, slaLabel };
  }, [thread]);

  const decisions = useMemo(() => {
    if (!thread) {
      return [];
    }
    const source =
      thread.metadata?.decisionLog ??
      thread.insights?.decisions ??
      thread.decisionLog ??
      [];
    return mapToInsightItems(source, 'summary').map((item, index) => {
      const entry = Array.isArray(source) ? source[index] : null;
      const owner = entry?.owner ?? entry?.assignee ?? entry?.author ?? null;
      const when = parseDate(entry?.decidedAt ?? entry?.date ?? null);
      const suffixParts = [];
      if (owner) {
        suffixParts.push(owner);
      }
      if (when) {
        suffixParts.push(formatRelativeTime(when.toISOString()));
      }
      const suffix = suffixParts.length ? ` — ${suffixParts.join(' · ')}` : '';
      return {
        ...item,
        label: `${item.label ?? item.title ?? 'Decision'}${suffix}`,
      };
    });
  }, [thread]);

  const upcomingEvents = useMemo(() => {
    if (!thread) {
      return [];
    }
    const sources = [
      thread.metadata?.upcomingEvents,
      thread.metadata?.milestones,
      thread.insights?.upcomingEvents,
      thread.timeline?.upcoming,
    ];
    const source = sources.find((candidate) => Array.isArray(candidate) && candidate.length) ?? [];
    return source
      .map((event, index) => {
        if (!event) {
          return null;
        }
        if (typeof event === 'string') {
          return { id: `event-${index}`, label: event };
        }
        const due = parseDate(event.dueAt ?? event.date ?? event.scheduledAt ?? event.when ?? null);
        const label = event.label ?? event.title ?? event.summary ?? 'Upcoming touchpoint';
        if (due) {
          return { id: event.id ?? `event-${index}`, label: `${label} — ${formatRelativeTime(due.toISOString())}` };
        }
        if (event.timeframe) {
          return { id: event.id ?? `event-${index}`, label: `${label} — ${event.timeframe}` };
        }
        return { id: event.id ?? `event-${index}`, label };
      })
      .filter(Boolean);
  }, [thread]);

  const riskAlerts = useMemo(() => {
    if (!thread) {
      return [];
    }
    const source =
      thread?.insights?.risks ??
      thread?.metadata?.risks ??
      thread?.riskAlerts ??
      thread?.insights?.blockers ??
      [];
    const mapped = mapToInsightItems(source, 'title');
    if (mapped.length) {
      return mapped;
    }
    if (thread?.metadata?.riskLevel) {
      return [{ id: 'riskLevel', label: `Risk level: ${thread.metadata.riskLevel}` }];
    }
    return [];
  }, [thread]);

  const stakeholders = useMemo(() => {
    if (!Array.isArray(thread?.participants)) {
      return [];
    }
    return thread.participants
      .map((participant, index) => {
        const name =
          participant?.displayName ??
          participant?.name ??
          participant?.fullName ??
          participant?.email ??
          null;
        if (!name) {
          return null;
        }
        const role = participant?.role ?? participant?.title ?? participant?.relationship ?? 'Collaborator';
        const influence = participant?.influence ?? participant?.relationshipTier ?? participant?.type ?? null;
        const organization = participant?.company ?? participant?.organisation ?? participant?.organization ?? null;
        return {
          id: participant?.userId ?? participant?.id ?? `stakeholder-${index}`,
          name,
          role,
          influence,
          organization,
        };
      })
      .filter(Boolean);
  }, [thread]);

  const engagementScore = useMemo(() => {
    const raw =
      thread?.metrics?.engagementScore ??
      thread?.metadata?.engagementScore ??
      thread?.insights?.engagementScore ??
      null;
    if (!Number.isFinite(raw)) {
      return null;
    }
    return Math.max(0, Math.min(100, Math.round(Number(raw))));
  }, [thread]);

  return (
    <div className="space-y-4 rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-soft backdrop-blur">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">{title}</p>
          {participantSummary ? <p className="text-xs text-slate-500">{participantSummary}</p> : null}
          {readReceipts ? (
            <p className="mt-1 text-[11px] text-slate-400">Read by {readReceipts}</p>
          ) : null}
          {typingSummary ? (
            <p className="mt-1 text-[11px] text-emerald-500">{typingSummary}</p>
          ) : null}
          {executiveSummary ? (
            <p className="mt-2 text-sm text-slate-600">{executiveSummary}</p>
          ) : null}
          {(stage || priority || relationshipTier || formattedDealValue) && (
            <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
              {stage ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 font-semibold uppercase tracking-wide">
                  {stage}
                </span>
              ) : null}
              {priority ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 font-semibold uppercase tracking-wide text-amber-600">
                  Priority: {priority}
                </span>
              ) : null}
              {relationshipTier ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 font-semibold uppercase tracking-wide text-emerald-600">
                  {relationshipTier}
                </span>
              ) : null}
              {formattedDealValue ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2 py-0.5 font-semibold uppercase tracking-wide text-sky-600">
                  {formattedDealValue}
                </span>
              ) : null}
            </div>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onStartCall('video')}
            disabled={disabled || callLoading || Boolean(callSession)}
            className={classNames(
              'inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold transition',
              disabled || callLoading || Boolean(callSession)
                ? 'border border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed'
                : 'border border-accent bg-accent text-white shadow-soft hover:border-accentDark hover:bg-accentDark',
            )}
          >
            <VideoCameraIcon className={classNames('h-4 w-4', callLoading ? 'animate-spin' : '')} />
            Start video
          </button>
          <button
            type="button"
            onClick={() => onStartCall('voice')}
            disabled={disabled || callLoading || Boolean(callSession)}
            className={classNames(
              'inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold transition',
              disabled || callLoading || Boolean(callSession)
                ? 'border border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed'
                : 'border border-slate-200 bg-white text-slate-600 hover:border-accent/60 hover:text-accent',
            )}
          >
            <PhoneIcon className={classNames('h-4 w-4', callLoading ? 'animate-spin' : '')} />
            Start voice
          </button>
        </div>
      </div>

      {callError ? (
        <p className="rounded-2xl bg-rose-50 px-4 py-2 text-xs text-rose-600" role="alert">
          {callError}
        </p>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2.1fr),minmax(220px,1fr)]">
        <div className="space-y-4">
          {messagesError ? (
            <p className="rounded-2xl bg-rose-50 px-4 py-2 text-xs text-rose-600" role="alert">
              {messagesError}
            </p>
          ) : null}
          <VirtualizedMessageList
            messages={messages}
            hasMore={hasMoreHistory}
            onLoadMore={onLoadOlder}
            loading={messagesLoading}
            emptyState={
              disabled ? (
                <p className="text-sm text-slate-500">
                  Select a conversation to view the full timeline of approvals, decisions, and updates.
                </p>
              ) : (
                <p className="text-sm text-slate-500">
                  No messages yet. Share agendas, approvals, and updates to kick things off.
                </p>
              )
            }
            renderMessage={(message) => (
              <ConversationMessage
                key={message.id}
                message={message}
                actorId={actorId}
                onJoinCall={onJoinCall}
                joiningCall={callLoading}
                activeCallId={callSession?.callId ?? null}
              />
            )}
          />
          {typingParticipants?.length ? <TypingIndicator participants={typingParticipants} actorId={actorId} /> : null}
          {callSession ? <AgoraCallPanel session={callSession} onClose={onCloseCall} /> : null}
          <MessageComposerBar
            threadId={thread?.id ?? null}
            value={composerValue}
            onChange={onComposerChange}
            onSend={onSendMessage}
            sending={sending}
            disabled={disabled}
            savedReplies={savedReplies}
            loadingSavedReplies={savedRepliesLoading}
            messageError={messagesError}
            onSavedReplyUsed={onSavedReplyUsed}
          />
        </div>
        <aside className="space-y-3">
          <InsightCard
            icon={InformationCircleIcon}
            title="Highlights"
            items={highlights}
            emptyLabel="Insights appear once conversations gather momentum."
          />
          <InsightCard
            icon={CheckCircleIcon}
            title="Next steps"
            items={nextSteps}
            emptyLabel="Track decisions, approvals, and owners as workstreams evolve."
          />
          <InsightCard
            icon={FlagIcon}
            title="Decision log"
            items={decisions}
            emptyLabel="Log approvals and commitments to keep leadership aligned."
          />
          <InsightCard
            icon={CalendarDaysIcon}
            title="Upcoming touchpoints"
            items={upcomingEvents}
            emptyLabel="Add upcoming sessions so the room stays ahead."
          />
          <InsightCard
            icon={ExclamationTriangleIcon}
            title="Risk watch"
            items={riskAlerts}
            emptyLabel="Document blockers and watchouts to keep leadership aligned."
          />
          <div className="rounded-3xl border border-slate-200 bg-white/70 p-4 shadow-sm">
            <div className="flex items-center gap-2 text-slate-500">
              <DocumentTextIcon className="h-4 w-4" />
              <p className="text-xs font-semibold uppercase tracking-wide">Resources</p>
            </div>
            {documents.length ? (
              <ul className="mt-3 space-y-2 text-sm text-slate-600">
                {documents.map((document, index) => (
                  <li key={document.id ?? document.href ?? index} className="flex items-center gap-2">
                    <LinkIcon className="h-4 w-4 text-accent" />
                    {document.href ? (
                      <a
                        href={document.href}
                        target="_blank"
                        rel="noreferrer"
                        className="text-accent transition hover:text-accentDark"
                      >
                        {document.label ?? document.title ?? document.href}
                      </a>
                    ) : (
                      <span>{document.label ?? document.title}</span>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-xs text-slate-400">Attach links and shared folders to keep everyone aligned.</p>
            )}
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white/70 p-4 shadow-sm">
            <div className="flex items-center gap-2 text-slate-500">
              {momentumSummary?.change && momentumSummary.change < 0 ? (
                <ArrowTrendingDownIcon className="h-4 w-4 text-amber-500" />
              ) : (
                <ArrowTrendingUpIcon className="h-4 w-4 text-emerald-500" />
              )}
              <p className="text-xs font-semibold uppercase tracking-wide">Momentum</p>
            </div>
            {momentumSummary ? (
              <>
                {Number.isFinite(momentumSummary.progress) ? (
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>Progress</span>
                      <span>{momentumSummary.progress}%</span>
                    </div>
                    <div className="mt-1 h-2 rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-accent transition-all"
                        style={{ width: `${momentumSummary.progress}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <p className="mt-3 text-xs text-slate-400">Log progress signals to unlock momentum tracking.</p>
                )}
                {momentumSummary.pace ? (
                  <p className="mt-3 text-xs text-slate-500">{momentumSummary.pace}</p>
                ) : null}
                {typeof momentumSummary.change === 'number' ? (
                  <p className="mt-2 text-[11px] text-slate-400">
                    Change {momentumSummary.change >= 0 ? '+' : ''}
                    {momentumSummary.change} pts since last review.
                  </p>
                ) : null}
                {momentumSummary.slaLabel ? (
                  <p className="mt-2 text-[11px] text-amber-500">{momentumSummary.slaLabel}</p>
                ) : null}
              </>
            ) : (
              <p className="mt-3 text-xs text-slate-400">Momentum insights appear once metrics sync.</p>
            )}
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white/70 p-4 shadow-sm">
            <div className="flex items-center gap-2 text-slate-500">
              <SparklesIcon className="h-4 w-4" />
              <p className="text-xs font-semibold uppercase tracking-wide">Engagement pulse</p>
            </div>
            <dl className="mt-3 space-y-2 text-xs text-slate-500">
              <div className="flex items-center justify-between gap-3">
                <dt className="font-semibold text-slate-600">Stage</dt>
                <dd>{stage ?? 'Not set'}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="font-semibold text-slate-600">Priority</dt>
                <dd>{priority ?? 'Standard'}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="font-semibold text-slate-600">Deal value</dt>
                <dd>{formattedDealValue ?? '—'}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="font-semibold text-slate-600">Confidence</dt>
                <dd>{confidence ?? 'Calibrate with your team'}</dd>
              </div>
            </dl>
            {Number.isFinite(engagementScore) ? (
              <div className="mt-3">
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>Engagement</span>
                  <span>{engagementScore}/100</span>
                </div>
                <div className="mt-1 h-2 rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-accent transition-all"
                    style={{ width: `${engagementScore}%` }}
                  />
                </div>
              </div>
            ) : (
              <p className="mt-3 text-[11px] text-slate-400">Telemetry syncs will surface engagement once available.</p>
            )}
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white/70 p-4 shadow-sm">
            <div className="flex items-center gap-2 text-slate-500">
              <UserGroupIcon className="h-4 w-4" />
              <p className="text-xs font-semibold uppercase tracking-wide">Stakeholder map</p>
            </div>
            {stakeholders.length ? (
              <ul className="mt-3 space-y-2 text-sm text-slate-600">
                {stakeholders.map((stakeholder) => (
                  <li key={stakeholder.id} className="rounded-2xl border border-slate-100 bg-white/70 px-3 py-2">
                    <p className="font-semibold text-slate-900">{stakeholder.name}</p>
                    <p className="text-xs text-slate-500">
                      {stakeholder.role}
                      {stakeholder.organization ? ` · ${stakeholder.organization}` : ''}
                    </p>
                    {stakeholder.influence ? (
                      <p className="mt-1 text-[11px] uppercase tracking-wide text-slate-400">{stakeholder.influence}</p>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-xs text-slate-400">
                Invite decision makers and collaborators so the full team stays visible.
              </p>
            )}
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white/70 p-4 shadow-sm">
            <div className="flex items-center gap-2 text-slate-500">
              <CalendarDaysIcon className="h-4 w-4" />
              <p className="text-xs font-semibold uppercase tracking-wide">Conversation health</p>
            </div>
            <ul className="mt-3 space-y-2 text-xs text-slate-500">
              <li className="flex items-center gap-2">
                <ClockIcon className="h-3.5 w-3.5 text-emerald-500" />
                {thread?.metadata?.avgResponseMinutes
                  ? `Avg response ${Math.round(thread.metadata.avgResponseMinutes)} minutes`
                  : 'No response-time benchmarks yet'}
              </li>
              <li className="flex items-center gap-2">
                <BoltIcon className="h-3.5 w-3.5 text-amber-500" />
                {thread?.priority === 'high' || thread?.state === 'escalated'
                  ? 'Escalation active — keep leadership informed.'
                  : 'Tracking well — no escalations flagged.'}
              </li>
              <li className="flex items-center gap-2">
                <DocumentTextIcon className="h-3.5 w-3.5 text-slate-400" />
                {documents.length
                  ? `${documents.length} linked resources available.`
                  : 'Link critical docs to power future reviews.'}
              </li>
              <li className="flex items-center gap-2">
                <SparklesIcon className="h-3.5 w-3.5 text-sky-500" />
                {Number.isFinite(engagementScore)
                  ? `Engagement score ${engagementScore}/100`
                  : 'Engagement insights will appear after first responses.'}
              </li>
              <li className="flex items-center gap-2">
                <FlagIcon className="h-3.5 w-3.5 text-amber-500" />
                {confidence ? `Confidence ${confidence}` : 'Set confidence to guide forecasting.'}
              </li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}

ConversationView.propTypes = {
  actorId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  thread: PropTypes.object,
  messages: PropTypes.arrayOf(PropTypes.object),
  messagesLoading: PropTypes.bool,
  messagesError: PropTypes.string,
  hasMoreHistory: PropTypes.bool,
  onLoadOlder: PropTypes.func,
  typingParticipants: PropTypes.array,
  onStartCall: PropTypes.func,
  onJoinCall: PropTypes.func,
  onCloseCall: PropTypes.func,
  callSession: PropTypes.object,
  callLoading: PropTypes.bool,
  callError: PropTypes.string,
  composerValue: PropTypes.string,
  onComposerChange: PropTypes.func,
  onSendMessage: PropTypes.func,
  sending: PropTypes.bool,
  savedReplies: PropTypes.array,
  savedRepliesLoading: PropTypes.bool,
  onSavedReplyUsed: PropTypes.func,
};

ConversationView.defaultProps = {
  actorId: null,
  thread: null,
  messages: [],
  messagesLoading: false,
  messagesError: null,
  hasMoreHistory: false,
  onLoadOlder: () => {},
  typingParticipants: [],
  onStartCall: () => {},
  onJoinCall: () => {},
  onCloseCall: () => {},
  callSession: null,
  callLoading: false,
  callError: null,
  composerValue: '',
  onComposerChange: () => {},
  onSendMessage: () => Promise.resolve(),
  sending: false,
  savedReplies: [],
  savedRepliesLoading: false,
  onSavedReplyUsed: null,
};
