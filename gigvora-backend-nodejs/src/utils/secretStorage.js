import crypto from 'crypto';

const DEFAULT_SECRET = process.env.AI_PROVIDER_SECRET || process.env.APP_SECRET || process.env.JWT_SECRET || 'gigvora-dev-secret';
const ALGORITHM = 'aes-256-gcm';
const PREFIX = 'enc:v1:';

function getKey() {
  const secret = DEFAULT_SECRET;
  return crypto.createHash('sha256').update(String(secret)).digest();
}

export function encryptSecret(value) {
  if (value == null) {
    return null;
  }
  const normalized = String(value);
  if (!normalized) {
    return null;
  }
  const key = getKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const ciphertext = Buffer.concat([cipher.update(normalized, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  const payload = Buffer.concat([iv, tag, ciphertext]).toString('base64');
  return `${PREFIX}${payload}`;
}

export function isEncryptedSecret(value) {
  return typeof value === 'string' && value.startsWith(PREFIX);
}

export function decryptSecret(value) {
  if (value == null) {
    return null;
  }
  if (!isEncryptedSecret(value)) {
    return value;
  }
  const raw = value.slice(PREFIX.length);
  const buffer = Buffer.from(raw, 'base64');
  const iv = buffer.subarray(0, 12);
  const tag = buffer.subarray(12, 28);
  const ciphertext = buffer.subarray(28);
  const key = getKey();
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return decrypted.toString('utf8');
}

export function maskSecret(value) {
  const decrypted = decryptSecret(value);
  if (!decrypted) {
    return null;
  }
  const normalized = String(decrypted);
  if (normalized.length <= 4) {
    return '*'.repeat(normalized.length);
  }
  return `${'*'.repeat(normalized.length - 4)}${normalized.slice(-4)}`;
}

export function fingerprintSecret(value) {
  const decrypted = decryptSecret(value);
  if (!decrypted) {
    return null;
  }
  const hash = crypto.createHash('sha256').update(decrypted).digest('hex');
  return `${hash.slice(0, 8)}…${hash.slice(-8)}`;
}

export default {
  encryptSecret,
  decryptSecret,
  maskSecret,
  fingerprintSecret,
  isEncryptedSecret,
};
