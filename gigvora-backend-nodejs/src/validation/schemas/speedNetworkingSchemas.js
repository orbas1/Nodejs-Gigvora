import { z } from 'zod';
import {
  SPEED_NETWORKING_SESSION_STATUSES,
  SPEED_NETWORKING_ACCESS_LEVELS,
  SPEED_NETWORKING_VISIBILITIES,
  SPEED_NETWORKING_MATCHING_STRATEGIES,
  SPEED_NETWORKING_PARTICIPANT_ROLES,
  SPEED_NETWORKING_PARTICIPANT_STATUSES,
} from '../../models/constants/index.js';

const numericIdSchema = z
  .number({ coerce: true })
  .int()
  .positive();

const dateStringSchema = z.string().datetime().or(z.string().min(1));

const roomSchema = z.object({
  id: z.number().int().positive().optional(),
  name: z.string().min(1),
  topic: z.string().max(255).nullish(),
  capacity: z.number({ coerce: true }).int().positive().nullish(),
  isLocked: z.boolean().optional(),
  meetingUrl: z.string().url().nullish(),
  facilitatorId: numericIdSchema.nullish(),
  rotationIntervalSeconds: z.number({ coerce: true }).int().positive().nullish(),
  instructions: z.string().max(2000).nullish(),
  metadata: z.record(z.any()).nullish(),
});

const participantSchema = z.object({
  id: z.number().int().positive().optional(),
  userId: numericIdSchema.nullish(),
  email: z.string().email().nullish(),
  fullName: z.string().max(180).nullish(),
  role: z.enum(SPEED_NETWORKING_PARTICIPANT_ROLES).optional(),
  status: z.enum(SPEED_NETWORKING_PARTICIPANT_STATUSES).optional(),
  assignedRoomId: numericIdSchema.nullish(),
  checkInAt: dateStringSchema.nullish(),
  lastMatchedAt: dateStringSchema.nullish(),
  interests: z.union([z.array(z.string()), z.record(z.any())]).nullish(),
  goals: z.string().max(2000).nullish(),
  notes: z.string().max(4000).nullish(),
  metadata: z.record(z.any()).nullish(),
});

export const speedNetworkingListQuerySchema = z
  .object({
    status: z.string().optional(),
    hostId: z.string().optional(),
    ownerId: z.string().optional(),
    workspaceId: z.string().optional(),
    from: z.string().optional(),
    to: z.string().optional(),
    search: z.string().optional(),
    page: z.string().optional(),
    pageSize: z.string().optional(),
  })
  .strip();

export const speedNetworkingCreateBodySchema = z
  .object({
    title: z.string().min(1),
    description: z.string().nullish(),
    status: z.enum(SPEED_NETWORKING_SESSION_STATUSES).optional(),
    accessLevel: z.enum(SPEED_NETWORKING_ACCESS_LEVELS).optional(),
    visibility: z.enum(SPEED_NETWORKING_VISIBILITIES).optional(),
    hostId: numericIdSchema.nullish(),
    adminOwnerId: numericIdSchema.nullish(),
    workspaceId: numericIdSchema.nullish(),
    capacity: z.number({ coerce: true }).int().positive().nullish(),
    roundDurationSeconds: z.number({ coerce: true }).int().positive().nullish(),
    totalRounds: z.number({ coerce: true }).int().positive().nullish(),
    bufferSeconds: z.number({ coerce: true }).int().nonnegative().nullish(),
    scheduledStart: dateStringSchema.nullish(),
    scheduledEnd: dateStringSchema.nullish(),
    timezone: z.string().max(80).nullish(),
    registrationCloseAt: dateStringSchema.nullish(),
    meetingProvider: z.string().max(120).nullish(),
    meetingUrl: z.string().url().nullish(),
    lobbyUrl: z.string().url().nullish(),
    instructions: z.string().nullish(),
    matchingStrategy: z.enum(SPEED_NETWORKING_MATCHING_STRATEGIES).optional(),
    tags: z.union([z.array(z.string()), z.record(z.any())]).nullish(),
    settings: z.record(z.any()).nullish(),
    assets: z.record(z.any()).nullish(),
    rooms: z.array(roomSchema).optional(),
    participants: z.array(participantSchema).optional(),
  })
  .strip();

export const speedNetworkingUpdateBodySchema = speedNetworkingCreateBodySchema.partial().strip();

export const speedNetworkingParticipantBodySchema = participantSchema
  .omit({ id: true })
  .extend({ role: z.enum(SPEED_NETWORKING_PARTICIPANT_ROLES).optional() })
  .strip();

export const speedNetworkingParticipantUpdateBodySchema = participantSchema.partial().strip();

export default {
  speedNetworkingListQuerySchema,
  speedNetworkingCreateBodySchema,
  speedNetworkingUpdateBodySchema,
  speedNetworkingParticipantBodySchema,
  speedNetworkingParticipantUpdateBodySchema,
};
