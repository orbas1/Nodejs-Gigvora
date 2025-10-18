import { z } from 'zod';
import {
  optionalBoolean,
  optionalNumber,
  optionalTrimmedString,
  requiredTrimmedString,
} from '../primitives.js';
import {
  AD_SURFACE_LAYOUT_MODES,
  AD_POSITION_TYPES,
  AD_STATUSES,
  AD_OBJECTIVES,
  AD_TYPES,
  AD_PACING_MODES,
  AD_OPPORTUNITY_TYPES,
} from '../../models/constants/index.js';

const optionalEnum = (values) =>
  optionalTrimmedString({ max: 60 })
    .transform((value) => value?.toLowerCase())
    .refine((value) => value == null || values.includes(value), {
      message: `must be one of: ${values.join(', ')}`,
    });

export const adminAdsSurfaceBodySchema = z
  .object({
    name: requiredTrimmedString({ max: 120 }),
    description: optionalTrimmedString({ max: 2000 }),
    heroImageUrl: optionalTrimmedString({ max: 1024 }),
    layoutMode: optionalEnum(AD_SURFACE_LAYOUT_MODES),
    isActive: optionalBoolean(),
    supportsCoupons: optionalBoolean(),
    placementLimit: optionalNumber({ min: 1, max: 20, precision: 0, integer: true }),
    defaultPosition: optionalEnum(AD_POSITION_TYPES),
    metadata: z.record(z.any()).optional(),
  })
  .strip();

export const adminAdsCampaignBodySchema = z
  .object({
    name: optionalTrimmedString({ max: 255 }),
    objective: optionalEnum(AD_OBJECTIVES),
    status: optionalEnum(AD_STATUSES),
    budgetCents: optionalNumber({ min: 0, precision: 0 }),
    currencyCode: optionalTrimmedString({ max: 8, toUpperCase: true }),
    startDate: optionalTrimmedString({ max: 120 }),
    endDate: optionalTrimmedString({ max: 120 }),
    ownerId: optionalNumber({ min: 1, precision: 0, integer: true }),
    metadata: z.record(z.any()).optional(),
  })
  .strip();

export const adminAdsCampaignCreateSchema = adminAdsCampaignBodySchema.extend({
  name: requiredTrimmedString({ max: 255 }),
});

export const adminAdsCreativeBodySchema = z
  .object({
    campaignId: optionalNumber({ min: 1, precision: 0, integer: true }),
    name: optionalTrimmedString({ max: 255 }),
    type: optionalEnum(AD_TYPES),
    status: optionalEnum(AD_STATUSES),
    format: optionalTrimmedString({ max: 80 }),
    headline: optionalTrimmedString({ max: 255 }),
    subheadline: optionalTrimmedString({ max: 255 }),
    body: optionalTrimmedString({ max: 2000 }),
    callToAction: optionalTrimmedString({ max: 120 }),
    ctaUrl: optionalTrimmedString({ max: 500 }),
    mediaUrl: optionalTrimmedString({ max: 500 }),
    durationSeconds: optionalNumber({ min: 0, precision: 0, integer: true }),
    primaryColor: optionalTrimmedString({ max: 12 }),
    accentColor: optionalTrimmedString({ max: 12 }),
    metadata: z.record(z.any()).optional(),
  })
  .strip();

export const adminAdsCreativeCreateSchema = adminAdsCreativeBodySchema.extend({
  name: requiredTrimmedString({ max: 255 }),
});

export const adminAdsPlacementBodySchema = z
  .object({
    creativeId: optionalNumber({ min: 1, precision: 0, integer: true }),
    surface: optionalTrimmedString({ max: 80 }).transform((value) => value?.toLowerCase()),
    position: optionalEnum(AD_POSITION_TYPES),
    status: optionalEnum(AD_STATUSES),
    weight: optionalNumber({ min: 1, max: 100, precision: 0, integer: true }),
    pacingMode: optionalEnum(AD_PACING_MODES),
    maxImpressionsPerHour: optionalNumber({ min: 0, precision: 0, integer: true }),
    startAt: optionalTrimmedString({ max: 120 }),
    endAt: optionalTrimmedString({ max: 120 }),
    opportunityType: optionalEnum(AD_OPPORTUNITY_TYPES),
    priority: optionalNumber({ min: 0, max: 1000, precision: 0, integer: true }),
    metadata: z.record(z.any()).optional(),
    couponIds: z.array(z.union([z.string(), z.number()])).optional(),
  })
  .strip();

export const adminAdsPlacementCreateSchema = adminAdsPlacementBodySchema.extend({
  creativeId: optionalNumber({ min: 1, precision: 0, integer: true }).refine((value) => value != null, {
    message: 'creativeId is required.',
  }),
});

export default {
  adminAdsSurfaceBodySchema,
  adminAdsCampaignBodySchema,
  adminAdsCampaignCreateSchema,
  adminAdsCreativeBodySchema,
  adminAdsCreativeCreateSchema,
  adminAdsPlacementBodySchema,
  adminAdsPlacementCreateSchema,
};
