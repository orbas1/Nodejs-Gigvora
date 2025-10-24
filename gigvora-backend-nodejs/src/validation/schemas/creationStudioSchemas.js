import { z } from 'zod';
import {
  CREATION_STUDIO_ITEM_TYPES,
  CREATION_STUDIO_ITEM_STATUSES,
  CREATION_STUDIO_VISIBILITIES,
  CREATION_STUDIO_COLLABORATOR_STATUSES,
} from '../../models/creationStudioModels.js';
import {
  optionalBoolean,
  optionalNumber,
  optionalStringArray,
  optionalTrimmedString,
  requiredTrimmedString,
} from '../primitives.js';

function optionalDateTime() {
  return z
    .union([z.string(), z.date(), z.number()])
    .optional()
    .transform((value, ctx) => {
      if (value == null || value === '') {
        return undefined;
      }
      const date = value instanceof Date ? value : new Date(value);
      if (Number.isNaN(date.getTime())) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'must be a valid date.' });
        return z.NEVER;
      }
      return date.toISOString();
    });
}

const typeEnum = z.enum([...CREATION_STUDIO_ITEM_TYPES]);
const statusEnum = z.enum([...CREATION_STUDIO_ITEM_STATUSES]);
const visibilityEnum = z.enum([...CREATION_STUDIO_VISIBILITIES]);

const baseSchema = z
  .object({
    workspaceId: optionalNumber({ min: 1, integer: true }).transform((value) => value ?? undefined),
    type: typeEnum,
    title: requiredTrimmedString({ min: 3, max: 180 }),
    headline: optionalTrimmedString({ max: 255 }).transform((value) => value ?? undefined),
    summary: optionalTrimmedString({ max: 2000 }).transform((value) => value ?? undefined),
    content: optionalTrimmedString({ max: 10000 }).transform((value) => value ?? undefined),
    status: statusEnum.optional(),
    visibility: visibilityEnum.optional(),
    category: optionalTrimmedString({ max: 120 }).transform((value) => value ?? undefined),
    location: optionalTrimmedString({ max: 255 }).transform((value) => value ?? undefined),
    targetAudience: optionalTrimmedString({ max: 255 }).transform((value) => value ?? undefined),
    launchDate: optionalDateTime(),
    publishAt: optionalDateTime(),
    endDate: optionalDateTime(),
    imageUrl: optionalTrimmedString({ max: 500 }).transform((value) => value ?? undefined),
    tags: optionalStringArray({ maxItemLength: 60, maxLength: 12 }),
    settings: z.record(z.any()).optional(),
    metadata: z.record(z.any()).optional(),
    budgetAmount: optionalNumber({ min: 0 }).transform((value) => value ?? undefined),
    budgetCurrency: optionalTrimmedString({ max: 6, toUpperCase: true }).transform((value) => value ?? undefined),
    compensationMin: optionalNumber({ min: 0 }).transform((value) => value ?? undefined),
    compensationMax: optionalNumber({ min: 0 }).transform((value) => value ?? undefined),
    compensationCurrency: optionalTrimmedString({ max: 6, toUpperCase: true }).transform((value) => value ?? undefined),
    durationWeeks: optionalNumber({ min: 0, integer: true }).transform((value) => value ?? undefined),
    commitmentHours: optionalNumber({ min: 0, integer: true }).transform((value) => value ?? undefined),
    remoteEligible: optionalBoolean().transform((value) => value ?? undefined),
  })
  .strip();

export const creationStudioCreateSchema = baseSchema;

export const creationStudioUpdateSchema = baseSchema.partial({ type: true, title: true });

export const creationStudioItemParamsSchema = z.object({
  itemId: requiredTrimmedString({ min: 1, max: 40 }).transform((value, ctx) => {
    const parsed = Number.parseInt(value, 10);
    if (!Number.isInteger(parsed) || parsed <= 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'itemId must be a positive integer.' });
      return z.NEVER;
    }
    return parsed;
  }),
});

export const creationStudioPublishSchema = z
  .object({
    publishAt: optionalDateTime(),
  })
  .strip();

export const creationStudioListQuerySchema = z
  .object({
    workspaceId: optionalNumber({ min: 1, integer: true }).transform((value) => value ?? undefined),
    type: optionalTrimmedString({ max: 80 })
      .transform((value) => (value && CREATION_STUDIO_ITEM_TYPES.includes(value) ? value : undefined))
      .optional(),
    status: optionalTrimmedString({ max: 40 })
      .transform((value) => (value && CREATION_STUDIO_ITEM_STATUSES.includes(value) ? value : undefined))
      .optional(),
    search: optionalTrimmedString({ max: 255 }).transform((value) => value ?? undefined),
    limit: optionalNumber({ min: 1, max: 100, integer: true }).transform((value) => value ?? undefined),
    offset: optionalNumber({ min: 0, integer: true }).transform((value) => value ?? undefined),
    page: optionalNumber({ min: 1, integer: true }).transform((value) => value ?? undefined),
    pageSize: optionalNumber({ min: 1, max: 100, integer: true }).transform((value) => value ?? undefined),
  })
  .strip();

export const creationStudioOverviewQuerySchema = z
  .object({
    workspaceId: optionalNumber({ min: 1, integer: true }).transform((value) => value ?? undefined),
  })
  .strip();

const collaboratorStatusEnum = z.enum([...CREATION_STUDIO_COLLABORATOR_STATUSES]);

export const creationStudioCollaboratorQuerySchema = z
  .object({
    ownerId: optionalNumber({ min: 1, integer: true }).transform((value) => value ?? undefined),
    trackType: optionalTrimmedString({ max: 80 })
      .transform((value) => (value && CREATION_STUDIO_ITEM_TYPES.includes(value) ? value : undefined))
      .optional(),
  })
  .strip();

export const creationStudioCollaboratorBodySchema = z
  .object({
    ownerId: optionalNumber({ min: 1, integer: true }).transform((value) => value ?? undefined),
    trackType: requiredTrimmedString({ max: 80 }).transform((value, ctx) => {
      const normalised = value.trim();
      if (!CREATION_STUDIO_ITEM_TYPES.includes(normalised)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Unsupported track type.' });
        return z.NEVER;
      }
      return normalised;
    }),
    email: requiredTrimmedString({ max: 320 }).email(),
    role: optionalTrimmedString({ max: 120 }).transform((value) => value ?? undefined),
    status: collaboratorStatusEnum.optional(),
    itemId: optionalNumber({ min: 1, integer: true }).transform((value) => value ?? undefined),
    workspaceId: optionalNumber({ min: 1, integer: true }).transform((value) => value ?? undefined),
    metadata: z.record(z.any()).optional(),
  })
  .strip();

export const creationStudioCollaboratorParamsSchema = z.object({
  collaboratorId: requiredTrimmedString({ min: 1, max: 40 }).transform((value, ctx) => {
    const parsed = Number.parseInt(value, 10);
    if (!Number.isInteger(parsed) || parsed <= 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'collaboratorId must be a positive integer.' });
      return z.NEVER;
    }
    return parsed;
  }),
});

export const creationStudioCollaboratorUpdateSchema = z
  .object({
    ownerId: optionalNumber({ min: 1, integer: true }).transform((value) => value ?? undefined),
    status: collaboratorStatusEnum.optional(),
    itemId: optionalNumber({ min: 1, integer: true }).transform((value) => value ?? undefined),
    metadata: z.record(z.any()).optional(),
  })
  .strip();

export default {
  creationStudioCreateSchema,
  creationStudioUpdateSchema,
  creationStudioItemParamsSchema,
  creationStudioPublishSchema,
  creationStudioListQuerySchema,
  creationStudioOverviewQuerySchema,
  creationStudioCollaboratorQuerySchema,
  creationStudioCollaboratorBodySchema,
  creationStudioCollaboratorParamsSchema,
  creationStudioCollaboratorUpdateSchema,
};
