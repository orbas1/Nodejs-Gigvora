export function resolveRequestUserId(req) {
  if (!req) {
    return null;
  }

  const candidates = [
    req.user?.id,
    req.userId,
    req.headers?.['x-user-id'],
    req.headers?.['x-actor-id'],
    req.headers?.['x-user'],
    req.query?.userId,
    req.body?.userId,
    req.body?.actorId,
  ];

  for (const candidate of candidates) {
    if (candidate === undefined || candidate === null) {
      continue;
    }
    const value = Number.parseInt(candidate, 10);
    if (!Number.isNaN(value)) {
      return value;
    }
  }

  return null;
}

export default {
  resolveRequestUserId,
};
