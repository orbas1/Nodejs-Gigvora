import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import fetch from 'node-fetch';
import jwkToPem from 'jwk-to-pem';
import { OAuth2Client } from 'google-auth-library';
import twoFactorService from './twoFactorService.js';
import { getAuthDomainService, getFeatureFlagService } from '../domains/serviceCatalog.js';
import { evaluatePasswordStrength } from '../../../shared-contracts/security/passwordStrength.js';
import {
  getRefreshTokenInvalidation,
  getRefreshTokenRevocation,
  invalidateRefreshTokensForUser,
  isRefreshTokenRevoked,
  markRefreshTokenRevoked,
  persistRefreshSession,
} from './refreshTokenStore.js';

const TOKEN_EXPIRY = process.env.JWT_EXPIRES_IN || '1h';
const REFRESH_EXPIRY = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

const authDomainService = getAuthDomainService();
const featureFlagService = getFeatureFlagService();

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const appleClientId =
  process.env.APPLE_SIGNIN_CLIENT_ID || process.env.APPLE_SERVICE_ID || process.env.APPLE_CLIENT_ID;
const LINKEDIN_USERINFO_URL = 'https://api.linkedin.com/v2/userinfo';
const LINKEDIN_EMAIL_URL =
  'https://api.linkedin.com/v2/emailAddress?q=members&projection=(elements*(handle~))';
const LINKEDIN_TOKEN_URL = 'https://www.linkedin.com/oauth/v2/accessToken';
const APPLE_KEYS_URL = 'https://appleid.apple.com/auth/keys';
const APPLE_KEYS_TTL = 1000 * 60 * 60; // 1 hour
let appleSigningKeys = new Map();
let appleKeysFetchedAt = 0;
let oauthClient = null;
let passwordResetTransporter = null;
const PASSWORD_RESET_DEFAULT_COOLDOWN_SECONDS = 120;
const PASSWORD_RESET_MAX_COOLDOWN_SECONDS = 900;

const linkedinClientId = process.env.LINKEDIN_CLIENT_ID;
const linkedinClientSecret = process.env.LINKEDIN_CLIENT_SECRET;
const defaultLinkedinRedirectUri = process.env.LINKEDIN_REDIRECT_URI;

const SOCIAL_LOGIN_CONFIG = {
  google: {
    idField: 'googleId',
    displayName: 'Google',
    loginContext: 'google_oauth',
    auditStrategy: 'google_oauth',
    missingEmailMessage:
      'Google account did not provide an email address. Use password login once to link your account.',
    notFoundMessage: 'Unable to resolve Google account owner.',
    defaultFirstName: 'Google',
    defaultLastName: 'User',
    findUserById: (identifier, options = {}) =>
      typeof authDomainService.findUserByGoogleId === 'function'
        ? authDomainService.findUserByGoogleId(identifier, options)
        : null,
  },
  apple: {
    idField: 'appleId',
    displayName: 'Apple',
    loginContext: 'apple_oauth',
    auditStrategy: 'apple_oauth',
    missingEmailMessage:
      'Apple account did not provide an email address. Use email login once to link your account.',
    notFoundMessage: 'Unable to resolve Apple account owner.',
    defaultFirstName: 'Apple',
    defaultLastName: 'Member',
    findUserById: (identifier, options = {}) => authDomainService.findUserByAppleId(identifier, options),
  },
  linkedin: {
    idField: 'linkedinId',
    displayName: 'LinkedIn',
    loginContext: 'linkedin_oauth',
    auditStrategy: 'linkedin_oauth',
    missingEmailMessage:
      'LinkedIn account did not return an email address. Add email scope or link your account manually.',
    notFoundMessage: 'Unable to resolve LinkedIn account owner.',
    defaultFirstName: 'LinkedIn',
    defaultLastName: 'Member',
    findUserById: (identifier, options = {}) => authDomainService.findUserByLinkedinId(identifier, options),
  },
};

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

async function refreshAppleKeys() {
  const now = Date.now();
  if (appleSigningKeys.size > 0 && now - appleKeysFetchedAt < APPLE_KEYS_TTL) {
    return appleSigningKeys;
  }

  const response = await fetch(APPLE_KEYS_URL, { method: 'GET' });
  if (!response.ok) {
    throw buildError('Unable to download Apple signing keys.', 503);
  }

  const payload = await response.json();
  if (!payload?.keys || !Array.isArray(payload.keys)) {
    throw buildError('Apple signing keys response malformed.', 503);
  }

  const nextKeys = new Map();
  for (const jwk of payload.keys) {
    if (!jwk?.kid) {
      continue;
    }
    try {
      nextKeys.set(jwk.kid, jwkToPem(jwk));
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('Failed to convert Apple JWK to PEM', error);
    }
  }

  if (nextKeys.size === 0) {
    throw buildError('Apple signing keyset is empty.', 503);
  }

  appleSigningKeys = nextKeys;
  appleKeysFetchedAt = now;
  return appleSigningKeys;
}

async function getAppleSigningKey(kid) {
  if (!kid) {
    throw buildError('Apple signing key id missing.', 401);
  }
  const keys = await refreshAppleKeys();
  const pem = keys.get(kid);
  if (!pem) {
    // Force refresh once if key missing
    appleSigningKeys = new Map();
    const refreshed = await refreshAppleKeys();
    const fallback = refreshed.get(kid);
    if (!fallback) {
      throw buildError('Unable to resolve Apple signing key.', 401);
    }
    return fallback;
  }
  return pem;
}

function splitName(fullName) {
  if (!fullName) {
    return { firstName: 'LinkedIn', lastName: 'Member' };
  }
  const segments = `${fullName}`.trim().split(/\s+/u).filter(Boolean);
  if (segments.length === 0) {
    return { firstName: 'LinkedIn', lastName: 'Member' };
  }
  if (segments.length === 1) {
    return { firstName: segments[0], lastName: 'Member' };
  }
  const [firstName, ...rest] = segments;
  return { firstName, lastName: rest.join(' ') };
}

async function fetchLinkedInProfile(accessToken) {
  const headers = { Authorization: `Bearer ${accessToken}` };
  const userInfoResponse = await fetch(LINKEDIN_USERINFO_URL, { headers });
  if (!userInfoResponse.ok) {
    throw buildError('Unable to verify LinkedIn access token.', 401);
  }
  const userInfo = await userInfoResponse.json();
  const id = userInfo?.sub || userInfo?.id;
  if (!id) {
    throw buildError('LinkedIn did not return a member identifier.', 401);
  }
  let email = typeof userInfo?.email === 'string' ? userInfo.email : null;
  if (!email) {
    const emailResponse = await fetch(LINKEDIN_EMAIL_URL, { headers });
    if (emailResponse.ok) {
      const emailPayload = await emailResponse.json();
      const element = Array.isArray(emailPayload?.elements)
        ? emailPayload.elements.find((entry) => entry?.['handle~']?.emailAddress)
        : null;
      email = element?.['handle~']?.emailAddress ?? null;
    }
  }
  const givenName = userInfo?.given_name || userInfo?.localizedFirstName;
  const familyName = userInfo?.family_name || userInfo?.localizedLastName;
  const fullName = userInfo?.name || [givenName, familyName].filter(Boolean).join(' ');
  const { firstName, lastName } = splitName(fullName || email || 'LinkedIn Member');
  return {
    id,
    email,
    firstName,
    lastName,
  };
}

function resolveLinkedInRedirectUri(override) {
  const redirectUri = override || defaultLinkedinRedirectUri;
  if (!redirectUri) {
    throw buildError('LinkedIn redirect URI is not configured.', 500);
  }
  return redirectUri;
}

async function exchangeLinkedInAuthorizationCode(code, overrideRedirectUri) {
  if (!code) {
    throw buildError('LinkedIn authorization code is required.', 422);
  }
  if (!linkedinClientId || !linkedinClientSecret) {
    throw buildError('LinkedIn login is not configured.', 503);
  }

  const redirectUri = resolveLinkedInRedirectUri(overrideRedirectUri);
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
    client_id: linkedinClientId,
    client_secret: linkedinClientSecret,
  });

  const response = await fetch(LINKEDIN_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!response.ok) {
    const payload = await response.text();
    throw buildError(
      `Unable to exchange LinkedIn authorization code. (${response.status}) ${payload || ''}`.trim(),
      response.status === 401 ? 401 : 502,
    );
  }

  const payload = await response.json();
  const accessToken = payload?.access_token;
  if (!accessToken) {
    throw buildError('LinkedIn token exchange response missing access_token.', 502);
  }

  return {
    accessToken,
    expiresIn: payload?.expires_in ?? null,
  };
}

function normalizeEmail(value) {
  if (typeof value !== 'string') {
    return null;
  }
  const trimmed = value.trim();
  return trimmed ? trimmed.toLowerCase() : null;
}

function coerceNamePart(value, fallback) {
  if (typeof value !== 'string') {
    return fallback;
  }
  const trimmed = value.trim();
  return trimmed || fallback;
}

function generateRandomPassword() {
  return crypto.randomBytes(32).toString('hex');
}

function getSocialConfig(provider) {
  const config = SOCIAL_LOGIN_CONFIG[provider];
  if (!config) {
    throw new Error(`Unsupported social login provider: ${provider}`);
  }
  return config;
}

async function resolveSocialUser({
  provider,
  providerId,
  email,
  firstName,
  lastName,
}) {
  const config = getSocialConfig(provider);
  if (!providerId) {
    throw buildError(`${config.displayName} identifier is required.`, 422);
  }

  let user = null;
  if (typeof config.findUserById === 'function') {
    user = await config.findUserById(providerId);
  }

  const normalizedEmail = normalizeEmail(email);
  if (!user && normalizedEmail) {
    user = await authDomainService.findUserByEmail(normalizedEmail);
  }

  if (!user && !normalizedEmail) {
    throw buildError(config.missingEmailMessage, 409);
  }

  if (!user) {
    await authDomainService.registerUser({
      email: normalizedEmail,
      password: generateRandomPassword(),
      firstName: coerceNamePart(firstName, config.defaultFirstName),
      lastName: coerceNamePart(lastName, config.defaultLastName),
      userType: 'user',
      twoFactorEnabled: false,
      twoFactorMethod: 'app',
      [config.idField]: providerId,
    });
    user = await authDomainService.findUserByEmail(normalizedEmail);
  }

  if (!user) {
    throw buildError(config.notFoundMessage, 404);
  }

  const updates = {};
  if (!user[config.idField] || user[config.idField] !== providerId) {
    updates[config.idField] = providerId;
  }
  if (user.twoFactorEnabled) {
    updates.twoFactorEnabled = false;
  }

  if (Object.keys(updates).length > 0) {
    await user.update(updates);
  }

  return user;
}

async function finalizeSocialLogin({ provider, user, context }) {
  const config = getSocialConfig(provider);
  const session = await issueSession(user, { context });
  const featureFlags = await featureFlagService.evaluateForUser(session.user, {
    traits: { loginContext: config.loginContext },
  });
  session.featureFlags = featureFlags;
  session.user.featureFlags = featureFlags;
  await authDomainService.recordLoginAudit(
    user.id,
    {
      eventType: 'login',
      ipAddress: context?.ipAddress,
      userAgent: context?.userAgent,
      metadata: { strategy: config.auditStrategy },
    },
    {},
  );
  return { session };
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

async function issueSession(user, { context = null } = {}) {
  const secrets = resolveSecrets();
  const payload = { id: user.id, type: user.userType };
  const accessToken = jwt.sign(payload, secrets.access, { expiresIn: TOKEN_EXPIRY });
  const refreshToken = jwt.sign(payload, secrets.refresh, { expiresIn: REFRESH_EXPIRY });
  await authDomainService.updateLastLogin(user.id);
  const refreshRecord = await persistRefreshSession(refreshToken, {
    userId: user.id,
    context,
  });
  const sanitized = sanitizeUser(user);

  const refreshMeta = {
    deviceFingerprint: refreshRecord?.deviceFingerprint ?? null,
    deviceLabel: refreshRecord?.deviceLabel ?? null,
    riskLevel: refreshRecord?.riskLevel ?? 'low',
    riskScore: refreshRecord?.riskScore ?? 0,
    riskSignals: Array.isArray(refreshRecord?.riskSignals) ? refreshRecord.riskSignals : [],
    expiresAt: refreshRecord?.expiresAt instanceof Date
      ? refreshRecord.expiresAt.toISOString()
      : refreshRecord?.expiresAt
        ? new Date(refreshRecord.expiresAt).toISOString()
        : null,
  };

  return {
    user: { ...sanitized, lastLoginAt: new Date().toISOString() },
    accessToken,
    refreshToken,
    expiresAt: decodeExpiry(accessToken),
    refreshMeta,
    sessionRisk: { level: refreshMeta.riskLevel, score: refreshMeta.riskScore },
  };
}

function ensurePasswordStrength(password) {
  if (typeof password !== 'string') {
    throw buildError('Password must be provided as a string.', 422);
  }
  const assessment = evaluatePasswordStrength(password);
  if (assessment.valid) {
    return;
  }
  const guidance = [...assessment.recommendations, ...assessment.compromised];
  const message = guidance[0] || 'Password does not meet the required complexity.';
  const error = buildError(message, 422);
  error.meta = {
    recommendations: assessment.recommendations,
    compromised: assessment.compromised,
    score: assessment.score,
    length: assessment.length,
  };
  throw error;
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

  const session = await issueSession(user, { context: options.context ?? null });
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

  const session = await issueSession(user, { context: options.context ?? null });
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

  const email = payload.email;
  const googleId = payload.sub;
  const user = await resolveSocialUser({
    provider: 'google',
    providerId: googleId,
    email,
    firstName: payload.given_name,
    lastName: payload.family_name,
  });

  return finalizeSocialLogin({ provider: 'google', user, context: options.context ?? null });
}

async function loginWithApple(identityToken, options = {}) {
  if (!identityToken) {
    throw buildError('Apple identity token is required.', 422);
  }
  if (!appleClientId) {
    throw buildError('Apple login is not configured.', 503);
  }

  const decoded = jwt.decode(identityToken, { complete: true });
  const kid = decoded?.header?.kid;
  const signingKey = await getAppleSigningKey(kid);
  let payload;
  try {
    payload = jwt.verify(identityToken, signingKey, {
      algorithms: ['RS256'],
      audience: appleClientId,
      issuer: 'https://appleid.apple.com',
    });
  } catch (error) {
    throw buildError('Unable to verify Apple identity token.', 401);
  }

  const appleId = payload?.sub;
  if (!appleId) {
    throw buildError('Apple identity token missing subject.', 401);
  }

  const user = await resolveSocialUser({
    provider: 'apple',
    providerId: appleId,
    email: payload?.email,
    firstName: payload?.given_name,
    lastName: payload?.family_name,
  });

  return finalizeSocialLogin({ provider: 'apple', user, context: options.context ?? null });
}

async function loginWithLinkedIn(accessToken, options = {}) {
  let resolvedAccessToken = accessToken;

  if (!resolvedAccessToken) {
    const authorizationCode = options.authorizationCode;
    if (!authorizationCode) {
      throw buildError('LinkedIn access token or authorization code is required.', 422);
    }
    const exchange = await exchangeLinkedInAuthorizationCode(authorizationCode, options.redirectUri);
    resolvedAccessToken = exchange.accessToken;
  }

  const profile = await fetchLinkedInProfile(resolvedAccessToken);
  const user = await resolveSocialUser({
    provider: 'linkedin',
    providerId: profile.id,
    email: profile.email,
    firstName: profile.firstName,
    lastName: profile.lastName,
  });

  return finalizeSocialLogin({ provider: 'linkedin', user, context: options.context ?? null });
}

async function refreshSession(refreshToken, options = {}) {
  const payload = verifyRefreshToken(refreshToken);

  if (await isRefreshTokenRevoked(refreshToken)) {
    throw buildError('Refresh token has been revoked.', 401);
  }

  const invalidation = await getRefreshTokenInvalidation(payload.id);
  if (invalidation?.invalidatedAt) {
    const invalidatedAt = new Date(invalidation.invalidatedAt).getTime();
    if (Number.isFinite(invalidatedAt) && payload.iat * 1000 <= invalidatedAt) {
      throw buildError('Refresh token has been revoked.', 401);
    }
  }

  const user = await authDomainService.findUserById(payload.id);
  if (!user) {
    throw buildError('Account not found.', 404);
  }

  const session = await issueSession(user, { context: options.context ?? null });
  const featureFlags = await featureFlagService.evaluateForUser(session.user, {
    traits: { loginContext: 'refresh_token' },
    workspaceIds: options.workspaceIds ?? [],
  });
  session.featureFlags = featureFlags;
  session.user.featureFlags = featureFlags;

  await markRefreshTokenRevoked(refreshToken, {
    userId: payload.id,
    reason: 'rotated',
    context: options.context ?? null,
    actorId: options.context?.actorId ?? null,
    replacedByToken: session.refreshToken,
  });

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

  await invalidateRefreshTokensForUser(sanitizedUser.id, {
    reason: 'password_reset',
    actorId: sanitizedUser.id,
  });

  return { success: true, maskedEmail: maskEmail(sanitizedUser.email) };
}

async function revokeRefreshToken(refreshToken, options = {}) {
  if (!refreshToken) {
    throw buildError('Refresh token is required.', 422);
  }

  const payload = verifyRefreshToken(refreshToken);
  const existing = await getRefreshTokenRevocation(refreshToken);
  let revocation = existing;
  if (!revocation) {
    revocation = await markRefreshTokenRevoked(refreshToken, {
      userId: payload.id,
      reason: options.reason ?? 'logout',
      context: options.context ?? null,
      actorId: options.context?.actorId ?? null,
    });
    await authDomainService.recordLoginAudit(
      payload.id,
      {
        eventType: 'refresh_token_revoked',
        ipAddress: options.context?.ipAddress,
        userAgent: options.context?.userAgent,
        metadata: { reason: options.reason ?? 'logout' },
      },
      {},
    );
  }

  return {
    success: true,
    revokedAt: revocation?.revokedAt ?? new Date().toISOString(),
    reason: revocation?.reason ?? options.reason ?? 'logout',
  };
}

export default {
  register,
  login,
  verifyTwoFactor,
  resendTwoFactor,
  loginWithGoogle,
  loginWithApple,
  loginWithLinkedIn,
  refreshSession,
  requestPasswordReset,
  verifyPasswordResetToken,
  resetPassword,
  revokeRefreshToken,
};
