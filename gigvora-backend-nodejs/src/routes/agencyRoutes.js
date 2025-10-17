import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import agencyController from '../controllers/agencyController.js';
import agencyClientKanbanController from '../controllers/agencyClientKanbanController.js';
import { authenticate, requireRoles } from '../middleware/authenticate.js';

const router = Router();

router.get(
  '/dashboard',
  authenticate(),
  requireRoles('agency', 'agency_admin', 'admin'),
  asyncHandler(agencyController.dashboard),
);

router.get(
  '/client-kanban',
  authenticate(),
  requireRoles('agency', 'agency_admin', 'admin'),
  asyncHandler(agencyClientKanbanController.index),
);

router.post(
  '/client-kanban/columns',
  authenticate(),
  requireRoles('agency', 'agency_admin', 'admin'),
  asyncHandler(agencyClientKanbanController.storeColumn),
);

router.patch(
  '/client-kanban/columns/:columnId',
  authenticate(),
  requireRoles('agency', 'agency_admin', 'admin'),
  asyncHandler(agencyClientKanbanController.updateColumnController),
);

router.delete(
  '/client-kanban/columns/:columnId',
  authenticate(),
  requireRoles('agency', 'agency_admin', 'admin'),
  asyncHandler(agencyClientKanbanController.destroyColumn),
);

router.post(
  '/client-kanban/cards',
  authenticate(),
  requireRoles('agency', 'agency_admin', 'admin'),
  asyncHandler(agencyClientKanbanController.storeCard),
);

router.patch(
  '/client-kanban/cards/:cardId',
  authenticate(),
  requireRoles('agency', 'agency_admin', 'admin'),
  asyncHandler(agencyClientKanbanController.updateCardController),
);

router.post(
  '/client-kanban/cards/:cardId/move',
  authenticate(),
  requireRoles('agency', 'agency_admin', 'admin'),
  asyncHandler(agencyClientKanbanController.moveCardController),
);

router.delete(
  '/client-kanban/cards/:cardId',
  authenticate(),
  requireRoles('agency', 'agency_admin', 'admin'),
  asyncHandler(agencyClientKanbanController.destroyCard),
);

router.post(
  '/client-kanban/cards/:cardId/checklist',
  authenticate(),
  requireRoles('agency', 'agency_admin', 'admin'),
  asyncHandler(agencyClientKanbanController.storeChecklistItem),
);

router.patch(
  '/client-kanban/cards/:cardId/checklist/:itemId',
  authenticate(),
  requireRoles('agency', 'agency_admin', 'admin'),
  asyncHandler(agencyClientKanbanController.updateChecklistItemController),
);

router.delete(
  '/client-kanban/cards/:cardId/checklist/:itemId',
  authenticate(),
  requireRoles('agency', 'agency_admin', 'admin'),
  asyncHandler(agencyClientKanbanController.destroyChecklistItem),
);

router.post(
  '/client-kanban/clients',
  authenticate(),
  requireRoles('agency', 'agency_admin', 'admin'),
  asyncHandler(agencyClientKanbanController.storeClient),
);

router.patch(
  '/client-kanban/clients/:clientId',
  authenticate(),
  requireRoles('agency', 'agency_admin', 'admin'),
  asyncHandler(agencyClientKanbanController.updateClientController),
);

export default router;

