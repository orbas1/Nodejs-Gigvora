import { useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import {
  ArrowTrendingUpIcon,
  BookmarkIcon,
  ChatBubbleLeftRightIcon,
  ShieldCheckIcon,
  SparklesIcon,
  UserPlusIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import UserAvatar from '../../components/UserAvatar.jsx';
import classNames from '../../utils/classNames.js';
import { formatRelativeTime } from '../../utils/date.js';

const ACCENT_TOKENS = {
  mentor: {
    overlay: 'from-sky-500/15 via-transparent to-indigo-500/10',
    border: 'border-sky-200/70',
  },
  investor: {
    overlay: 'from-emerald-400/15 via-transparent to-slate-100/30',
    border: 'border-emerald-200/70',
  },
  recruiter: {
    overlay: 'from-amber-400/15 via-transparent to-slate-100/30',
    border: 'border-amber-200/70',
  },
  founder: {
    overlay: 'from-violet-400/20 via-transparent to-indigo-500/10',
    border: 'border-violet-200/70',
  },
  default: {
    overlay: 'from-slate-200/40 via-transparent to-slate-100/20',
    border: 'border-slate-200/70',
  },
};

const BADGE_ICON = {
  verified: ShieldCheckIcon,
  spotlight: SparklesIcon,
  rising: ArrowTrendingUpIcon,
};

function buildAccent(persona) {
  return ACCENT_TOKENS[persona?.toLowerCase?.()] ?? ACCENT_TOKENS.default;
}

function buildPrimaryAction(connection) {
  if (connection.status === 'connected') {
    return { label: 'Message', intent: 'primary', action: 'message' };
  }

  if (connection.status === 'pending') {
    return { label: 'Request sent', intent: 'muted', action: 'pending', disabled: true };
  }

  if (connection.status === 'invited') {
    return { label: 'Accept invite', intent: 'primary', action: 'accept' };
  }

  return { label: 'Connect', intent: 'primary', action: 'connect' };
}

function buildSecondaryAction(connection) {
  if (connection.status === 'connected') {
    return { label: 'Save for later', intent: 'ghost', action: 'save' };
  }
  return { label: connection.following ? 'Following' : 'Follow updates', intent: 'ghost', action: 'follow', toggled: connection.following };
}

function renderBadge(badge) {
  if (!badge) return null;
  const Icon = BADGE_ICON[badge.type] ?? SparklesIcon;
  return (
    <span
      key={`${badge.type}-${badge.label}`}
      className="inline-flex items-center gap-1 rounded-full bg-white/70 px-2.5 py-1 text-[11px] font-semibold text-slate-600 shadow-sm"
    >
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {badge.label}
    </span>
  );
}

function ActionButton({ action, connection, onConnect, onMessage, onSave, onFollowToggle, onAccept, analyticsTag }) {
  const common = {
    type: 'button',
    className: classNames(
      'flex-1 rounded-full px-4 py-2 text-xs font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
      action.intent === 'primary'
        ? 'bg-slate-900 text-white shadow-sm hover:bg-slate-800 focus-visible:ring-slate-300'
        : action.intent === 'ghost'
          ? 'border border-slate-200 bg-white/80 text-slate-600 hover:bg-slate-100 focus-visible:ring-slate-200'
          : 'border border-slate-200 bg-slate-100/80 text-slate-500 cursor-default',
      action.toggled ? 'border-slate-300 bg-slate-100 text-slate-700' : null,
    ),
    disabled: action.disabled,
  };

  const handleClick = () => {
    if (action.disabled) return;
    if (action.action === 'connect') {
      onConnect(connection, analyticsTag);
    } else if (action.action === 'message') {
      onMessage(connection, analyticsTag);
    } else if (action.action === 'save') {
      onSave(connection, analyticsTag);
    } else if (action.action === 'follow') {
      onFollowToggle(connection, analyticsTag);
    } else if (action.action === 'accept') {
      onAccept(connection, analyticsTag);
    }
  };

  if (action.action === 'pending') {
    return (
      <button {...common}>
        <UserPlusIcon className="mr-1 h-3.5 w-3.5" aria-hidden="true" />
        {action.label}
      </button>
    );
  }

  const Icon = action.action === 'message' ? ChatBubbleLeftRightIcon : action.action === 'save' ? BookmarkIcon : UserPlusIcon;

  return (
    <button {...common} onClick={handleClick}>
      <Icon className="mr-1.5 h-4 w-4" aria-hidden="true" />
      {action.label}
    </button>
  );
}

ActionButton.propTypes = {
  action: PropTypes.shape({
    label: PropTypes.string.isRequired,
    intent: PropTypes.oneOf(['primary', 'ghost', 'muted']).isRequired,
    action: PropTypes.oneOf(['connect', 'message', 'save', 'follow', 'pending', 'accept']).isRequired,
    disabled: PropTypes.bool,
    toggled: PropTypes.bool,
  }).isRequired,
  connection: PropTypes.object.isRequired,
  onConnect: PropTypes.func.isRequired,
  onMessage: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  onFollowToggle: PropTypes.func.isRequired,
  onAccept: PropTypes.func.isRequired,
  analyticsTag: PropTypes.string,
};

export default function ConnectionCard({
  connection,
  analyticsTag,
  onConnect,
  onAccept,
  onMessage,
  onSave,
  onFollowToggle,
  onDismiss,
  onViewProfile,
  timezone,
  onCopyIntro,
}) {
  const accent = buildAccent(connection.persona);
  const primaryAction = useMemo(() => buildPrimaryAction(connection), [connection]);
  const secondaryAction = useMemo(() => buildSecondaryAction(connection), [connection]);

  const lastActiveLabel = connection.lastActiveAt ? formatRelativeTime(connection.lastActiveAt, { timeZone: timezone }) : null;
  const matchScore = Math.round((connection.matchScore ?? 0) * 100);
  const quickIntro = connection.quickIntro ||
    `Hi ${connection.firstName || connection.name?.split(' ')[0] || 'there'}, I noticed we both care about ${connection.focusAreas?.[0] || 'growth'} and would love to connect.`;

  const copyTimeoutRef = useRef(null);
  const [copiedIntro, setCopiedIntro] = useState(false);

  const handleDismiss = () => {
    onDismiss(connection, analyticsTag);
  };

  const handleViewProfile = () => {
    onViewProfile(connection, analyticsTag);
  };

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
    };
  }, []);

  const handleCopyIntro = async () => {
    const introText = quickIntro?.trim();
    if (!introText) {
      onCopyIntro(connection, { analyticsTag, success: false, reason: 'empty' });
      return;
    }

    let success = false;
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(introText);
        success = true;
      } else if (typeof document !== 'undefined') {
        const textarea = document.createElement('textarea');
        textarea.value = introText;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'absolute';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        textarea.select();
        success = document.execCommand('copy');
        document.body.removeChild(textarea);
      }
    } catch (error) {
      onCopyIntro(connection, { analyticsTag, success: false, error });
      return;
    }

    if (!success) {
      onCopyIntro(connection, { analyticsTag, success: false });
      return;
    }

    onCopyIntro(connection, { analyticsTag, success: true });
    setCopiedIntro(true);
    if (copyTimeoutRef.current) {
      clearTimeout(copyTimeoutRef.current);
    }
    copyTimeoutRef.current = setTimeout(() => setCopiedIntro(false), 2000);
  };

  return (
    <article
      className={classNames(
        'group relative flex h-full flex-col overflow-hidden rounded-3xl border bg-white/80 p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-xl focus-within:-translate-y-1 focus-within:shadow-xl',
        accent.border,
      )}
    >
      <div className={classNames('pointer-events-none absolute inset-0 bg-gradient-to-br opacity-90', accent.overlay)} aria-hidden="true" />
      {connection.backgroundUrl ? (
        <img
          src={connection.backgroundUrl}
          alt=""
          className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-[0.08]"
        />
      ) : null}
      <div className="relative flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <button type="button" className="focus:outline-none" onClick={handleViewProfile}>
            <UserAvatar
              name={connection.name}
              imageUrl={connection.avatarUrl}
              seed={connection.id ? String(connection.id) : connection.name}
              size="md"
              className="shadow-md"
            />
            <span className="sr-only">Open profile</span>
          </button>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-semibold text-slate-900">{connection.name}</h3>
              {connection.persona ? (
                <span className="rounded-full bg-slate-900/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-white/90">
                  {connection.persona}
                </span>
              ) : null}
            </div>
            {connection.headline ? (
              <p className="text-xs text-slate-600">{connection.headline}</p>
            ) : null}
            <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
              {connection.location ? <span>{connection.location}</span> : null}
              {lastActiveLabel ? <span>Active {lastActiveLabel}</span> : null}
              {connection.sharedContext ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-white/60 px-2 py-0.5 text-[10px] font-semibold text-slate-600 shadow-sm">
                  <SparklesIcon className="h-3 w-3" aria-hidden="true" />
                  {connection.sharedContext}
                </span>
              ) : null}
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={handleDismiss}
          className="relative -mr-2 -mt-2 inline-flex h-8 w-8 items-center justify-center rounded-full border border-transparent bg-white/80 text-slate-400 shadow-sm transition hover:bg-slate-100 hover:text-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-200 focus-visible:ring-offset-2"
        >
          <XMarkIcon className="h-4 w-4" aria-hidden="true" />
          <span className="sr-only">Dismiss suggestion</span>
        </button>
      </div>

      {connection.badges?.length ? (
        <div className="relative mt-3 flex flex-wrap gap-2">
          {connection.badges.map((badge) => renderBadge(badge))}
        </div>
      ) : null}

      <div className="relative mt-4 space-y-3 text-xs text-slate-600">
        {connection.summary ? <p className="leading-relaxed text-slate-600">{connection.summary}</p> : null}
        {connection.mutualConnections ? (
          <p className="flex items-center gap-2 text-[11px] font-semibold text-slate-500">
            <UserPlusIcon className="h-4 w-4 text-slate-400" aria-hidden="true" />
            {connection.mutualConnections} mutual connections
          </p>
        ) : null}
        {connection.focusAreas?.length ? (
          <div className="flex flex-wrap gap-2 text-[11px]">
            {connection.focusAreas.map((area) => (
              <span key={area} className="rounded-full bg-white/70 px-2.5 py-1 font-semibold text-slate-600 shadow-sm">
                {area}
              </span>
            ))}
          </div>
        ) : null}
        {connection.recentActivity ? (
          <div className="rounded-2xl border border-white/60 bg-white/70 p-3 text-[11px] text-slate-500 shadow-inner">
            <p className="font-semibold text-slate-600">Recent activity</p>
            <p className="mt-1 leading-relaxed">{connection.recentActivity}</p>
          </div>
        ) : null}
        {connection.matchScore != null ? (
          <div>
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500">
              <span>Affinity match</span>
              <span>{matchScore}%</span>
            </div>
            <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-200/70">
              <div
                className="h-full rounded-full bg-gradient-to-r from-slate-900 via-indigo-600 to-sky-500"
                style={{ width: `${Math.min(100, Math.max(0, matchScore))}%` }}
              />
            </div>
          </div>
        ) : null}
        <div className="rounded-2xl border border-slate-200/60 bg-white/70 p-3 text-[11px] text-slate-500 shadow-sm">
          <div className="flex items-start justify-between gap-2">
            <p className="font-semibold text-slate-600">Intro template</p>
            <button
              type="button"
              onClick={handleCopyIntro}
              className={classNames(
                'inline-flex items-center gap-1 rounded-full border px-3 py-1 text-[10px] font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
                copiedIntro
                  ? 'border-emerald-300 bg-emerald-50 text-emerald-600 focus-visible:ring-emerald-200'
                  : 'border-slate-200 bg-white/80 text-slate-600 hover:bg-slate-100 focus-visible:ring-slate-200',
              )}
            >
              {copiedIntro ? 'Copied' : 'Copy intro'}
            </button>
          </div>
          <p className="mt-1 whitespace-pre-line leading-relaxed">{quickIntro}</p>
          <span className="sr-only" aria-live="polite">
            {copiedIntro ? 'Intro template copied to clipboard' : ''}
          </span>
        </div>
      </div>

      <div className="relative mt-5 flex flex-col gap-2">
        <div className="flex gap-2">
          <ActionButton
            action={primaryAction}
            connection={connection}
            onConnect={onConnect}
            onMessage={onMessage}
            onSave={onSave}
            onFollowToggle={onFollowToggle}
            onAccept={onAccept}
            analyticsTag={analyticsTag}
          />
          <ActionButton
            action={secondaryAction}
            connection={connection}
            onConnect={onConnect}
            onMessage={onMessage}
            onSave={onSave}
            onFollowToggle={onFollowToggle}
            onAccept={onAccept}
            analyticsTag={analyticsTag}
          />
        </div>
        <button
          type="button"
          onClick={handleViewProfile}
          className="inline-flex items-center justify-center gap-1 text-[11px] font-semibold text-slate-500 transition hover:text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-200 focus-visible:ring-offset-2"
        >
          <span>View full profile</span>
          <ArrowTrendingUpIcon className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </div>
    </article>
  );
}

ConnectionCard.propTypes = {
  connection: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    name: PropTypes.string.isRequired,
    firstName: PropTypes.string,
    persona: PropTypes.string,
    headline: PropTypes.string,
    summary: PropTypes.string,
    location: PropTypes.string,
    sharedContext: PropTypes.string,
    avatarUrl: PropTypes.string,
    backgroundUrl: PropTypes.string,
    focusAreas: PropTypes.arrayOf(PropTypes.string),
    badges: PropTypes.arrayOf(
      PropTypes.shape({
        type: PropTypes.string,
        label: PropTypes.string.isRequired,
      }),
    ),
    mutualConnections: PropTypes.number,
    lastActiveAt: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.instanceOf(Date)]),
    recentActivity: PropTypes.string,
    matchScore: PropTypes.number,
    quickIntro: PropTypes.string,
    status: PropTypes.oneOf(['connected', 'pending', 'invited', 'suggested']),
    following: PropTypes.bool,
  }).isRequired,
  analyticsTag: PropTypes.string,
  onConnect: PropTypes.func,
  onAccept: PropTypes.func,
  onMessage: PropTypes.func,
  onSave: PropTypes.func,
  onFollowToggle: PropTypes.func,
  onDismiss: PropTypes.func,
  onViewProfile: PropTypes.func,
  timezone: PropTypes.string,
  onCopyIntro: PropTypes.func,
};

ConnectionCard.defaultProps = {
  analyticsTag: undefined,
  onConnect: () => {},
  onAccept: () => {},
  onMessage: () => {},
  onSave: () => {},
  onFollowToggle: () => {},
  onDismiss: () => {},
  onViewProfile: () => {},
  timezone: undefined,
  onCopyIntro: () => {},
};
