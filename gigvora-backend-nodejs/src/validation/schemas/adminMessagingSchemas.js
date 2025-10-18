import { z } from 'zod';
import { nonEmptyString } from '../primitives.js';

const positiveInt = z
  .union([z.string(), z.number()])
  .transform((value) => Number(value))
  .refine((value) => Number.isInteger(value) && value > 0, 'Must be a positive integer');

export const adminMessagingListQuerySchema = z.object({
  page: z.optional(z.coerce.number().int().positive()),
  pageSize: z.optional(z.coerce.number().int().positive().max(100)),
  search: z.optional(z.string()),
  channelTypes: z.optional(z.union([z.array(z.string()), z.string()])),
  states: z.optional(z.union([z.array(z.string()), z.string()])),
  supportStatuses: z.optional(z.union([z.array(z.string()), z.string()])),
  supportPriorities: z.optional(z.union([z.array(z.string()), z.string()])),
  labelIds: z.optional(z.union([z.array(z.union([z.string(), z.number()])), z.string()])),
  assignedTo: z.optional(z.union([z.string(), z.number()])),
  unassignedOnly: z.optional(z.string()),
  escalatedOnly: z.optional(z.string()),
  hasSupportCase: z.optional(z.string()),
  dateFrom: z.optional(z.string()),
  dateTo: z.optional(z.string()),
  includeSystem: z.optional(z.string()),
});

export const adminMessagingCreateThreadSchema = z.object({
  subject: z.optional(z.string().max(255)),
  channelType: z.optional(nonEmptyString),
  participantIds: z.optional(z.array(positiveInt).min(1)),
  metadata: z.optional(z.record(z.any())),
});

export const adminMessagingSendMessageSchema = z.object({
  messageType: z.optional(z.string()),
  body: z.optional(z.string()),
  attachments: z.optional(z.array(z.record(z.any()))),
  metadata: z.optional(z.record(z.any())),
});

export const adminMessagingChangeStateSchema = z.object({
  state: nonEmptyString,
});

export const adminMessagingEscalateSchema = z.object({
  reason: z.optional(z.string()),
  priority: z.optional(z.string()),
  metadata: z.optional(z.record(z.any())),
});

export const adminMessagingAssignSchema = z.object({
  agentId: positiveInt,
  notifyAgent: z.optional(z.string()),
});

export const adminMessagingSupportStatusSchema = z.object({
  status: nonEmptyString,
  resolutionSummary: z.optional(z.string()),
  metadata: z.optional(z.record(z.any())),
});

export const adminMessagingLabelSchema = z.object({
  name: nonEmptyString,
  color: z.optional(z.string()),
  description: z.optional(z.string()),
  metadata: z.optional(z.record(z.any())),
});

export const adminMessagingApplyLabelsSchema = z.object({
  labelIds: z.array(z.union([z.string(), z.number()])).default([]),
});

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
