import { useMemo } from 'react';
import PropTypes from 'prop-types';
import {
  BoltIcon,
  ChatBubbleLeftIcon,
  CheckBadgeIcon,
  ClockIcon,
  EnvelopeIcon,
  ShieldCheckIcon,
  StarIcon,
  UserPlusIcon,
} from '@heroicons/react/24/outline';

import analytics from '../../services/analytics.js';
import classNames from '../../utils/classNames.js';

function computeCallToAction(connection) {
  if (connection.status === 'connected') {
    return { label: 'Message', icon: ChatBubbleLeftIcon, intent: 'message' };
  }
  if (connection.status === 'pending') {
    return { label: 'Pending', icon: ClockIcon, intent: 'pending' };
  }
  if (connection.status === 'invited') {
    return { label: 'Accept invite', icon: ShieldCheckIcon, intent: 'accept' };
  }
  return { label: 'Connect', icon: UserPlusIcon, intent: 'connect' };
}

export default function ConnectionCard({ connection, onConnect, onMessage, onSave, analyticsSource }) {
  const callToAction = useMemo(() => computeCallToAction(connection), [connection]);

  const ActionIcon = callToAction.icon ?? UserPlusIcon;

  const handlePrimary = () => {
    analytics.track('discovery.connection.primary_action', {
      connectionId: connection.id,
      intent: callToAction.intent,
      source: analyticsSource ?? 'web_app',
    });

    if (callToAction.intent === 'message') {
      onMessage?.(connection);
    } else {
      onConnect?.(connection);
    }
  };

  const handleSave = () => {
    analytics.track('discovery.connection.saved', {
      connectionId: connection.id,
      source: analyticsSource ?? 'web_app',
    });
    onSave?.(connection);
  };

  const headline = connection.headline ?? connection.role ?? 'Emerging leader';
  const tags = Array.isArray(connection.tags) ? connection.tags.slice(0, 4) : [];

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-[22px] border border-white/40 bg-white/70 p-6 shadow-xl transition duration-200 ease-out hover:-translate-y-1 hover:shadow-2xl">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50/90 via-white to-blue-50/60 opacity-80" aria-hidden />
      <div className="relative flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          {connection.avatarUrl ? (
            <img
              src={connection.avatarUrl}
              alt=""
              loading="lazy"
              className="h-16 w-16 flex-none rounded-[18px] border border-white/70 object-cover shadow-sm"
            />
          ) : (
            <div className="flex h-16 w-16 flex-none items-center justify-center rounded-[18px] bg-gradient-to-br from-indigo-500 to-purple-500 text-white shadow-sm">
              <StarIcon className="h-6 w-6" aria-hidden="true" />
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold text-slate-900">{connection.name}</h3>
              {connection.verified ? (
                <CheckBadgeIcon className="h-5 w-5 text-blue-500" aria-hidden="true" />
              ) : null}
            </div>
            <p className="text-sm text-slate-500">{headline}</p>
            {connection.location ? <p className="text-xs text-slate-400">{connection.location}</p> : null}
          </div>
        </div>
        {connection.trustSignal ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-600">
            <ShieldCheckIcon className="h-4 w-4" aria-hidden="true" />
            {connection.trustSignal}
          </span>
        ) : null}
      </div>

      {connection.bio ? <p className="relative mt-4 line-clamp-3 text-sm text-slate-600">{connection.bio}</p> : null}

      {connection.mutualConnections != null || connection.sharedCommunities?.length ? (
        <div className="relative mt-4 rounded-2xl border border-blue-100/70 bg-white/70 p-4 shadow-inner">
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-500">Shared context</p>
          <div className="mt-2 space-y-2 text-sm text-slate-600">
            {connection.mutualConnections != null ? (
              <p>{connection.mutualConnections} mutual connections</p>
            ) : null}
            {connection.sharedCommunities?.length ? (
              <p>
                Communities: <span className="font-semibold text-slate-900">{connection.sharedCommunities.join(', ')}</span>
              </p>
            ) : null}
            {connection.lastCollaborated ? (
              <p className="text-xs text-slate-500">Last collaborated {connection.lastCollaborated}</p>
            ) : null}
          </div>
        </div>
      ) : null}

      {tags.length ? (
        <div className="relative mt-4 flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-blue-600"
            >
              <BoltIcon className="h-3 w-3" aria-hidden="true" />
              {tag}
            </span>
          ))}
        </div>
      ) : null}

      <div className="relative mt-6 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handlePrimary}
          className={classNames(
            'inline-flex flex-1 items-center justify-center gap-2 rounded-full px-5 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-offset-2',
            callToAction.intent === 'message'
              ? 'bg-slate-900 text-white shadow-sm hover:bg-slate-800 focus:ring-slate-300'
              : 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg hover:from-blue-600 hover:to-indigo-600 focus:ring-indigo-300',
          )}
        >
          <ActionIcon className="h-5 w-5" aria-hidden="true" />
          {callToAction.label}
        </button>
        <button
          type="button"
          onClick={handleSave}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-200 focus:ring-offset-2"
        >
          <EnvelopeIcon className="h-5 w-5" aria-hidden="true" />
          Save for later
        </button>
      </div>

      {connection.successStory ? (
        <p className="relative mt-4 rounded-2xl border border-amber-100 bg-amber-50/70 p-4 text-sm text-amber-800">
          “{connection.successStory}”
        </p>
      ) : null}
    </article>
  );
}

ConnectionCard.propTypes = {
  connection: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    name: PropTypes.string.isRequired,
    avatarUrl: PropTypes.string,
    headline: PropTypes.string,
    role: PropTypes.string,
    location: PropTypes.string,
    verified: PropTypes.bool,
    bio: PropTypes.string,
    mutualConnections: PropTypes.number,
    sharedCommunities: PropTypes.arrayOf(PropTypes.string),
    lastCollaborated: PropTypes.string,
    tags: PropTypes.arrayOf(PropTypes.string),
    trustSignal: PropTypes.string,
    status: PropTypes.oneOf(['connected', 'pending', 'invited', 'new']),
    successStory: PropTypes.string,
  }).isRequired,
  onConnect: PropTypes.func,
  onMessage: PropTypes.func,
  onSave: PropTypes.func,
  analyticsSource: PropTypes.string,
};

ConnectionCard.defaultProps = {
  onConnect: undefined,
  onMessage: undefined,
  onSave: undefined,
  analyticsSource: 'web_app',
};
