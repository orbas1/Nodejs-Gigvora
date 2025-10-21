import connectionService from '../services/connectionService.js';
import { ValidationError } from '../utils/errors.js';

function parsePositiveInteger(value, fieldName, { required = false } = {}) {
  if (value == null || value === '') {
    if (required) {
      throw new ValidationError(`${fieldName} is required.`);
    }
    return undefined;
  }
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new ValidationError(`${fieldName} must be a positive integer.`);
  }
  return parsed;
}

export async function getNetwork(req, res) {
  const userId =
    parsePositiveInteger(
      req.query?.userId ?? req.params?.userId ?? req.body?.userId ?? req.user?.id,
      'userId',
      { required: true },
    );
  const viewerCandidate = req.query?.viewerId ?? req.user?.id ?? userId;
  const viewerId = viewerCandidate ? parsePositiveInteger(viewerCandidate, 'viewerId') : userId;
  const includePending = (req.query.includePending ?? 'false').toString().toLowerCase() === 'true';

  const network = await connectionService.buildConnectionNetwork({
    userId,
    viewerId,
    includePending,
  });

  res.json(network);
}

export async function createConnection(req, res) {
  const requesterId = parsePositiveInteger(
    req.body?.actorId ?? req.body?.requesterId ?? req.user?.id,
    'actorId',
    { required: true },
  );
  const targetId = parsePositiveInteger(req.body?.targetId ?? req.body?.addresseeId, 'targetId', {
    required: true,
  });

  const connection = await connectionService.requestConnection(requesterId, targetId);
  res.status(201).json(connection);
}

export async function respondToConnection(req, res) {
  const connectionId = parsePositiveInteger(
    req.params?.connectionId ?? req.params?.id,
    'connectionId',
    { required: true },
  );
  const actorId = parsePositiveInteger(req.body?.actorId ?? req.user?.id, 'actorId', { required: true });
  const decision = `${req.body?.decision ?? req.body?.status ?? ''}`.toLowerCase();

  const allowed = new Set(['accepted', 'declined', 'pending', 'blocked']);
  if (!allowed.has(decision)) {
    throw new ValidationError('decision must be accepted, declined, pending, or blocked.');
  }

  const result = await connectionService.respondToConnection({
    connectionId,
    actorId,
    decision,
  });

  res.json({
    id: result.id,
    status: result.status,
    updatedAt: result.updatedAt,
  });
}

export default {
  getNetwork,
  createConnection,
  respondToConnection,
};
