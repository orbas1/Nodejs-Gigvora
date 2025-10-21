import freelancerProfileHubService from '../services/freelancerProfileHubService.js';
import { AuthorizationError, ValidationError } from '../utils/errors.js';

function parseFreelancerId(value) {
  const numeric = Number.parseInt(value, 10);
  if (!Number.isInteger(numeric) || numeric <= 0) {
    throw new ValidationError('userId must be a positive integer.');
  }
  return numeric;
}

function normalizePermissions(user) {
  if (!user) {
    return [];
  }
  const permissions = [];
  if (Array.isArray(user.permissions)) {
    permissions.push(...user.permissions);
  }
  if (Array.isArray(user.roles)) {
    permissions.push(...user.roles);
  }
  if (typeof user.role === 'string') {
    permissions.push(user.role);
  }
  return permissions.map((permission) => String(permission).toLowerCase());
}

function ensureProfileAccess(user, freelancerId) {
  if (!user) {
    throw new AuthorizationError('Authentication required.');
  }

  const actorId = Number.parseInt(user.id, 10);
  if (Number.isInteger(actorId) && actorId === freelancerId) {
    return;
  }

  const permissions = new Set(normalizePermissions(user));
  if (
    permissions.has('admin') ||
    permissions.has('freelancer.manage.any') ||
    permissions.has('profile.manage.any')
  ) {
    return;
  }

  throw new AuthorizationError('You do not have permission to manage this profile.');
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

function sanitizeObjectPayload(body, label) {
  if (body == null) {
    throw new ValidationError(`${label} cannot be empty.`);
  }
  if (typeof body !== 'object' || Array.isArray(body)) {
    throw new ValidationError(`${label} must be an object.`);
  }
  const sanitized = JSON.parse(JSON.stringify(body));
  if (Object.keys(sanitized).length === 0) {
    throw new ValidationError(`${label} cannot be empty.`);
  }
  return sanitized;
}

function sanitizeItemsPayload(body, label) {
  const items = Array.isArray(body?.items) ? body.items : body;
  if (!Array.isArray(items)) {
    throw new ValidationError(`${label} must be an array.`);
  }
  if (items.length === 0) {
    return [];
  }
  return items.map((item) => {
    if (item == null) {
      throw new ValidationError(`${label} contains invalid items.`);
    }
    if (typeof item === 'object') {
      return JSON.parse(JSON.stringify(item));
    }
    return item;
  });
}

export async function getProfileHub(req, res) {
  const userId = parseFreelancerId(req.params.userId);
  ensureProfileAccess(req.user, userId);
  const data = await freelancerProfileHubService.getFreelancerProfileHub(userId, {
    bypassCache: parseFreshFlag(req.query?.fresh),
  });
  res.json(data);
}

export async function updateProfileHub(req, res) {
  const userId = parseFreelancerId(req.params.userId);
  ensureProfileAccess(req.user, userId);
  const payload = sanitizeObjectPayload(req.body, 'profile hub payload');
  const data = await freelancerProfileHubService.updateFreelancerProfileHub(userId, payload);
  res.json(data);
}

export async function updateExpertiseAreas(req, res) {
  const userId = parseFreelancerId(req.params.userId);
  ensureProfileAccess(req.user, userId);
  const data = await freelancerProfileHubService.updateFreelancerExpertiseAreas(
    userId,
    sanitizeItemsPayload(req.body, 'expertise areas'),
  );
  res.json(data);
}

export async function updateSuccessMetrics(req, res) {
  const userId = parseFreelancerId(req.params.userId);
  ensureProfileAccess(req.user, userId);
  const data = await freelancerProfileHubService.updateFreelancerSuccessMetrics(
    userId,
    sanitizeItemsPayload(req.body, 'success metrics'),
  );
  res.json(data);
}

export async function updateTestimonials(req, res) {
  const userId = parseFreelancerId(req.params.userId);
  ensureProfileAccess(req.user, userId);
  const data = await freelancerProfileHubService.updateFreelancerTestimonials(
    userId,
    sanitizeItemsPayload(req.body, 'testimonials'),
  );
  res.json(data);
}

export async function updateHeroBanners(req, res) {
  const userId = parseFreelancerId(req.params.userId);
  ensureProfileAccess(req.user, userId);
  const data = await freelancerProfileHubService.updateFreelancerHeroBanners(
    userId,
    sanitizeItemsPayload(req.body, 'hero banners'),
  );
  res.json(data);
}

export default {
  getProfileHub,
  updateProfileHub,
  updateExpertiseAreas,
  updateSuccessMetrics,
  updateTestimonials,
  updateHeroBanners,
};
