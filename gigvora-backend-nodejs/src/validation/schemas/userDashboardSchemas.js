import { z } from 'zod';

function optionalTrimmedString(maxLength) {
  return z
    .preprocess((value) => {
      if (value === undefined) {
        return undefined;
      }
      if (value === null) {
        return null;
      }
      const trimmed = `${value}`.trim();
      return trimmed.length ? trimmed : null;
    }, z.union([z.string().min(1).max(maxLength), z.literal(null)]));
}

function optionalLongText(maxLength) {
  return z.preprocess((value) => {
    if (value === undefined) {
      return undefined;
    }
    if (value === null) {
      return null;
    }
    const text = `${value}`.trim();
    return text.length ? text : null;
  }, z.union([z.string().max(maxLength), z.literal(null)]));
}

function optionalUrl(maxLength = 2048) {
  return z.preprocess((value) => {
    if (value === undefined) {
      return undefined;
    }
    if (value === null) {
      return null;
    }
    const trimmed = `${value}`.trim();
    return trimmed.length ? trimmed : null;
  }, z.union([z.string().url().max(maxLength), z.literal(null)]));
}

function optionalInteger(minimum, maximum) {
  return z.preprocess((value) => {
    if (value === undefined) {
      return undefined;
    }
    if (value === null || value === '') {
      return null;
    }
    const numeric = Number(value);
    return Number.isFinite(numeric) ? Math.round(numeric) : value;
  }, z.union([z.number().int().min(minimum).max(maximum), z.literal(null)]));
}

function optionalDecimal(minimum, maximum) {
  return z.preprocess((value) => {
    if (value === undefined) {
      return undefined;
    }
    if (value === null || value === '') {
      return null;
    }
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : value;
  }, z.union([z.number().min(minimum).max(maximum), z.literal(null)]));
}

export const updateUserDashboardOverviewSchema = z
  .object({
    greetingName: optionalTrimmedString(120).optional(),
    headline: optionalTrimmedString(180).optional(),
    overview: optionalLongText(2000).optional(),
    followersCount: optionalInteger(0, 100_000_000).optional(),
    followersGoal: optionalInteger(0, 100_000_000).optional(),
    avatarUrl: optionalUrl().optional(),
    bannerImageUrl: optionalUrl().optional(),
    trustScore: optionalDecimal(0, 100).optional(),
    trustScoreLabel: optionalTrimmedString(120).optional(),
    rating: optionalDecimal(0, 5).optional(),
    ratingCount: optionalInteger(0, 10_000_000).optional(),
    weatherLocation: optionalTrimmedString(180).optional(),
    weatherUnits: z
      .preprocess((value) => {
        if (value === undefined || value === null || value === '') {
          return undefined;
        }
        return `${value}`.trim().toLowerCase();
      }, z.enum(['metric', 'imperial']).optional()),
  })
  .strict();

export default {
  updateUserDashboardOverviewSchema,
};
