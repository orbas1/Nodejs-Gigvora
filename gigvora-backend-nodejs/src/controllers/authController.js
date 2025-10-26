import { CompanyProfile, AgencyProfile } from '../models/index.js';
import authService from '../services/authService.js';
import { normalizeLocationPayload } from '../utils/location.js';

export async function registerUser(req, res) {
  const user = await authService.register({ ...req.body, userType: 'user' });
  res.status(201).json(user);
}

export async function registerCompany(req, res) {
  const user = await authService.register({ ...req.body, userType: 'company' });
  const locationPayload = normalizeLocationPayload({
    location: req.body.location,
    geoLocation: req.body.geoLocation,
  });
  await CompanyProfile.create({
    userId: user.id,
    companyName: req.body.companyName,
    description: req.body.description || '',
    website: req.body.website || '',
    location: locationPayload.location,
    geoLocation: locationPayload.geoLocation,
  });
  res.status(201).json(user);
}

export async function registerAgency(req, res) {
  const user = await authService.register({ ...req.body, userType: 'agency' });
  const locationPayload = normalizeLocationPayload({
    location: req.body.location,
    geoLocation: req.body.geoLocation,
  });
  await AgencyProfile.create({
    userId: user.id,
    agencyName: req.body.agencyName,
    focusArea: req.body.focusArea || '',
    website: req.body.website || '',
    location: locationPayload.location,
    geoLocation: locationPayload.geoLocation,
  });
  res.status(201).json(user);
}

export async function login(req, res) {
  const { email, password } = req.body;
  const response = await authService.login(email, password, { context: { ipAddress: req.ip } });
  res.json(response);
}

export async function adminLogin(req, res) {
  const { email, password } = req.body;
  const response = await authService.login(email, password, {
    requireAdmin: true,
    context: { ipAddress: req.ip },
  });
  res.json(response);
}

export async function verifyTwoFactor(req, res) {
  const { email, code, tokenId } = req.body;
  const response = await authService.verifyTwoFactor(email, code, tokenId);
  res.json(response);
}

export async function resendTwoFactor(req, res) {
  const { tokenId } = req.body;
  const challenge = await authService.resendTwoFactor(tokenId);
  res.json(challenge);
}

export async function googleLogin(req, res) {
  const { idToken } = req.body;
  const response = await authService.loginWithGoogle(idToken, {
    context: { ipAddress: req.ip, userAgent: req.get('user-agent') },
  });
  res.json(response);
}

export async function appleLogin(req, res) {
  const { identityToken, authorizationCode } = req.body;
  const response = await authService.loginWithApple(identityToken, {
    authorizationCode,
    context: { ipAddress: req.ip, userAgent: req.get('user-agent') },
  });
  res.json(response);
}

export async function linkedinLogin(req, res) {
  const { accessToken } = req.body;
  const response = await authService.loginWithLinkedIn(accessToken, {
    context: { ipAddress: req.ip, userAgent: req.get('user-agent') },
  });
  res.json(response);
}

function collectWorkspaceIdentifiers(query = {}) {
  const candidates = [];
  const keys = ['workspaceIds', 'workspaceId', 'workspace', 'workspace_id'];
  keys.forEach((key) => {
    const value = query[key];
    if (value == null) {
      return;
    }
    if (Array.isArray(value)) {
      value.forEach((entry) => {
        if (entry != null) {
          candidates.push(entry);
        }
      });
      return;
    }
    candidates.push(value);
  });
  return candidates;
}

function collectSessionTraits(req) {
  const traits = {};
  const query = req.query ?? {};

  const candidateTraits = {
    persona: query.persona ?? query.role ?? null,
    surface: query.surface ?? query.section ?? null,
    client: query.client ?? null,
    platform: query.platform ?? query.device ?? null,
    channel: query.channel ?? null,
    journey: query.journey ?? null,
  };

  Object.entries(candidateTraits).forEach(([key, value]) => {
    if (value == null) {
      return;
    }
    const normalised = `${value}`.trim();
    if (normalised) {
      traits[key] = normalised.toLowerCase();
    }
  });

  const headerTraits = {
    clientVersion: req.get('x-client-version') ?? req.get('x-app-version') ?? null,
    appPlatform: req.get('x-app-platform') ?? req.get('x-platform') ?? null,
    device: req.get('x-device') ?? null,
  };

  Object.entries(headerTraits).forEach(([key, value]) => {
    if (value == null) {
      return;
    }
    const normalised = `${value}`.trim();
    if (normalised) {
      traits[key] = normalised.toLowerCase();
    }
  });

  return traits;
}

export async function currentSession(req, res) {
  const workspaceIds = collectWorkspaceIdentifiers(req.query);
  const traits = collectSessionTraits(req);
  const response = await authService.describeSession(req.user?.id, {
    workspaceIds,
    traits,
    accessToken: req.auth?.token ?? null,
  });
  res.json(response);
}

export async function refreshSession(req, res) {
  const { refreshToken } = req.body;
  const response = await authService.refreshSession(refreshToken, {
    context: { ipAddress: req.ip, userAgent: req.get('user-agent') },
  });
  res.json(response);
}

export async function requestPasswordReset(req, res) {
  const { email } = req.body;
  const result = await authService.requestPasswordReset(email, {
    context: { ipAddress: req.ip, userAgent: req.get('user-agent'), requestUrl: req.originalUrl },
  });
  res.status(202).json(result);
}

export async function verifyPasswordResetToken(req, res) {
  const { token } = req.body;
  const result = await authService.verifyPasswordResetToken(token);
  res.json(result);
}

export async function resetPassword(req, res) {
  const { token, password } = req.body;
  const result = await authService.resetPassword(token, password, {
    context: { ipAddress: req.ip, userAgent: req.get('user-agent'), requestUrl: req.originalUrl },
  });
  res.json(result);
}

export async function logout(req, res) {
  const { refreshToken, reason } = req.body || {};
  const result = await authService.revokeRefreshToken(refreshToken, {
    reason,
    context: { ipAddress: req.ip, userAgent: req.get('user-agent') },
  });
  res.status(202).json(result);
}
