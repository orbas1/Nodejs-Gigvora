import crypto from 'crypto';
import { TwoFactorToken } from '../models/index.js';

const EXPIRY_MINUTES = 10;

async function sendToken(email) {
  const code = crypto.randomInt(100000, 999999).toString();
  const expiresAt = new Date(Date.now() + EXPIRY_MINUTES * 60 * 1000);

  await TwoFactorToken.upsert({ email, code, expiresAt });

  // TODO: integrate with email provider. For now we log to console for development.
  console.log(`2FA code for ${email}: ${code}`);

  return code;
}

async function verifyToken(email, code) {
  const token = await TwoFactorToken.findOne({ where: { email, code } });
  if (!token) return null;
  if (token.expiresAt < new Date()) {
    await token.destroy();
    return null;
  }

  await token.destroy();
  return token;
}

export default { sendToken, verifyToken };
