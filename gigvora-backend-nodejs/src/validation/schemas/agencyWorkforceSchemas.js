import { z } from 'zod';
import {
  AGENCY_ASSIGNMENT_STATUSES,
  AGENCY_ASSIGNMENT_TYPES,
  AGENCY_AVAILABILITY_STATUSES,
  AGENCY_EMPLOYMENT_TYPES,
  AGENCY_GIG_STATUSES,
  AGENCY_MEMBER_STATUSES,
  AGENCY_PAY_FREQUENCIES,
  AGENCY_PAY_STATUSES,
} from '../../models/agencyWorkforceModels.js';

const workspaceIdSchema = z.coerce.number().int().positive('workspaceId must be a positive integer');
const memberIdSchema = z.coerce.number().int().positive('memberId must be a positive integer');
const delegationIdSchema = z.coerce.number().int().positive('delegationId must be a positive integer');
const snapshotIdSchema = z.coerce.number().int().positive('snapshotId must be a positive integer');
const availabilityIdSchema = z.coerce.number().int().positive('entryId must be a positive integer');

const baseMemberSchema = z.object({
  workspaceId: workspaceIdSchema,
  fullName: z.string().min(2).max(160),
  title: z.string().max(120).nullish(),
  email: z.string().email().nullish(),
  phone: z.string().max(60).nullish(),
  location: z.string().max(160).nullish(),
  employmentType: z.enum(AGENCY_EMPLOYMENT_TYPES).optional().default('contract'),
  status: z.enum(AGENCY_MEMBER_STATUSES).optional().default('active'),
  startDate: z.coerce.date().nullish(),
  endDate: z.coerce.date().nullish(),
  hourlyRate: z.coerce.number().min(0).nullish(),
  billableRate: z.coerce.number().min(0).nullish(),
  costCenter: z.string().max(80).nullish(),
  capacityHoursPerWeek: z.coerce.number().min(0).max(400).nullish(),
  allocationPercent: z.coerce.number().min(0).max(100).nullish(),
  benchAllocationPercent: z.coerce.number().min(0).max(100).nullish(),
  skills: z.array(z.string()).optional(),
  avatarUrl: z.string().url().nullish(),
  notes: z.string().nullish(),
  metadata: z.record(z.any()).optional(),
});

export const createMemberBodySchema = baseMemberSchema;
export const updateMemberBodySchema = baseMemberSchema.partial({ fullName: true }).extend({ workspaceId: workspaceIdSchema.optional() });

export const memberIdParamsSchema = z.object({
  memberId: memberIdSchema,
});

export const listMembersQuerySchema = z.object({
  workspaceId: workspaceIdSchema.optional(),
  status: z.enum(AGENCY_MEMBER_STATUSES).optional(),
});

const basePaySchema = z.object({
  workspaceId: workspaceIdSchema,
  memberId: memberIdSchema,
  frequency: z.enum(AGENCY_PAY_FREQUENCIES).optional().default('monthly'),
  amount: z.coerce.number().min(0),
  currency: z.string().length(3).optional().default('USD'),
  status: z.enum(AGENCY_PAY_STATUSES).optional().default('scheduled'),
  nextPayDate: z.coerce.date().nullish(),
  payoutMethod: z.string().max(80).nullish(),
  approverId: z.coerce.number().int().positive().nullish(),
  memo: z.string().nullish(),
  metadata: z.record(z.any()).optional(),
});

export const createPayDelegationBodySchema = basePaySchema;
export const updatePayDelegationBodySchema = basePaySchema.partial({ amount: true, workspaceId: true, memberId: true });

export const payDelegationIdParamsSchema = z.object({
  delegationId: delegationIdSchema,
});

export const listPayDelegationsQuerySchema = z.object({
  workspaceId: workspaceIdSchema.optional(),
  status: z.enum(AGENCY_PAY_STATUSES).optional(),
});

const baseProjectDelegationSchema = z.object({
  workspaceId: workspaceIdSchema,
  memberId: memberIdSchema,
  projectId: z.coerce.number().int().positive().nullish(),
  projectName: z.string().min(2).max(180),
  clientName: z.string().max(160).nullish(),
  assignmentType: z.enum(AGENCY_ASSIGNMENT_TYPES).optional().default('project'),
  status: z.enum(AGENCY_ASSIGNMENT_STATUSES).optional().default('planned'),
  startDate: z.coerce.date().nullish(),
  endDate: z.coerce.date().nullish(),
  allocationPercent: z.coerce.number().min(0).max(100).optional().default(0),
  billableRate: z.coerce.number().min(0).nullish(),
  notes: z.string().nullish(),
  metadata: z.record(z.any()).optional(),
});

export const createProjectDelegationBodySchema = baseProjectDelegationSchema;
export const updateProjectDelegationBodySchema = baseProjectDelegationSchema.partial({ projectName: true, workspaceId: true, memberId: true });

export const projectDelegationIdParamsSchema = z.object({
  delegationId: delegationIdSchema,
});

export const listProjectDelegationsQuerySchema = z.object({
  workspaceId: workspaceIdSchema.optional(),
  status: z.enum(AGENCY_ASSIGNMENT_STATUSES).optional(),
});

const baseGigDelegationSchema = z.object({
  workspaceId: workspaceIdSchema,
  memberId: memberIdSchema,
  gigId: z.coerce.number().int().positive().nullish(),
  gigName: z.string().min(2).max(180),
  status: z.enum(AGENCY_GIG_STATUSES).optional().default('briefing'),
  deliverables: z.coerce.number().int().min(0).nullish(),
  startDate: z.coerce.date().nullish(),
  dueDate: z.coerce.date().nullish(),
  allocationPercent: z.coerce.number().min(0).max(100).optional().default(0),
  notes: z.string().nullish(),
  metadata: z.record(z.any()).optional(),
});

export const createGigDelegationBodySchema = baseGigDelegationSchema;
export const updateGigDelegationBodySchema = baseGigDelegationSchema.partial({ gigName: true, workspaceId: true, memberId: true });

export const gigDelegationIdParamsSchema = z.object({
  delegationId: delegationIdSchema,
});

export const listGigDelegationsQuerySchema = z.object({
  workspaceId: workspaceIdSchema.optional(),
  status: z.enum(AGENCY_GIG_STATUSES).optional(),
});

const baseCapacitySchema = z.object({
  workspaceId: workspaceIdSchema,
  recordedFor: z.coerce.date().optional(),
  totalHeadcount: z.coerce.number().int().min(0).optional().default(0),
  activeAssignments: z.coerce.number().int().min(0).optional().default(0),
  availableHours: z.coerce.number().min(0).optional().default(0),
  allocatedHours: z.coerce.number().min(0).optional().default(0),
  benchHours: z.coerce.number().min(0).optional().default(0),
  utilizationPercent: z.coerce.number().min(0).max(100).optional().default(0),
  notes: z.string().nullish(),
  metadata: z.record(z.any()).optional(),
});

export const createCapacitySnapshotBodySchema = baseCapacitySchema;
export const updateCapacitySnapshotBodySchema = baseCapacitySchema.partial({ workspaceId: true });

export const capacitySnapshotIdParamsSchema = z.object({
  snapshotId: snapshotIdSchema,
});

export const listCapacitySnapshotsQuerySchema = z.object({
  workspaceId: workspaceIdSchema.optional(),
});

const baseAvailabilitySchema = z.object({
  workspaceId: workspaceIdSchema,
  memberId: memberIdSchema,
  date: z.coerce.date(),
  status: z.enum(AGENCY_AVAILABILITY_STATUSES).optional().default('available'),
  availableHours: z.coerce.number().min(0).max(24).nullish(),
  reason: z.string().max(255).nullish(),
  metadata: z.record(z.any()).optional(),
});

export const createAvailabilityBodySchema = baseAvailabilitySchema;
export const updateAvailabilityBodySchema = baseAvailabilitySchema.partial({ workspaceId: true, memberId: true, date: true });

export const availabilityIdParamsSchema = z.object({
  entryId: availabilityIdSchema,
});

export const listAvailabilityQuerySchema = z.object({
  workspaceId: workspaceIdSchema.optional(),
  memberId: memberIdSchema.optional(),
});

export const workforceDashboardQuerySchema = z.object({
  workspaceId: workspaceIdSchema.optional(),
});

export default {
  createMemberBodySchema,
  updateMemberBodySchema,
  memberIdParamsSchema,
  listMembersQuerySchema,
  createPayDelegationBodySchema,
  updatePayDelegationBodySchema,
  payDelegationIdParamsSchema,
  listPayDelegationsQuerySchema,
  createProjectDelegationBodySchema,
  updateProjectDelegationBodySchema,
  projectDelegationIdParamsSchema,
  listProjectDelegationsQuerySchema,
  createGigDelegationBodySchema,
  updateGigDelegationBodySchema,
  gigDelegationIdParamsSchema,
  listGigDelegationsQuerySchema,
  createCapacitySnapshotBodySchema,
  updateCapacitySnapshotBodySchema,
  capacitySnapshotIdParamsSchema,
  listCapacitySnapshotsQuerySchema,
  createAvailabilityBodySchema,
  updateAvailabilityBodySchema,
  availabilityIdParamsSchema,
  listAvailabilityQuerySchema,
  workforceDashboardQuerySchema,
};
