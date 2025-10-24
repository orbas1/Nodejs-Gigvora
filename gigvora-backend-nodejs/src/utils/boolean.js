const TRUTHY_STRINGS = new Set(['true', '1', 'yes', 'on']);
const FALSY_STRINGS = new Set(['false', '0', 'no', 'off']);

export function coerceBoolean(value, { fallback = false, truthy = TRUTHY_STRINGS, falsy = FALSY_STRINGS } = {}) {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      return fallback;
    }
    return value !== 0;
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (truthy.has(normalized)) {
      return true;
    }
    if (falsy.has(normalized)) {
      return false;
    }
  }

  return fallback;
}

export default {
  coerceBoolean,
};
