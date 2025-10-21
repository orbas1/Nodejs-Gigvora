import { z } from 'zod';
import {
  AD_OBJECTIVES,
  AD_STATUSES,
  AD_TYPES,
  AD_SURFACE_TYPES,
  AD_POSITION_TYPES,
  AD_PACING_MODES,
  AD_OPPORTUNITY_TYPES,
} from '../../models/constants/index.js';

const isoDate = z
  .string()
  .trim()
  .refine((value) => !value || !Number.isNaN(Date.parse(value)), { message: 'Must be a valid ISO date string.' });

export const workspaceQuerySchema = z
  .object({
    surfaces: z.string().trim().optional(),
    context: z.union([z.string(), z.record(z.any())]).optional(),
    bypassCache: z.enum(['true', 'false']).optional(),
  })
  .strip();

export const campaignIdParamsSchema = z
  .object({
    campaignId: z.coerce.number().int().positive({ message: 'campaignId must be a positive integer.' }),
  })
  .strip();

export const creativeIdParamsSchema = z
  .object({
    creativeId: z.coerce.number().int().positive({ message: 'creativeId must be a positive integer.' }),
  })
  .strip();

export const placementIdParamsSchema = z
  .object({
    placementId: z.coerce.number().int().positive({ message: 'placementId must be a positive integer.' }),
  })
  .strip();

const campaignBaseSchema = z
  .object({
    name: z.string().trim().min(1, 'Provide a campaign name.'),
    objective: z.enum(AD_OBJECTIVES).optional(),
    status: z.enum(AD_STATUSES).optional(),
    budgetCents: z.coerce.number().int().min(0).optional(),
    budget: z.coerce.number().min(0).optional(),
    currencyCode: z.string().trim().length(3, 'Use a 3-character currency code.').optional(),
    startDate: isoDate.optional(),
    endDate: isoDate.optional(),
    metadata: z.record(z.any()).optional(),
  })
  .strip();

export const createCampaignBodySchema = campaignBaseSchema;
export const updateCampaignBodySchema = campaignBaseSchema.partial();

const creativeBaseSchema = z
  .object({
    name: z.string().trim().min(1, 'Provide a creative name.'),
    type: z.enum(AD_TYPES),
    status: z.enum(AD_STATUSES).optional(),
    format: z.string().trim().max(40).optional(),
    headline: z.string().trim().max(255).optional(),
    subheadline: z.string().trim().max(255).optional(),
    body: z.string().trim().max(4000).optional(),
    callToAction: z.string().trim().max(120).optional(),
    ctaUrl: z.string().trim().url().optional(),
    mediaUrl: z.string().trim().url().optional(),
    durationSeconds: z.coerce.number().int().min(0).optional(),
    primaryColor: z.string().trim().max(12).optional(),
    accentColor: z.string().trim().max(12).optional(),
    metadata: z.record(z.any()).optional(),
  })
  .strip();

export const createCreativeBodySchema = creativeBaseSchema;
export const updateCreativeBodySchema = creativeBaseSchema.partial();

const placementBaseSchema = z
  .object({
    surface: z.enum(AD_SURFACE_TYPES, { required_error: 'Select a surface.' }),
    position: z.enum(AD_POSITION_TYPES, { required_error: 'Select a placement position.' }),
    status: z.enum(AD_STATUSES).optional(),
    pacingMode: z.enum(AD_PACING_MODES).optional(),
    weight: z.coerce.number().int().min(1).max(100).optional(),
    maxImpressionsPerHour: z.coerce.number().int().min(0).optional(),
    priority: z.coerce.number().int().min(0).max(999).optional(),
    startAt: isoDate.optional(),
    endAt: isoDate.optional(),
    opportunityType: z.enum(AD_OPPORTUNITY_TYPES).optional(),
    metadata: z.record(z.any()).optional(),
  })
  .strip();

export const createPlacementBodySchema = placementBaseSchema;
export const updatePlacementBodySchema = placementBaseSchema.partial();

export default {
  workspaceQuerySchema,
  campaignIdParamsSchema,
  creativeIdParamsSchema,
  placementIdParamsSchema,
  createCampaignBodySchema,
  updateCampaignBodySchema,
  createCreativeBodySchema,
  updateCreativeBodySchema,
  createPlacementBodySchema,
  updatePlacementBodySchema,
};
