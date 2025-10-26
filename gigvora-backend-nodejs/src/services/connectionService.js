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

function buildUserSummary(user) {
  const firstName = user.firstName || '';
  const lastName = user.lastName || '';
  const name = [firstName, lastName].filter(Boolean).join(' ').trim() || user.email;
  const profile = user.Profile ?? {};
  return {
    id: user.id,
    name,
    userType: normaliseRole(user.userType),
    headline: profile.headline ?? null,
    location: profile.location ?? null,
    avatarSeed: (profile.avatarSeed ?? name) || `user-${user.id}`,
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

async function fetchUsersByIds(ids) {
  if (!ids.length) {
    return new Map();
  }

  const users = await User.findAll({
    where: { id: { [Op.in]: ids } },
    include: [{ model: Profile, attributes: ['headline', 'location', 'avatarSeed'] }],
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
    };

    existing.connectors.add(source);
    if (!existing.path) {
      const basePath = sourceMeta?.path ?? [source];
      existing.path = [...basePath, target];
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
      attributes: ['requesterId', 'addresseeId'],
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

  const [owner, viewer] = await Promise.all([
    User.findByPk(userId, {
      include: [{ model: Profile, attributes: ['headline', 'location', 'avatarSeed'] }],
    }),
    viewerId && viewerId !== userId
      ? User.findByPk(viewerId, {
          include: [{ model: Profile, attributes: ['headline', 'location', 'avatarSeed'] }],
        })
      : Promise.resolve(null),
  ]);

  if (!owner) {
    throw new NotFoundError('User not found.');
  }

  ensureCanViewNetwork({ viewer, owner });

  const traversalBuckets = await traverseNetwork(owner.id);

  const idsToHydrate = new Set([owner.id]);
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
  if (!['accept', 'reject'].includes(normalizedDecision)) {
    throw new ValidationError('Decision must be either "accept" or "reject".');
  }

  const record = await Connection.findByPk(connectionId);
  if (!record) {
    throw new NotFoundError('Connection request not found.');
  }

  if (record.addresseeId !== actorId) {
    throw new AuthorizationError('Only the addressee can respond to this connection request.');
  }

  if (record.status === 'accepted' && normalizedDecision === 'accept') {
    return record;
  }

  record.status = normalizedDecision === 'accept' ? 'accepted' : 'rejected';
  await record.save();

  invalidateFeedSuggestions(record.requesterId, record.addresseeId);

  return record;
}

export default {
  buildConnectionNetwork,
  listDirectConnections,
  requestConnection,
  respondToConnection,
};
