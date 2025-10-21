import { z } from 'zod';
import {
  optionalBoolean,
  optionalNumber,
  optionalStringArray,
  optionalTrimmedString,
  requiredTrimmedString,
} from '../primitives.js';
import {
  MESSAGE_CHANNEL_TYPES,
  MESSAGE_THREAD_STATES,
  MESSAGE_TYPES,
  SUPPORT_CASE_PRIORITIES,
  SUPPORT_CASE_STATUSES,
} from '../../models/messagingModels.js';

const CHANNEL_TYPES = MESSAGE_CHANNEL_TYPES.map((value) => value.toLowerCase());
const THREAD_STATES = MESSAGE_THREAD_STATES.map((value) => value.toLowerCase());
const MESSAGE_TYPE_VALUES = MESSAGE_TYPES.map((value) => value.toLowerCase());
const SUPPORT_PRIORITIES = SUPPORT_CASE_PRIORITIES.map((value) => value.toLowerCase());
const SUPPORT_STATUSES = SUPPORT_CASE_STATUSES.map((value) => value.toLowerCase());

const positiveInteger = z
  .any()
  .transform((value, ctx) => {
    const numeric = Number(value);
    if (!Number.isInteger(numeric) || numeric <= 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'must be a positive integer.' });
      return z.NEVER;
    }
    return numeric;
  });

const optionalDateTime = optionalTrimmedString({ max: 40 }).transform((value, ctx) => {
  if (!value) {
    return undefined;
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'must be a valid ISO date-time.' });
    return z.NEVER;
  }
  return parsed.toISOString();
});

const optionalEnumArray = (allowed, field) =>
  z
    .union([
      z.array(optionalTrimmedString({ max: 60 })),
      optionalTrimmedString({ max: 180 }).transform((value) => (value ? value.split(',') : undefined)),
      z.undefined(),
    ])
    .transform((values, ctx) => {
      if (!values) {
        return undefined;
      }
      const list = Array.isArray(values) ? values : [values];
      const normalised = list
        .map((value) => `${value}`.trim().toLowerCase())
        .filter((value) => value.length > 0);
      const deduped = Array.from(new Set(normalised));
      const invalid = deduped.filter((value) => !allowed.includes(value));
      if (invalid.length) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `${field} contains unsupported values: ${invalid.join(', ')}`,
        });
        return z.NEVER;
      }
      return deduped;
    });

const optionalBooleanFlag = () => optionalBoolean().transform((value) => value ?? undefined);

const attachmentSchema = z
  .object({
    fileName: requiredTrimmedString({ max: 255 }),
    mimeType: optionalTrimmedString({ max: 120 }).transform((value) => value ?? 'application/octet-stream'),
    fileSize: optionalNumber({ min: 0, integer: true }).transform((value) => value ?? 0),
    url: optionalTrimmedString({ max: 2048 }).transform((value) => value ?? undefined),
    metadata: z.record(z.any()).optional(),
  })
  .strip();

export const adminMessagingListQuerySchema = z
  .object({
    page: optionalNumber({ min: 1, max: 1000, integer: true }).transform((value) => value ?? 1),
    pageSize: optionalNumber({ min: 1, max: 100, integer: true }).transform((value) => value ?? 25),
    search: optionalTrimmedString({ max: 200 }).transform((value) => value ?? undefined),
    channelTypes: optionalEnumArray(CHANNEL_TYPES, 'channelTypes'),
    states: optionalEnumArray(THREAD_STATES, 'states'),
    supportStatuses: optionalEnumArray(SUPPORT_STATUSES, 'supportStatuses'),
    supportPriorities: optionalEnumArray(SUPPORT_PRIORITIES, 'supportPriorities'),
    labelIds: optionalStringArray({ maxItemLength: 24, maxLength: 20 }).transform((values) => {
      if (!values) {
        return undefined;
      }
      const numeric = values
        .map((value) => Number.parseInt(value, 10))
        .filter((value) => Number.isInteger(value) && value > 0);
      return numeric.length ? Array.from(new Set(numeric)) : [];
    }),
    assignedTo: z.union([positiveInteger, z.undefined()]).transform((value) => value ?? undefined),
    unassignedOnly: optionalBooleanFlag(),
    escalatedOnly: optionalBooleanFlag(),
    hasSupportCase: optionalBooleanFlag(),
    includeSystem: optionalBooleanFlag(),
    dateFrom: optionalDateTime,
    dateTo: optionalDateTime,
  })
  .strip();

const participantIdsSchema = z
  .array(positiveInteger)
  .min(1, { message: 'participantIds must include at least one participant.' })
  .max(50)
  .transform((values) => Array.from(new Set(values)));

export const adminMessagingCreateThreadSchema = z
  .object({
    subject: optionalTrimmedString({ max: 255 }).transform((value) => value ?? undefined),
    channelType: requiredTrimmedString({ max: 40 }).transform((value, ctx) => {
      const normalised = value.trim().toLowerCase();
      if (!CHANNEL_TYPES.includes(normalised)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'channelType is not supported.' });
        return z.NEVER;
      }
      return normalised;
    }),
    participantIds: participantIdsSchema,
    metadata: z.record(z.any()).optional(),
    initialMessage: optionalTrimmedString({ max: 4000 }).transform((value) => value ?? undefined),
  })
  .strip();

export const adminMessagingSendMessageSchema = z
  .object({
    messageType: optionalTrimmedString({ max: 40 }).transform((value, ctx) => {
      if (!value) {
        return 'text';
      }
      const normalised = value.toLowerCase();
      if (!MESSAGE_TYPE_VALUES.includes(normalised)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'messageType is not supported.' });
        return z.NEVER;
      }
      return normalised;
    }),
    body: optionalTrimmedString({ max: 8000 }).transform((value) => value ?? undefined),
    attachments: z.array(attachmentSchema).max(20).optional(),
    metadata: z.record(z.any()).optional(),
  })
  .strip()
  .refine((value) => Boolean(value.body || (value.attachments && value.attachments.length)), {
    message: 'Provide a message body or at least one attachment.',
  });

export const adminMessagingChangeStateSchema = z
  .object({
    state: requiredTrimmedString({ max: 40 }).transform((value, ctx) => {
      const normalised = value.trim().toLowerCase();
      if (!THREAD_STATES.includes(normalised)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'state is not supported.' });
        return z.NEVER;
      }
      return normalised;
    }),
    note: optionalTrimmedString({ max: 500 }).transform((value) => value ?? undefined),
  })
  .strip();

export const adminMessagingEscalateSchema = z
  .object({
    reason: optionalTrimmedString({ max: 1000 }).transform((value) => value ?? undefined),
    priority: optionalTrimmedString({ max: 40 }).transform((value, ctx) => {
      if (!value) {
        return undefined;
      }
      const normalised = value.trim().toLowerCase();
      if (!SUPPORT_PRIORITIES.includes(normalised)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'priority is not supported.' });
        return z.NEVER;
      }
      return normalised;
    }),
    metadata: z.record(z.any()).optional(),
  })
  .strip();

export const adminMessagingAssignSchema = z
  .object({
    agentId: positiveInteger,
    notifyAgent: optionalBooleanFlag(),
  })
  .strip();

export const adminMessagingSupportStatusSchema = z
  .object({
    status: requiredTrimmedString({ max: 40 }).transform((value, ctx) => {
      const normalised = value.trim().toLowerCase();
      if (!SUPPORT_STATUSES.includes(normalised)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'status is not supported.' });
        return z.NEVER;
      }
      return normalised;
    }),
    resolutionSummary: optionalTrimmedString({ max: 1000 }).transform((value) => value ?? undefined),
    metadata: z.record(z.any()).optional(),
  })
  .strip();

export const adminMessagingLabelSchema = z
  .object({
    name: requiredTrimmedString({ max: 120 }),
    color: optionalTrimmedString({ max: 9 }).transform((value, ctx) => {
      if (!value) {
        return undefined;
      }
      const normalised = value.startsWith('#') ? value : `#${value}`;
      if (!/^#?[0-9a-fA-F]{3,8}$/.test(normalised)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'color must be a valid hex value.' });
        return z.NEVER;
      }
      return normalised.startsWith('#') ? normalised : `#${normalised}`;
    }),
    description: optionalTrimmedString({ max: 500 }).transform((value) => value ?? undefined),
    isSystem: optionalBooleanFlag(),
    metadata: z.record(z.any()).optional(),
  })
  .strip();

export const adminMessagingApplyLabelsSchema = z
  .object({
    labelIds: z
      .array(positiveInteger)
      .max(50)
      .transform((values) => Array.from(new Set(values))),
  })
  .strip();

export default {
  adminMessagingListQuerySchema,
  adminMessagingCreateThreadSchema,
  adminMessagingSendMessageSchema,
  adminMessagingChangeStateSchema,
  adminMessagingEscalateSchema,
  adminMessagingAssignSchema,
  adminMessagingSupportStatusSchema,
  adminMessagingLabelSchema,
  adminMessagingApplyLabelsSchema,
};
