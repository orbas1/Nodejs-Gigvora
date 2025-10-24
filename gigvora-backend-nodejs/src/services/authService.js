import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import nodemailer from 'nodemailer';
import twoFactorService from './twoFactorService.js';
import { getAuthDomainService, getFeatureFlagService } from '../domains/serviceCatalog.js';
import logger from '../utils/logger.js';

const TOKEN_EXPIRY = process.env.JWT_EXPIRES_IN || '1h';
const REFRESH_EXPIRY = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

const authDomainService = getAuthDomainService();
const featureFlagService = getFeatureFlagService();
const serviceLogger = logger.child({ module: 'authService' });

const googleClientId = process.env.GOOGLE_CLIENT_ID;
let oauthClient = null;
let passwordResetTransporter = null;

function getGoogleClient() {
  if (!googleClientId) {
    return null;
  }
  if (!oauthClient) {
    oauthClient = new OAuth2Client(googleClientId);
  }
  return oauthClient;
}

function buildError(message, status = 400) {
  return Object.assign(new Error(message), { status });
}

function resolvePasswordResetExpiryMinutes() {
  const fallback = 30;
  const parsed = Number.parseInt(process.env.PASSWORD_RESET_EXPIRY_MINUTES ?? `${fallback}`, 10);
  if (Number.isNaN(parsed) || parsed < 5) {
    return fallback;
  }
  return Math.min(parsed, 1440);
}

async function resolvePasswordResetTransporter() {
  if (passwordResetTransporter) {
    return passwordResetTransporter;
  }
  if (!process.env.SMTP_HOST) {
    return null;
  }
  const secure = process.env.SMTP_SECURE
    ? process.env.SMTP_SECURE === 'true'
    : Number.parseInt(process.env.SMTP_PORT ?? '587', 10) === 465;
  passwordResetTransporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number.parseInt(process.env.SMTP_PORT ?? '587', 10),
    secure,
    auth:
      process.env.SMTP_USER && process.env.SMTP_PASS
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined,
  });
  return passwordResetTransporter;
}

function resolvePasswordResetBaseUrl(overrideUrl) {
  const fallback = process.env.PASSWORD_RESET_URL || 'https://app.gigvora.com/reset-password';
  if (!overrideUrl) {
    return fallback;
  }
  try {
    const candidate = new URL(overrideUrl);
    const allowList = (process.env.PASSWORD_RESET_ALLOWED_HOSTS || '')
      .split(',')
      .map((entry) => entry.trim().toLowerCase())
      .filter(Boolean);
    if (allowList.length === 0 || allowList.includes(candidate.host.toLowerCase())) {
      return candidate.toString();
    }
    serviceLogger.warn(
      { host: candidate.host },
      'Rejected password reset redirect host outside of allow list; falling back to default.',
    );
    return fallback;
  } catch (error) {
    serviceLogger.warn({ err: error, overrideUrl }, 'Invalid password reset redirect supplied; using fallback.');
    return fallback;
  }
}

function buildPasswordResetUrl(token, overrideUrl) {
  const baseUrl = resolvePasswordResetBaseUrl(overrideUrl);
  try {
    const url = new URL(baseUrl);
    url.searchParams.set('token', token);
    return url.toString();
  } catch (error) {
    serviceLogger.warn({ err: error, baseUrl }, 'Failed to construct password reset URL; returning fallback string.');
    return `${baseUrl}?token=${encodeURIComponent(token)}`;
  }
}

async function sendPasswordResetEmail(email, resetUrl, expiresAt, context = {}) {
  const transporter = await resolvePasswordResetTransporter();
  const expiration = new Date(expiresAt);
  const formattedExpiry = expiration.toLocaleString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  });
  const subject = 'Reset your Gigvora password';
  const text =
    `We received a request to reset your Gigvora password. Use the secure link below before ${formattedExpiry}.
${resetUrl}

If you did not request this change, please contact support immediately.`;
  const html = `
    <p style="font-size:16px;line-height:24px;margin:0 0 16px;color:#0f172a">
      We received a request to reset your Gigvora password.
    </p>
    <p style="font-size:16px;line-height:24px;margin:0 0 24px">
      <a href="${resetUrl}" style="display:inline-block;padding:12px 20px;border-radius:9999px;background-color:#2563eb;color:#fff;text-decoration:none;font-weight:600">Reset your password</a>
    </p>
    <p style="font-size:14px;line-height:20px;margin:0 0 8px;color:#0f172a">
      This link expires on ${formattedExpiry}.
    </p>
    <p style="font-size:12px;line-height:18px;margin:0;color:#475569">
      ${
        context.ipAddress
          ? `Request originated from ${context.ipAddress}. If this wasn’t you, secure your account or contact support.`
          : 'If this wasn’t you, secure your account or contact support.'
      }
    </p>
  `;

  if (!transporter) {
    serviceLogger.info({ email, resetUrl }, 'SMTP not configured; logging password reset link for audit.');
    serviceLogger.info({ resetUrl }, 'Password reset link');
    return;
  }

  const from = process.env.SMTP_FROM || process.env.EMAIL_FROM || 'Gigvora Security <no-reply@gigvora.com>';
  await transporter.sendMail({ from, to: email, subject, text, html });
}

function sanitizeUser(userInstance) {
  return authDomainService.sanitizeUser(userInstance);
}

function decodeExpiry(token) {
  const decoded = jwt.decode(token);
  if (!decoded || typeof decoded !== 'object' || !decoded.exp) {
    return null;
  }
  return new Date(decoded.exp * 1000).toISOString();
}

function resolveAccessTokenSecret() {
  const secret = process.env.JWT_SECRET || process.env.JWT_ACCESS_SECRET;
  if (!secret) {
    throw buildError('JWT access token secret is not configured.', 500);
  }
  return secret;
}

function resolveRefreshTokenSecret() {
  const secret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;
  if (!secret) {
    throw buildError('JWT refresh token secret is not configured.', 500);
  }
  return secret;
}

function resolveSecrets() {
  return {
    access: resolveAccessTokenSecret(),
    refresh: resolveRefreshTokenSecret(),
  };
}

function verifyRefreshToken(refreshToken) {
  if (!refreshToken) {
    throw buildError('Refresh token is required.', 422);
  }
  const secrets = resolveSecrets();
  try {
    return jwt.verify(refreshToken, secrets.refresh);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw buildError('Refresh token has expired.', 401);
    }
    throw buildError('Invalid refresh token.', 401);
  }
}

async function issueSession(user) {
  const secrets = resolveSecrets();
  const payload = { id: user.id, type: user.userType };
  const accessToken = jwt.sign(payload, secrets.access, { expiresIn: TOKEN_EXPIRY });
  const refreshToken = jwt.sign(payload, secrets.refresh, { expiresIn: REFRESH_EXPIRY });
  await authDomainService.updateLastLogin(user.id);
  const sanitized = sanitizeUser(user);

  return {
    user: { ...sanitized, lastLoginAt: new Date().toISOString() },
    accessToken,
    refreshToken,
    expiresAt: decodeExpiry(accessToken),
  };
}

function ensurePasswordStrength(password) {
  if (typeof password !== 'string' || password.length < 8) {
    throw buildError('Password must be at least 8 characters long.', 422);
  }
}

async function register(data) {
  if (!data.email) {
    throw buildError('Email is required.', 422);
  }
  ensurePasswordStrength(data.password);

  const sanitizedUser = await authDomainService.registerUser(data);
  const featureFlags = await featureFlagService.evaluateForUser(sanitizedUser, {
    traits: { signupChannel: data.signupChannel || 'api', persona: sanitizedUser.userType },
  });
  return { ...sanitizedUser, featureFlags };
}

async function login(email, password, options = {}) {
  if (!email || !password) {
    throw buildError('Email and password are required.', 422);
  }
  const user = await authDomainService.findUserByEmail(email);
  if (!user || !user.password) {
    throw buildError('Invalid credentials', 401);
  }

  if (options.requireAdmin && user.userType !== 'admin') {
    throw buildError('Admin access required', 403);
  }

  const valid = await authDomainService.comparePassword(user, password);
  if (!valid) {
    throw buildError('Invalid credentials', 401);
  }

  const sanitizedUser = sanitizeUser(user);

  if (user.twoFactorEnabled !== false) {
    const challenge = await twoFactorService.sendToken(user.email, {
      deliveryMethod: sanitizedUser.twoFactorMethod,
      context: options.context,
    });
    const featureFlags = await featureFlagService.evaluateForUser(sanitizedUser, {
      traits: { loginContext: 'two_factor_pending' },
    });
    return {
      requiresTwoFactor: true,
      challenge,
      user: { ...sanitizedUser, featureFlags },
    };
  }

  const session = await issueSession(user);
  const featureFlags = await featureFlagService.evaluateForUser(session.user, {
    workspaceIds: options.workspaceIds ?? [],
    traits: { loginContext: options.context?.ipAddress ? 'ip_tracked' : 'standard' },
  });
  session.featureFlags = featureFlags;
  session.user.featureFlags = featureFlags;
  await authDomainService.recordLoginAudit(
    user.id,
    {
      eventType: 'login',
      ipAddress: options.context?.ipAddress,
      userAgent: options.context?.userAgent,
      metadata: { strategy: 'password' },
    },
    {},
  );
  return {
    requiresTwoFactor: false,
    session,
  };
}

async function verifyTwoFactor(email, code, tokenId, options = {}) {
  if (!email || !code) {
    throw buildError('Email and code are required.', 422);
  }
  const token = await twoFactorService.verifyToken({ email, code, tokenId });
  if (!token) {
    throw buildError('Invalid or expired code', 401);
  }

  const user = await authDomainService.findUserByEmail(email);
  if (!user) {
    throw buildError('Account not found.', 404);
  }

  await authDomainService.recordLoginAudit(
    user.id,
    {
      eventType: 'two_factor_verified',
      ipAddress: options.context?.ipAddress,
      userAgent: options.context?.userAgent,
      metadata: { strategy: 'password' },
    },
    {},
  );

  const session = await issueSession(user);
  const featureFlags = await featureFlagService.evaluateForUser(session.user, {
    workspaceIds: options.workspaceIds ?? [],
    traits: { loginContext: 'two_factor_completed' },
  });
  session.featureFlags = featureFlags;
  session.user.featureFlags = featureFlags;
  return { session };
}

async function resendTwoFactor(tokenId) {
  if (!tokenId) {
    throw buildError('tokenId is required to resend a 2FA code.', 422);
  }
  return twoFactorService.resendToken(tokenId);
}

async function loginWithGoogle(idToken, options = {}) {
  if (!idToken) {
    throw buildError('Google ID token is required.', 422);
  }
  const client = getGoogleClient();
  if (!client) {
    throw buildError('Google login is not configured.', 503);
  }

  const ticket = await client.verifyIdToken({ idToken, audience: googleClientId });
  const payload = ticket.getPayload();
  if (!payload?.email) {
    throw buildError('Unable to verify Google account.', 401);
  }
  if (payload.email_verified === false) {
    throw buildError('Google email address is not verified.', 401);
  }

  const email = payload.email.toLowerCase();
  const googleId = payload.sub;
  let user = await authDomainService.findUserByEmail(email);

  if (!user) {
    const randomPassword = crypto.randomBytes(32).toString('hex');
    await authDomainService.registerUser({
      email,
      password: randomPassword,
      firstName: payload.given_name || 'Google',
      lastName: payload.family_name || 'User',
      userType: 'user',
      twoFactorEnabled: false,
      twoFactorMethod: 'app',
      googleId,
    });
    user = await authDomainService.findUserByEmail(email);
  } else if (!user.googleId || user.googleId !== googleId) {
    await user.update({ googleId, twoFactorEnabled: false });
  }

  const session = await issueSession(user);
  const featureFlags = await featureFlagService.evaluateForUser(session.user, {
    traits: { loginContext: 'google_oauth' },
  });
  session.featureFlags = featureFlags;
  session.user.featureFlags = featureFlags;
  await authDomainService.recordLoginAudit(
    user.id,
    {
      eventType: 'login',
      ipAddress: options.context?.ipAddress,
      userAgent: options.context?.userAgent,
      metadata: { strategy: 'google_oauth' },
    },
    {},
  );
  return { session };
}

async function refreshSession(refreshToken, options = {}) {
  const payload = verifyRefreshToken(refreshToken);
  const user = await authDomainService.findUserById(payload.id);
  if (!user) {
    throw buildError('Account not found.', 404);
  }

  const session = await issueSession(user);
  const featureFlags = await featureFlagService.evaluateForUser(session.user, {
    traits: { loginContext: 'refresh_token' },
    workspaceIds: options.workspaceIds ?? [],
  });
  session.featureFlags = featureFlags;
  session.user.featureFlags = featureFlags;

  await authDomainService.recordLoginAudit(
    user.id,
    {
      eventType: 'refresh_token_issued',
      ipAddress: options.context?.ipAddress,
      userAgent: options.context?.userAgent,
      metadata: { strategy: 'refresh_token' },
    },
    {},
  );

  return { session };
}

async function requestPasswordReset(email, options = {}) {
  if (!email) {
    throw buildError('Email is required to request a password reset.', 422);
  }

  let user = null;
  try {
    user = await authDomainService.findUserByEmail(email);
  } catch (error) {
    serviceLogger.debug({ email, err: error }, 'Password reset lookup failed.');
    return { delivered: true };
  }

  if (!user) {
    serviceLogger.info({ email }, 'Password reset requested for non-existent account.');
    return { delivered: true };
  }

  const tokenValue = crypto.randomBytes(48).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(tokenValue).digest('hex');
  const expiresAt = new Date(Date.now() + resolvePasswordResetExpiryMinutes() * 60 * 1000);

  await authDomainService.issuePasswordResetToken(user.id, {
    tokenHash,
    expiresAt,
    ipAddress: options.context?.ipAddress,
    userAgent: options.context?.userAgent,
  });

  const resetUrl = buildPasswordResetUrl(tokenValue, options.redirectUri);
  try {
    await sendPasswordResetEmail(user.email, resetUrl, expiresAt, {
      ipAddress: options.context?.ipAddress,
    });
  } catch (error) {
    serviceLogger.error({ err: error, email: user.email }, 'Failed to dispatch password reset email.');
    throw buildError('Unable to send password reset email.', 500);
  }

  await authDomainService.recordLoginAudit(
    user.id,
    {
      eventType: 'password_reset_requested',
      ipAddress: options.context?.ipAddress,
      userAgent: options.context?.userAgent,
      metadata: { strategy: 'password_reset_email' },
    },
    {},
  );

  return { delivered: true, expiresAt: expiresAt.toISOString() };
}

async function resetPassword(token, password, options = {}) {
  if (!token) {
    throw buildError('Reset token is required.', 422);
  }
  ensurePasswordStrength(password);

  const tokenHash = crypto.createHash('sha256').update(token.trim()).digest('hex');
  const record = await authDomainService.findPasswordResetTokenByHash(tokenHash);
  if (!record || record.consumedAt) {
    throw buildError('Reset token is invalid or has expired.', 401);
  }

  if (new Date(record.expiresAt) < new Date()) {
    await authDomainService.invalidatePasswordResetTokens(record.userId);
    throw buildError('Reset token is invalid or has expired.', 401);
  }

  const user = await authDomainService.findUserById(record.userId);
  if (!user) {
    await authDomainService.invalidatePasswordResetTokens(record.userId);
    throw buildError('Account not found.', 404);
  }

  await authDomainService.updateUserPassword(user.id, password);
  await authDomainService.consumePasswordResetToken(record.id);
  await authDomainService.invalidatePasswordResetTokens(user.id);
  await twoFactorService.invalidateExisting(user.email);

  const session = await issueSession(user);
  const featureFlags = await featureFlagService.evaluateForUser(session.user, {
    traits: { loginContext: 'password_reset' },
  });
  session.featureFlags = featureFlags;
  session.user.featureFlags = featureFlags;

  await authDomainService.recordLoginAudit(
    user.id,
    {
      eventType: 'password_reset_completed',
      ipAddress: options.context?.ipAddress,
      userAgent: options.context?.userAgent,
      metadata: { strategy: 'password_reset' },
    },
    {},
  );

  return { session };
}

export default {
  register,
  login,
  verifyTwoFactor,
  resendTwoFactor,
  loginWithGoogle,
  refreshSession,
  requestPasswordReset,
  resetPassword,
};
