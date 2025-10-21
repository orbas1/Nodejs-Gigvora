import { AuthenticationError, AuthorizationError, ValidationError } from './errors.js';

function isPlainObject(value) {
  return value != null && typeof value === 'object' && !Array.isArray(value);
}

export function ensurePlainObject(value, label = 'payload') {
  if (!isPlainObject(value)) {
    throw new ValidationError(`${label} must be an object.`);
  }
  return { ...value };
}

export function toTrimmedString(value, { fieldName = 'value', minLength = 0, maxLength = 255, lowercase = false, uppercase = false, required = false } = {}) {
  if (value == null) {
    if (required) {
      throw new ValidationError(`${fieldName} is required.`);
    }
    return undefined;
  }
  const text = `${value}`.trim();
  if (!text) {
    if (required) {
      throw new ValidationError(`${fieldName} is required.`);
    }
    return undefined;
  }
  if (text.length < minLength) {
    throw new ValidationError(`${fieldName} must be at least ${minLength} characters long.`);
  }
  if (text.length > maxLength) {
    throw new ValidationError(`${fieldName} must be at most ${maxLength} characters long.`);
  }
  if (lowercase) {
    return text.toLowerCase();
  }
  if (uppercase) {
    return text.toUpperCase();
  }
  return text;
}

export function toOptionalString(value, options = {}) {
  return toTrimmedString(value, { ...options, required: false });
}

export function toRequiredString(value, options = {}) {
  return toTrimmedString(value, { ...options, required: true });
}

export function toEmail(value, { fieldName = 'email', required = true } = {}) {
  const email = toTrimmedString(value, { fieldName, maxLength: 255, required });
  if (!email) {
    return undefined;
  }
  const normalised = email.toLowerCase();
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(normalised)) {
    throw new ValidationError(`${fieldName} must be a valid email address.`);
  }
  return normalised;
}

export function toBoolean(value, { defaultValue = undefined } = {}) {
  if (value == null || value === '') {
    return defaultValue;
  }
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'number') {
    if (value === 1) return true;
    if (value === 0) return false;
  }
  if (typeof value === 'string') {
    const normalised = value.trim().toLowerCase();
    if (['true', '1', 'yes', 'y', 'on'].includes(normalised)) {
      return true;
    }
    if (['false', '0', 'no', 'n', 'off'].includes(normalised)) {
      return false;
    }
  }
  throw new ValidationError('Value must be a boolean.');
}

export function toPositiveInteger(value, { fieldName = 'id', required = true, allowZero = false } = {}) {
  if (value == null || value === '') {
    if (required) {
      throw new ValidationError(`${fieldName} is required.`);
    }
    return undefined;
  }
  const numeric = Number.parseInt(value, 10);
  if (!Number.isInteger(numeric)) {
    throw new ValidationError(`${fieldName} must be a valid integer.`);
  }
  if (numeric < 0 || (!allowZero && numeric === 0)) {
    throw new ValidationError(`${fieldName} must be a positive integer.`);
  }
  return numeric;
}

export function toOptionalPositiveInteger(value, options = {}) {
  return toPositiveInteger(value, { ...options, required: false });
}

export function toFiniteNumber(value, { fieldName = 'value', required = true, min = undefined, max = undefined } = {}) {
  if (value == null || value === '') {
    if (required) {
      throw new ValidationError(`${fieldName} is required.`);
    }
    return undefined;
  }
  const numeric = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(numeric)) {
    throw new ValidationError(`${fieldName} must be a valid number.`);
  }
  if (typeof min === 'number' && numeric < min) {
    throw new ValidationError(`${fieldName} must be greater than or equal to ${min}.`);
  }
  if (typeof max === 'number' && numeric > max) {
    throw new ValidationError(`${fieldName} must be less than or equal to ${max}.`);
  }
  return numeric;
}

export function toOptionalFiniteNumber(value, options = {}) {
  return toFiniteNumber(value, { ...options, required: false });
}

export function toDate(value, { fieldName = 'value', required = true } = {}) {
  if (value == null || value === '') {
    if (required) {
      throw new ValidationError(`${fieldName} is required.`);
    }
    return undefined;
  }
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new ValidationError(`${fieldName} must be a valid date.`);
  }
  return date;
}

export function toOptionalDate(value, options = {}) {
  return toDate(value, { ...options, required: false });
}

export function toStringArray(value, { fieldName = 'value', minItems = 0, maxItems = 50, maxItemLength = 255, unique = true, allowedValues = undefined } = {}) {
  if (value == null) {
    if (minItems > 0) {
      throw new ValidationError(`${fieldName} must contain at least ${minItems} item(s).`);
    }
    return [];
  }
  const list = Array.isArray(value) ? value : [value];
  const cleaned = [];
  const seen = new Set();
  for (const item of list) {
    const text = toTrimmedString(item, { fieldName: `${fieldName} item`, required: true, maxLength: maxItemLength });
    const lower = text.toLowerCase();
    if (allowedValues && !allowedValues.has(lower) && !allowedValues.has(text)) {
      throw new ValidationError(`${fieldName} contains an unsupported value: ${text}.`);
    }
    if (unique) {
      if (seen.has(lower)) {
        continue;
      }
      seen.add(lower);
    }
    cleaned.push(allowedValues && allowedValues.has(lower) ? lower : text);
    if (cleaned.length > maxItems) {
      break;
    }
  }
  if (cleaned.length < minItems) {
    throw new ValidationError(`${fieldName} must contain at least ${minItems} item(s).`);
  }
  return cleaned;
}

export function toOptionalEnum(value, allowedValues, { fieldName = 'value', defaultValue = undefined } = {}) {
  if (!allowedValues || !(allowedValues instanceof Set) || allowedValues.size === 0) {
    throw new Error('allowedValues must be a non-empty Set.');
  }
  if (value == null || value === '') {
    return defaultValue;
  }
  const normalised = `${value}`.trim().toLowerCase();
  if (!allowedValues.has(normalised)) {
    throw new ValidationError(`${fieldName} must be one of: ${Array.from(allowedValues.values()).join(', ')}.`);
  }
  return normalised;
}

export function resolveActorContext(req = {}) {
  const rawId = req?.user?.id ?? req?.auth?.userId ?? null;
  const actorId = rawId != null ? toOptionalPositiveInteger(rawId, { fieldName: 'actorId', required: false }) : null;
  const roles = Array.isArray(req?.user?.roles)
    ? req.user.roles.map((role) => `${role}`.toLowerCase()).filter(Boolean)
    : [];
  const actorRole = req?.user?.type ? `${req.user.type}`.toLowerCase() : null;
  const isAdmin = roles.includes('admin') || actorRole === 'admin';
  return {
    actorId,
    actorRole,
    actorRoles: roles,
    isAdmin,
  };
}

export function requireAuthenticatedActor(req = {}) {
  const actor = resolveActorContext(req);
  if (!actor.actorId) {
    throw new AuthenticationError('Authentication required.');
  }
  return actor;
}

export function requireAdminActor(req = {}) {
  const actor = resolveActorContext(req);
  if (!actor.actorId) {
    throw new AuthenticationError('Authentication required.');
  }
  if (!actor.isAdmin) {
    throw new AuthorizationError('Administrator privileges required.');
  }
  return actor;
}

export function requireAgencyActor(req = {}) {
  const actor = resolveActorContext(req);
  if (!actor.actorId) {
    throw new AuthenticationError('Authentication required.');
  }
  const allowedRoles = new Set(['agency', 'agency_admin', 'agency_owner', 'manager', 'admin']);
  const hasAgencyRole = actor.isAdmin || actor.actorRoles.some((role) => allowedRoles.has(role));
  const primaryAllowed = actor.actorRole ? allowedRoles.has(actor.actorRole) : false;
  if (!hasAgencyRole && !primaryAllowed) {
    throw new AuthorizationError('Agency access required.');
  }
  return actor;
}

export function buildAgencyActorContext(req = {}) {
  const actor = requireAgencyActor(req);
  return {
    actorId: actor.actorId,
    actorRole: actor.actorRole,
    actorRoles: actor.actorRoles,
    isAdmin: actor.isAdmin,
    id: actor.actorId,
    role: actor.actorRole,
  };
}

export function normalisePagination(query = {}, { defaultPage = 1, defaultPageSize = 20, maxPageSize = 100 } = {}) {
  const page = toOptionalPositiveInteger(query.page, { fieldName: 'page', required: false, allowZero: false }) ?? defaultPage;
  const pageSize = toOptionalPositiveInteger(query.pageSize, {
    fieldName: 'pageSize',
    required: false,
    allowZero: false,
  }) ?? defaultPageSize;
  const limit = Math.max(1, Math.min(pageSize, maxPageSize));
  const currentPage = Math.max(1, page);
  const offset = (currentPage - 1) * limit;
  return { page: currentPage, pageSize: limit, limit, offset };
}

export function mergeDefined(target, source) {
  const next = { ...target };
  Object.entries(source).forEach(([key, value]) => {
    if (value !== undefined) {
      next[key] = value;
    }
  });
  return next;
}

export default {
  ensurePlainObject,
  toTrimmedString,
  toOptionalString,
  toRequiredString,
  toEmail,
  toBoolean,
  toPositiveInteger,
  toOptionalPositiveInteger,
  toFiniteNumber,
  toOptionalFiniteNumber,
  toDate,
  toOptionalDate,
  toStringArray,
  toOptionalEnum,
  resolveActorContext,
  requireAuthenticatedActor,
  requireAdminActor,
  requireAgencyActor,
  buildAgencyActorContext,
  normalisePagination,
  mergeDefined,
};
