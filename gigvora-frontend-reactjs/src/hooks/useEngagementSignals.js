import { useMemo } from 'react';
import {
  generateConnectionSuggestions,
  generateGroupSuggestions,
  generateLiveMoments,
  resolveUserInterests,
} from '../services/engagementService.js';

function mergeInterests(localInterests, remoteInterests) {
  const base = Array.isArray(localInterests) ? localInterests : [];
  const remote = Array.isArray(remoteInterests) ? remoteInterests : [];
  return Array.from(new Set([...base, ...remote].filter(Boolean))).slice(0, 12);
}

function normaliseConnection(connection) {
  if (!connection) {
    return null;
  }
  const name = `${connection.name ?? ''}`.trim();
  if (!name) {
    return null;
  }
  const id = connection.id ?? (connection.userId ? `user-${connection.userId}` : null);
  if (!id) {
    return null;
  }
  const headline = connection.headline ? `${connection.headline}`.trim() : '';
  const location = connection.location ? `${connection.location}`.trim() : null;
  const mutualConnections = Number.isFinite(Number(connection.mutualConnections))
    ? Number(connection.mutualConnections)
    : 0;
  const reason = connection.reason
    ? `${connection.reason}`.trim().slice(0, 140)
    : 'Recently active in your circles—reach out while the thread is fresh.';
  return {
    id,
    userId: connection.userId ?? null,
    name,
    headline: headline ? headline.slice(0, 120) : null,
    location,
    avatarSeed: connection.avatarSeed ?? name,
    mutualConnections,
    reason,
  };
}

function hydrateConnections(remoteConnections, fallback, limit) {
  const normalisedRemote = Array.isArray(remoteConnections)
    ? remoteConnections.map(normaliseConnection).filter(Boolean)
    : [];

  const combined = [...normalisedRemote];
  const seen = new Set(combined.map((connection) => connection.id ?? connection.userId));

  (fallback ?? []).forEach((connection) => {
    const key = connection.id ?? connection.userId ?? connection.name;
    if (key && !seen.has(key)) {
      combined.push(connection);
      seen.add(key);
    }
  });

  return combined.slice(0, limit);
}

function normaliseGroup(group) {
  if (!group) {
    return null;
  }
  const id = group.id ?? group.slug ?? null;
  if (!id) {
    return null;
  }
  return {
    id,
    name: group.name ?? 'Gigvora group',
    description: group.description ?? '',
    focus: Array.isArray(group.focus) ? group.focus.slice(0, 3) : [],
    members: Number.isFinite(Number(group.members)) ? Number(group.members) : null,
    reason: group.reason ? `${group.reason}`.trim().slice(0, 140) : null,
    accentColor: group.accentColor ?? '#2563eb',
  };
}

function hydrateGroups(remoteGroups, fallback, limit) {
  const normalisedRemote = Array.isArray(remoteGroups)
    ? remoteGroups.map(normaliseGroup).filter(Boolean)
    : [];

  const combined = [...normalisedRemote];
  const seen = new Set(combined.map((group) => group.id));

  (fallback ?? []).forEach((group) => {
    if (group?.id && !seen.has(group.id)) {
      combined.push(group);
      seen.add(group.id);
    }
  });

  return combined.slice(0, limit);
}

function normaliseMoments(remoteMoments, fallback, limit) {
  const normalisedRemote = Array.isArray(remoteMoments)
    ? remoteMoments.map((moment) => {
        if (!moment) {
          return null;
        }
        const id = moment.id ?? moment.link ?? moment.title;
        if (!id) {
          return null;
        }
        return {
          id,
          title: moment.title ?? 'Live community signal',
          tag: moment.tag ?? null,
          icon: moment.icon ?? '⚡️',
          preview: moment.preview ?? null,
          timestamp: moment.timestamp ?? moment.occuredAt ?? null,
        };
      })
      .filter(Boolean)
    : [];

  if (normalisedRemote.length >= limit) {
    return normalisedRemote.slice(0, limit);
  }

  const combined = [...normalisedRemote];
  const seen = new Set(combined.map((moment) => moment.id));
  (fallback ?? []).forEach((moment) => {
    if (moment?.id && !seen.has(moment.id)) {
      combined.push(moment);
      seen.add(moment.id);
    }
  });
  return combined.slice(0, limit);
}

export default function useEngagementSignals({ session, feedPosts = [], limit = 6, suggestions = null } = {}) {
  return useMemo(() => {
    const interests = resolveUserInterests(session);
    const fallbackConnections = generateConnectionSuggestions({ session, feedPosts, limit });
    const fallbackGroups = generateGroupSuggestions({ session, limit: Math.max(3, Math.floor(limit / 2)) });
    const fallbackMoments = generateLiveMoments({
      session,
      feedPosts,
      limit: Math.max(4, Math.floor(limit * 0.75)),
    });

    const connectionSuggestions = hydrateConnections(
      suggestions?.connections,
      fallbackConnections,
      limit,
    );
    const groupSuggestions = hydrateGroups(
      suggestions?.groups,
      fallbackGroups,
      Math.max(3, Math.floor(limit / 2)),
    );
    const liveMoments = normaliseMoments(
      suggestions?.liveMoments ?? suggestions?.signals,
      fallbackMoments,
      Math.max(4, Math.floor(limit * 0.75)),
    );

    const mergedInterests = suggestions?.interests
      ? mergeInterests(interests, suggestions.interests)
      : interests;

    return {
      interests: mergedInterests,
      connectionSuggestions,
      groupSuggestions,
      liveMoments,
      generatedAt: suggestions?.generatedAt ?? null,
    };
  }, [session, feedPosts, limit, suggestions]);
}
