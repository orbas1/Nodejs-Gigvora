import { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import clsx from 'clsx';
import {
  ArrowDownTrayIcon,
  ArrowUturnLeftIcon,
  CheckCircleIcon,
  EnvelopeIcon,
  ExclamationTriangleIcon,
  PaperAirplaneIcon,
  UserMinusIcon,
  UserPlusIcon,
} from '@heroicons/react/24/outline';
import UserAvatar from '../UserAvatar.jsx';

const invitationShape = PropTypes.shape({
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  name: PropTypes.string.isRequired,
  headline: PropTypes.string,
  location: PropTypes.string,
  mutualConnections: PropTypes.number,
  invitedBy: PropTypes.string,
  note: PropTypes.string,
  persona: PropTypes.string,
  sentAt: PropTypes.string,
  industries: PropTypes.arrayOf(PropTypes.string),
  focusAreas: PropTypes.arrayOf(PropTypes.string),
});

function formatTimeAgo(timestamp) {
  if (!timestamp) {
    return 'Moments ago';
  }
  try {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now.getTime() - time.getTime();
    const diffMinutes = Math.max(Math.floor(diffMs / (1000 * 60)), 0);
    if (diffMinutes < 1) {
      return 'Moments ago';
    }
    if (diffMinutes < 60) {
      return `${diffMinutes} min ago`;
    }
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) {
      return `${diffHours} hr ago`;
    }
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) {
      return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
    }
    const diffWeeks = Math.floor(diffDays / 7);
    return `${diffWeeks} wk${diffWeeks === 1 ? '' : 's'} ago`;
  } catch (error) {
    return 'Recently';
  }
}

function InvitationCard({
  tab,
  invitation,
  isSelected,
  onToggleSelect,
  onPrimary,
  onSecondary,
  loading,
  note,
  onNoteChange,
}) {
  const personaLabel = invitation.persona ?? 'Member';
  const industries = invitation.industries ?? invitation.focusAreas ?? [];
  const primaryLabel =
    tab === 'incoming' ? 'Accept' : tab === 'suggestions' ? 'Send invite' : 'Withdraw';
  const secondaryLabel =
    tab === 'incoming' ? 'Decline' : tab === 'suggestions' ? 'Skip' : 'Remind me later';

  const handlePrimary = () => {
    const payload = tab === 'outgoing' ? { note, withdraw: true } : { note };
    onPrimary?.(invitation, payload);
  };

  const handleSecondary = () => {
    const payload = tab === 'outgoing' ? { note, withdraw: false } : { note };
    onSecondary?.(invitation, payload);
  };

  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft transition hover:-translate-y-0.5 hover:shadow-xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-500">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-slate-300 text-accent focus:ring-accent"
            checked={isSelected}
            onChange={() => onToggleSelect?.(invitation)}
          />
          Select
        </label>
        <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
          <UserPlusIcon className="h-4 w-4 text-accent" aria-hidden="true" />
          {personaLabel}
        </span>
      </div>

      <div className="mt-4 flex items-center gap-4">
        <UserAvatar name={invitation.name} seed={invitation.id ?? invitation.name} size="lg" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold text-slate-900">{invitation.name}</h3>
            {invitation.mutualConnections ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-600">
                <CheckCircleIcon className="h-3.5 w-3.5" aria-hidden="true" />
                {invitation.mutualConnections} mutual
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-sm text-slate-600">{invitation.headline ?? 'Building the future together'}</p>
          <p className="mt-1 text-xs text-slate-500">{invitation.location ?? 'Global'}</p>
          <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-slate-500">
            {industries.map((industry) => (
              <span
                key={industry}
                className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-2.5 py-1"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden="true" />
                {industry}
              </span>
            ))}
          </div>
        </div>
        <div className="text-right text-xs text-slate-400">
          <p>{formatTimeAgo(invitation.sentAt)}</p>
          {invitation.invitedBy ? <p className="mt-1">Invited by {invitation.invitedBy}</p> : null}
        </div>
      </div>

      {tab !== 'suggestions' ? (
        <p className="mt-4 rounded-2xl bg-slate-50 p-3 text-sm text-slate-600">
          {invitation.note ?? 'Add a personal note to accelerate the conversation.'}
        </p>
      ) : null}

      <div className="mt-4 space-y-3 text-xs">
        <label className="block text-[11px] font-semibold uppercase tracking-wide text-slate-400">
          Include a context note
          <textarea
            rows={2}
            className="mt-2 w-full resize-none rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            value={note}
            onChange={(event) => onNoteChange?.(invitation, event.target.value)}
            placeholder={
              tab === 'suggestions'
                ? 'Share how you met or why collaborating matters.'
                : 'Thank them for reaching out or set expectations.'
            }
          />
        </label>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={loading}
          onClick={handlePrimary}
          className={clsx(
            'inline-flex items-center gap-2 rounded-full px-5 py-2 text-xs font-semibold transition focus:outline-none focus:ring-2 focus:ring-offset-2',
            loading
              ? 'cursor-not-allowed border border-slate-200 bg-slate-100 text-slate-400'
              : tab === 'incoming'
              ? 'border border-emerald-500 bg-emerald-500 text-white hover:bg-emerald-600 focus:ring-emerald-300'
              : 'border border-accent text-accent hover:bg-accentSoft focus:ring-accent/40',
          )}
        >
          {primaryLabel}
          {loading ? '…' : null}
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={handleSecondary}
          className={clsx(
            'inline-flex items-center gap-2 rounded-full border px-5 py-2 text-xs font-semibold transition focus:outline-none focus:ring-2 focus:ring-offset-2',
            loading
              ? 'cursor-not-allowed border-slate-200 text-slate-400'
              : 'border-slate-200 text-slate-500 hover:border-rose-200 hover:text-rose-500 focus:ring-rose-200',
          )}
        >
          {secondaryLabel}
        </button>
      </div>
    </article>
  );
}

InvitationCard.propTypes = {
  tab: PropTypes.oneOf(['incoming', 'outgoing', 'suggestions']).isRequired,
  invitation: invitationShape.isRequired,
  isSelected: PropTypes.bool,
  onToggleSelect: PropTypes.func,
  onPrimary: PropTypes.func,
  onSecondary: PropTypes.func,
  loading: PropTypes.bool,
  note: PropTypes.string,
  onNoteChange: PropTypes.func,
};

InvitationCard.defaultProps = {
  isSelected: false,
  onToggleSelect: undefined,
  onPrimary: undefined,
  onSecondary: undefined,
  loading: false,
  note: '',
  onNoteChange: undefined,
};

export default function InvitationManager({
  incoming,
  outgoing,
  suggested,
  onAccept,
  onDecline,
  onRescind,
  onSend,
  analytics,
  className,
}) {
  const [activeTab, setActiveTab] = useState(incoming.length ? 'incoming' : 'suggestions');
  const [selected, setSelected] = useState({ incoming: new Set(), outgoing: new Set(), suggestions: new Set() });
  const [noteDrafts, setNoteDrafts] = useState({});
  const [loadingKeys, setLoadingKeys] = useState(new Set());

  const acceptanceDisplay = useMemo(() => {
    if (!analytics) {
      return '—';
    }
    if (typeof analytics.acceptanceRate === 'number') {
      return `${analytics.acceptanceRate}%`;
    }
    if (analytics.acceptanceRate) {
      return analytics.acceptanceRate;
    }
    return '—';
  }, [analytics]);

  const tabConfig = useMemo(
    () => [
      {
        id: 'incoming',
        label: `Received (${incoming.length})`,
        description: 'Warm intros and invites waiting for your response.',
        dataset: incoming,
        icon: EnvelopeIcon,
      },
      {
        id: 'outgoing',
        label: `Sent (${outgoing.length})`,
        description: 'Track follow-ups on invitations you initiated.',
        dataset: outgoing,
        icon: ArrowUturnLeftIcon,
      },
      {
        id: 'suggestions',
        label: `Suggestions (${suggested.length})`,
        description: 'Smart matches curated from your extended network.',
        dataset: suggested,
        icon: UserPlusIcon,
      },
    ],
    [incoming, outgoing, suggested],
  );

  const totals = useMemo(() => ({
    pending: incoming.length,
    sent: outgoing.length,
    recommended: suggested.length,
  }), [incoming.length, outgoing.length, suggested.length]);

  const toggleSelect = (tabId, invitation) => {
    setSelected((previous) => {
      const copy = new Map([
        ['incoming', new Set(previous.incoming)],
        ['outgoing', new Set(previous.outgoing)],
        ['suggestions', new Set(previous.suggestions)],
      ]);
      const current = copy.get(tabId);
      const key = invitation.id;
      if (current.has(key)) {
        current.delete(key);
      } else {
        current.add(key);
      }
      return {
        incoming: copy.get('incoming'),
        outgoing: copy.get('outgoing'),
        suggestions: copy.get('suggestions'),
      };
    });
  };

  const setNote = (invitation, value) => {
    setNoteDrafts((previous) => ({ ...previous, [invitation.id]: value }));
  };

  const withLoading = async (key, action) => {
    setLoadingKeys((previous) => new Set(previous).add(key));
    try {
      await action();
    } finally {
      setLoadingKeys((previous) => {
        const next = new Set(previous);
        next.delete(key);
        return next;
      });
    }
  };

  const handlePrimary = (tabId, invitation, payload) => {
    const note = payload?.note ?? noteDrafts[invitation.id] ?? '';
    if (tabId === 'incoming') {
      return withLoading(`${tabId}:${invitation.id}`, async () => {
        await onAccept?.(invitation, { note });
      });
    }
    if (tabId === 'suggestions') {
      return withLoading(`${tabId}:${invitation.id}`, async () => {
        await onSend?.(invitation, { note });
      });
    }
    return withLoading(`${tabId}:${invitation.id}`, async () => {
      const shouldWithdraw = payload?.withdraw ?? true;
      await onRescind?.(invitation, { note, withdraw: shouldWithdraw });
    });
  };

  const handleSecondary = (tabId, invitation, payload) => {
    const note = payload?.note ?? noteDrafts[invitation.id] ?? '';
    if (tabId === 'incoming') {
      return withLoading(`${tabId}:${invitation.id}`, async () => {
        await onDecline?.(invitation, { note });
      });
    }
    if (tabId === 'suggestions') {
      return withLoading(`${tabId}:${invitation.id}`, async () => {
        await onSend?.(invitation, { note, skip: true });
      });
    }
    return withLoading(`${tabId}:${invitation.id}`, async () => {
      const shouldWithdraw = payload?.withdraw ?? true;
      await onRescind?.(invitation, { note, withdraw: shouldWithdraw });
    });
  };

  const bulkAction = async (tabId, intent) => {
    const selectedIds = Array.from(selected[tabId] ?? []);
    if (!selectedIds.length) {
      return;
    }
    const dataset = tabConfig.find((tab) => tab.id === tabId)?.dataset ?? [];
    const selectedInvitations = dataset.filter((invitation) => selectedIds.includes(invitation.id));
    await Promise.all(
      selectedInvitations.map((invitation) => {
        if (intent === 'accept') {
          return handlePrimary(tabId, invitation, { note: noteDrafts[invitation.id] });
        }
        if (intent === 'decline') {
          return handleSecondary(tabId, invitation, { note: noteDrafts[invitation.id] });
        }
        if (intent === 'rescind') {
          return handleSecondary(tabId, invitation, { note: noteDrafts[invitation.id] });
        }
        return Promise.resolve();
      }),
    );
    setSelected((previous) => ({ ...previous, [tabId]: new Set() }));
  };

  const active = tabConfig.find((tab) => tab.id === activeTab) ?? tabConfig[0];
  const activeDataset = active?.dataset ?? [];

  return (
    <section className={clsx('rounded-3xl border border-slate-200 bg-white p-6 shadow-soft', className)}>
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-900">Connections &amp; invitations</p>
          <p className="mt-1 text-xs text-slate-500">Stay on top of intros, track follow-ups, and action curated matches.</p>
        </div>
        {analytics ? (
          <dl className="grid gap-4 text-xs text-slate-500 sm:auto-cols-max sm:grid-flow-col sm:items-center">
            <div>
              <dt className="uppercase tracking-wide">Acceptance rate</dt>
              <dd className="mt-1 text-sm font-semibold text-emerald-600">{acceptanceDisplay}</dd>
            </div>
            <div>
              <dt className="uppercase tracking-wide">Median response</dt>
              <dd className="mt-1 text-sm font-semibold text-slate-900">{analytics.medianResponse ?? '—'}</dd>
            </div>
            <div>
              <dt className="uppercase tracking-wide">Introductions closed</dt>
              <dd className="mt-1 text-sm font-semibold text-slate-900">{analytics.closed ?? '—'}</dd>
            </div>
          </dl>
        ) : null}
      </header>

      <div className="mt-6 grid gap-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-500 sm:grid-cols-3">
        <div>
          <p className="font-semibold text-slate-600">Pending replies</p>
          <p className="text-2xl font-semibold text-slate-900">{totals.pending}</p>
        </div>
        <div>
          <p className="font-semibold text-slate-600">Sent</p>
          <p className="text-2xl font-semibold text-slate-900">{totals.sent}</p>
        </div>
        <div>
          <p className="font-semibold text-slate-600">Smart matches</p>
          <p className="text-2xl font-semibold text-slate-900">{totals.recommended}</p>
        </div>
      </div>

      <nav className="mt-6 flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
        {tabConfig.map((tab) => {
          const Icon = tab.icon;
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={clsx(
                'inline-flex items-center gap-2 rounded-full border px-4 py-2 transition focus:outline-none focus:ring-2 focus:ring-offset-2',
                isActive
                  ? 'border-accent bg-accent text-white focus:ring-accent/40'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-800 focus:ring-slate-200',
              )}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              {tab.label}
            </button>
          );
        })}
      </nav>

      <p className="mt-4 text-xs text-slate-500">{active?.description}</p>

      {selected[activeTab]?.size ? (
        <div className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-600">
          <span className="inline-flex items-center gap-2 rounded-full bg-accent/10 px-3 py-1 font-semibold text-accent">
            <ExclamationTriangleIcon className="h-4 w-4" aria-hidden="true" />
            {selected[activeTab].size} selected
          </span>
          {activeTab === 'incoming' ? (
            <>
              <button
                type="button"
                onClick={() => bulkAction('incoming', 'accept')}
                className="inline-flex items-center gap-2 rounded-full border border-emerald-500 bg-emerald-500 px-4 py-1.5 font-semibold text-white transition hover:bg-emerald-600"
              >
                <CheckCircleIcon className="h-4 w-4" aria-hidden="true" />
                Accept selected
              </button>
              <button
                type="button"
                onClick={() => bulkAction('incoming', 'decline')}
                className="inline-flex items-center gap-2 rounded-full border border-rose-200 px-4 py-1.5 font-semibold text-rose-500 transition hover:border-rose-300 hover:text-rose-600"
              >
                <UserMinusIcon className="h-4 w-4" aria-hidden="true" />
                Decline selected
              </button>
            </>
          ) : null}
          {activeTab === 'outgoing' ? (
            <button
              type="button"
              onClick={() => bulkAction('outgoing', 'rescind')}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-1.5 font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-800"
            >
              <ArrowDownTrayIcon className="h-4 w-4" aria-hidden="true" />
              Withdraw selected
            </button>
          ) : null}
          {activeTab === 'suggestions' ? (
            <button
              type="button"
              onClick={() => bulkAction('suggestions', 'accept')}
              className="inline-flex items-center gap-2 rounded-full border border-accent px-4 py-1.5 font-semibold text-accent transition hover:bg-accentSoft"
            >
              <PaperAirplaneIcon className="h-4 w-4" aria-hidden="true" />
              Invite selected
            </button>
          ) : null}
        </div>
      ) : null}

      <div className="mt-6 grid gap-4">
        {activeDataset.length ? (
          activeDataset.map((invitation) => {
            const loading = loadingKeys.has(`${activeTab}:${invitation.id}`);
            return (
              <InvitationCard
                key={invitation.id}
                tab={activeTab}
                invitation={invitation}
                isSelected={selected[activeTab]?.has(invitation.id)}
                onToggleSelect={(item) => toggleSelect(activeTab, item)}
                onPrimary={(item, payload) => handlePrimary(activeTab, item, payload)}
                onSecondary={(item, payload) => handleSecondary(activeTab, item, payload)}
                loading={loading}
                note={noteDrafts[invitation.id] ?? ''}
                onNoteChange={setNote}
              />
            );
          })
        ) : (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
            <p className="font-semibold text-slate-700">All caught up</p>
            <p className="mt-2 text-slate-500">There are no invitations in this lane right now. Check back soon.</p>
          </div>
        )}
      </div>
    </section>
  );
}

InvitationManager.propTypes = {
  incoming: PropTypes.arrayOf(invitationShape),
  outgoing: PropTypes.arrayOf(invitationShape),
  suggested: PropTypes.arrayOf(invitationShape),
  onAccept: PropTypes.func,
  onDecline: PropTypes.func,
  onRescind: PropTypes.func,
  onSend: PropTypes.func,
  analytics: PropTypes.shape({
    acceptanceRate: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    medianResponse: PropTypes.string,
    closed: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  }),
  className: PropTypes.string,
};

InvitationManager.defaultProps = {
  incoming: [],
  outgoing: [],
  suggested: [],
  onAccept: undefined,
  onDecline: undefined,
  onRescind: undefined,
  onSend: undefined,
  analytics: undefined,
  className: undefined,
};
