import { z } from 'zod';
import {
  optionalBoolean,
  optionalNumber,
  optionalTrimmedString,
  requiredTrimmedString,
} from '../primitives.js';

const positiveId = (field) =>
  z
    .preprocess((value) => {
      if (value == null || value === '') {
        return undefined;
      }
      const numeric = Number(value);
      return Number.isFinite(numeric) ? numeric : value;
    }, z.number({ invalid_type_error: `${field} must be a number.` }))
    .int({ message: `${field} must be an integer.` })
    .positive({ message: `${field} must be a positive integer.` });

export const threadParamsSchema = z
  .object({
    threadId: positiveId('threadId'),
  })
  .strip();

export const messageParamsSchema = threadParamsSchema
  .extend({
    messageId: positiveId('messageId'),
  })
  .strip();

export const participantParamsSchema = threadParamsSchema
  .extend({
    participantId: positiveId('participantId'),
  })
  .strip();

export const callParamsSchema = threadParamsSchema;

export const threadStateBodySchema = z
  .object({
    state: requiredTrimmedString({ max: 60 }),
  })
  .strip();

const metadataSchema = z
  .record(z.any())
  .optional()
  .transform((value) => (value && Object.keys(value).length > 0 ? value : undefined));

export const createThreadBodySchema = z
  .object({
    subject: requiredTrimmedString({ max: 255 }),
    channelType: requiredTrimmedString({ max: 60 }),
    participantIds: z
      .preprocess((value) => {
        if (value == null) {
          return [];
        }
        if (Array.isArray(value)) {
          return value;
        }
        return [`${value}`];
      }, z.array(positiveId('participantId')))
      .max(50, { message: 'participantIds supports a maximum of 50 entries.' })
      .optional()
      .transform((ids) => ids ?? []),
    metadata: metadataSchema,
  })
  .strip();

export const createMessageBodySchema = z
  .object({
    messageType: requiredTrimmedString({ max: 40 }),
    body: requiredTrimmedString({ max: 8000 }),
    attachments: z.array(z.record(z.any())).optional().default([]),
    metadata: metadataSchema,
  })
  .strip();

export const callSessionBodySchema = z
  .object({
    callType: requiredTrimmedString({ max: 32 }),
    callId: optionalTrimmedString({ max: 120 }).transform((value) => value ?? undefined),
  })
  .strip();

export const typingStateBodySchema = z
  .object({
    typing: optionalBoolean(),
    displayName: optionalTrimmedString({ max: 160 }).transform((value) => value ?? undefined),
  })
  .strip();

export const muteThreadBodySchema = z
  .object({
    until: optionalTrimmedString({ max: 40 }).transform((value) => value ?? undefined),
  })
  .strip();

export const escalateThreadBodySchema = z
  .object({
    reason: requiredTrimmedString({ max: 2000 }),
    priority: optionalTrimmedString({ max: 60 }).transform((value) => value ?? undefined),
    metadata: metadataSchema,
  })
  .strip();

export const assignSupportBodySchema = z
  .object({
    agentId: positiveId('agentId'),
    assignedBy: positiveId('assignedBy').optional(),
    notifyAgent: optionalBoolean(),
  })
  .strip();

export const supportStatusBodySchema = z
  .object({
    status: requiredTrimmedString({ max: 60 }),
    resolutionSummary: optionalTrimmedString({ max: 4000 }).transform((value) => value ?? undefined),
    metadata: metadataSchema,
  })
  .strip();

export const threadSettingsBodySchema = z
  .object({
    muted: optionalBoolean(),
    starred: optionalBoolean(),
    labels: z
      .preprocess((value) => {
        if (value == null) {
          return undefined;
        }
        if (Array.isArray(value)) {
          return value;
        }
        return `${value}`
          .split(',')
          .map((entry) => entry.trim())
          .filter(Boolean);
      }, z.array(requiredTrimmedString({ max: 120 })))
      .max(20, { message: 'labels accepts a maximum of 20 entries.' })
      .optional(),
    retentionPolicy: optionalTrimmedString({ max: 60 }).transform((value) => value ?? undefined),
    retentionDays: optionalNumber({ min: 1, max: 3650, integer: true }).transform((value) => value ?? undefined),
    retentionLocked: optionalBoolean(),
  })
  .strip()
  .superRefine((value, ctx) => {
    if (value.retentionDays != null && value.retentionPolicy !== 'custom') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['retentionDays'],
        message: 'retentionDays may only be supplied when retentionPolicy is custom.',
      });
    }
  });

export const addParticipantsBodySchema = z
  .object({
    participantIds: z
      .preprocess((value) => {
        if (Array.isArray(value)) {
          return value;
        }
        if (value == null) {
          return [];
        }
        return [`${value}`];
      }, z.array(positiveId('participantId')))
      .min(1, { message: 'participantIds must include at least one entry.' })
      .max(50, { message: 'participantIds supports a maximum of 50 entries.' }),
  })
  .strip();

export const listThreadsQuerySchema = z
  .object({
    channelTypes: optionalTrimmedString({ max: 255 }).transform((value) => value ?? undefined),
    states: optionalTrimmedString({ max: 255 }).transform((value) => value ?? undefined),
    search: optionalTrimmedString({ max: 255 }).transform((value) => value ?? undefined),
    unreadOnly: optionalBoolean(),
    includeParticipants: optionalBoolean(),
    includeSupport: optionalBoolean(),
    includeLabels: optionalBoolean(),
    page: optionalNumber({ min: 1, integer: true }).transform((value) => value ?? undefined),
    pageSize: optionalNumber({ min: 1, max: 100, integer: true }).transform((value) => value ?? undefined),
  })
  .strip();

export const listMessagesQuerySchema = z
  .object({
    page: optionalNumber({ min: 1, integer: true }).transform((value) => value ?? undefined),
    pageSize: optionalNumber({ min: 1, max: 100, integer: true }).transform((value) => value ?? undefined),
    includeSystem: optionalBoolean(),
  })
  .strip();

export const threadDetailQuerySchema = z
  .object({
    includeParticipants: optionalBoolean(),
    includeSupport: optionalBoolean(),
    includeLabels: optionalBoolean(),
  })
  .strip();

const isoDateTime = z
  .preprocess((value) => {
    if (value == null || value === '') {
      return undefined;
    }
    const text = `${value}`.trim();
    return text || undefined;
  }, z.string().max(60))
  .refine((value) => (value == null ? true : !Number.isNaN(Date.parse(value))), {
    message: 'cutoff must be a valid ISO-8601 datetime.',
  });

export const createTranscriptBodySchema = z
  .object({
    cutoff: isoDateTime.transform((value) => value ?? undefined),
  })
  .strip();

export const searchThreadsQuerySchema = z
  .object({
    q: optionalTrimmedString({ max: 255 }).transform((value) => value ?? undefined),
    channelType: optionalTrimmedString({ max: 60 }).transform((value) => value ?? undefined),
    limit: optionalNumber({ min: 1, max: 50, integer: true }).transform((value) => value ?? undefined),
    includeMessages: optionalBoolean(),
  })
  .strip()
  .superRefine((value, ctx) => {
    if (!value.q) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['q'],
        message: 'q is required for thread search.',
      });
    } else if (value.q.length < 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.too_small,
        path: ['q'],
        minimum: 2,
        type: 'string',
        inclusive: true,
        message: 'q must be at least two characters.',
      });
    }
  });

export const enforceRetentionBodySchema = z
  .object({
    limit: optionalNumber({ min: 1, max: 200, integer: true }).transform((value) => value ?? undefined),
    dryRun: optionalBoolean(),
  })
  .strip();

export default {
  threadParamsSchema,
  messageParamsSchema,
  participantParamsSchema,
  callParamsSchema,
  threadStateBodySchema,
  createThreadBodySchema,
  createMessageBodySchema,
  callSessionBodySchema,
  typingStateBodySchema,
  muteThreadBodySchema,
  escalateThreadBodySchema,
  assignSupportBodySchema,
  supportStatusBodySchema,
  threadSettingsBodySchema,
  addParticipantsBodySchema,
  listThreadsQuerySchema,
  listMessagesQuerySchema,
  threadDetailQuerySchema,
  createTranscriptBodySchema,
  searchThreadsQuerySchema,
  enforceRetentionBodySchema,
};
