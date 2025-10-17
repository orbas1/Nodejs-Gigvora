import {
  getFreelancerNetworkingDashboard,
  bookNetworkingSessionForFreelancer,
  updateFreelancerNetworkingSignup,
  listFreelancerNetworkingConnections,
  createFreelancerNetworkingConnection,
  updateFreelancerNetworkingConnection,
} from '../services/freelancerNetworkingService.js';
import { AuthorizationError, ValidationError } from '../utils/errors.js';

function parsePositiveInteger(value, label = 'id') {
  if (value == null || value === '') {
    return null;
  }
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new ValidationError(`${label} must be a positive integer.`);
  }
  return parsed;
}

function ensureFreelancerAccess(user, freelancerId) {
  if (!freelancerId) {
    throw new ValidationError('freelancerId is required.');
  }
  if (!user) {
    throw new AuthorizationError('Authentication required.');
  }
  if (Number(user.id) === Number(freelancerId)) {
    return;
  }
  const permissions = new Set(
    Array.isArray(user.permissions)
      ? user.permissions.map((permission) => String(permission).toLowerCase())
      : [],
  );
  if (
    permissions.has('freelancer.manage.any') ||
    permissions.has('networking.manage.any') ||
    permissions.has('admin')
  ) {
    return;
  }
  throw new AuthorizationError('You do not have permission to manage this networking workspace.');
}

export async function dashboard(req, res) {
  const freelancerId =
    parsePositiveInteger(req.params.freelancerId ?? req.query.freelancerId, 'freelancerId') ??
    parsePositiveInteger(req.user?.id, 'freelancerId');
  ensureFreelancerAccess(req.user, freelancerId);

  const lookbackDays = req.query?.lookbackDays ? Number(req.query.lookbackDays) : undefined;
  const limitConnections = req.query?.limitConnections
    ? Number(req.query.limitConnections)
    : undefined;

  const payload = await getFreelancerNetworkingDashboard(freelancerId, {
    lookbackDays,
    limitConnections,
  });
  res.json(payload);
}

export async function book(req, res) {
  const freelancerId = parsePositiveInteger(req.params.freelancerId, 'freelancerId');
  ensureFreelancerAccess(req.user, freelancerId);
  const sessionId = parsePositiveInteger(req.params.sessionId, 'sessionId');
  const payload = await bookNetworkingSessionForFreelancer(freelancerId, sessionId, req.body ?? {});
  res.status(201).json(payload);
}

export async function updateSignup(req, res) {
  const freelancerId = parsePositiveInteger(req.params.freelancerId, 'freelancerId');
  ensureFreelancerAccess(req.user, freelancerId);
  const signupId = parsePositiveInteger(req.params.signupId, 'signupId');
  const payload = await updateFreelancerNetworkingSignup(freelancerId, signupId, req.body ?? {});
  res.json(payload);
}

export async function listConnections(req, res) {
  const freelancerId = parsePositiveInteger(req.params.freelancerId, 'freelancerId');
  ensureFreelancerAccess(req.user, freelancerId);
  const limit = req.query?.limit ? Number(req.query.limit) : undefined;
  const payload = await listFreelancerNetworkingConnections(freelancerId, { limit });
  res.json(payload);
}

export async function createConnection(req, res) {
  const freelancerId = parsePositiveInteger(req.params.freelancerId, 'freelancerId');
  ensureFreelancerAccess(req.user, freelancerId);
  const payload = await createFreelancerNetworkingConnection(freelancerId, req.body ?? {});
  res.status(201).json(payload);
}

export async function updateConnection(req, res) {
  const freelancerId = parsePositiveInteger(req.params.freelancerId, 'freelancerId');
  ensureFreelancerAccess(req.user, freelancerId);
  const connectionId = parsePositiveInteger(req.params.connectionId, 'connectionId');
  const payload = await updateFreelancerNetworkingConnection(freelancerId, connectionId, req.body ?? {});
  res.json(payload);
}

export default {
  dashboard,
  book,
  updateSignup,
  listConnections,
  createConnection,
  updateConnection,
};
