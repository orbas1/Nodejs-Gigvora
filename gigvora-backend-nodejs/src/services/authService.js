import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import { OAuth2Client } from 'google-auth-library';
import twoFactorService from './twoFactorService.js';
import { getAuthDomainService, getFeatureFlagService } from '../domains/serviceCatalog.js';

const TOKEN_EXPIRY = process.env.JWT_EXPIRES_IN || '1h';
const REFRESH_EXPIRY = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

const authDomainService = getAuthDomainService();
const featureFlagService = getFeatureFlagService();

const googleClientId = process.env.GOOGLE_CLIENT_ID;
let oauthClient = null;
let passwordResetTransporter = null;
const PASSWORD_RESET_DEFAULT_COOLDOWN_SECONDS = 120;
const PASSWORD_RESET_MAX_COOLDOWN_SECONDS = 900;

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

function sanitizeUser(userInstance) {
  return authDomainService.sanitizeUser(userInstance);
}

function maskEmail(email) {
  if (typeof email !== 'string' || !email.includes('@')) {
    return '***';
  }
  const [local, domain] = email.split('@');
  if (local.length <= 2) {
    return `${local.slice(0, 1)}***@${domain}`;
  }
  return `${local.slice(0, 2)}***@${domain}`;
}

function resolveAppBaseUrl() {
  const base =
    process.env.APP_BASE_URL || process.env.CLIENT_APP_URL || 'https://app.gigvora.com';
  return base.replace(/\/$/, '');
}

function buildPasswordResetUrl(token) {
  const baseUrl = resolveAppBaseUrl();
  return `${baseUrl}/reset-password?token=${encodeURIComponent(token)}`;
}

function resolveResetCooldownSeconds() {
  const parsed = Number.parseInt(
    process.env.PASSWORD_RESET_COOLDOWN_SECONDS ?? `${PASSWORD_RESET_DEFAULT_COOLDOWN_SECONDS}`,
    10,
  );
  if (!Number.isFinite(parsed) || parsed < 30) {
    return PASSWORD_RESET_DEFAULT_COOLDOWN_SECONDS;
  }
  return Math.min(parsed, PASSWORD_RESET_MAX_COOLDOWN_SECONDS);
}

async function getPasswordResetTransporter() {
  if (!process.env.SMTP_HOST) {
    return null;
  }
  if (passwordResetTransporter) {
    return passwordResetTransporter;
  }
  const port = Number.parseInt(process.env.SMTP_PORT ?? '587', 10);
  const secure = process.env.SMTP_SECURE ? process.env.SMTP_SECURE === 'true' : port === 465;
  passwordResetTransporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure,
    auth:
      process.env.SMTP_USER && process.env.SMTP_PASS
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined,
  });
  return passwordResetTransporter;
}

function formatResetExpiry(expiresAt) {
  if (!(expiresAt instanceof Date)) {
    return '';
  }
  const formatter = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  });
  return formatter.format(expiresAt);
}

async function deliverPasswordResetEmail(user, token, expiresAt, context = {}) {
  const transporter = await getPasswordResetTransporter();
  const resetUrl = buildPasswordResetUrl(token);
  const subject = 'Reset your Gigvora password';
  const formattedExpiry = formatResetExpiry(expiresAt);
  const text =
    `We received a request to reset the password for ${user.email}. Use the secure link below` +
    ` before ${formattedExpiry || 'the link expires'} to set a new password:\n\n${resetUrl}\n\n` +
    `If you did not request this change, contact security@gigvora.com immediately.`;
  const html = `
    <p style="font-size:16px;line-height:24px;color:#0f172a;margin:0 0 16px">
      We received a request to reset the password for <strong>${user.email}</strong>.
      Use the secure link below before ${formattedExpiry || 'the link expires'} to choose a new password.
    </p>
    <p style="margin:0 0 24px"><a href="${resetUrl}" style="display:inline-block;padding:12px 20px;background:#2563eb;color:#fff;font-weight:600;border-radius:9999px;text-decoration:none">Reset password</a></p>
    <p style="font-size:13px;line-height:20px;color:#475569;margin:0">
      If you did not request this change, contact <a href="mailto:security@gigvora.com">security@gigvora.com</a> immediately.
    </p>
    <p style="font-size:12px;line-height:18px;color:#64748b;margin:12px 0 0">
      Request metadata: ${context.ipAddress ? `IP ${context.ipAddress}` : 'IP unknown'} · ${
        context.userAgent || 'no user agent provided'
      }
    </p>
  `;

  if (!transporter) {
    console.info(`Password reset link for ${user.email}: ${resetUrl}`);
    return;
  }

  const from = process.env.SMTP_FROM || process.env.EMAIL_FROM || 'Gigvora Security <no-reply@gigvora.com>';
  await transporter.sendMail({ from, to: user.email, subject, text, html });
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

  let normalizedEmail;
  try {
    normalizedEmail = authDomainService.validateEmail(email);
  } catch (error) {
    const message = error?.message || 'A valid email address is required.';
    throw buildError(message, 422);
  }

  const user = await authDomainService.findUserByEmail(normalizedEmail);
  const context = options.context ?? {};

  if (!user) {
    return {
      accepted: true,
      cooldownSeconds: resolveResetCooldownSeconds(),
      maskedEmail: maskEmail(normalizedEmail),
    };
  }

  const creation = await authDomainService.createPasswordResetToken(user, { context });
  if (creation?.rateLimited) {
    const error = buildError('Password reset recently requested. Please wait before trying again.', 429);
    error.retryAfterSeconds = creation.cooldownSeconds;
    error.cooldownSeconds = creation.cooldownSeconds;
    error.meta = {
      cooldownSeconds: creation.cooldownSeconds,
      retryAvailableAt: creation.retryAvailableAt,
    };
    throw error;
  }

  await deliverPasswordResetEmail(user, creation.token, creation.expiresAt, context);
  await authDomainService.recordLoginAudit(
    user.id,
    {
      eventType: 'password_reset_requested',
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      metadata: { channel: 'self_service' },
    },
    {},
  );

  return {
    accepted: true,
    expiresAt: creation.expiresAt.toISOString(),
    cooldownSeconds: creation.cooldownSeconds,
    maskedEmail: maskEmail(user.email),
  };
}

async function verifyPasswordResetToken(token) {
  if (!token) {
    throw buildError('Reset token is required.', 422);
  }
  const lookup = await authDomainService.findPasswordResetToken(token);
  if (!lookup) {
    throw buildError('Reset link is invalid or has expired.', 404);
  }
  const { user, record } = lookup;
  return {
    valid: true,
    expiresAt: record.expiresAt.toISOString(),
    maskedEmail: maskEmail(user.email),
  };
}

async function resetPassword(token, password, options = {}) {
  if (!token) {
    throw buildError('Reset token is required.', 422);
  }
  ensurePasswordStrength(password);
  const context = options.context ?? {};
  let sanitizedUser = null;

  await authDomainService.registry.transaction('auth', async ({ transaction }) => {
    const lookup = await authDomainService.findPasswordResetToken(token, { transaction });
    if (!lookup) {
      throw buildError('Reset link is invalid or has expired.', 404);
    }
    const { record, user } = lookup;
    const hashedPassword = await authDomainService.hashPassword(password);
    await user.update({ password: hashedPassword }, { transaction });
    await authDomainService.consumePasswordResetToken(
      record,
      {
        metadata: {
          resetAt: new Date().toISOString(),
          ipAddress: context.ipAddress ?? null,
        },
      },
      { transaction },
    );
    sanitizedUser = sanitizeUser(user);
  });

  if (!sanitizedUser) {
    throw buildError('Reset link is invalid or has expired.', 404);
  }

  await authDomainService.recordLoginAudit(
    sanitizedUser.id,
    {
      eventType: 'password_reset_completed',
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      metadata: { channel: 'self_service' },
    },
    {},
  );

  return { success: true, maskedEmail: maskEmail(sanitizedUser.email) };
}

export default {
  register,
  login,
  verifyTwoFactor,
  resendTwoFactor,
  loginWithGoogle,
  refreshSession,
  requestPasswordReset,
  verifyPasswordResetToken,
  resetPassword,
};
