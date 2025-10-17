import crypto from 'crypto';

function resolveKeyMaterial() {
  const seed =
    process.env.AGENCY_AI_SECRET || process.env.AGENCY_AI_KMS_SECRET || process.env.APP_SECRET || process.env.JWT_SECRET ||
    'gigvora-development-secret-key';
  return crypto.createHash('sha256').update(seed).digest();
}

const KEY = resolveKeyMaterial();
const IV_LENGTH = 12; // AES-GCM recommended

export function encryptSecret(plainText) {
  if (plainText == null) {
    return null;
  }
  const normalized = String(plainText);
  if (!normalized.trim()) {
    return null;
  }
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-gcm', KEY, iv);
  const encrypted = Buffer.concat([cipher.update(normalized, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString('base64')}.${encrypted.toString('base64')}.${authTag.toString('base64')}`;
}

export function decryptSecret(payload) {
  if (!payload || typeof payload !== 'string') {
    return null;
  }
  const segments = payload.split('.');
  if (segments.length !== 3) {
    return null;
  }
  try {
    const iv = Buffer.from(segments[0], 'base64');
    const encrypted = Buffer.from(segments[1], 'base64');
    const authTag = Buffer.from(segments[2], 'base64');
    const decipher = crypto.createDecipheriv('aes-256-gcm', KEY, iv);
    decipher.setAuthTag(authTag);
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    return decrypted.toString('utf8');
  } catch (error) {
    if (process.env.NODE_ENV !== 'test') {
      // eslint-disable-next-line no-console
      console.error('[secretVault] failed to decrypt payload', error);
    }
    return null;
  }
}

export default {
  encryptSecret,
  decryptSecret,
};
