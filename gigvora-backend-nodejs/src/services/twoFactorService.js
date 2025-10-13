import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { Op } from 'sequelize';
import { TwoFactorToken } from '../models/index.js';

const DEFAULT_EXPIRY_MINUTES = 10;
const MAX_ATTEMPTS = (() => {
  const parsed = Number.parseInt(process.env.TWO_FACTOR_MAX_ATTEMPTS ?? '5', 10);
  if (Number.isNaN(parsed) || parsed < 1) {
    return 5;
  }
  return Math.min(parsed, 10);
})();

function resolveExpiryMinutes() {
  const parsed = Number.parseInt(process.env.TWO_FACTOR_EXPIRY_MINUTES ?? `${DEFAULT_EXPIRY_MINUTES}`, 10);
  if (Number.isNaN(parsed) || parsed < 1) {
    return DEFAULT_EXPIRY_MINUTES;
  }
  return Math.min(parsed, 60);
}

function maskEmail(email) {
  if (typeof email !== 'string' || !email.includes('@')) {
    return '***';
  }
  const [user, domain] = email.split('@');
  if (user.length <= 2) {
    return `${user[0] ?? ''}***@${domain}`;
  }
  return `${user.slice(0, 2)}***@${domain}`;
}

function hashCode(code) {
  return crypto.createHash('sha256').update(code).digest('hex');
}

async function getTransporter() {
  if (!process.env.SMTP_HOST) {
    return null;
  }

  const secure = process.env.SMTP_SECURE ? process.env.SMTP_SECURE === 'true' : Number.parseInt(process.env.SMTP_PORT ?? '587', 10) === 465;

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number.parseInt(process.env.SMTP_PORT ?? '587', 10),
    secure,
    auth:
      process.env.SMTP_USER && process.env.SMTP_PASS
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined,
  });
}

async function deliverEmail(email, code, expiresAt, context = {}) {
  const transporter = await getTransporter();
  const subject = 'Your Gigvora verification code';
  const formattedExpiry = expiresAt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  const text = `Your secure Gigvora verification code is ${code}. It expires at ${formattedExpiry}. ` +
    `If you did not initiate this request, please reset your password immediately.`;
  const html = `
    <p style="font-size:16px;line-height:24px;margin:0 0 16px;color:#0f172a">Use the verification code below to continue signing in to Gigvora.</p>
    <p style="font-size:28px;font-weight:700;letter-spacing:8px;margin:0 0 24px;color:#2563eb">${code}</p>
    <p style="font-size:14px;line-height:20px;margin:0 0 8px;color:#0f172a">This code expires at ${formattedExpiry}.</p>
    <p style="font-size:12px;line-height:18px;margin:0;color:#475569">${
      context.ipAddress
        ? `Request originated from ${context.ipAddress}. If this wasn’t you, secure your account.`
        : 'If this wasn’t you, secure your account.'
    }</p>`;

  if (!transporter) {
    console.info(`2FA code for ${email}: ${code}`);
    return;
  }

  const from = process.env.SMTP_FROM || process.env.EMAIL_FROM || 'Gigvora Security <no-reply@gigvora.com>';
  await transporter.sendMail({ from, to: email, subject, text, html });
}

async function invalidateExisting(email) {
  await TwoFactorToken.destroy({ where: { email } });
}

async function sendToken(email, { deliveryMethod = 'email', context } = {}) {
  const code = crypto.randomInt(100000, 999999).toString();
  const expiresAt = new Date(Date.now() + resolveExpiryMinutes() * 60 * 1000);

  await invalidateExisting(email);
  const token = await TwoFactorToken.create({
    email,
    codeHash: hashCode(code),
    deliveryMethod,
    expiresAt,
  });

  if (deliveryMethod === 'email') {
    await deliverEmail(email, code, expiresAt, context);
  }

  return {
    tokenId: token.id,
    email,
    deliveryMethod,
    expiresAt,
    maskedDestination: maskEmail(email),
    debugCode: process.env.NODE_ENV === 'test' ? code : undefined,
  };
}

async function verifyToken({ email, code, tokenId }) {
  if (!tokenId || !code) {
    return null;
  }

  const token = await TwoFactorToken.findOne({ where: { id: tokenId, email } });
  if (!token) {
    return null;
  }

  if (token.consumedAt) {
    return null;
  }

  if (token.expiresAt < new Date()) {
    await token.destroy();
    return null;
  }

  const hashed = hashCode(code.trim());
  if (token.codeHash !== hashed) {
    const attempts = token.attempts + 1;
    await token.update({ attempts });
    if (attempts >= MAX_ATTEMPTS) {
      await token.destroy();
    }
    return null;
  }

  await token.update({ consumedAt: new Date(), attempts: token.attempts + 1 });
  await TwoFactorToken.destroy({ where: { id: token.id } });
  return token;
}

async function clearExpired() {
  await TwoFactorToken.destroy({ where: { expiresAt: { [Op.lt]: new Date() } } });
}

async function resendToken(tokenId) {
  const existing = await TwoFactorToken.findByPk(tokenId);
  if (!existing) {
    throw Object.assign(new Error('Challenge expired'), { status: 404 });
  }
  return sendToken(existing.email, { deliveryMethod: existing.deliveryMethod });
}

export default {
  sendToken,
  verifyToken,
  resendToken,
  clearExpired,
  invalidateExisting,
  maskEmail,
};
