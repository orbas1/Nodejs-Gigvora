import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import authenticate from '../middleware/authenticate.js';
import * as eventManagementController from '../controllers/eventManagementController.js';

const router = Router({ mergeParams: true });

router.use(
  authenticate({
    roles: ['user', 'freelancer', 'agency', 'company', 'mentor', 'admin'],
    matchParam: 'userId',
  }),
);

router.get('/', asyncHandler(eventManagementController.listEventManagement));
router.post('/', asyncHandler(eventManagementController.createEvent));
router.get('/:eventId', asyncHandler(eventManagementController.getEvent));
router.patch('/:eventId', asyncHandler(eventManagementController.updateEvent));
router.delete('/:eventId', asyncHandler(eventManagementController.deleteEvent));

router.post('/:eventId/tasks', asyncHandler(eventManagementController.createTask));
router.patch('/:eventId/tasks/:taskId', asyncHandler(eventManagementController.updateTask));
router.delete('/:eventId/tasks/:taskId', asyncHandler(eventManagementController.deleteTask));

router.post('/:eventId/guests', asyncHandler(eventManagementController.createGuest));
router.patch('/:eventId/guests/:guestId', asyncHandler(eventManagementController.updateGuest));
router.delete('/:eventId/guests/:guestId', asyncHandler(eventManagementController.deleteGuest));

router.post('/:eventId/budget-items', asyncHandler(eventManagementController.createBudgetItem));
router.patch('/:eventId/budget-items/:budgetItemId', asyncHandler(eventManagementController.updateBudgetItem));
router.delete('/:eventId/budget-items/:budgetItemId', asyncHandler(eventManagementController.deleteBudgetItem));

router.post('/:eventId/agenda', asyncHandler(eventManagementController.createAgendaItem));
router.patch('/:eventId/agenda/:agendaItemId', asyncHandler(eventManagementController.updateAgendaItem));
router.delete('/:eventId/agenda/:agendaItemId', asyncHandler(eventManagementController.deleteAgendaItem));

router.post('/:eventId/assets', asyncHandler(eventManagementController.createAsset));
router.patch('/:eventId/assets/:assetId', asyncHandler(eventManagementController.updateAsset));
router.delete('/:eventId/assets/:assetId', asyncHandler(eventManagementController.deleteAsset));

router.post('/:eventId/checklist', asyncHandler(eventManagementController.createChecklistItem));
router.patch('/:eventId/checklist/:checklistItemId', asyncHandler(eventManagementController.updateChecklistItem));
router.delete('/:eventId/checklist/:checklistItemId', asyncHandler(eventManagementController.deleteChecklistItem));

export default router;
