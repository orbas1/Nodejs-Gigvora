import PropTypes from 'prop-types';
import clsx from 'clsx';
import {
  ArrowTopRightOnSquareIcon,
  ChatBubbleBottomCenterTextIcon,
  StarIcon,
  UserPlusIcon,
} from '@heroicons/react/24/outline';
import UserAvatar from '../UserAvatar.jsx';

function safeArray(value) {
  if (!value) {
    return [];
  }
  if (Array.isArray(value)) {
    return value.filter(Boolean);
  }
  return [value].filter(Boolean);
}

export default function ConnectionProfileCard({
  connection,
  onConnect,
  onMessage,
  onBookmark,
  isSubmitting,
  isBookmarked,
}) {
  const {
    id,
    name,
    headline,
    location,
    degreeLabel,
    mutualConnections,
    connectors,
    lastInteractionAt,
    industries,
    focusAreas,
    availability,
    trustScore,
    actions,
    summary,
  } = connection;

  const personaLabel = connection.persona ?? connection.userType ?? 'Member';
  const connectorList = safeArray(connectors).slice(0, 4);
  const focusList = safeArray(focusAreas ?? industries).slice(0, 3);
  const availabilityLabel = Array.isArray(availability)
    ? availability.join(' • ')
    : availability ?? 'Open to conversations';
  const trustDisplay = typeof trustScore === 'number' ? `${Math.round(trustScore)}% trust` : 'Trusted';
  const lastInteractionLabel = lastInteractionAt
    ? new Date(lastInteractionAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    : 'New connection';

  return (
    <article className="relative flex h-full flex-col justify-between overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-soft transition hover:-translate-y-0.5 hover:border-accent/50 hover:shadow-2xl">
      <div className="absolute -left-20 top-1/2 h-40 w-40 -translate-y-1/2 rounded-full bg-accent/5 blur-3xl" aria-hidden="true" />
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <UserAvatar name={name} seed={connection.avatarSeed ?? id ?? name} size="md" showGlow />
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{degreeLabel ?? 'Connection'}</p>
            <h3 className="text-lg font-semibold text-slate-900">{name}</h3>
            <p className="text-sm text-slate-600">{headline ?? 'Gigvora member'}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2 text-right text-[11px] uppercase tracking-wide text-slate-400">
          <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1 font-semibold text-slate-600">
            <UserPlusIcon className="h-4 w-4 text-accent" aria-hidden="true" />
            {personaLabel}
          </span>
          <span>{lastInteractionLabel}</span>
          <span>{trustDisplay}</span>
        </div>
      </div>

      <p className="mt-4 text-sm text-slate-600">{summary ?? connection.bio ?? 'Collaborating on new opportunities across the Gigvora network.'}</p>

      <dl className="mt-4 grid grid-cols-2 gap-3 text-xs text-slate-500">
        <div className="rounded-2xl bg-slate-50 p-3">
          <dt className="font-semibold text-slate-600">Location</dt>
          <dd className="mt-1 text-slate-900">{location ?? 'Global'}</dd>
        </div>
        <div className="rounded-2xl bg-slate-50 p-3">
          <dt className="font-semibold text-slate-600">Availability</dt>
          <dd className="mt-1 text-slate-900">{availabilityLabel}</dd>
        </div>
        <div className="rounded-2xl bg-slate-50 p-3">
          <dt className="font-semibold text-slate-600">Mutual allies</dt>
          <dd className="mt-1 text-slate-900">{mutualConnections ?? 0}</dd>
        </div>
        <div className="rounded-2xl bg-slate-50 p-3">
          <dt className="font-semibold text-slate-600">Introductions</dt>
          <dd className="mt-1 text-slate-900">{connectorList.length}</dd>
        </div>
      </dl>

      {connectorList.length ? (
        <div className="mt-4 space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Warm path</p>
          <div className="flex flex-wrap gap-2 text-xs text-slate-600">
            {connectorList.map((connector) => (
              <span
                key={connector.id ?? connector.name}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden="true" />
                {connector.name ?? connector}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      {focusList.length ? (
        <div className="mt-4 space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Focus</p>
          <div className="flex flex-wrap gap-2 text-xs text-slate-600">
            {focusList.map((focus) => (
              <span
                key={focus}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1"
              >
                <StarIcon className="h-3.5 w-3.5 text-amber-400" aria-hidden="true" />
                {focus}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={!actions?.canRequestConnection || isSubmitting}
          onClick={() => onConnect?.(connection)}
          className={clsx(
            'inline-flex items-center gap-2 rounded-full border px-5 py-2 text-xs font-semibold transition focus:outline-none focus:ring-2 focus:ring-offset-2',
            actions?.canRequestConnection && !isSubmitting
              ? 'border-accent bg-accent text-white hover:bg-accentDark focus:ring-accent/40'
              : 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400 focus:ring-transparent',
          )}
        >
          {actions?.requiresIntroduction ? 'Request intro' : 'Connect'}
          {isSubmitting ? '…' : null}
        </button>
        {actions?.canMessage ? (
          <button
            type="button"
            onClick={() => onMessage?.(connection)}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-5 py-2 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-800 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:ring-offset-2"
          >
            <ChatBubbleBottomCenterTextIcon className="h-4 w-4" aria-hidden="true" />
            Message
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => onBookmark?.(connection)}
          className={clsx(
            'inline-flex items-center gap-2 rounded-full border px-5 py-2 text-xs font-semibold transition focus:outline-none focus:ring-2 focus:ring-offset-2',
            isBookmarked
              ? 'border-amber-300 bg-amber-50 text-amber-600 focus:ring-amber-200'
              : 'border-slate-200 text-slate-500 hover:border-amber-200 hover:text-amber-500 focus:ring-amber-200',
          )}
        >
          <ArrowTopRightOnSquareIcon className="h-4 w-4" aria-hidden="true" />
          {isBookmarked ? 'Saved' : 'Save for later'}
        </button>
        {actions?.canRequestConnection === false && actions?.reason ? (
          <p className="mt-2 w-full text-xs text-slate-500">{actions.reason}</p>
        ) : null}
      </div>
    </article>
  );
}

ConnectionProfileCard.propTypes = {
  connection: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    name: PropTypes.string.isRequired,
    headline: PropTypes.string,
    location: PropTypes.string,
    degreeLabel: PropTypes.string,
    persona: PropTypes.string,
    userType: PropTypes.string,
    mutualConnections: PropTypes.number,
    connectors: PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.string, PropTypes.object])),
    lastInteractionAt: PropTypes.string,
    industries: PropTypes.arrayOf(PropTypes.string),
    focusAreas: PropTypes.arrayOf(PropTypes.string),
    availability: PropTypes.oneOfType([PropTypes.string, PropTypes.arrayOf(PropTypes.string)]),
    trustScore: PropTypes.number,
    actions: PropTypes.shape({
      canRequestConnection: PropTypes.bool,
      canMessage: PropTypes.bool,
      requiresIntroduction: PropTypes.bool,
    }),
    summary: PropTypes.string,
    bio: PropTypes.string,
    avatarSeed: PropTypes.string,
  }).isRequired,
  onConnect: PropTypes.func,
  onMessage: PropTypes.func,
  onBookmark: PropTypes.func,
  isSubmitting: PropTypes.bool,
  isBookmarked: PropTypes.bool,
};

ConnectionProfileCard.defaultProps = {
  onConnect: undefined,
  onMessage: undefined,
  onBookmark: undefined,
  isSubmitting: false,
  isBookmarked: false,
};
