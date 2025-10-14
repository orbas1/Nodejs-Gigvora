const DEFAULT_ACCESS_SECRET = 'gigvora-development-access-secret';
const DEFAULT_REFRESH_SECRET = 'gigvora-development-refresh-secret';

function resolveSecret(value, fallback, name) {
  const trimmed = typeof value === 'string' ? value.trim() : '';
  if (trimmed) {
    return trimmed;
  }
  if (process.env.NODE_ENV && process.env.NODE_ENV.toLowerCase() === 'production') {
    throw Object.assign(new Error(`${name} is not configured`), { status: 500 });
  }
  return fallback;
}

export function resolveAccessTokenSecret() {
  return resolveSecret(process.env.JWT_SECRET, DEFAULT_ACCESS_SECRET, 'JWT secret');
}

export function resolveRefreshTokenSecret() {
  return resolveSecret(process.env.JWT_REFRESH_SECRET, DEFAULT_REFRESH_SECRET, 'JWT refresh secret');
}

export default {
  resolveAccessTokenSecret,
  resolveRefreshTokenSecret,
};
