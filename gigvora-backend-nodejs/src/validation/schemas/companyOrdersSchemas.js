import { z } from 'zod';
import {
  GIG_ORDER_STATUSES,
  GIG_TIMELINE_EVENT_TYPES,
  GIG_TIMELINE_VISIBILITIES,
  GIG_ESCROW_STATUSES,
} from '../../models/constants/index.js';

const isoDate = z
  .string()
  .trim()
  .refine((value) => !value || !Number.isNaN(Date.parse(value)), { message: 'Must be a valid ISO date string.' });

const deliverableSchema = z
  .object({
    id: z.coerce.number().int().positive().optional(),
    title: z.string().trim().min(1, 'Provide a deliverable title.'),
    dueAt: isoDate.optional(),
    notes: z.string().trim().max(2000).optional(),
    amount: z.coerce.number().min(0).optional(),
    deliveryDays: z.coerce.number().int().min(1).optional(),
    ordinal: z.coerce.number().int().min(1).optional(),
  })
  .strip();

export const dashboardQuerySchema = z
  .object({
    status: z.string().trim().optional(),
  })
  .strip();

export const orderIdParamsSchema = z
  .object({
    orderId: z.coerce.number().int().positive({ message: 'orderId must be a positive integer.' }),
  })
  .strip();

export const timelineParamsSchema = z
  .object({
    orderId: z.coerce.number().int().positive({ message: 'orderId must be a positive integer.' }),
    eventId: z.coerce.number().int().positive({ message: 'eventId must be a positive integer.' }),
  })
  .strip();

export const checkpointParamsSchema = z
  .object({
    orderId: z.coerce.number().int().positive({ message: 'orderId must be a positive integer.' }),
    checkpointId: z.coerce.number().int().positive({ message: 'checkpointId must be a positive integer.' }),
  })
  .strip();

export const createOrderBodySchema = z
  .object({
    vendorName: z.string().trim().min(1, 'Provide a vendor name.'),
    serviceName: z.string().trim().min(1, 'Provide a service name.'),
    amount: z.coerce.number().min(0).optional(),
    currency: z.string().trim().length(3).optional(),
    kickoffAt: isoDate.optional(),
    dueAt: isoDate.optional(),
    status: z.enum(GIG_ORDER_STATUSES).optional(),
    progressPercent: z.coerce.number().min(0).max(100).optional(),
    deliverables: z.array(deliverableSchema).max(25).optional(),
    metadata: z.record(z.any()).optional(),
  })
  .strip();

export const updateOrderBodySchema = createOrderBodySchema.partial();

export const createTimelineBodySchema = z
  .object({
    title: z.string().trim().min(1, 'Add a title for the timeline entry.'),
    eventType: z.enum(GIG_TIMELINE_EVENT_TYPES).optional(),
    type: z.enum(GIG_TIMELINE_EVENT_TYPES).optional(),
    summary: z.string().trim().max(4000).optional(),
    notes: z.string().trim().max(4000).optional(),
    visibility: z.enum(GIG_TIMELINE_VISIBILITIES).optional(),
    occurredAt: isoDate.optional(),
    scheduledAt: isoDate.optional(),
    completedAt: isoDate.optional(),
    metadata: z.record(z.any()).optional(),
  })
  .strip();

export const updateTimelineBodySchema = createTimelineBodySchema.partial();

export const messageBodySchema = z
  .object({
    body: z.string().trim().min(1, 'Message body is required.'),
    attachmentUrl: z.string().trim().url().optional(),
    attachments: z.array(z.object({ url: z.string().trim().url(), label: z.string().trim().optional() })).optional(),
    authorName: z.string().trim().optional(),
    roleLabel: z.string().trim().optional(),
    visibility: z.enum(['private', 'shared']).optional(),
  })
  .strip();

export const createEscrowBodySchema = z
  .object({
    label: z.string().trim().min(1, 'Provide a checkpoint label.'),
    amount: z.coerce.number().min(1, 'Escrow amount must be positive.'),
    currency: z.string().trim().length(3).optional(),
    status: z.enum(GIG_ESCROW_STATUSES).optional(),
    notes: z.string().trim().max(2000).optional(),
    approvalRequirement: z.string().trim().max(200).optional(),
    csatThreshold: z.coerce.number().min(0).max(100).optional(),
    releasedAt: isoDate.optional(),
  })
  .strip();

export const updateEscrowBodySchema = createEscrowBodySchema.partial();

export const reviewBodySchema = z
  .object({
    scorecard: z
      .object({
        overallScore: z.coerce.number().min(0).max(5).optional(),
        qualityScore: z.coerce.number().min(0).max(5).optional(),
        communicationScore: z.coerce.number().min(0).max(5).optional(),
        reliabilityScore: z.coerce.number().min(0).max(5).optional(),
        notes: z.string().trim().max(4000).optional(),
      })
      .strip()
      .optional(),
  })
  .strip();

export default {
  dashboardQuerySchema,
  orderIdParamsSchema,
  timelineParamsSchema,
  checkpointParamsSchema,
  createOrderBodySchema,
  updateOrderBodySchema,
  createTimelineBodySchema,
  updateTimelineBodySchema,
  messageBodySchema,
  createEscrowBodySchema,
  updateEscrowBodySchema,
  reviewBodySchema,
};
