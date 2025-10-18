import { z } from 'zod';

const BOOLEAN_TRUE_VALUES = new Set(['true', '1', 'yes', 'y', 'on']);
const BOOLEAN_FALSE_VALUES = new Set(['false', '0', 'no', 'n', 'off']);

export const nonEmptyString = z.string().trim().min(1);

export function optionalTrimmedString({ max = 255, min = 1, toUpperCase = false } = {}) {
  const schema = z.preprocess((value) => {
    if (value == null) {
      return undefined;
    }
    const text = `${value}`.trim();
    if (!text) {
      return undefined;
    }
    return toUpperCase ? text.toUpperCase() : text;
  }, z.string().min(min).max(max));

  return z.union([schema, z.undefined()]);
}

export function requiredTrimmedString({ max = 255, min = 1, toLowerCase = false, toUpperCase = false } = {}) {
  let schema = z.string().trim();
  schema = schema.min(min, { message: `must be at least ${min} characters long.` });
  schema = schema.max(max, { message: `must be at most ${max} characters long.` });
  return schema.transform((value) => {
    if (toLowerCase) {
      return value.toLowerCase();
    }
    if (toUpperCase) {
      return value.toUpperCase();
    }
    return value;
  });
}

export function requiredEmail({ max = 255 } = {}) {
  return z
    .string()
    .trim()
    .min(1, { message: 'email is required.' })
    .max(max, { message: `email must be at most ${max} characters long.` })
    .email('must be a valid email address.')
    .transform((value) => value.toLowerCase());
}

export function optionalBoolean() {
  const schema = z.preprocess((value) => {
    if (value == null || value === '') {
      return undefined;
    }
    if (typeof value === 'boolean') {
      return value;
    }
    if (typeof value === 'number') {
      if (value === 1) return true;
      if (value === 0) return false;
    }
    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase();
      if (BOOLEAN_TRUE_VALUES.has(normalized)) {
        return true;
      }
      if (BOOLEAN_FALSE_VALUES.has(normalized)) {
        return false;
      }
    }
    return value;
  }, z.boolean({ invalid_type_error: 'must be a boolean.' }));

  return z.union([schema, z.undefined()]);
}

export function optionalNumber({ min, max, precision, integer = false, message = 'must be a valid number.' } = {}) {
  let schema = z.preprocess((value) => {
    if (value == null || value === '') {
      return undefined;
    }
    const numeric = typeof value === 'number' ? value : Number(value);
    if (!Number.isFinite(numeric)) {
      return Number.NaN;
    }
    if (typeof precision === 'number') {
      const multiplier = 10 ** precision;
      return Math.round(numeric * multiplier) / multiplier;
    }
    return numeric;
  }, z.number({ invalid_type_error: message, required_error: message }).finite({ message }));

  if (integer) {
    schema = schema.refine((value) => Number.isInteger(value), { message: 'must be an integer.' });
  }
  if (typeof min === 'number') {
    schema = schema.refine((value) => value >= min, {
      message: `must be greater than or equal to ${min}.`,
    });
  }
  if (typeof max === 'number') {
    schema = schema.refine((value) => value <= max, {
      message: `must be less than or equal to ${max}.`,
    });
  }

  return z.union([schema, z.undefined()]);
}

export function optionalStringArray({ maxItemLength = 255, maxLength, unique = true } = {}) {
  const base = z.preprocess((value) => {
    if (value == null) {
      return undefined;
    }
    if (Array.isArray(value)) {
      return value;
    }
    return [value];
  }, z.array(z.string()));

  return z
    .union([base, z.undefined()])
    .transform((values) => {
      if (!values) {
        return undefined;
      }
      const trimmed = values
        .map((value) => `${value}`.trim())
        .filter((value) => value.length > 0 && value.length <= maxItemLength);
      const limited = typeof maxLength === 'number' ? trimmed.slice(0, maxLength) : trimmed;
      if (!unique) {
        return limited;
      }
      return Array.from(new Set(limited));
    });
}

export function optionalGeoLocation() {
  const coordinate = optionalNumber({ min: -180, max: 180, precision: 6 }).transform((value) => value ?? undefined);

  const schema = z
    .object({
      label: optionalTrimmedString({ max: 255 }).transform((value) => value ?? undefined),
      city: optionalTrimmedString({ max: 120 }).transform((value) => value ?? undefined),
      region: optionalTrimmedString({ max: 120 }).transform((value) => value ?? undefined),
      state: optionalTrimmedString({ max: 120 }).transform((value) => value ?? undefined),
      province: optionalTrimmedString({ max: 120 }).transform((value) => value ?? undefined),
      country: optionalTrimmedString({ max: 120, toUpperCase: true }).transform((value) => value ?? undefined),
      countryCode: optionalTrimmedString({ max: 120, toUpperCase: true }).transform((value) => value ?? undefined),
      postalCode: optionalTrimmedString({ max: 40 }).transform((value) => value ?? undefined),
      zip: optionalTrimmedString({ max: 40 }).transform((value) => value ?? undefined),
      timezone: optionalTrimmedString({ max: 120 }).transform((value) => value ?? undefined),
      placeId: optionalTrimmedString({ max: 255 }).transform((value) => value ?? undefined),
      latitude: coordinate,
      lat: coordinate,
      longitude: coordinate,
      lng: coordinate,
      lon: coordinate,
      boundingBox: z.unknown().optional(),
      raw: z.unknown().optional(),
    })
    .strip();

  return z.union([schema, z.undefined()]).transform((value) => {
    if (!value) {
      return undefined;
    }
    const normalized = { ...value };
    if (normalized.lat != null && normalized.latitude == null) {
      normalized.latitude = normalized.lat;
    }
    if (normalized.lng != null && normalized.longitude == null) {
      normalized.longitude = normalized.lng;
    }
    if (normalized.lon != null && normalized.longitude == null) {
      normalized.longitude = normalized.lon;
    }
    delete normalized.lat;
    delete normalized.lng;
    delete normalized.lon;
    return normalized;
  });
}

export function optionalLocationString({ max = 255 } = {}) {
  return optionalTrimmedString({ max }).transform((value) => value ?? undefined);
}

