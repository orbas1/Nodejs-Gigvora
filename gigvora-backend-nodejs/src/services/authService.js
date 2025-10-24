import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import twoFactorService from './twoFactorService.js';
import tokenRevocationService from './tokenRevocationService.js';
import { getAuthDomainService, getFeatureFlagService } from '../domains/serviceCatalog.js';
import logger from '../utils/logger.js';

const TOKEN_EXPIRY = process.env.JWT_EXPIRES_IN || '1h';
const REFRESH_EXPIRY = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

const authDomainService = getAuthDomainService();
const featureFlagService = getFeatureFlagService();

const googleClientId = process.env.GOOGLE_CLIENT_ID;
let oauthClient = null;

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
    const error = buildError(
      'Google login is not configured. Please sign in with email and password or contact support to enable Google OAuth.',
      503,
    );
    error.code = 'GOOGLE_LOGIN_DISABLED';
    error.details = { missingEnvironment: 'GOOGLE_CLIENT_ID' };
    logger.warn(
      {
        module: 'authService',
        reason: 'google_login_disabled',
        missingEnvironment: 'GOOGLE_CLIENT_ID',
      },
      'Google login attempted without client configuration.',
    );
    throw error;
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
  if (tokenRevocationService.isRevoked(refreshToken)) {
    throw buildError('Refresh token has been revoked.', 401);
  }
  const payload = verifyRefreshToken(refreshToken);
  const user = await authDomainService.findUserById(payload.id);
  if (!user) {
    throw buildError('Account not found.', 404);
  }

  tokenRevocationService.revoke(refreshToken, {
    expiresAt: payload.exp ? payload.exp * 1000 : null,
    reason: 'rotation',
    userId: payload.id,
    context: {
      ipAddress: options.context?.ipAddress ?? null,
      userAgent: options.context?.userAgent ?? null,
    },
  });

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

function revokeRefreshToken(refreshToken, { userId = null, reason = 'manual', context = {}, expiresAt } = {}) {
  if (!refreshToken) {
    throw buildError('Refresh token is required.', 422);
  }
  let normalizedExpiry = expiresAt;
  if (!normalizedExpiry) {
    const decoded = jwt.decode(refreshToken);
    if (decoded && typeof decoded === 'object' && decoded.exp) {
      normalizedExpiry = decoded.exp * 1000;
    }
  }
  tokenRevocationService.revoke(refreshToken, {
    expiresAt: normalizedExpiry,
    reason,
    userId,
    context,
  });
  return { revoked: true };
}

export default {
  register,
  login,
  verifyTwoFactor,
  resendTwoFactor,
  loginWithGoogle,
  refreshSession,
  revokeRefreshToken,
};
