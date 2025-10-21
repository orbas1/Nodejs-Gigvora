import { z } from 'zod';
import {
  LAUNCHPAD_PLACEMENT_STATUSES,
  LAUNCHPAD_OPPORTUNITY_SOURCES,
} from '../../models/constants/index.js';

const isoDate = z
  .string()
  .trim()
  .refine((value) => !value || !Number.isNaN(Date.parse(value)), {
    message: 'Must be a valid ISO date string.',
  });

export const dashboardQuerySchema = z
  .object({
    workspaceId: z.coerce.number().int().positive().optional(),
    workspaceSlug: z.string().trim().min(1).optional(),
    launchpadId: z.coerce.number().int().positive().optional(),
    lookbackDays: z.coerce.number().int().positive().max(365).optional(),
  })
  .partial()
  .strip();

export const linkIdParamsSchema = z
  .object({
    linkId: z.coerce.number().int().positive({ message: 'linkId must be a positive integer.' }),
  })
  .strip();

export const placementIdParamsSchema = z
  .object({
    placementId: z.coerce.number().int().positive({ message: 'placementId must be a positive integer.' }),
  })
  .strip();

export const createLinkBodySchema = z
  .object({
    launchpadId: z.coerce.number().int().positive({ message: 'launchpadId is required.' }),
    jobId: z.coerce.number().int().positive({ message: 'jobId is required.' }),
    source: z.enum(LAUNCHPAD_OPPORTUNITY_SOURCES).optional(),
    notes: z.string().trim().max(4000).optional(),
  })
  .strip();

export const updateLinkBodySchema = z
  .object({
    notes: z.string().trim().max(4000).nullable().optional(),
  })
  .strip();

const compensationSchema = z
  .object({
    amount: z.coerce.number().min(0).optional(),
    currency: z.string().trim().length(3).optional(),
    currencyCode: z.string().trim().length(3).optional(),
    cadence: z.string().trim().max(120).optional(),
    frequency: z.string().trim().max(120).optional(),
    structure: z.string().trim().max(120).optional(),
    type: z.string().trim().max(120).optional(),
    notes: z.string().trim().max(4000).optional(),
  })
  .strip()
  .partial();

export const createPlacementBodySchema = z
  .object({
    candidateId: z.coerce.number().int().positive({ message: 'candidateId is required.' }),
    employerRequestId: z.coerce.number().int().positive().optional(),
    status: z.enum(LAUNCHPAD_PLACEMENT_STATUSES).optional(),
    placementDate: isoDate.optional(),
    endDate: isoDate.optional(),
    compensation: compensationSchema.optional(),
    feedbackScore: z.coerce.number().min(0).max(100).optional(),
  })
  .strip();

export const updatePlacementBodySchema = createPlacementBodySchema.partial();

export default {
  dashboardQuerySchema,
  createLinkBodySchema,
  updateLinkBodySchema,
  createPlacementBodySchema,
  updatePlacementBodySchema,
  linkIdParamsSchema,
  placementIdParamsSchema,
};

