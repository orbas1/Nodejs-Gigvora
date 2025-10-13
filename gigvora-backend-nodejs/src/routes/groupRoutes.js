import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import groupController from '../controllers/groupController.js';

const router = Router();

router.get('/', asyncHandler(groupController.index));
router.get('/:groupId', asyncHandler(groupController.show));
router.post('/:groupId/join', asyncHandler(groupController.join));
router.delete('/:groupId/leave', asyncHandler(groupController.leave));
router.patch('/:groupId/membership', asyncHandler(groupController.updateMembership));

export default router;
