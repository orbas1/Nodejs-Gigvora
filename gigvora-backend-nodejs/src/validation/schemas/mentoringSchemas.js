import { z } from 'zod';
import {
  PEER_MENTORING_STATUSES,
  MENTORING_SESSION_NOTE_VISIBILITIES,
  MENTORING_SESSION_ACTION_STATUSES,
  MENTORING_SESSION_ACTION_PRIORITIES,
} from '../../models/constants/index.js';
import { optionalNumber, optionalTrimmedString, requiredTrimmedString } from '../primitives.js';

const idSchema = optionalNumber({ min: 1, integer: true }).transform((value) => value ?? undefined);

const requiredIdSchema = z
  .preprocess((value) => {
    if (value == null || value === '') {
      return undefined;
    }
    return value;
  }, optionalNumber({ min: 1, integer: true }))
  .superRefine((value, ctx) => {
    if (value == null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Value is required.',
      });
    }
  })
  .transform((value) => value ?? undefined);

const paginationSchema = z
  .object({
    page: optionalNumber({ min: 1, integer: true }).transform((value) => value ?? undefined),
    pageSize: optionalNumber({ min: 1, max: 100, integer: true }).transform((value) => value ?? undefined),
  })
  .strip();

const sortSchema = optionalTrimmedString({ max: 60 }).transform((value) => value ?? undefined);

const statusArraySchema = z
  .array(z.enum(PEER_MENTORING_STATUSES))
  .max(PEER_MENTORING_STATUSES.length)
  .optional();

const statusQuerySchema = z
  .union([
    z.preprocess((value) => {
      if (value == null || value === '') {
        return undefined;
      }
      if (Array.isArray(value)) {
        return value;
      }
      return [`${value}`];
    }, statusArraySchema),
    z.enum(PEER_MENTORING_STATUSES).optional(),
  ])
  .optional();

export const adminMentoringListQuerySchema = z
  .object({
    mentorId: idSchema,
    menteeId: idSchema,
    serviceLineId: idSchema,
    ownerId: idSchema,
    from: optionalTrimmedString({ max: 50 }).transform((value) => value ?? undefined),
    to: optionalTrimmedString({ max: 50 }).transform((value) => value ?? undefined),
    search: optionalTrimmedString({ max: 120 }).transform((value) => value ?? undefined),
    sort: sortSchema,
    status: statusQuerySchema,
  })
  .merge(paginationSchema)
  .strip();

const resourceLinkSchema = z
  .object({
    label: optionalTrimmedString({ max: 200 }).transform((value) => value ?? undefined),
    url: requiredTrimmedString({ max: 2048 }),
    type: optionalTrimmedString({ max: 120 }).transform((value) => value ?? undefined),
  })
  .strip();

const actionItemSchema = z
  .object({
    title: requiredTrimmedString({ max: 200 }),
    description: optionalTrimmedString({ max: 2000 }).transform((value) => value ?? undefined),
    status: z.enum(MENTORING_SESSION_ACTION_STATUSES).optional(),
    priority: z.enum(MENTORING_SESSION_ACTION_PRIORITIES).optional(),
    dueAt: optionalTrimmedString({ max: 50 }).transform((value) => value ?? undefined),
    assigneeId: idSchema,
    createdById: idSchema,
    completedAt: optionalTrimmedString({ max: 50 }).transform((value) => value ?? undefined),
  })
  .strip();

const noteSchema = z
  .object({
    authorId: idSchema,
    visibility: z.enum(MENTORING_SESSION_NOTE_VISIBILITIES).optional(),
    body: requiredTrimmedString({ max: 5000 }),
    attachments: z.array(resourceLinkSchema).optional(),
  })
  .strip();

export const adminMentoringCreateBodySchema = z
  .object({
    mentorId: requiredIdSchema,
    menteeId: requiredIdSchema,
    serviceLineId: idSchema,
    adminOwnerId: idSchema,
    topic: requiredTrimmedString({ max: 255 }),
    agenda: optionalTrimmedString({ max: 5000 }).transform((value) => value ?? undefined),
    scheduledAt: requiredTrimmedString({ max: 50 }),
    durationMinutes: optionalNumber({ min: 0, max: 720, integer: true }).transform((value) => value ?? undefined),
    status: optionalTrimmedString({ max: 32 }).transform((value) => value ?? undefined),
    meetingUrl: optionalTrimmedString({ max: 2048 }).transform((value) => value ?? undefined),
    meetingProvider: optionalTrimmedString({ max: 120 }).transform((value) => value ?? undefined),
    recordingUrl: optionalTrimmedString({ max: 2048 }).transform((value) => value ?? undefined),
    notesSummary: optionalTrimmedString({ max: 5000 }).transform((value) => value ?? undefined),
    followUpAt: optionalTrimmedString({ max: 50 }).transform((value) => value ?? undefined),
    feedbackRating: optionalNumber({ min: 0, max: 5, precision: 2 }).transform((value) => value ?? undefined),
    feedbackSummary: optionalTrimmedString({ max: 5000 }).transform((value) => value ?? undefined),
    resourceLinks: z.array(resourceLinkSchema).optional(),
    actionItems: z.array(actionItemSchema).optional(),
    sessionNotes: z.array(noteSchema).optional(),
  })
  .strip();

export const adminMentoringUpdateBodySchema = adminMentoringCreateBodySchema
  .partial({ mentorId: true, menteeId: true, topic: true, scheduledAt: true })
  .strip();

export const adminMentoringNoteBodySchema = noteSchema;

export const adminMentoringNoteUpdateBodySchema = noteSchema.partial().strip();

export const adminMentoringActionCreateBodySchema = actionItemSchema;

export const adminMentoringActionUpdateBodySchema = actionItemSchema
  .partial()
  .extend({ title: optionalTrimmedString({ max: 200 }).transform((value) => value ?? undefined) })
  .strip();
