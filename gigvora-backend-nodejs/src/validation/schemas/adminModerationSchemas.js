import { z } from 'zod';
import { ModerationEventStatuses } from '../../models/messagingModels.js';

const stringOrArray = z.union([z.array(z.string()), z.string()]);

export const adminModerationQueueQuerySchema = z.object({
  page: z.optional(z.coerce.number().int().positive()),
  pageSize: z.optional(z.coerce.number().int().positive().max(100)),
  severities: z.optional(stringOrArray),
  channels: z.optional(stringOrArray),
  status: z.optional(stringOrArray),
  search: z.optional(z.string().max(200)),
});

export const adminModerationEventsQuerySchema = z.object({
  page: z.optional(z.coerce.number().int().positive()),
  pageSize: z.optional(z.coerce.number().int().positive().max(200)),
  status: z.optional(stringOrArray),
  actorId: z.optional(z.coerce.number().int().positive()),
  channelSlug: z.optional(z.string().max(120)),
});

export const adminModerationResolveSchema = z.object({
  status: z.optional(z.enum([...ModerationEventStatuses])),
  notes: z.optional(z.string().max(500)),
});

export default {
  adminModerationQueueQuerySchema,
  adminModerationEventsQuerySchema,
  adminModerationResolveSchema,
};
