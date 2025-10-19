import { resolveAuthenticatedUser, extractRoleSet } from '../middleware/authentication.js';
import { AuthenticationError } from '../utils/errors.js';

function buildHandshakeRequest(socket) {
  const headers = { ...(socket.handshake?.headers ?? {}) };
  const auth = socket.handshake?.auth ?? {};
  if (auth.token && !headers.authorization) {
    headers.authorization = `Bearer ${auth.token}`;
  }
  if (auth.accessToken && !headers.authorization) {
    headers.authorization = `Bearer ${auth.accessToken}`;
  }
  if (auth['x-user-id'] && !headers['x-user-id']) {
    headers['x-user-id'] = auth['x-user-id'];
  }
  if (auth['x-roles'] && !headers['x-roles']) {
    headers['x-roles'] = auth['x-roles'];
  }
  return {
    headers,
    cookies: socket.handshake?.cookies ?? {},
    query: socket.handshake?.query ?? {},
  };
}

function normalisePermissions(permissions = []) {
  return permissions
    .map((permission) => String(permission ?? '').trim())
    .filter(Boolean)
    .map((permission) => permission.toLowerCase());
}

export async function authenticateSocket(socket, { allowAnonymous = false } = {}) {
  try {
    const req = buildHandshakeRequest(socket);
    const user = await resolveAuthenticatedUser(req, { optional: allowAnonymous });
    if (!user && !allowAnonymous) {
      throw new AuthenticationError('Realtime authentication required.');
    }
    if (!user) {
      return { id: null, roles: [], permissions: [], user: null };
    }
    const roles = Array.from(extractRoleSet(user));
    const permissions = normalisePermissions(user.permissions ?? []);
    return {
      id: user.id,
      roles,
      permissions,
      user,
      memberships: user.memberships ?? [],
    };
  } catch (error) {
    if (error instanceof AuthenticationError) {
      throw error;
    }
    throw new AuthenticationError(error.message || 'Unable to authenticate realtime connection.');
  }
}

export default authenticateSocket;
