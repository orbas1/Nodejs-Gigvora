import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import agencyController from '../controllers/agencyController.js';
import agencyWorkforceController from '../controllers/agencyWorkforceController.js';
import { authenticate, requireRoles } from '../middleware/authenticate.js';
import validateRequest from '../middleware/validateRequest.js';
import {
  availabilityIdParamsSchema,
  createAvailabilityBodySchema,
  createCapacitySnapshotBodySchema,
  createGigDelegationBodySchema,
  createMemberBodySchema,
  createPayDelegationBodySchema,
  createProjectDelegationBodySchema,
  listAvailabilityQuerySchema,
  listCapacitySnapshotsQuerySchema,
  listGigDelegationsQuerySchema,
  listMembersQuerySchema,
  listPayDelegationsQuerySchema,
  listProjectDelegationsQuerySchema,
  memberIdParamsSchema,
  payDelegationIdParamsSchema,
  projectDelegationIdParamsSchema,
  gigDelegationIdParamsSchema,
  capacitySnapshotIdParamsSchema,
  updateAvailabilityBodySchema,
  updateCapacitySnapshotBodySchema,
  updateGigDelegationBodySchema,
  updateMemberBodySchema,
  updatePayDelegationBodySchema,
  updateProjectDelegationBodySchema,
  workforceDashboardQuerySchema,
} from '../validation/schemas/agencyWorkforceSchemas.js';

const router = Router();

router.get(
  '/dashboard',
  authenticate(),
  requireRoles('agency', 'agency_admin', 'admin'),
  asyncHandler(agencyController.dashboard),
);

router.get(
  '/workforce/dashboard',
  authenticate(),
  requireRoles('agency', 'agency_admin', 'admin'),
  validateRequest({ query: workforceDashboardQuerySchema }),
  asyncHandler(agencyWorkforceController.dashboard),
);

router.get(
  '/workforce/members',
  authenticate(),
  requireRoles('agency', 'agency_admin', 'admin'),
  validateRequest({ query: listMembersQuerySchema }),
  asyncHandler(agencyWorkforceController.indexMembers),
);

router.post(
  '/workforce/members',
  authenticate(),
  requireRoles('agency', 'agency_admin', 'admin'),
  validateRequest({ body: createMemberBodySchema }),
  asyncHandler(agencyWorkforceController.storeMember),
);

router.put(
  '/workforce/members/:memberId',
  authenticate(),
  requireRoles('agency', 'agency_admin', 'admin'),
  validateRequest({ params: memberIdParamsSchema, body: updateMemberBodySchema }),
  asyncHandler(agencyWorkforceController.updateMember),
);

router.delete(
  '/workforce/members/:memberId',
  authenticate(),
  requireRoles('agency', 'agency_admin', 'admin'),
  validateRequest({ params: memberIdParamsSchema }),
  asyncHandler(agencyWorkforceController.destroyMember),
);

router.get(
  '/workforce/pay-delegations',
  authenticate(),
  requireRoles('agency', 'agency_admin', 'admin'),
  validateRequest({ query: listPayDelegationsQuerySchema }),
  asyncHandler(agencyWorkforceController.indexPayDelegations),
);

router.post(
  '/workforce/pay-delegations',
  authenticate(),
  requireRoles('agency', 'agency_admin', 'admin'),
  validateRequest({ body: createPayDelegationBodySchema }),
  asyncHandler(agencyWorkforceController.storePayDelegation),
);

router.put(
  '/workforce/pay-delegations/:delegationId',
  authenticate(),
  requireRoles('agency', 'agency_admin', 'admin'),
  validateRequest({ params: payDelegationIdParamsSchema, body: updatePayDelegationBodySchema }),
  asyncHandler(agencyWorkforceController.updatePayDelegationRecord),
);

router.delete(
  '/workforce/pay-delegations/:delegationId',
  authenticate(),
  requireRoles('agency', 'agency_admin', 'admin'),
  validateRequest({ params: payDelegationIdParamsSchema }),
  asyncHandler(agencyWorkforceController.destroyPayDelegation),
);

router.get(
  '/workforce/project-delegations',
  authenticate(),
  requireRoles('agency', 'agency_admin', 'admin'),
  validateRequest({ query: listProjectDelegationsQuerySchema }),
  asyncHandler(agencyWorkforceController.indexProjectDelegations),
);

router.post(
  '/workforce/project-delegations',
  authenticate(),
  requireRoles('agency', 'agency_admin', 'admin'),
  validateRequest({ body: createProjectDelegationBodySchema }),
  asyncHandler(agencyWorkforceController.storeProjectDelegation),
);

router.put(
  '/workforce/project-delegations/:delegationId',
  authenticate(),
  requireRoles('agency', 'agency_admin', 'admin'),
  validateRequest({ params: projectDelegationIdParamsSchema, body: updateProjectDelegationBodySchema }),
  asyncHandler(agencyWorkforceController.updateProjectDelegationRecord),
);

router.delete(
  '/workforce/project-delegations/:delegationId',
  authenticate(),
  requireRoles('agency', 'agency_admin', 'admin'),
  validateRequest({ params: projectDelegationIdParamsSchema }),
  asyncHandler(agencyWorkforceController.destroyProjectDelegation),
);

router.get(
  '/workforce/gig-delegations',
  authenticate(),
  requireRoles('agency', 'agency_admin', 'admin'),
  validateRequest({ query: listGigDelegationsQuerySchema }),
  asyncHandler(agencyWorkforceController.indexGigDelegations),
);

router.post(
  '/workforce/gig-delegations',
  authenticate(),
  requireRoles('agency', 'agency_admin', 'admin'),
  validateRequest({ body: createGigDelegationBodySchema }),
  asyncHandler(agencyWorkforceController.storeGigDelegation),
);

router.put(
  '/workforce/gig-delegations/:delegationId',
  authenticate(),
  requireRoles('agency', 'agency_admin', 'admin'),
  validateRequest({ params: gigDelegationIdParamsSchema, body: updateGigDelegationBodySchema }),
  asyncHandler(agencyWorkforceController.updateGigDelegationRecord),
);

router.delete(
  '/workforce/gig-delegations/:delegationId',
  authenticate(),
  requireRoles('agency', 'agency_admin', 'admin'),
  validateRequest({ params: gigDelegationIdParamsSchema }),
  asyncHandler(agencyWorkforceController.destroyGigDelegation),
);

router.get(
  '/workforce/capacity-snapshots',
  authenticate(),
  requireRoles('agency', 'agency_admin', 'admin'),
  validateRequest({ query: listCapacitySnapshotsQuerySchema }),
  asyncHandler(agencyWorkforceController.indexCapacitySnapshots),
);

router.post(
  '/workforce/capacity-snapshots',
  authenticate(),
  requireRoles('agency', 'agency_admin', 'admin'),
  validateRequest({ body: createCapacitySnapshotBodySchema }),
  asyncHandler(agencyWorkforceController.storeCapacitySnapshot),
);

router.put(
  '/workforce/capacity-snapshots/:snapshotId',
  authenticate(),
  requireRoles('agency', 'agency_admin', 'admin'),
  validateRequest({ params: capacitySnapshotIdParamsSchema, body: updateCapacitySnapshotBodySchema }),
  asyncHandler(agencyWorkforceController.updateCapacitySnapshotRecord),
);

router.delete(
  '/workforce/capacity-snapshots/:snapshotId',
  authenticate(),
  requireRoles('agency', 'agency_admin', 'admin'),
  validateRequest({ params: capacitySnapshotIdParamsSchema }),
  asyncHandler(agencyWorkforceController.destroyCapacitySnapshot),
);

router.get(
  '/workforce/availability',
  authenticate(),
  requireRoles('agency', 'agency_admin', 'admin'),
  validateRequest({ query: listAvailabilityQuerySchema }),
  asyncHandler(agencyWorkforceController.indexAvailabilityEntries),
);

router.post(
  '/workforce/availability',
  authenticate(),
  requireRoles('agency', 'agency_admin', 'admin'),
  validateRequest({ body: createAvailabilityBodySchema }),
  asyncHandler(agencyWorkforceController.storeAvailabilityEntry),
);

router.put(
  '/workforce/availability/:entryId',
  authenticate(),
  requireRoles('agency', 'agency_admin', 'admin'),
  validateRequest({ params: availabilityIdParamsSchema, body: updateAvailabilityBodySchema }),
  asyncHandler(agencyWorkforceController.updateAvailabilityEntryRecord),
);

router.delete(
  '/workforce/availability/:entryId',
  authenticate(),
  requireRoles('agency', 'agency_admin', 'admin'),
  validateRequest({ params: availabilityIdParamsSchema }),
  asyncHandler(agencyWorkforceController.destroyAvailabilityEntry),
);

export default router;

