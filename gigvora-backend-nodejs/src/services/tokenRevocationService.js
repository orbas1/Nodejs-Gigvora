import crypto from 'crypto';

const DEFAULT_RETENTION_WINDOW_MS = 1000 * 60 * 60 * 24 * 30; // 30 days

function normaliseExpiry(expiresAt) {
  if (!expiresAt) {
    return null;
  }
  if (typeof expiresAt === 'number' && Number.isFinite(expiresAt)) {
    return expiresAt;
  }
  const date = expiresAt instanceof Date ? expiresAt : new Date(expiresAt);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date.getTime();
}

class TokenRevocationService {
  constructor() {
    this.revokedTokens = new Map();
  }

  hashToken(token) {
    if (typeof token !== 'string' || !token) {
      throw new Error('A valid token must be provided for revocation.');
    }
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  purgeExpired(now = Date.now()) {
    for (const [hash, record] of this.revokedTokens.entries()) {
      if (!record.expiresAt || record.expiresAt > now) {
        continue;
      }
      this.revokedTokens.delete(hash);
    }
  }

  isRevoked(token) {
    const hashed = this.hashToken(token);
    this.purgeExpired();
    return this.revokedTokens.has(hashed);
  }

  getRevocationRecord(token) {
    const hashed = this.hashToken(token);
    this.purgeExpired();
    return this.revokedTokens.get(hashed) ?? null;
  }

  revoke(token, { expiresAt, reason = 'manual', userId = null, context = {} } = {}) {
    const hashed = this.hashToken(token);
    const now = Date.now();
    const normalizedExpiry = normaliseExpiry(expiresAt) ?? now + DEFAULT_RETENTION_WINDOW_MS;
    this.revokedTokens.set(hashed, {
      tokenHash: hashed,
      revokedAt: now,
      revokedAtIso: new Date(now).toISOString(),
      expiresAt: normalizedExpiry,
      expiresAtIso: new Date(normalizedExpiry).toISOString(),
      reason,
      userId,
      context: context ?? {},
    });
  }

  flush() {
    this.revokedTokens.clear();
  }
}

const tokenRevocationService = new TokenRevocationService();

export default tokenRevocationService;
export { TokenRevocationService };
