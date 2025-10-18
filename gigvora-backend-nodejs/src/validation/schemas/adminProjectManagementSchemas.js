import { z } from 'zod';
import {
  optionalBoolean,
  optionalNumber,
  optionalStringArray,
  optionalTrimmedString,
  requiredTrimmedString,
} from '../primitives.js';
import {
  PROJECT_STATUSES,
  PROJECT_RISK_LEVELS,
  PROJECT_COLLABORATOR_STATUSES,
  PROJECT_INTEGRATION_STATUSES,
} from '../../models/projectGigManagementModels.js';

function assertEnumValue(value, allowed, ctx, field) {
  if (!value) {
    return;
  }
  if (!allowed.includes(value)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: `${field} is invalid.` });
  }
}

const metadataSchema = z.record(z.any()).optional();

const workspaceSchema = z
  .object({
    status: optionalTrimmedString({ max: 40 }).transform((value) => (value ? value.toLowerCase() : undefined)),
    progressPercent: optionalNumber({ min: 0, max: 100, precision: 2 }),
    riskLevel: optionalTrimmedString({ max: 40 }).transform((value) => (value ? value.toLowerCase() : undefined)),
    nextMilestone: optionalTrimmedString({ max: 255 }).transform((value) => value ?? undefined),
    nextMilestoneDueAt: optionalTrimmedString({ max: 40 }).transform((value) => value ?? undefined),
    notes: optionalTrimmedString({ max: 2000 }).transform((value) => value ?? undefined),
    metrics: metadataSchema,
  })
  .strip()
  .optional()
  .superRefine((data, ctx) => {
    if (data?.status) {
      assertEnumValue(data.status, PROJECT_STATUSES, ctx, 'status');
    }
    if (data?.riskLevel) {
      assertEnumValue(data.riskLevel, PROJECT_RISK_LEVELS, ctx, 'riskLevel');
    }
  });

const milestoneCreateSchema = z
  .object({
    title: requiredTrimmedString({ max: 180 }),
    description: optionalTrimmedString({ max: 2000 }).transform((value) => value ?? undefined),
    ordinal: optionalNumber({ min: 0, precision: 0, integer: true }),
    dueDate: optionalTrimmedString({ max: 40 }).transform((value) => value ?? undefined),
    completedAt: optionalTrimmedString({ max: 40 }).transform((value) => value ?? undefined),
    status: optionalTrimmedString({ max: 40 }).transform((value) => value?.toLowerCase()),
    budget: optionalNumber({ min: 0, precision: 2 }),
    metrics: metadataSchema,
  })
  .strip();

const milestoneUpdateSchema = milestoneCreateSchema.partial();

const collaboratorCreateSchema = z
  .object({
    fullName: requiredTrimmedString({ max: 180 }),
    email: optionalTrimmedString({ max: 180 }).transform((value) => value ?? undefined),
    role: optionalTrimmedString({ max: 120 }).transform((value) => value ?? undefined),
    status: optionalTrimmedString({ max: 40 }).transform((value) => value?.toLowerCase()),
    hourlyRate: optionalNumber({ min: 0, precision: 2 }),
    permissions: metadataSchema,
  })
  .strip()
  .superRefine((data, ctx) => {
    if (data.status) {
      assertEnumValue(data.status, PROJECT_COLLABORATOR_STATUSES, ctx, 'status');
    }
  });

const collaboratorUpdateSchema = collaboratorCreateSchema.partial();

const integrationCreateSchema = z
  .object({
    provider: requiredTrimmedString({ max: 120 }),
    status: optionalTrimmedString({ max: 40 }).transform((value) => value?.toLowerCase()),
    connectedAt: optionalTrimmedString({ max: 40 }).transform((value) => value ?? undefined),
    metadata: metadataSchema,
  })
  .strip()
  .superRefine((data, ctx) => {
    if (data.status) {
      assertEnumValue(data.status, PROJECT_INTEGRATION_STATUSES, ctx, 'status');
    }
  });

const integrationUpdateSchema = integrationCreateSchema.partial();

const assetCreateSchema = z
  .object({
    label: requiredTrimmedString({ max: 180 }),
    category: optionalTrimmedString({ max: 80 }).transform((value) => value ?? undefined),
    storageUrl: requiredTrimmedString({ max: 2048 }),
    thumbnailUrl: optionalTrimmedString({ max: 2048 }).transform((value) => value ?? undefined),
    sizeBytes: optionalNumber({ min: 0, precision: 0, integer: true }),
    permissionLevel: optionalTrimmedString({ max: 60 }).transform((value) => value ?? undefined),
    watermarkEnabled: optionalBoolean(),
    metadata: metadataSchema,
  })
  .strip();

const retrospectiveCreateSchema = z
  .object({
    milestoneTitle: optionalTrimmedString({ max: 180 }).transform((value) => value ?? undefined),
    summary: requiredTrimmedString({ max: 5000, min: 5 }),
    sentiment: optionalTrimmedString({ max: 40 }).transform((value) => value ?? undefined),
    generatedAt: optionalTrimmedString({ max: 40 }).transform((value) => value ?? undefined),
    highlights: metadataSchema,
  })
  .strip();

function coerceEnumArray(values, allowed) {
  if (!values) {
    return undefined;
  }
  const normalised = values.map((value) => value.toLowerCase());
  return normalised.filter((value) => allowed.includes(value));
}

export const projectPortfolioQuerySchema = z
  .object({
    search: optionalTrimmedString({ max: 200 }).transform((value) => value ?? undefined),
    statuses: optionalStringArray({ maxItemLength: 40 }).transform((values) => coerceEnumArray(values, PROJECT_STATUSES)),
    riskLevels: optionalStringArray({ maxItemLength: 40 }).transform((values) => coerceEnumArray(values, PROJECT_RISK_LEVELS)),
    ownerId: optionalNumber({ min: 1, precision: 0, integer: true }).transform((value) => value ?? undefined),
    limit: optionalNumber({ min: 1, max: 100, precision: 0, integer: true }).transform((value) => value ?? undefined),
    offset: optionalNumber({ min: 0, precision: 0, integer: true }).transform((value) => value ?? undefined),
    sortBy: optionalTrimmedString({ max: 40 }).transform((value) => {
      if (!value) return undefined;
      const allowed = new Set(['status', 'dueDate', 'progress', 'risk', 'updatedAt', 'owner']);
      const normalized = value.toLowerCase();
      return allowed.has(normalized) ? normalized : undefined;
    }),
    sortDirection: optionalTrimmedString({ max: 4 }).transform((value) => {
      if (!value) return undefined;
      const normalized = value.toLowerCase();
      if (normalized === 'asc' || normalized === 'desc') {
        return normalized;
      }
      return undefined;
    }),
  })
  .strip();

const baseProjectSchema = z
  .object({
    ownerId: optionalNumber({ min: 1, precision: 0, integer: true }),
    title: requiredTrimmedString({ max: 180 }),
    description: requiredTrimmedString({ max: 5000 }),
    status: optionalTrimmedString({ max: 40 }).transform((value) => value?.toLowerCase()),
    budgetCurrency: optionalTrimmedString({ max: 3, toUpperCase: true }).transform((value) => value ?? undefined),
    budgetAllocated: optionalNumber({ min: 0, precision: 2 }),
    budgetSpent: optionalNumber({ min: 0, precision: 2 }),
    startDate: optionalTrimmedString({ max: 40 }).transform((value) => value ?? undefined),
    dueDate: optionalTrimmedString({ max: 40 }).transform((value) => value ?? undefined),
    archivedAt: optionalTrimmedString({ max: 40 }).transform((value) => value ?? undefined),
    metadata: metadataSchema,
    workspace: workspaceSchema,
    milestones: z.array(milestoneCreateSchema).optional(),
    collaborators: z.array(collaboratorCreateSchema).optional(),
    integrations: z.array(integrationCreateSchema).optional(),
    assets: z.array(assetCreateSchema).optional(),
  })
  .strip()
  .superRefine((data, ctx) => {
    if (data.status) {
      assertEnumValue(data.status, PROJECT_STATUSES, ctx, 'status');
    }
  });

export const createProjectBodySchema = baseProjectSchema.superRefine((data, ctx) => {
  if (!data.ownerId) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'ownerId is required.' });
  }
});

export const updateProjectBodySchema = baseProjectSchema.partial();

export const projectWorkspaceBodySchema = z
  .object({
    status: optionalTrimmedString({ max: 40 }).transform((value) => value?.toLowerCase()),
    riskLevel: optionalTrimmedString({ max: 40 }).transform((value) => value?.toLowerCase()),
    progressPercent: optionalNumber({ min: 0, max: 100, precision: 2 }),
    nextMilestone: optionalTrimmedString({ max: 255 }).transform((value) => value ?? undefined),
    nextMilestoneDueAt: optionalTrimmedString({ max: 40 }).transform((value) => value ?? undefined),
    notes: optionalTrimmedString({ max: 2000 }).transform((value) => value ?? undefined),
    metrics: metadataSchema,
  })
  .strip()
  .superRefine((data, ctx) => {
    if (data.status) {
      assertEnumValue(data.status, PROJECT_STATUSES, ctx, 'status');
    }
    if (data.riskLevel) {
      assertEnumValue(data.riskLevel, PROJECT_RISK_LEVELS, ctx, 'riskLevel');
    }
  });

function positiveId(field) {
  return z
    .any()
    .transform((value, ctx) => {
      const numeric = Number(value);
      if (!Number.isInteger(numeric) || numeric <= 0) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: `${field} must be a positive integer.` });
        return z.NEVER;
      }
      return numeric;
    });
}

export const projectIdParamsSchema = z
  .object({
    projectId: positiveId('projectId'),
  })
  .strip();

export const projectMilestoneParamsSchema = z
  .object({
    projectId: positiveId('projectId'),
    milestoneId: positiveId('milestoneId'),
  })
  .strip();

export const projectCollaboratorParamsSchema = z
  .object({
    projectId: positiveId('projectId'),
    collaboratorId: positiveId('collaboratorId'),
  })
  .strip();

export const projectIntegrationParamsSchema = z
  .object({
    projectId: positiveId('projectId'),
    integrationId: positiveId('integrationId'),
  })
  .strip();

export const projectAssetParamsSchema = z
  .object({
    projectId: positiveId('projectId'),
    assetId: positiveId('assetId'),
  })
  .strip();

export const projectRetrospectiveParamsSchema = z
  .object({
    projectId: positiveId('projectId'),
  })
  .strip();

export const milestoneCreateBodySchema = milestoneCreateSchema;
export const milestoneUpdateBodySchema = milestoneUpdateSchema;
export const collaboratorCreateBodySchema = collaboratorCreateSchema;
export const collaboratorUpdateBodySchema = collaboratorUpdateSchema;
export const integrationCreateBodySchema = integrationCreateSchema;
export const integrationUpdateBodySchema = integrationUpdateSchema;
export const assetCreateBodySchema = assetCreateSchema;
export const retrospectiveCreateBodySchema = retrospectiveCreateSchema;

export default {
  projectPortfolioQuerySchema,
  createProjectBodySchema,
  updateProjectBodySchema,
  projectWorkspaceBodySchema,
  projectIdParamsSchema,
  projectMilestoneParamsSchema,
  projectCollaboratorParamsSchema,
  projectIntegrationParamsSchema,
  projectAssetParamsSchema,
  projectRetrospectiveParamsSchema,
  milestoneCreateBodySchema,
  milestoneUpdateBodySchema,
  collaboratorCreateBodySchema,
  collaboratorUpdateBodySchema,
  integrationCreateBodySchema,
  integrationUpdateBodySchema,
  assetCreateBodySchema,
  retrospectiveCreateBodySchema,
};
