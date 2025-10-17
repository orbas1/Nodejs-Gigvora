import { z } from 'zod';

const positiveInt = z
  .union([z.string(), z.number()])
  .transform((value) => {
    const numeric = Number(value);
    if (!Number.isInteger(numeric) || numeric <= 0) {
      throw new Error('Must be a positive integer');
    }
    return numeric;
  });

const toneSchema = z
  .string()
  .trim()
  .transform((value) => value.toLowerCase())
  .refine((value) => ['slate', 'blue', 'emerald', 'amber', 'rose', 'violet'].includes(value), {
    message: 'Unsupported tone value',
  })
  .optional();

const workstreamSchema = z.object({
  id: z.string().trim().min(1).max(120).optional(),
  label: z.string().trim().min(1).max(255),
  status: z.string().trim().max(120).optional().nullable(),
  dueDateLabel: z.string().trim().max(120).optional().nullable(),
  tone: toneSchema,
  link: z
    .string()
    .trim()
    .url({ message: 'Link must be a valid URL' })
    .max(2048)
    .optional()
    .or(z.literal(''))
    .transform((value) => (value === '' ? undefined : value)),
});

const scheduleSchema = z.object({
  id: z.string().trim().min(1).max(120).optional(),
  label: z.string().trim().min(1).max(255),
  type: z.string().trim().min(1).max(120).default('Session'),
  tone: toneSchema,
  startsAt: z.string().trim().max(120).optional().nullable(),
  link: z
    .string()
    .trim()
    .url({ message: 'Link must be a valid URL' })
    .max(2048)
    .optional()
    .or(z.literal(''))
    .transform((value) => (value === '' ? undefined : value)),
});

const relationshipHealthSchema = z.object({
  retentionScore: z
    .number({ invalid_type_error: 'Retention score must be a number' })
    .min(0)
    .max(100)
    .optional()
    .nullable(),
  retentionNotes: z.string().trim().max(600).optional().nullable(),
  retentionStatus: z.string().trim().max(120).optional().nullable(),
  advocacyInProgress: z
    .number({ invalid_type_error: 'Advocacy in progress must be a number' })
    .min(0)
    .max(999)
    .optional()
    .nullable(),
  advocacyNotes: z.string().trim().max(600).optional().nullable(),
});

const weatherSchema = z
  .object({
    locationName: z.string().trim().max(255).optional().nullable(),
    latitude: z
      .number({ invalid_type_error: 'Latitude must be a number' })
      .min(-90)
      .max(90)
      .optional()
      .nullable(),
    longitude: z
      .number({ invalid_type_error: 'Longitude must be a number' })
      .min(-180)
      .max(180)
      .optional()
      .nullable(),
    units: z.enum(['metric', 'imperial']).optional(),
  })
  .partial();

export const freelancerDashboardParamsSchema = z.object({
  freelancerId: positiveInt,
});

export const freelancerDashboardOverviewUpdateSchema = z
  .object({
    headline: z.string().trim().max(255).optional().nullable(),
    summary: z.string().trim().max(2000).optional().nullable(),
    avatarUrl: z
      .string()
      .trim()
      .url({ message: 'Avatar must be a valid URL' })
      .max(2048)
      .optional()
      .or(z.literal(''))
      .transform((value) => (value === '' ? null : value)),
    followerCount: z
      .number({ invalid_type_error: 'Follower count must be a number' })
      .int()
      .min(0)
      .max(10_000_000)
      .optional(),
    followerGoal: z
      .number({ invalid_type_error: 'Follower goal must be a number' })
      .int()
      .min(0)
      .max(10_000_000)
      .optional(),
    trustScore: z
      .number({ invalid_type_error: 'Trust score must be a number' })
      .min(0)
      .max(100)
      .optional()
      .nullable(),
    trustScoreChange: z
      .number({ invalid_type_error: 'Trust score change must be a number' })
      .min(-100)
      .max(100)
      .optional()
      .nullable(),
    rating: z
      .number({ invalid_type_error: 'Rating must be a number' })
      .min(0)
      .max(5)
      .optional()
      .nullable(),
    ratingCount: z
      .number({ invalid_type_error: 'Rating count must be a number' })
      .int()
      .min(0)
      .max(10_000_000)
      .optional(),
    workstreams: z.array(workstreamSchema).max(50).optional(),
    relationshipHealth: relationshipHealthSchema.optional(),
    upcomingSchedule: z.array(scheduleSchema).max(50).optional(),
    weather: weatherSchema.optional(),
    timezone: z.string().trim().max(120).optional().nullable(),
  })
  .refine((value) => {
    if (!value.weather) {
      return true;
    }
    const { latitude, longitude } = value.weather;
    if ((latitude == null) !== (longitude == null)) {
      return false;
    }
    return true;
  }, {
    message: 'Latitude and longitude must both be provided together',
    path: ['weather'],
  });

export default {
  freelancerDashboardParamsSchema,
  freelancerDashboardOverviewUpdateSchema,
};
