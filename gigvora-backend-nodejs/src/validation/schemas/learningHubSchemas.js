import { z } from 'zod';
import { optionalBoolean, optionalNumber, optionalTrimmedString, requiredTrimmedString } from '../primitives.js';
import { LEARNING_ENROLLMENT_STATUSES } from '../../models/index.js';

const positiveId = (field) =>
  z
    .preprocess((value) => {
      if (value == null || value === '') {
        return undefined;
      }
      const numeric = Number(value);
      return Number.isFinite(numeric) ? numeric : value;
    }, z.number({ invalid_type_error: `${field} must be a number.` }))
    .int({ message: `${field} must be a whole number.` })
    .positive({ message: `${field} must be a positive integer.` });

export const freelancerParamsSchema = z
  .object({
    freelancerId: positiveId('freelancerId'),
  })
  .strip();

export const enrollmentParamsSchema = freelancerParamsSchema
  .extend({
    enrollmentId: positiveId('enrollmentId'),
  })
  .strip();

export const certificationParamsSchema = freelancerParamsSchema
  .extend({
    certificationId: positiveId('certificationId'),
  })
  .strip();

export const learningHubOverviewQuerySchema = z
  .object({
    includeEmpty: optionalBoolean(),
  })
  .strip();

export const learningHubEnrollmentBodySchema = z
  .object({
    courseId: positiveId('courseId'),
  })
  .strip();

const enrollmentStatusEnum = z.enum([...LEARNING_ENROLLMENT_STATUSES]);

export const learningHubEnrollmentUpdateBodySchema = z
  .object({
    status: enrollmentStatusEnum.optional(),
    progress: optionalNumber({ min: 0, max: 100, precision: 2 }).transform((value) => value ?? undefined),
    notes: optionalTrimmedString({ max: 2000 }).transform((value) => value ?? undefined),
  })
  .strip();

export const learningHubMentoringSessionBodySchema = z
  .object({
    mentorId: positiveId('mentorId'),
    serviceLineId: positiveId('serviceLineId').optional(),
    topic: requiredTrimmedString({ max: 255 }),
    agenda: optionalTrimmedString({ max: 5000 }).transform((value) => value ?? undefined),
    scheduledAt: requiredTrimmedString({ max: 40 }),
    durationMinutes: optionalNumber({ min: 15, max: 720, integer: true }).transform((value) => value ?? undefined),
    meetingUrl: optionalTrimmedString({ max: 2048 }).transform((value) => value ?? undefined),
  })
  .strip();

const tagsArray = z
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
  .max(50, { message: 'You can submit up to 50 items.' })
  .optional()
  .transform((value) => (value ? Array.from(new Set(value)) : undefined));

export const learningHubDiagnosticBodySchema = z
  .object({
    serviceLineId: positiveId('serviceLineId'),
    summary: requiredTrimmedString({ max: 4000 }),
    strengths: tagsArray,
    gaps: tagsArray,
    recommendedActions: tagsArray,
    completedAt: optionalTrimmedString({ max: 40 }).transform((value) => value ?? undefined),
  })
  .strip();

export default {
  freelancerParamsSchema,
  enrollmentParamsSchema,
  certificationParamsSchema,
  learningHubOverviewQuerySchema,
  learningHubEnrollmentBodySchema,
  learningHubEnrollmentUpdateBodySchema,
  learningHubMentoringSessionBodySchema,
  learningHubDiagnosticBodySchema,
};
