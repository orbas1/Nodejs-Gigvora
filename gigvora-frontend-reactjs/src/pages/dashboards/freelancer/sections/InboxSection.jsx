import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AdjustmentsHorizontalIcon,
  ArrowPathIcon,
  BoltIcon,
  ChatBubbleLeftRightIcon,
  Cog6ToothIcon,
  EnvelopeOpenIcon,
  InboxIcon,
  InboxStackIcon,
  PaperAirplaneIcon,
  PencilSquareIcon,
  PlusIcon,
  ShieldCheckIcon,
  SparklesIcon,
  TrashIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import SectionShell from '../SectionShell.jsx';
import useSession from '../../../../hooks/useSession.js';
import useFreelancerInboxWorkspace from '../../../../hooks/useFreelancerInboxWorkspace.js';
import { resolveActorId } from '../../../../utils/session.js';
import { canAccessMessaging, getMessagingMemberships } from '../../../../constants/access.js';
import { classNames } from '../../../../utils/classNames.js';
import {
  createThread,
  sendMessage,
  markThreadRead,
  updateSupportStatus,
} from '../../../../services/messaging.js';

const DAY_KEYS = [
  { key: 'monday', label: 'Mon' },
  { key: 'tuesday', label: 'Tue' },
  { key: 'wednesday', label: 'Wed' },
  { key: 'thursday', label: 'Thu' },
  { key: 'friday', label: 'Fri' },
  { key: 'saturday', label: 'Sat' },
  { key: 'sunday', label: 'Sun' },
];

function formatRelativeTime(value) {
  if (!value) {
    return '—';
  }
  try {
    const date = value instanceof Date ? value : new Date(value);
    const diff = date.getTime() - Date.now();
    const absMinutes = Math.round(Math.abs(diff) / (1000 * 60));
    const formatter = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });
    if (absMinutes < 60) {
      return formatter.format(Math.round(diff / (1000 * 60)), 'minute');
    }
    const absHours = Math.round(Math.abs(diff) / (1000 * 60 * 60));
    if (absHours < 48) {
      return formatter.format(Math.round(diff / (1000 * 60 * 60)), 'hour');
    }
    const absDays = Math.round(Math.abs(diff) / (1000 * 60 * 60 * 24));
    return formatter.format(Math.round(diff / (1000 * 60 * 60 * 24)), 'day');
  } catch (error) {
    return `${value}`;
  }
}

function SummaryMetric({ icon: Icon, label, value, hint, accent = 'accent' }) {
  return (
    <div className="flex items-center gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div
        className={classNames(
          'flex h-12 w-12 items-center justify-center rounded-2xl text-white',
          accent === 'emerald'
            ? 'bg-emerald-500'
            : accent === 'amber'
            ? 'bg-amber-500'
            : accent === 'sky'
            ? 'bg-sky-500'
            : 'bg-accent',
        )}
      >
        <Icon className="h-6 w-6" />
      </div>
      <div>
        <p className="text-sm font-semibold text-slate-900">{label}</p>
        <p className="mt-1 text-2xl font-semibold text-slate-900">{value}</p>
        {hint ? <p className="text-xs text-slate-500">{hint}</p> : null}
      </div>
    </div>
  );
}

function ActiveThreadCard({ thread, onMarkRead, onView }) {
  const support = thread.supportCase;
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">{thread.subject || 'Untitled conversation'}</p>
          <p className="mt-1 text-xs text-slate-500">{thread.channelType}</p>
        </div>
        {thread.unread ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-700">
            New
          </span>
        ) : null}
      </div>
      <p className="mt-3 text-sm text-slate-600 line-clamp-2">{thread.lastMessagePreview ?? 'Stay aligned with stakeholders and collaborators.'}</p>
      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-500">
        {thread.participants.slice(0, 3).map((participant) => (
          <span key={participant.participantId} className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5">
            <UserGroupIcon className="h-3.5 w-3.5" />
            {participant.name || participant.email || 'Participant'}
          </span>
        ))}
        {thread.participants.length > 3 ? (
          <span className="rounded-full bg-slate-100 px-2 py-0.5">+{thread.participants.length - 3}</span>
        ) : null}
        <span className="ml-auto">{formatRelativeTime(thread.lastMessageAt)}</span>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onView?.(thread)}
          className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-accent/60 hover:text-accent"
        >
          Open thread
        </button>
        <button
          type="button"
          onClick={() => onMarkRead?.(thread)}
          className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600 transition hover:border-emerald-300"
        >
          Mark read
        </button>
        {support ? (
          <span className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-blue-600">
            Support · {support.status}
          </span>
        ) : null}
      </div>
    </div>
  );
}

function SavedReplyForm({ initialValue, onCancel, onSave, saving }) {
  const [title, setTitle] = useState(initialValue?.title ?? '');
  const [body, setBody] = useState(initialValue?.body ?? '');
  const [shortcut, setShortcut] = useState(initialValue?.shortcut ?? '');
  const [category, setCategory] = useState(initialValue?.category ?? '');
  const [isDefault, setIsDefault] = useState(Boolean(initialValue?.isDefault ?? false));

  const handleSubmit = (event) => {
    event.preventDefault();
    onSave?.({ title, body, shortcut, category, isDefault });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
          Title
          <input
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            required
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
        </label>
        <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
          Shortcut
          <input
            type="text"
            value={shortcut}
            onChange={(event) => setShortcut(event.target.value)}
            placeholder="e.g. intro"
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
        </label>
      </div>
      <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
        Message body
        <textarea
          rows={4}
          required
          value={body}
          onChange={(event) => setBody(event.target.value)}
          className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
        />
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
          Category
          <input
            type="text"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            placeholder="Follow up, onboarding, support"
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
        </label>
        <label className="mt-5 inline-flex items-center gap-2 text-xs font-semibold text-slate-600">
          <input
            type="checkbox"
            checked={isDefault}
            onChange={(event) => setIsDefault(event.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-accent focus:ring-accent"
          />
          Set as default reply
        </label>
      </div>
      <div className="flex flex-wrap gap-2 pt-2">
        <button
          type="submit"
          disabled={saving}
          className={classNames(
            'inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white shadow-soft transition',
            saving ? 'opacity-60' : 'hover:bg-accentDark',
          )}
        >
          <SparklesIcon className="h-4 w-4" /> Save reply
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-accent/60 hover:text-accent"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

function RoutingRuleForm({ initialValue, onCancel, onSave, saving }) {
  const [name, setName] = useState(initialValue?.name ?? '');
  const [matchType, setMatchType] = useState(initialValue?.matchType ?? 'keyword');
  const [keywords, setKeywords] = useState(() => {
    if (initialValue?.criteria?.keywords) {
      return initialValue.criteria.keywords.join(', ');
    }
    return '';
  });
  const [priority, setPriority] = useState(initialValue?.priority ?? 0);
  const [enabled, setEnabled] = useState(initialValue?.enabled ?? true);
  const [escalate, setEscalate] = useState(Boolean(initialValue?.action?.escalate));

  const handleSubmit = (event) => {
    event.preventDefault();
    const criteria = {};
    if (matchType === 'keyword') {
      criteria.keywords = keywords
        .split(',')
        .map((entry) => entry.trim())
        .filter(Boolean);
    }
    const action = { escalate };
    onSave?.({ name, matchType, priority, enabled, criteria, action });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
          Rule name
          <input
            type="text"
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
        </label>
        <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
          Match type
          <select
            value={matchType}
            onChange={(event) => setMatchType(event.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          >
            <option value="keyword">Keywords</option>
            <option value="channel">Channel</option>
            <option value="priority">Priority</option>
            <option value="support">Support queue</option>
            <option value="custom">Custom</option>
          </select>
        </label>
      </div>
      {matchType === 'keyword' ? (
        <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
          Keywords (comma separated)
          <input
            type="text"
            value={keywords}
            onChange={(event) => setKeywords(event.target.value)}
            placeholder="urgent, escalation, contract"
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
        </label>
      ) : null}
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
          Priority
          <input
            type="number"
            value={priority}
            onChange={(event) => setPriority(Number(event.target.value))}
            min={0}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
        </label>
        <div className="flex flex-col gap-3 pt-4 text-xs font-semibold text-slate-600">
          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(event) => setEnabled(event.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-accent focus:ring-accent"
            />
            Rule enabled
          </label>
          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              checked={escalate}
              onChange={(event) => setEscalate(event.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-accent focus:ring-accent"
            />
            Escalate to support team
          </label>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 pt-2">
        <button
          type="submit"
          disabled={saving}
          className={classNames(
            'inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white shadow-soft transition',
            saving ? 'opacity-60' : 'hover:bg-accentDark',
          )}
        >
          <BoltIcon className="h-4 w-4" /> Save rule
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-accent/60 hover:text-accent"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

export default function InboxSection() {
  const { session } = useSession();
  const actorId = resolveActorId(session);
  const hasMessagingAccess = canAccessMessaging(session);
  const memberships = useMemo(() => getMessagingMemberships(session), [session]);
  const {
    workspace,
    loading,
    error,
    refresh,
    updatePreferences,
    addSavedReply,
    editSavedReply,
    removeSavedReply,
    addRoutingRule,
    editRoutingRule,
    removeRoutingRule,
  } = useFreelancerInboxWorkspace({ userId: actorId, enabled: hasMessagingAccess });

  const [creatingReply, setCreatingReply] = useState(false);
  const [editingReplyId, setEditingReplyId] = useState(null);
  const [creatingRule, setCreatingRule] = useState(false);
  const [editingRuleId, setEditingRuleId] = useState(null);
  const [preferencesSaving, setPreferencesSaving] = useState(false);
  const [preferencesState, setPreferencesState] = useState(() => workspace.preferences);
  const [composerSubject, setComposerSubject] = useState('');
  const [composerParticipants, setComposerParticipants] = useState([]);
  const [composerBody, setComposerBody] = useState('');
  const [composerSaving, setComposerSaving] = useState(false);
  const [supportUpdating, setSupportUpdating] = useState(null);

  useEffect(() => {
    setPreferencesState(
      workspace.preferences ? JSON.parse(JSON.stringify(workspace.preferences)) : workspace.preferences,
    );
  }, [workspace.preferences]);

  const participantOptions = useMemo(() => workspace.participantDirectory ?? [], [workspace.participantDirectory]);

  const summary = workspace.summary ?? {};
  const workingHours = preferencesState?.workingHours ?? workspace.preferences?.workingHours;

  const handleRefresh = useCallback(() => {
    refresh({ force: true });
  }, [refresh]);

  const handleSavePreferences = useCallback(
    async (event) => {
      event.preventDefault();
      if (!actorId) return;
      setPreferencesSaving(true);
      try {
        await updatePreferences({
          timezone: preferencesState?.timezone,
          notificationsEmail: preferencesState?.notificationsEmail,
          notificationsPush: preferencesState?.notificationsPush,
          autoArchiveAfterDays: preferencesState?.autoArchiveAfterDays,
          autoResponderEnabled: preferencesState?.autoResponderEnabled,
          autoResponderMessage: preferencesState?.autoResponderMessage,
          escalationKeywords: preferencesState?.escalationKeywords ?? [],
          workingHours,
        });
      } finally {
        setPreferencesSaving(false);
      }
    },
    [actorId, preferencesState, updatePreferences, workingHours],
  );

  const handleCreateThread = useCallback(
    async (event) => {
      event.preventDefault();
      if (!actorId || !composerSubject.trim() || composerParticipants.length === 0) {
        return;
      }
      setComposerSaving(true);
      try {
        const participantIds = composerParticipants.map((value) => Number(value)).filter((value) => Number.isFinite(value));
        const thread = await createThread({
          userId: actorId,
          subject: composerSubject.trim(),
          channelType: 'direct',
          participantIds,
        });
        if (composerBody.trim()) {
          await sendMessage(thread.id, {
            userId: actorId,
            body: composerBody.trim(),
          });
        }
        setComposerSubject('');
        setComposerBody('');
        setComposerParticipants([]);
        await refresh({ force: true });
      } finally {
        setComposerSaving(false);
      }
    },
    [actorId, composerBody, composerParticipants, composerSubject, refresh],
  );

  const handleMarkRead = useCallback(
    async (thread) => {
      if (!actorId || !thread?.id) {
        return;
      }
      await markThreadRead(thread.id, { userId: actorId });
      await refresh({ force: true });
    },
    [actorId, refresh],
  );

  const handleUpdateSupportStatus = useCallback(
    async (threadId, status) => {
      if (!actorId || !threadId || !status) return;
      setSupportUpdating(threadId);
      try {
        await updateSupportStatus(threadId, { userId: actorId, status });
        await refresh({ force: true });
      } finally {
        setSupportUpdating(null);
      }
    },
    [actorId, refresh],
  );

  if (!hasMessagingAccess) {
    return (
      <SectionShell
        id="inbox"
        title="Inbox workspace"
        description="Messaging is not yet enabled for your workspace. Update your memberships to unlock enterprise communications."
        actions={
          <Link
            to="/settings"
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-accent/60 hover:text-accent"
          >
            <Cog6ToothIcon className="h-4 w-4" /> Manage memberships
          </Link>
        }
      >
        <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-8 text-sm text-slate-600">
          <p className="font-semibold text-slate-900">Messaging memberships required</p>
          <p className="mt-2">Activate one of the following roles to unlock the full inbox experience:</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {memberships.length ? (
              memberships.map((membership) => (
                <span key={membership} className="rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">
                  {membership}
                </span>
              ))
            ) : (
              <span className="text-xs text-slate-500">Contact your workspace owner to enable messaging roles.</span>
            )}
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to="/feed"
              className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-accentDark"
            >
              Back to feed
            </Link>
            <a
              href="mailto:support@gigvora.com"
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-accent/60 hover:text-accent"
            >
              Contact support
            </a>
          </div>
        </div>
      </SectionShell>
    );
  }

  return (
    <SectionShell
      id="inbox"
      title="Inbox workspace"
      description="Compose conversations, orchestrate routing rules, and keep support cases on track without leaving the freelancer dashboard."
      actions={
        <button
          type="button"
          onClick={handleRefresh}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-accent/60 hover:text-accent"
        >
          <ArrowPathIcon className={classNames('h-4 w-4', loading ? 'animate-spin' : '')} /> Sync inbox
        </button>
      }
    >
      {error ? (
        <p className="rounded-3xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600" role="alert">
          {error.message || 'Unable to load inbox workspace.'}
        </p>
      ) : null}
      <div className="grid gap-4 lg:grid-cols-4">
        <SummaryMetric
          icon={EnvelopeOpenIcon}
          label="Unread threads"
          value={summary.unreadThreads ?? 0}
          hint="Messages awaiting your response"
        />
        <SummaryMetric
          icon={PaperAirplaneIcon}
          label="Awaiting reply"
          value={summary.awaitingReply ?? 0}
          hint="Conversations paused on you"
          accent="emerald"
        />
        <SummaryMetric
          icon={BoltIcon}
          label="Avg. response"
          value={summary.avgResponseMinutes != null ? `${summary.avgResponseMinutes}m` : '—'}
          hint="Last 48 hours"
          accent="amber"
        />
        <SummaryMetric
          icon={ShieldCheckIcon}
          label="Open support"
          value={summary.openSupportCases ?? 0}
          hint="Cases awaiting resolution"
          accent="sky"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_minmax(0,1fr)]">
        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900">Active threads</p>
                <p className="text-xs text-slate-500">Your most recent conversations across gigs and support queues.</p>
              </div>
              <Link
                to="/inbox"
                className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-xs font-semibold text-white shadow-soft transition hover:bg-accentDark"
              >
                <InboxStackIcon className="h-4 w-4" /> Open inbox
              </Link>
            </div>
            <div className="mt-4 space-y-4">
              {workspace.activeThreads?.length ? (
                workspace.activeThreads.map((thread) => (
                  <ActiveThreadCard
                    key={thread.id}
                    thread={thread}
                    onMarkRead={handleMarkRead}
                    onView={(target) => window.open(`/inbox?thread=${target.id}`, '_blank')}
                  />
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
                  No active conversations yet. Start a new message to keep clients and collaborators in sync.
                </div>
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
            <p className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <ChatBubbleLeftRightIcon className="h-5 w-5 text-accent" /> Compose new conversation
            </p>
            <p className="mt-2 text-xs text-slate-500">Start a workspace thread and optionally send your first update instantly.</p>
            <form onSubmit={handleCreateThread} className="mt-4 space-y-3">
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Subject
                <input
                  type="text"
                  value={composerSubject}
                  onChange={(event) => setComposerSubject(event.target.value)}
                  placeholder="Kickoff agenda, weekly sync, contract revision…"
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                  required
                />
              </label>
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Participants
                <select
                  multiple
                  value={composerParticipants}
                  onChange={(event) => {
                    const options = Array.from(event.target.selectedOptions).map((option) => option.value);
                    setComposerParticipants(options);
                  }}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                  required
                >
                  {participantOptions.length ? (
                    participantOptions.map((participant) => (
                      <option key={participant.id} value={participant.id}>
                        {participant.name || participant.email || `Participant ${participant.id}`}
                      </option>
                    ))
                  ) : (
                    <option value="">Invite participants from the inbox first</option>
                  )}
                </select>
              </label>
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Message (optional)
                <textarea
                  rows={4}
                  value={composerBody}
                  onChange={(event) => setComposerBody(event.target.value)}
                  placeholder="Share context, attach next steps, or note expected outcomes."
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                />
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="submit"
                  disabled={composerSaving || composerParticipants.length === 0 || !composerSubject.trim()}
                  className={classNames(
                    'inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white shadow-soft transition',
                    composerSaving ? 'opacity-60' : 'hover:bg-accentDark',
                  )}
                >
                  <PlusIcon className="h-4 w-4" /> Launch thread
                </button>
                <Link
                  to="/inbox"
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-accent/60 hover:text-accent"
                >
                  Go to full inbox
                </Link>
              </div>
            </form>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-900">Saved replies</p>
              <button
                type="button"
                onClick={() => {
                  setEditingReplyId(null);
                  setCreatingReply((value) => !value);
                }}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-accent/60 hover:text-accent"
              >
                <PencilSquareIcon className="h-4 w-4" /> {creatingReply ? 'Close' : 'New reply'}
              </button>
            </div>
            <p className="mt-2 text-xs text-slate-500">Codify high-signal responses for proposals, onboarding, and client check-ins.</p>
            {creatingReply ? (
              <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <SavedReplyForm
                  saving={false}
                  onCancel={() => setCreatingReply(false)}
                  onSave={async (payload) => {
                    await addSavedReply(payload);
                    setCreatingReply(false);
                  }}
                />
              </div>
            ) : null}
            <div className="mt-4 space-y-3">
              {workspace.savedReplies?.length ? (
                workspace.savedReplies.map((reply) => (
                  <div key={reply.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{reply.title}</p>
                        <p className="mt-1 text-xs text-slate-500">{reply.category || 'General'}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setCreatingReply(false);
                            setEditingReplyId(reply.id);
                          }}
                          className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500 transition hover:border-accent/60 hover:text-accent"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            await removeSavedReply(reply.id);
                          }}
                          className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-rose-600 transition hover:border-rose-300"
                        >
                          <TrashIcon className="h-3.5 w-3.5" /> Delete
                        </button>
                      </div>
                    </div>
                    <p className="mt-3 text-sm text-slate-600 whitespace-pre-line">{reply.body}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      {reply.shortcut ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5">/{reply.shortcut}</span>
                      ) : null}
                      {reply.isDefault ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-emerald-700">
                          <SparklesIcon className="h-3.5 w-3.5" /> Default
                        </span>
                      ) : null}
                    </div>
                    {editingReplyId === reply.id ? (
                      <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <SavedReplyForm
                          initialValue={reply}
                          saving={false}
                          onCancel={() => setEditingReplyId(null)}
                          onSave={async (payload) => {
                            await editSavedReply(reply.id, payload);
                            setEditingReplyId(null);
                          }}
                        />
                      </div>
                    ) : null}
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
                  No saved replies yet. Capture your best responses to reuse during busy weeks.
                </div>
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-900">Routing rules</p>
              <button
                type="button"
                onClick={() => {
                  setEditingRuleId(null);
                  setCreatingRule((value) => !value);
                }}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-accent/60 hover:text-accent"
              >
                <AdjustmentsHorizontalIcon className="h-4 w-4" /> {creatingRule ? 'Close' : 'New rule'}
              </button>
            </div>
            <p className="mt-2 text-xs text-slate-500">Automate hand-offs, escalations, and smart tagging when new messages arrive.</p>
            {creatingRule ? (
              <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <RoutingRuleForm
                  saving={false}
                  onCancel={() => setCreatingRule(false)}
                  onSave={async (payload) => {
                    await addRoutingRule(payload);
                    setCreatingRule(false);
                  }}
                />
              </div>
            ) : null}
            <div className="mt-4 space-y-3">
              {workspace.routingRules?.length ? (
                workspace.routingRules.map((rule) => (
                  <div key={rule.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{rule.name}</p>
                        <p className="mt-1 text-xs text-slate-500">{rule.matchType} · Priority {rule.priority}</p>
                      </div>
                      <div className="flex gap-2">
                        <span
                          className={classNames(
                            'inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide',
                            rule.enabled ? 'border border-emerald-200 bg-emerald-50 text-emerald-600' : 'border border-slate-200 bg-slate-50 text-slate-500',
                          )}
                        >
                          {rule.enabled ? 'Enabled' : 'Disabled'}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setCreatingRule(false);
                            setEditingRuleId(rule.id);
                          }}
                          className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500 transition hover:border-accent/60 hover:text-accent"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            await removeRoutingRule(rule.id);
                          }}
                          className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-rose-600 transition hover:border-rose-300"
                        >
                          <TrashIcon className="h-3.5 w-3.5" /> Remove
                        </button>
                      </div>
                    </div>
                    {rule.criteria?.keywords?.length ? (
                      <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
                        {rule.criteria.keywords.map((keyword) => (
                          <span key={keyword} className="rounded-full bg-slate-100 px-2 py-0.5">{keyword}</span>
                        ))}
                      </div>
                    ) : null}
                    {editingRuleId === rule.id ? (
                      <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <RoutingRuleForm
                          initialValue={rule}
                          saving={false}
                          onCancel={() => setEditingRuleId(null)}
                          onSave={async (payload) => {
                            await editRoutingRule(rule.id, payload);
                            setEditingRuleId(null);
                          }}
                        />
                      </div>
                    ) : null}
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
                  No routing rules configured yet. Automate triage by adding keyword triggers or channel filters.
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
            <p className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <Cog6ToothIcon className="h-5 w-5 text-accent" /> Messaging preferences
            </p>
            <p className="mt-2 text-xs text-slate-500">Personalise notifications, availability, and automatic replies.</p>
            <form className="mt-4 space-y-4" onSubmit={handleSavePreferences}>
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Timezone
                <input
                  type="text"
                  value={preferencesState?.timezone ?? ''}
                  onChange={(event) =>
                    setPreferencesState((prev) => ({ ...prev, timezone: event.target.value }))
                  }
                  placeholder="e.g. Europe/London"
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                />
              </label>
              <div className="flex flex-col gap-2 text-xs font-semibold text-slate-600">
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={preferencesState?.notificationsEmail ?? true}
                    onChange={(event) =>
                      setPreferencesState((prev) => ({ ...prev, notificationsEmail: event.target.checked }))
                    }
                    className="h-4 w-4 rounded border-slate-300 text-accent focus:ring-accent"
                  />
                  Email notifications
                </label>
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={preferencesState?.notificationsPush ?? true}
                    onChange={(event) =>
                      setPreferencesState((prev) => ({ ...prev, notificationsPush: event.target.checked }))
                    }
                    className="h-4 w-4 rounded border-slate-300 text-accent focus:ring-accent"
                  />
                  Push notifications
                </label>
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={preferencesState?.autoResponderEnabled ?? false}
                    onChange={(event) =>
                      setPreferencesState((prev) => ({ ...prev, autoResponderEnabled: event.target.checked }))
                    }
                    className="h-4 w-4 rounded border-slate-300 text-accent focus:ring-accent"
                  />
                  Enable auto-responder when away
                </label>
              </div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Auto-responder message
                <textarea
                  rows={3}
                  value={preferencesState?.autoResponderMessage ?? ''}
                  onChange={(event) =>
                    setPreferencesState((prev) => ({ ...prev, autoResponderMessage: event.target.value }))
                  }
                  placeholder="Thanks for reaching out! I'm currently heads down and will respond within the next business day."
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                />
              </label>
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Auto-archive after (days)
                <input
                  type="number"
                  min={0}
                  value={preferencesState?.autoArchiveAfterDays ?? ''}
                  onChange={(event) =>
                    setPreferencesState((prev) => ({
                      ...prev,
                      autoArchiveAfterDays: event.target.value === '' ? null : Number(event.target.value),
                    }))
                  }
                  placeholder="Leave blank to disable"
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                />
              </label>
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Working hours</p>
                <div className="grid gap-2">
                  {DAY_KEYS.map((day) => {
                    const slot = workingHours?.availability?.[day.key] ?? { active: false, start: '09:00', end: '17:00' };
                    return (
                      <div key={day.key} className="flex items-center gap-3 text-xs text-slate-600">
                        <label className="inline-flex items-center gap-2 w-16">
                          <input
                            type="checkbox"
                            checked={slot.active}
                            onChange={(event) =>
                              setPreferencesState((prev) => ({
                                ...prev,
                                workingHours: {
                                  ...(prev?.workingHours ?? {}),
                                  availability: {
                                    ...(prev?.workingHours?.availability ?? {}),
                                    [day.key]: {
                                      ...slot,
                                      active: event.target.checked,
                                    },
                                  },
                                },
                              }))
                            }
                            className="h-4 w-4 rounded border-slate-300 text-accent focus:ring-accent"
                          />
                          {day.label}
                        </label>
                        <input
                          type="time"
                          value={slot.start}
                          onChange={(event) =>
                            setPreferencesState((prev) => ({
                              ...prev,
                              workingHours: {
                                ...(prev?.workingHours ?? {}),
                                availability: {
                                  ...(prev?.workingHours?.availability ?? {}),
                                  [day.key]: {
                                    ...slot,
                                    start: event.target.value,
                                  },
                                },
                              },
                            }))
                          }
                          className="w-28 rounded-xl border border-slate-200 px-3 py-1 text-xs focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                        />
                        <span className="text-slate-400">to</span>
                        <input
                          type="time"
                          value={slot.end}
                          onChange={(event) =>
                            setPreferencesState((prev) => ({
                              ...prev,
                              workingHours: {
                                ...(prev?.workingHours ?? {}),
                                availability: {
                                  ...(prev?.workingHours?.availability ?? {}),
                                  [day.key]: {
                                    ...slot,
                                    end: event.target.value,
                                  },
                                },
                              },
                            }))
                          }
                          className="w-28 rounded-xl border border-slate-200 px-3 py-1 text-xs focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="flex flex-wrap gap-2 pt-2">
                <button
                  type="submit"
                  disabled={preferencesSaving}
                  className={classNames(
                    'inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white shadow-soft transition',
                    preferencesSaving ? 'opacity-60' : 'hover:bg-accentDark',
                  )}
                >
                  <ShieldCheckIcon className="h-4 w-4" /> Save preferences
                </button>
                <button
                  type="button"
                  onClick={handleRefresh}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-accent/60 hover:text-accent"
                >
                  Refresh
                </button>
              </div>
            </form>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
            <p className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <InboxIcon className="h-5 w-5 text-accent" /> Support cases
            </p>
            <p className="mt-2 text-xs text-slate-500">Track escalations and progress them through resolution workflows.</p>
            <div className="mt-4 space-y-3">
              {workspace.supportCases?.length ? (
                workspace.supportCases.map((supportCase) => (
                  <div key={supportCase.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                    <p className="text-sm font-semibold text-slate-900">{supportCase.thread?.subject ?? 'Support case'}</p>
                    <p className="mt-1 text-xs text-slate-500">Priority: {supportCase.priority}</p>
                    <p className="mt-2 text-xs text-slate-500">
                      Last activity {formatRelativeTime(supportCase.updatedAt)}
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <select
                        value={supportCase.status}
                        onChange={(event) => handleUpdateSupportStatus(supportCase.threadId, event.target.value)}
                        className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                        disabled={supportUpdating === supportCase.threadId}
                      >
                        <option value="triage">Triage</option>
                        <option value="in_progress">In progress</option>
                        <option value="waiting_on_customer">Waiting on customer</option>
                        <option value="resolved">Resolved</option>
                        <option value="closed">Closed</option>
                      </select>
                      <Link
                        to={`/inbox?thread=${supportCase.threadId}`}
                        className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500 transition hover:border-accent/60 hover:text-accent"
                      >
                        View conversation
                      </Link>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
                  No escalations in flight. Routing rules can automatically escalate when keywords or SLAs require attention.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </SectionShell>
  );
}
