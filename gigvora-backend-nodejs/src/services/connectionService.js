import { Op } from 'sequelize';
import { Connection, Profile, User } from '../models/index.js';
import {
  AuthorizationError,
  ConflictError,
  NotFoundError,
  ValidationError,
} from '../utils/errors.js';
import { invalidateFeedSuggestions } from './feedSuggestionService.js';

const CONNECTION_ACCESS_MATRIX = {
  user: ['user', 'freelancer', 'agency', 'company', 'mentor', 'headhunter'],
  freelancer: ['user', 'freelancer', 'agency', 'company', 'mentor', 'headhunter'],
  agency: ['freelancer', 'agency', 'company', 'headhunter'],
  company: ['freelancer', 'agency', 'company', 'headhunter'],
  mentor: ['freelancer', 'user', 'mentor', 'agency'],
  headhunter: ['freelancer', 'user', 'company', 'agency', 'headhunter'],
  admin: ['admin'],
};

const DEFAULT_ALLOWED_ROLES = ['user', 'freelancer', 'agency', 'company'];

function normaliseRole(role) {
  return (role || 'user').toString().trim().toLowerCase();
}

function resolveAllowedRoles(role) {
  const normalized = normaliseRole(role);
  return [...new Set(CONNECTION_ACCESS_MATRIX[normalized] ?? DEFAULT_ALLOWED_ROLES)];
}

function isConnectionAllowed(roleA, roleB) {
  const allowed = resolveAllowedRoles(roleA);
  return allowed.includes(normaliseRole(roleB));
}

function ensureCanViewNetwork({ viewer, owner }) {
  if (!viewer) {
    return;
  }
  if (viewer.id === owner.id) {
    return;
  }
  if (normaliseRole(viewer.userType) === 'admin') {
    return;
  }
  throw new AuthorizationError('You do not have permission to inspect this network.');
}

function ensureCanRequest({ requester, target }) {
  if (requester.id === target.id) {
    throw new ValidationError('You cannot connect with yourself.');
  }

  const requesterRole = normaliseRole(requester.userType);
  const targetRole = normaliseRole(target.userType);

  if (!isConnectionAllowed(requesterRole, targetRole)) {
    throw new AuthorizationError('Your role is not permitted to connect with this profile.');
  }

  if (!isConnectionAllowed(targetRole, requesterRole)) {
    throw new AuthorizationError('The target role is restricted from connecting with your role.');
  }
}

function buildMatrixSnapshot() {
  return Object.fromEntries(
    Object.entries(CONNECTION_ACCESS_MATRIX).map(([role, allowed]) => [role, [...new Set(allowed)]]),
  );
}

function normaliseList(value) {
  if (!value) {
    return [];
  }
  if (Array.isArray(value)) {
    return value
      .flatMap((entry) => {
        if (entry == null) {
          return [];
        }
        if (Array.isArray(entry)) {
          return entry;
        }
        if (typeof entry === 'object') {
          return Object.values(entry ?? {});
        }
        return [entry];
      })
      .map((entry) => `${entry}`.trim())
      .filter(Boolean);
  }
  if (typeof value === 'object') {
    return normaliseList(Object.values(value));
  }
  const stringValue = `${value}`.trim();
  return stringValue ? [stringValue] : [];
}

function buildUserSummary(user) {
  const firstName = user.firstName || '';
  const lastName = user.lastName || '';
  const name = [firstName, lastName].filter(Boolean).join(' ').trim() || user.email;
  const profile = user.Profile ?? {};
  const focusAreas = normaliseList(profile.areasOfFocus);
  const preferredEngagements = normaliseList(
    Array.isArray(profile.preferredEngagements)
      ? profile.preferredEngagements
      : profile.preferredEngagements?.types ?? profile.preferredEngagements?.labels ?? profile.preferredEngagements,
  );
  const availability = [];
  if (profile.availabilityStatus) {
    availability.push(`${profile.availabilityStatus}`.replace(/_/g, ' '));
  }
  if (profile.availableHoursPerWeek) {
    availability.push(`${profile.availableHoursPerWeek} hrs/week`);
  }
  if (profile.openToRemote === true) {
    availability.push('Open to remote');
  }
  if (profile.availabilityNotes) {
    availability.push(profile.availabilityNotes);
  }
  const trustScore = profile.trustScore ? Number(profile.trustScore) : null;
  return {
    id: user.id,
    name,
    userType: normaliseRole(user.userType),
    headline: profile.headline ?? null,
    location: profile.location ?? null,
    avatarSeed: (profile.avatarSeed ?? name) || `user-${user.id}`,
    bio: profile.bio ?? null,
    summary: profile.missionStatement ?? profile.bio ?? null,
    focusAreas,
    availability: availability.length ? availability : preferredEngagements,
    trustScore,
  };
}

function formatPath(pathIds, userMap) {
  return pathIds
    .map((identifier) => {
      const data = userMap.get(identifier);
      if (!data) {
        return null;
      }
      return {
        id: data.id,
        name: data.name,
        userType: data.userType,
      };
    })
    .filter(Boolean);
}

function formatConnectors(connectorIds, userMap, ownerId) {
  return connectorIds
    .filter((identifier) => identifier !== ownerId)
    .map((identifier) => {
      const summary = userMap.get(identifier);
      if (!summary) {
        return null;
      }
      return {
        id: summary.id,
        name: summary.name,
        userType: summary.userType,
      };
    })
    .filter(Boolean);
}

function buildNodeResponse({
  ownerId,
  nodeId,
  degree,
  metadata,
  userMap,
  viewerRole,
}) {
  const summary = userMap.get(nodeId);
  if (!summary) {
    return null;
  }

  const degreeLabel =
    degree === 1 ? '1st degree' : degree === 2 ? '2nd degree' : degree === 3 ? '3rd degree' : `${degree}°`;
  const connectors = formatConnectors([...metadata.connectors], userMap, ownerId);
  const mutualConnections = connectors.length;
  const path = formatPath(metadata.path, userMap);
  const canConnect = isConnectionAllowed(viewerRole, summary.userType);

  return {
    ...summary,
    degree,
    degreeLabel,
    mutualConnections,
    connectors,
    path,
    connectedAt: metadata.connectedAt ?? null,
    lastInteractionAt: metadata.lastInteractionAt ?? null,
    relationshipTag: metadata.relationshipTag ?? null,
    notes: metadata.notes ?? null,
    actions: {
      canMessage: degree === 1,
      canRequestConnection: canConnect,
      requiresIntroduction: degree > 1,
      reason: canConnect
        ? null
        : 'Connection policies for your role prevent direct introductions to this profile.',
    },
  };
}

function buildPendingInvitation({ record, ownerId, userMap, connectorsMap, ownerDirectIds }) {
  const counterpartyId = record.requesterId === ownerId ? record.addresseeId : record.requesterId;
  const direction = record.addresseeId === ownerId ? 'incoming' : 'outgoing';
  if (!counterpartyId) {
    return null;
  }

  const summary = userMap.get(counterpartyId);
  if (!summary) {
    return null;
  }

  const connectors = connectorsMap.get(counterpartyId) ?? new Set();
  const mutualConnectorIds = [...connectors].filter((connectorId) => ownerDirectIds.has(connectorId));
  const mutualConnectors = mutualConnectorIds.map((identifier) => userMap.get(identifier)).filter(Boolean);

  const sentAt = record.createdAt instanceof Date ? record.createdAt.toISOString() : record.createdAt ?? null;

  return {
    direction,
    payload: {
      id: record.id,
      userId: counterpartyId,
      name: summary.name,
      headline: summary.headline,
      location: summary.location,
      persona: summary.userType,
      focusAreas: summary.focusAreas,
      availability: summary.availability,
      trustScore: summary.trustScore,
      mutualConnections: mutualConnectorIds.length,
      connectors: mutualConnectors,
      invitedBy:
        direction === 'incoming'
          ? userMap.get(record.requesterId)?.name ?? null
          : userMap.get(ownerId)?.name ?? null,
      note: record.notes ?? null,
      relationshipTag: record.relationshipTag ?? null,
      sentAt,
      status: record.status ?? 'pending',
    },
  };
}

function median(values) {
  if (!values.length) {
    return null;
  }
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return sorted[mid];
}

function formatDurationLabel(hours) {
  if (hours == null) {
    return null;
  }
  if (hours < 1) {
    return '<1h';
  }
  if (hours < 24) {
    return `${Math.round(hours)}h`;
  }
  const days = Math.round(hours / 24);
  return `${days}d`;
}

async function fetchUsersByIds(ids) {
  if (!ids.length) {
    return new Map();
  }

  const users = await User.findAll({
    where: { id: { [Op.in]: ids } },
    include: [
      {
        model: Profile,
        attributes: [
          'headline',
          'location',
          'avatarSeed',
          'bio',
          'missionStatement',
          'areasOfFocus',
          'preferredEngagements',
          'availabilityStatus',
          'availableHoursPerWeek',
          'openToRemote',
          'availabilityNotes',
          'trustScore',
        ],
      },
    ],
    order: [['firstName', 'ASC']],
  });

  return new Map(users.map((user) => [user.id, buildUserSummary(user)]));
}

function initialiseTraversalState(ownerId) {
  return {
    visited: new Set([ownerId]),
    frontier: new Map([[ownerId, { path: [ownerId], connectors: new Set([ownerId]) }]]),
    buckets: new Map([
      [1, new Map()],
      [2, new Map()],
      [3, new Map()],
    ]),
  };
}

function registerEdge({
  edge,
  frontier,
  buckets,
  degree,
}) {
  const { requesterId, addresseeId } = edge;
  const permutations = [
    { source: requesterId, target: addresseeId },
    { source: addresseeId, target: requesterId },
  ];

  for (const { source, target } of permutations) {
    if (!frontier.has(source)) {
      continue;
    }
    const sourceMeta = frontier.get(source);
    const bucket = buckets.get(degree);
    if (!bucket) {
      continue;
    }

    const existing = bucket.get(target) ?? {
      connectors: new Set(),
      path: null,
      connectedAt: null,
      lastInteractionAt: null,
      relationshipTag: null,
      notes: null,
    };

    existing.connectors.add(source);
    if (!existing.path) {
      const basePath = sourceMeta?.path ?? [source];
      existing.path = [...basePath, target];
    }

    if (edge.connectedAt) {
      const nextConnectedAt = new Date(edge.connectedAt);
      if (!Number.isNaN(nextConnectedAt.getTime())) {
        if (!existing.connectedAt) {
          existing.connectedAt = nextConnectedAt.toISOString();
        } else {
          const existingDate = new Date(existing.connectedAt);
          if (Number.isNaN(existingDate.getTime()) || nextConnectedAt < existingDate) {
            existing.connectedAt = nextConnectedAt.toISOString();
          }
        }
      }
    }

    if (edge.lastInteractedAt) {
      const nextInteraction = new Date(edge.lastInteractedAt);
      if (!Number.isNaN(nextInteraction.getTime())) {
        if (!existing.lastInteractionAt) {
          existing.lastInteractionAt = nextInteraction.toISOString();
        } else {
          const current = new Date(existing.lastInteractionAt);
          if (Number.isNaN(current.getTime()) || nextInteraction > current) {
            existing.lastInteractionAt = nextInteraction.toISOString();
          }
        }
      }
    }

    if (edge.relationshipTag && !existing.relationshipTag) {
      existing.relationshipTag = edge.relationshipTag;
    }

    if (edge.notes && !existing.notes) {
      existing.notes = edge.notes;
    }

    bucket.set(target, existing);
  }
}

async function traverseNetwork(ownerId) {
  const state = initialiseTraversalState(ownerId);

  for (let degree = 1; degree <= 3; degree += 1) {
    const frontierIds = [...state.frontier.keys()];
    if (!frontierIds.length) {
      break;
    }

    const edges = await Connection.findAll({
      where: {
        status: 'accepted',
        [Op.or]: [{ requesterId: { [Op.in]: frontierIds } }, { addresseeId: { [Op.in]: frontierIds } }],
      },
      attributes: ['requesterId', 'addresseeId', 'connectedAt', 'lastInteractedAt', 'relationshipTag', 'notes'],
      raw: true,
    });

    if (!edges.length) {
      state.frontier = new Map();
      continue;
    }

    const nextFrontier = new Map();

    for (const edge of edges) {
      registerEdge({ edge, frontier: state.frontier, buckets: state.buckets, degree });
    }

    const bucket = state.buckets.get(degree);
    if (!bucket) {
      state.frontier = new Map();
      continue;
    }

    for (const [targetId, metadata] of bucket.entries()) {
      if (state.visited.has(targetId)) {
        continue;
      }
      state.visited.add(targetId);
      nextFrontier.set(targetId, {
        path: metadata.path,
        connectors: new Set([targetId, ...metadata.connectors]),
        connectedAt: metadata.connectedAt,
        lastInteractionAt: metadata.lastInteractionAt,
        relationshipTag: metadata.relationshipTag,
        notes: metadata.notes,
      });
    }

    state.frontier = nextFrontier;
  }

  return state.buckets;
}

export async function buildConnectionNetwork({ userId, viewerId, includePending = false } = {}) {
  if (!userId) {
    throw new ValidationError('A userId is required to inspect the connection network.');
  }

  const profileAttributes = [
    'headline',
    'location',
    'avatarSeed',
    'bio',
    'missionStatement',
    'areasOfFocus',
    'preferredEngagements',
    'availabilityStatus',
    'availableHoursPerWeek',
    'openToRemote',
    'availabilityNotes',
    'trustScore',
  ];

  const [owner, viewer] = await Promise.all([
    User.findByPk(userId, {
      include: [{ model: Profile, attributes: profileAttributes }],
    }),
    viewerId && viewerId !== userId
      ? User.findByPk(viewerId, {
          include: [{ model: Profile, attributes: profileAttributes }],
        })
      : Promise.resolve(null),
  ]);

  if (!owner) {
    throw new NotFoundError('User not found.');
  }

  ensureCanViewNetwork({ viewer, owner });

  const pendingRecords = includePending
    ? await Connection.findAll({
        where: {
          status: 'pending',
          [Op.or]: [{ requesterId: owner.id }, { addresseeId: owner.id }],
        },
        attributes: ['id', 'requesterId', 'addresseeId', 'status', 'notes', 'relationshipTag', 'createdAt'],
        order: [['createdAt', 'DESC']],
        raw: true,
      })
    : [];

  const pendingCounterpartyIds = new Set();
  for (const record of pendingRecords) {
    const counterpartyId = record.requesterId === owner.id ? record.addresseeId : record.requesterId;
    if (counterpartyId) {
      pendingCounterpartyIds.add(counterpartyId);
    }
  }

  let pendingConnectorsMap = new Map();
  if (pendingCounterpartyIds.size) {
    const connectorRows = await Connection.findAll({
      where: {
        status: 'accepted',
        [Op.or]: [
          { requesterId: { [Op.in]: [...pendingCounterpartyIds] } },
          { addresseeId: { [Op.in]: [...pendingCounterpartyIds] } },
        ],
      },
      attributes: ['requesterId', 'addresseeId'],
      raw: true,
    });

    pendingConnectorsMap = new Map();
    for (const row of connectorRows) {
      const { requesterId, addresseeId } = row;
      if (pendingCounterpartyIds.has(requesterId)) {
        if (!pendingConnectorsMap.has(requesterId)) {
          pendingConnectorsMap.set(requesterId, new Set());
        }
        pendingConnectorsMap.get(requesterId).add(addresseeId);
      }
      if (pendingCounterpartyIds.has(addresseeId)) {
        if (!pendingConnectorsMap.has(addresseeId)) {
          pendingConnectorsMap.set(addresseeId, new Set());
        }
        pendingConnectorsMap.get(addresseeId).add(requesterId);
      }
    }
  }

  const traversalBuckets = await traverseNetwork(owner.id);

  const idsToHydrate = new Set([owner.id]);
  pendingCounterpartyIds.forEach((identifier) => idsToHydrate.add(identifier));
  for (const connectors of pendingConnectorsMap.values()) {
    connectors.forEach((identifier) => idsToHydrate.add(identifier));
  }
  for (const bucket of traversalBuckets.values()) {
    for (const [nodeId, metadata] of bucket.entries()) {
      idsToHydrate.add(nodeId);
      for (const connectorId of metadata.connectors) {
        idsToHydrate.add(connectorId);
      }
    }
  }

  const userMap = await fetchUsersByIds([...idsToHydrate]);
  const ownerSummary = userMap.get(owner.id) ?? buildUserSummary(owner);
  const viewerSummary = viewer ? buildUserSummary(viewer) : ownerSummary;
  const viewerRole = viewerSummary.userType;

  const firstDegree = [];
  const secondDegree = [];
  const thirdDegree = [];

  for (const [degree, bucket] of traversalBuckets.entries()) {
    for (const [nodeId, metadata] of bucket.entries()) {
      if (nodeId === owner.id) {
        continue;
      }
      const response = buildNodeResponse({
        ownerId: owner.id,
        nodeId,
        degree,
        metadata,
        userMap,
        viewerRole,
      });
      if (!response) {
        continue;
      }
      if (degree === 1) {
        firstDegree.push(response);
      } else if (degree === 2) {
        secondDegree.push(response);
      } else if (degree === 3) {
        thirdDegree.push(response);
      }
    }
  }

  const policy = {
    actorRole: ownerSummary.userType,
    allowedRoles: resolveAllowedRoles(ownerSummary.userType),
    matrix: buildMatrixSnapshot(),
    notes:
      'Connection tiers require mutual trust. Roles must be reciprocal partners to form direct connections.',
  };

  const ownerDirectIds = new Set(firstDegree.map((connection) => connection.id));

  const pendingInvitations = includePending
    ? pendingRecords
        .map((record) =>
          buildPendingInvitation({
            record,
            ownerId: owner.id,
            userMap,
            connectorsMap: pendingConnectorsMap,
            ownerDirectIds,
          }),
        )
        .filter(Boolean)
    : [];

  const incomingInvitations = pendingInvitations
    .filter((invitation) => invitation.direction === 'incoming')
    .map((invitation) => invitation.payload);
  const outgoingInvitations = pendingInvitations
    .filter((invitation) => invitation.direction === 'outgoing')
    .map((invitation) => invitation.payload);

  const suggestedConnections = secondDegree
    .slice()
    .sort((a, b) => (b.mutualConnections ?? 0) - (a.mutualConnections ?? 0))
    .slice(0, 8);

  const respondedInvites = await Connection.findAll({
    where: {
      addresseeId: owner.id,
      status: { [Op.in]: ['accepted', 'rejected'] },
    },
    attributes: ['status', 'createdAt', 'updatedAt'],
    raw: true,
  });

  const acceptedResponses = respondedInvites.filter((record) => record.status === 'accepted').length;
  const totalResponses = respondedInvites.length;
  const acceptanceRate = totalResponses ? Math.round((acceptedResponses / totalResponses) * 100) : null;
  const responseDurations = respondedInvites
    .map((record) => {
      const created = record.createdAt instanceof Date ? record.createdAt : new Date(record.createdAt);
      const updated = record.updatedAt instanceof Date ? record.updatedAt : new Date(record.updatedAt);
      if (Number.isNaN(created.getTime()) || Number.isNaN(updated.getTime())) {
        return null;
      }
      const diffHours = (updated.getTime() - created.getTime()) / (1000 * 60 * 60);
      return diffHours >= 0 ? diffHours : null;
    })
    .filter((value) => typeof value === 'number');
  const medianResponseHours = median(responseDurations);
  const medianResponse = formatDurationLabel(medianResponseHours);

  const closedIntroductions = await Connection.count({
    where: {
      requesterId: owner.id,
      status: 'accepted',
    },
  });

  return {
    user: ownerSummary,
    viewer: viewerSummary,
    policy,
    summary: {
      firstDegree: firstDegree.length,
      secondDegree: secondDegree.length,
      thirdDegree: thirdDegree.length,
      total: firstDegree.length + secondDegree.length + thirdDegree.length,
    },
    firstDegree: firstDegree.sort((a, b) => a.name.localeCompare(b.name)),
    secondDegree: secondDegree.sort((a, b) => a.name.localeCompare(b.name)),
    thirdDegree: thirdDegree.sort((a, b) => a.name.localeCompare(b.name)),
    pending: includePending
      ? {
          incoming: incomingInvitations,
          outgoing: outgoingInvitations,
        }
      : undefined,
    suggestedConnections,
    invitationAnalytics: {
      acceptanceRate: acceptanceRate ?? null,
      medianResponse: medianResponse ?? null,
      closed: closedIntroductions,
    },
    includePending,
    generatedAt: new Date().toISOString(),
  };
}

export async function listDirectConnections(userId) {
  const result = await buildConnectionNetwork({ userId });
  return result.firstDegree;
}

export async function requestConnection(requesterId, targetId) {
  if (!requesterId || !targetId) {
    throw new ValidationError('Both requesterId and targetId are required.');
  }

  const [requester, target] = await Promise.all([
    User.findByPk(requesterId, { include: [{ model: Profile, attributes: ['headline', 'location', 'avatarSeed'] }] }),
    User.findByPk(targetId, { include: [{ model: Profile, attributes: ['headline', 'location', 'avatarSeed'] }] }),
  ]);

  if (!requester || !target) {
    throw new NotFoundError('Requester or target could not be found.');
  }

  ensureCanRequest({ requester, target });

  const existing = await Connection.findOne({
    where: {
      [Op.or]: [
        { requesterId, addresseeId: targetId },
        { requesterId: targetId, addresseeId: requesterId },
      ],
      status: { [Op.in]: ['pending', 'accepted'] },
    },
  });

  if (existing) {
    throw new ConflictError('A connection between these profiles already exists.');
  }

  const record = await Connection.create({
    requesterId,
    addresseeId: targetId,
    status: 'pending',
  });

  invalidateFeedSuggestions(requesterId, targetId);

  return {
    id: record.id,
    status: record.status,
    requester: buildUserSummary(requester),
    addressee: buildUserSummary(target),
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

export async function respondToConnection({ connectionId, actorId, decision }) {
  if (!connectionId || !actorId) {
    throw new ValidationError('A connectionId and actorId are required.');
  }
  const normalizedDecision = (decision || '').toString().trim().toLowerCase();
  const resolvedDecision = normalizedDecision.startsWith('accept')
    ? 'accept'
    : normalizedDecision.startsWith('declin') || normalizedDecision.startsWith('reject')
    ? 'reject'
    : normalizedDecision === 'withdraw'
    ? 'withdraw'
    : null;

  if (!resolvedDecision) {
    throw new ValidationError('Decision must be "accept", "decline", or "withdraw".');
  }

  if (resolvedDecision === 'withdraw') {
    return withdrawConnection({ connectionId, actorId });
  }

  const record = await Connection.findByPk(connectionId);
  if (!record) {
    throw new NotFoundError('Connection request not found.');
  }

  if (record.addresseeId !== actorId) {
    throw new AuthorizationError('Only the addressee can respond to this connection request.');
  }

  if (record.status === 'accepted' && resolvedDecision === 'accept') {
    return record;
  }

  record.status = resolvedDecision === 'accept' ? 'accepted' : 'rejected';
  await record.save();

  invalidateFeedSuggestions(record.requesterId, record.addresseeId);

  return record;
}

export async function withdrawConnection({ connectionId, actorId }) {
  if (!connectionId || !actorId) {
    throw new ValidationError('A connectionId and actorId are required.');
  }

  const record = await Connection.findByPk(connectionId);
  if (!record) {
    throw new NotFoundError('Connection request not found.');
  }

  if (record.requesterId !== actorId) {
    throw new AuthorizationError('Only the requester can withdraw this connection request.');
  }

  if (record.status !== 'pending') {
    throw new ConflictError('Only pending connection requests can be withdrawn.');
  }

  await record.destroy();
  invalidateFeedSuggestions(record.requesterId, record.addresseeId);

  return {
    id: connectionId,
    status: 'withdrawn',
    requesterId: record.requesterId,
    addresseeId: record.addresseeId,
    updatedAt: new Date().toISOString(),
  };
}

export default {
  buildConnectionNetwork,
  listDirectConnections,
  requestConnection,
  respondToConnection,
  withdrawConnection,
};
