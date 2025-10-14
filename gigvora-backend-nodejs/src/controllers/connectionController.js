import connectionService from '../services/connectionService.js';
import { ValidationError } from '../utils/errors.js';

function parseNumber(value, fallback = undefined) {
  if (value == null) {
    return fallback;
  }
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
}

export async function getNetwork(req, res) {
  const userId = parseNumber(req.query.userId ?? req.params.userId ?? req.body?.userId ?? req.user?.id);
  const viewerId = parseNumber(req.query.viewerId ?? req.user?.id ?? userId);
  const includePending = (req.query.includePending ?? 'false').toString().toLowerCase() === 'true';

  const network = await connectionService.buildConnectionNetwork({
    userId,
    viewerId,
    includePending,
  });

  res.json(network);
}

export async function createConnection(req, res) {
  const requesterId = parseNumber(req.body?.actorId ?? req.body?.requesterId ?? req.user?.id);
  const targetId = parseNumber(req.body?.targetId ?? req.body?.addresseeId);

  if (!requesterId || !targetId) {
    throw new ValidationError('Both actorId and targetId must be supplied to create a connection.');
  }

  const connection = await connectionService.requestConnection(requesterId, targetId);
  res.status(201).json(connection);
}

export async function respondToConnection(req, res) {
  const connectionId = parseNumber(req.params.connectionId ?? req.params.id);
  const actorId = parseNumber(req.body?.actorId ?? req.user?.id);
  const decision = req.body?.decision ?? req.body?.status;

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
