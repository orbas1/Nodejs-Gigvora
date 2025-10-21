import { z } from 'zod';
import {
  optionalBoolean,
  optionalNumber,
  optionalTrimmedString,
  requiredEmail,
  requiredTrimmedString,
} from '../primitives.js';
import {
  LAUNCHPAD_APPLICATION_STATUSES,
  LAUNCHPAD_PLACEMENT_STATUSES,
  LAUNCHPAD_TARGET_TYPES,
  LAUNCHPAD_OPPORTUNITY_SOURCES,
} from '../../models/constants/index.js';

const positiveId = (field) =>
  z
    .preprocess((value) => {
      if (value == null || value === '') {
        return undefined;
      }
      const numeric = Number(value);
      return Number.isFinite(numeric) ? numeric : value;
    }, z.number({ required_error: `${field} is required.`, invalid_type_error: `${field} must be a number.` }))
    .int(`${field} must be a whole number.`)
    .positive({ message: `${field} must be a positive integer.` });

const optionalPositiveId = (field) => positiveId(field).optional();

const skillArraySchema = z
  .preprocess((value) => {
    if (value == null) {
      return undefined;
    }
    if (Array.isArray(value)) {
      return value;
    }
    if (typeof value === 'string') {
      return value
        .split(',')
        .map((entry) => entry.trim())
        .filter(Boolean);
    }
    return [value];
  }, z.array(requiredTrimmedString({ max: 120 })))
  .max(50, { message: 'You can submit a maximum of 50 skills.' })
  .optional()
  .transform((skills) => (skills ? Array.from(new Set(skills)) : undefined));

const optionalIsoDate = optionalTrimmedString({ max: 40 }).transform((value) => value ?? undefined);

export const launchpadApplicationsQuerySchema = z
  .object({
    launchpadId: optionalPositiveId('launchpadId'),
    status: optionalTrimmedString({ max: 60 }).transform((value) => value ?? undefined),
    statuses: z
      .preprocess((value) => {
        if (value == null || value === '') {
          return undefined;
        }
        if (Array.isArray(value)) {
          return value;
        }
        return `${value}`
          .split(',')
          .map((entry) => entry.trim())
          .filter(Boolean);
      }, z.array(requiredTrimmedString({ max: 60 })))
      .max(10, { message: 'statuses accepts a maximum of 10 items.' })
      .optional(),
    search: optionalTrimmedString({ max: 120 }).transform((value) => value ?? undefined),
    page: optionalNumber({ min: 1, integer: true }).transform((value) => value ?? undefined),
    pageSize: optionalNumber({ min: 1, max: 100, integer: true }).transform((value) => value ?? undefined),
    minScore: optionalNumber({ min: 0, max: 100, precision: 2 }).transform((value) => value ?? undefined),
    maxScore: optionalNumber({ min: 0, max: 100, precision: 2 }).transform((value) => value ?? undefined),
    sort: optionalTrimmedString({ max: 60 }).transform((value) => value ?? undefined),
    includeMatches: optionalBoolean(),
  })
  .strip();

export const createLaunchpadApplicationBodySchema = z
  .object({
    launchpadId: positiveId('launchpadId'),
    applicantId: optionalPositiveId('applicantId'),
    applicantEmail: optionalTrimmedString({ max: 255 })
      .transform((value) => value?.toLowerCase())
      .refine((value) => !value || /^(?:[A-Za-z0-9_'^&+{}=-]+(?:\.[A-Za-z0-9_'^&+{}=-]+)*)@(?:[A-Za-z0-9-]+\.)+[A-Za-z]{2,}$/.test(value), {
        message: 'applicantEmail must be a valid email address.',
      }),
    applicantFirstName: optionalTrimmedString({ max: 120 }).transform((value) => value ?? undefined),
    applicantLastName: optionalTrimmedString({ max: 120 }).transform((value) => value ?? undefined),
    yearsExperience: optionalNumber({ min: 0, max: 60, precision: 1 }).transform((value) => value ?? undefined),
    skills: skillArraySchema,
    targetSkills: skillArraySchema,
    portfolioUrl: optionalTrimmedString({ max: 2048 }).transform((value) => value ?? undefined),
    motivations: optionalTrimmedString({ max: 4000 }).transform((value) => value ?? undefined),
    availabilityDate: optionalIsoDate,
    applicationId: optionalPositiveId('applicationId'),
  })
  .strip()
  .superRefine((value, ctx) => {
    if (!value.applicantId && !value.applicantEmail) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Either applicantId or applicantEmail must be supplied.',
        path: ['applicantEmail'],
      });
    }
  });

export const updateLaunchpadApplicationBodySchema = z
  .object({
    status: z.enum([...LAUNCHPAD_APPLICATION_STATUSES]),
    assignedMentor: optionalTrimmedString({ max: 255 }).transform((value) => value ?? undefined),
    interviewScheduledAt: optionalIsoDate,
    decisionNotes: optionalTrimmedString({ max: 5000 }).transform((value) => value ?? undefined),
  })
  .strip();

export const launchpadEmployerRequestBodySchema = z
  .object({
    launchpadId: positiveId('launchpadId'),
    organizationName: requiredTrimmedString({ max: 255 }),
    contactName: requiredTrimmedString({ max: 255 }),
    contactEmail: requiredEmail(),
    headcount: optionalNumber({ min: 1, max: 10000, integer: true }).transform((value) => value ?? undefined),
    engagementTypes: skillArraySchema,
    targetStartDate: optionalIsoDate,
    idealCandidateProfile: optionalTrimmedString({ max: 2000 }).transform((value) => value ?? undefined),
    hiringNotes: optionalTrimmedString({ max: 4000 }).transform((value) => value ?? undefined),
    slaCommitmentDays: optionalNumber({ min: 1, max: 180, integer: true }).transform((value) => value ?? undefined),
    metadata: z.record(z.any()).optional(),
  })
  .strip();

export const launchpadOpportunityLinkBodySchema = z
  .object({
    launchpadId: positiveId('launchpadId'),
    targetType: z.enum([...LAUNCHPAD_TARGET_TYPES]),
    targetId: positiveId('targetId'),
    source: z.enum([...LAUNCHPAD_OPPORTUNITY_SOURCES]).optional().default('manual'),
    notes: optionalTrimmedString({ max: 2000 }).transform((value) => value ?? undefined),
  })
  .strip();

export const launchpadPlacementBodySchema = z
  .object({
    launchpadId: positiveId('launchpadId'),
    candidateId: positiveId('candidateId'),
    employerRequestId: optionalPositiveId('employerRequestId'),
    targetType: z.enum([...LAUNCHPAD_TARGET_TYPES]).optional().default('project'),
    targetId: optionalPositiveId('targetId'),
    status: z.enum([...LAUNCHPAD_PLACEMENT_STATUSES]).optional().default('scheduled'),
    placementDate: optionalIsoDate,
    endDate: optionalIsoDate,
    compensation: optionalNumber({ min: 0, max: 10_000_000, precision: 2 }).transform((value) => value ?? undefined),
    feedbackScore: optionalNumber({ min: 0, max: 5, precision: 2 }).transform((value) => value ?? undefined),
  })
  .strip();

const lookbackQuery = z
  .object({
    launchpadId: optionalPositiveId('launchpadId'),
    lookbackDays: optionalNumber({ min: 1, max: 365, integer: true }).transform((value) => value ?? undefined),
  })
  .strip();

export const launchpadDashboardQuerySchema = lookbackQuery;
export const launchpadWorkflowQuerySchema = lookbackQuery;

export const launchpadApplicationParamsSchema = z
  .object({
    applicationId: positiveId('applicationId'),
  })
  .strip();

export default {
  launchpadApplicationsQuerySchema,
  createLaunchpadApplicationBodySchema,
  updateLaunchpadApplicationBodySchema,
  launchpadEmployerRequestBodySchema,
  launchpadOpportunityLinkBodySchema,
  launchpadPlacementBodySchema,
  launchpadDashboardQuerySchema,
  launchpadWorkflowQuerySchema,
  launchpadApplicationParamsSchema,
};
