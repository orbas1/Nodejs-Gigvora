import { ValidationError } from './errors.js';

function isEmpty(value) {
  return value == null || value === '';
}

export function coercePositiveInteger(value) {
  if (isEmpty(value)) {
    return undefined;
  }

  const numeric = Number.parseInt(value, 10);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return undefined;
  }

  return numeric;
}

export function requirePositiveInteger(label, value) {
  const parsed = coercePositiveInteger(value);
  if (!parsed) {
    throw new ValidationError(`${label} must be a positive integer.`);
  }
  return parsed;
}

export function resolvePositiveInteger(label, ...candidates) {
  for (const candidate of candidates) {
    const parsed = coercePositiveInteger(candidate);
    if (parsed) {
      return parsed;
    }
  }

  throw new ValidationError(`${label} must be a positive integer.`);
}

export default {
  coercePositiveInteger,
  requirePositiveInteger,
  resolvePositiveInteger,
};
