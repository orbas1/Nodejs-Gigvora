import crypto from 'node:crypto';
import logger from './logger.js';

let cachedKey = null;
let usedFallback = false;

function resolveKey() {
  if (cachedKey) {
    return cachedKey;
  }

  const secretSources = [
    process.env.DB_SETTINGS_SECRET,
    process.env.APP_SECRET_KEY,
    process.env.JWT_SECRET,
    process.env.AUTH_SECRET,
    process.env.SECRET_KEY_BASE,
  ].filter((value) => typeof value === 'string' && value.trim().length > 0);

  let baseSecret = secretSources[0];
  if (!baseSecret) {
    baseSecret = crypto.randomBytes(32).toString('hex');
    usedFallback = true;
    logger.warn(
      'No persistent secret configured for database settings encryption. Generated an ephemeral key; secrets will rotate on restart.',
    );
  }

  cachedKey = crypto.createHash('sha256').update(baseSecret).digest();
  return cachedKey;
}

export function encryptSecret(secret) {
  if (secret == null || secret === '') {
    return null;
  }
  const key = resolveKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const ciphertext = Buffer.concat([cipher.update(String(secret), 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `v1:${iv.toString('hex')}:${authTag.toString('hex')}:${ciphertext.toString('hex')}`;
}

export function decryptSecret(payload) {
  if (!payload) {
    return null;
  }
  const [version, ivHex, tagHex, cipherHex] = String(payload).split(':');
  if (version !== 'v1' || !ivHex || !tagHex || !cipherHex) {
    logger.warn('Unsupported secret payload format encountered while decrypting database credential.');
    return null;
  }

  try {
    const key = resolveKey();
    const iv = Buffer.from(ivHex, 'hex');
    const tag = Buffer.from(tagHex, 'hex');
    const ciphertext = Buffer.from(cipherHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(tag);
    const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    return decrypted.toString('utf8');
  } catch (error) {
    logger.error({ error }, 'Failed to decrypt database connection secret payload.');
    return null;
  }
}

export function didUseEphemeralKey() {
  resolveKey();
  return usedFallback;
}

export default {
  encryptSecret,
  decryptSecret,
  didUseEphemeralKey,
};
