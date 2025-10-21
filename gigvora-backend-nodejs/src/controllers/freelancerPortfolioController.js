import freelancerPortfolioService from '../services/freelancerPortfolioService.js';
import { AuthorizationError, ValidationError } from '../utils/errors.js';

function parsePositiveInteger(value, label) {
  const numeric = Number.parseInt(value, 10);
  if (!Number.isInteger(numeric) || numeric <= 0) {
    throw new ValidationError(`${label} must be a positive integer.`);
  }
  return numeric;
}

function sanitizeObjectPayload(body, label) {
  if (body == null) {
    return {};
  }

  if (typeof body !== 'object' || Array.isArray(body)) {
    throw new ValidationError(`${label} must be an object.`);
  }

  return JSON.parse(JSON.stringify(body));
}

function normalizePermissions(user) {
  const values = [];
  if (!user) {
    return values;
  }
  if (Array.isArray(user.permissions)) {
    values.push(...user.permissions);
  }
  if (Array.isArray(user.roles)) {
    values.push(...user.roles);
  }
  if (typeof user.role === 'string') {
    values.push(user.role);
  }
  return values.map((permission) => String(permission).toLowerCase());
}

function ensurePortfolioAccess(user, ownerId) {
  if (!user) {
    throw new AuthorizationError('Authentication required.');
  }

  const actorId = Number.parseInt(user.id, 10);
  if (Number.isInteger(actorId) && actorId === ownerId) {
    return;
  }

  const permissions = new Set(normalizePermissions(user));
  if (
    permissions.has('admin') ||
    permissions.has('freelancer.manage.any') ||
    permissions.has('portfolio.manage.any')
  ) {
    return;
  }

  throw new AuthorizationError('You do not have permission to manage this portfolio.');
}

function parseFreshFlag(value) {
  if (value == null) {
    return false;
  }
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'string') {
    if (value.toLowerCase() === 'true') {
      return true;
    }
    if (value.toLowerCase() === 'false') {
      return false;
    }
  }
  throw new ValidationError('fresh must be a boolean value.');
}

export async function listPortfolio(req, res) {
  const userId = parsePositiveInteger(req.params.userId, 'userId');
  ensurePortfolioAccess(req.user, userId);
  const data = await freelancerPortfolioService.getPortfolio(userId, {
    bypassCache: parseFreshFlag(req.query?.fresh),
  });
  res.json(data);
}

export async function createPortfolioItem(req, res) {
  const userId = parsePositiveInteger(req.params.userId, 'userId');
  ensurePortfolioAccess(req.user, userId);
  const item = await freelancerPortfolioService.createPortfolioItem(
    userId,
    sanitizeObjectPayload(req.body, 'portfolio item'),
  );
  res.status(201).json(item);
}

export async function updatePortfolioItem(req, res) {
  const userId = parsePositiveInteger(req.params.userId, 'userId');
  const portfolioId = parsePositiveInteger(req.params.portfolioId, 'portfolioId');
  ensurePortfolioAccess(req.user, userId);
  const item = await freelancerPortfolioService.updatePortfolioItem(
    userId,
    portfolioId,
    sanitizeObjectPayload(req.body, 'portfolio item'),
  );
  res.json(item);
}

export async function deletePortfolioItem(req, res) {
  const userId = parsePositiveInteger(req.params.userId, 'userId');
  const portfolioId = parsePositiveInteger(req.params.portfolioId, 'portfolioId');
  ensurePortfolioAccess(req.user, userId);
  await freelancerPortfolioService.deletePortfolioItem(userId, portfolioId);
  res.status(204).send();
}

export async function createPortfolioAsset(req, res) {
  const userId = parsePositiveInteger(req.params.userId, 'userId');
  const portfolioId = parsePositiveInteger(req.params.portfolioId, 'portfolioId');
  ensurePortfolioAccess(req.user, userId);
  const asset = await freelancerPortfolioService.createPortfolioAsset(
    userId,
    portfolioId,
    sanitizeObjectPayload(req.body, 'portfolio asset'),
  );
  res.status(201).json(asset);
}

export async function updatePortfolioAsset(req, res) {
  const userId = parsePositiveInteger(req.params.userId, 'userId');
  const portfolioId = parsePositiveInteger(req.params.portfolioId, 'portfolioId');
  const assetId = parsePositiveInteger(req.params.assetId, 'assetId');
  ensurePortfolioAccess(req.user, userId);
  const asset = await freelancerPortfolioService.updatePortfolioAsset(
    userId,
    portfolioId,
    assetId,
    sanitizeObjectPayload(req.body, 'portfolio asset'),
  );
  res.json(asset);
}

export async function deletePortfolioAsset(req, res) {
  const userId = parsePositiveInteger(req.params.userId, 'userId');
  const portfolioId = parsePositiveInteger(req.params.portfolioId, 'portfolioId');
  const assetId = parsePositiveInteger(req.params.assetId, 'assetId');
  ensurePortfolioAccess(req.user, userId);
  await freelancerPortfolioService.deletePortfolioAsset(userId, portfolioId, assetId);
  res.status(204).send();
}

export async function updatePortfolioSettings(req, res) {
  const userId = parsePositiveInteger(req.params.userId, 'userId');
  ensurePortfolioAccess(req.user, userId);
  const payload = sanitizeObjectPayload(req.body, 'portfolio settings');
  if (Object.keys(payload).length === 0) {
    throw new ValidationError('portfolio settings cannot be empty.');
  }
  const settings = await freelancerPortfolioService.updatePortfolioSettings(userId, payload);
  res.json(settings);
}

export default {
  listPortfolio,
  createPortfolioItem,
  updatePortfolioItem,
  deletePortfolioItem,
  createPortfolioAsset,
  updatePortfolioAsset,
  deletePortfolioAsset,
  updatePortfolioSettings,
};
