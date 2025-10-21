import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import { authenticateRequest, requireRoles } from '../middleware/authentication.js';
import interviewController from '../controllers/interviewController.js';

const router = Router();
const INTERVIEW_ROLES = ['company', 'agency', 'headhunter', 'mentor', 'admin'];

router.use(authenticateRequest());
router.use(requireRoles(...INTERVIEW_ROLES));

router.get('/', asyncHandler(interviewController.index));
router.post('/', asyncHandler(interviewController.store));

router.get('/workspaces', asyncHandler(interviewController.listWorkspaces));
router.get('/workspaces/:workspaceId', asyncHandler(interviewController.workspace));
router.get('/workspaces/:workspaceId/rooms', asyncHandler(interviewController.workspaceRooms));
router.post('/workspaces/:workspaceId/rooms', asyncHandler(interviewController.store));

router.get('/rooms/:roomId', asyncHandler(interviewController.show));
router.put('/rooms/:roomId', asyncHandler(interviewController.update));
router.delete('/rooms/:roomId', asyncHandler(interviewController.destroyRoom));

router.post('/rooms/:roomId/participants', asyncHandler(interviewController.addParticipant));
router.patch('/rooms/:roomId/participants/:participantId', asyncHandler(interviewController.updateParticipant));
router.delete('/rooms/:roomId/participants/:participantId', asyncHandler(interviewController.removeParticipant));

router.post('/rooms/:roomId/checklist', asyncHandler(interviewController.createChecklist));
router.patch('/rooms/:roomId/checklist/:itemId', asyncHandler(interviewController.updateChecklist));
router.delete('/rooms/:roomId/checklist/:itemId', asyncHandler(interviewController.removeChecklist));

router.post('/workflows/:workspaceId/lanes', asyncHandler(interviewController.createLane));
router.patch('/workflows/:workspaceId/lanes/:laneId', asyncHandler(interviewController.updateLane));
router.delete('/workflows/:workspaceId/lanes/:laneId', asyncHandler(interviewController.destroyLane));

router.post('/workflows/:workspaceId/lanes/:laneId/cards', asyncHandler(interviewController.createCard));
router.patch('/workflows/:workspaceId/lanes/:laneId/cards/:cardId', asyncHandler(interviewController.updateCard));
router.delete('/workflows/:workspaceId/lanes/:laneId/cards/:cardId', asyncHandler(interviewController.removeCard));

router.get('/workspaces/:workspaceId/templates', asyncHandler(interviewController.listTemplates));
router.post('/workspaces/:workspaceId/templates', asyncHandler(interviewController.createTemplate));
router.patch('/templates/:templateId', asyncHandler(interviewController.updateTemplate));
router.delete('/templates/:templateId', asyncHandler(interviewController.removeTemplate));

router.get('/workspaces/:workspaceId/prep', asyncHandler(interviewController.listPrep));
router.post('/workspaces/:workspaceId/prep', asyncHandler(interviewController.createPrep));
router.patch('/prep/:portalId', asyncHandler(interviewController.updatePrep));
router.delete('/prep/:portalId', asyncHandler(interviewController.removePrep));

export default router;
