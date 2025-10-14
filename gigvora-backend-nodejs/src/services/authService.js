import crypto from 'crypto';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { User, sequelize } from '../models/index.js';
import { normalizeLocationPayload } from '../utils/location.js';
import twoFactorService from './twoFactorService.js';
import { resolveAccessTokenSecret, resolveRefreshTokenSecret } from '../utils/jwtSecrets.js';

const TOKEN_EXPIRY = process.env.JWT_EXPIRES_IN || '1h';
const REFRESH_EXPIRY = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
const ALLOWED_TWO_FACTOR_METHODS = ['email', 'app', 'sms'];

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

function deriveMemberships(user) {
  const memberships = new Set();
  if (Array.isArray(user.memberships)) {
    user.memberships.filter(Boolean).forEach((item) => memberships.add(item));
  }
  if (user.userType) {
    memberships.add(user.userType);
  }
  if (memberships.size === 0) {
    memberships.add('user');
  }
  return Array.from(memberships);
}

function sanitizeUser(userInstance) {
  const plain = typeof userInstance.get === 'function' ? userInstance.get({ plain: true }) : userInstance;
  const fullName = [plain.firstName, plain.lastName].filter(Boolean).join(' ').trim() || plain.email;
  return {
    id: plain.id,
    email: plain.email,
    firstName: plain.firstName,
    lastName: plain.lastName,
    name: fullName,
    address: plain.address,
    location: plain.location,
    geoLocation: plain.geoLocation,
    age: plain.age,
    userType: plain.userType,
    twoFactorEnabled: plain.twoFactorEnabled !== false,
    twoFactorMethod: plain.twoFactorMethod || 'email',
    lastLoginAt: plain.lastLoginAt || null,
    googleId: plain.googleId || null,
    memberships: deriveMemberships(plain),
    primaryDashboard: plain.primaryDashboard || plain.userType || 'user',
  };
}

function decodeExpiry(token) {
  const decoded = jwt.decode(token);
  if (!decoded || typeof decoded !== 'object' || !decoded.exp) {
    return null;
  }
  return new Date(decoded.exp * 1000).toISOString();
}

function resolveSecrets() {
  return {
    access: resolveAccessTokenSecret(),
    refresh: resolveRefreshTokenSecret(),
  };
}

async function issueSession(user) {
  const secrets = resolveSecrets();
  const payload = { id: user.id, type: user.userType };
  const accessToken = jwt.sign(payload, secrets.access, { expiresIn: TOKEN_EXPIRY });
  const refreshToken = jwt.sign(payload, secrets.refresh, { expiresIn: REFRESH_EXPIRY });
  const sanitized = sanitizeUser(user);

  await user.update({ lastLoginAt: new Date() });

  return {
    user: { ...sanitized, lastLoginAt: new Date().toISOString() },
    accessToken,
    refreshToken,
    expiresAt: decodeExpiry(accessToken),
  };
}

function normalizeTwoFactorPreference(data = {}) {
  const enabled = data.twoFactorEnabled !== false;
  const preferredMethod = typeof data.twoFactorMethod === 'string' ? data.twoFactorMethod.toLowerCase() : undefined;
  const method = enabled && preferredMethod && ALLOWED_TWO_FACTOR_METHODS.includes(preferredMethod)
    ? preferredMethod
    : 'email';
  return { twoFactorEnabled: enabled, twoFactorMethod: method };
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

  const existing = await User.findOne({ where: { email: data.email } });
  if (existing) {
    throw buildError('An account with this email already exists.', 409);
  }

  const hashedPassword = await bcrypt.hash(data.password, 10);
  const { twoFactorEnabled, twoFactorMethod } = normalizeTwoFactorPreference(data);

  const user = await sequelize.transaction(async (trx) => {
    const locationPayload = normalizeLocationPayload({
      location: data.location ?? data.address,
      geoLocation: data.geoLocation,
    });
    return User.create(
      {
        email: data.email,
        password: hashedPassword,
        firstName: data.firstName,
        lastName: data.lastName,
        address: data.address,
        location: locationPayload.location,
        geoLocation: locationPayload.geoLocation,
        age: data.age,
        userType: data.userType || 'user',
        twoFactorEnabled,
        twoFactorMethod,
      },
      { transaction: trx },
    );
  });

  return sanitizeUser(user);
}

async function login(email, password, options = {}) {
  if (!email || !password) {
    throw buildError('Email and password are required.', 422);
  }
  const user = await User.findOne({ where: { email } });
  if (!user || !user.password) {
    throw buildError('Invalid credentials', 401);
  }

  if (options.requireAdmin && user.userType !== 'admin') {
    throw buildError('Admin access required', 403);
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    throw buildError('Invalid credentials', 401);
  }

  if (user.twoFactorEnabled !== false) {
    const challenge = await twoFactorService.sendToken(user.email, {
      deliveryMethod: user.twoFactorMethod || 'email',
      context: options.context,
    });
    return {
      requiresTwoFactor: true,
      challenge,
      user: sanitizeUser(user),
    };
  }

  const session = await issueSession(user);
  return {
    requiresTwoFactor: false,
    session,
  };
}

async function verifyTwoFactor(email, code, tokenId) {
  if (!email || !code) {
    throw buildError('Email and code are required.', 422);
  }
  const token = await twoFactorService.verifyToken({ email, code, tokenId });
  if (!token) {
    throw buildError('Invalid or expired code', 401);
  }

  const user = await User.findOne({ where: { email } });
  if (!user) {
    throw buildError('Account not found.', 404);
  }

  const session = await issueSession(user);
  return { session };
}

async function resendTwoFactor(tokenId) {
  if (!tokenId) {
    throw buildError('tokenId is required to resend a 2FA code.', 422);
  }
  return twoFactorService.resendToken(tokenId);
}

async function loginWithGoogle(idToken) {
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
  let user = await User.findOne({ where: { email } });

  if (!user) {
    const randomPassword = crypto.randomBytes(32).toString('hex');
    user = await User.create({
      email,
      password: await bcrypt.hash(randomPassword, 10),
      firstName: payload.given_name || 'Google',
      lastName: payload.family_name || 'User',
      userType: 'user',
      twoFactorEnabled: false,
      twoFactorMethod: 'app',
      googleId,
    });
  } else if (!user.googleId || user.googleId !== googleId) {
    await user.update({ googleId, twoFactorEnabled: false });
  }

  const session = await issueSession(user);
  return { session };
}

export default {
  register,
  login,
  verifyTwoFactor,
  resendTwoFactor,
  loginWithGoogle,
};
