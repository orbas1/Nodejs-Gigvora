import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import companyIntegrationController from '../controllers/companyIntegrationController.js';

const router = Router({ mergeParams: true });

router.get('/crm', asyncHandler(companyIntegrationController.list));
router.patch('/crm/:providerKey', asyncHandler(companyIntegrationController.update));
router.post('/crm/:integrationId/credentials', asyncHandler(companyIntegrationController.rotateCredential));
router.put(
  '/crm/:integrationId/field-mappings',
  asyncHandler(companyIntegrationController.updateFieldMappings),
);
router.put(
  '/crm/:integrationId/role-assignments',
  asyncHandler(companyIntegrationController.updateRoleAssignments),
);
router.post('/crm/:integrationId/trigger-sync', asyncHandler(companyIntegrationController.triggerSync));
router.post('/crm/:integrationId/incidents', asyncHandler(companyIntegrationController.createIncident));
router.patch(
  '/crm/:integrationId/incidents/:incidentId/resolve',
  asyncHandler(companyIntegrationController.resolveIncident),
);

export default router;
