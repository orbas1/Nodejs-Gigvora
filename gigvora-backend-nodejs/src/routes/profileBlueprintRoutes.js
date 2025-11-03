import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import profileBlueprintController from '../controllers/profileBlueprintController.js';

const router = Router();

router.get('/', asyncHandler(profileBlueprintController.index));
router.get('/:blueprintId', asyncHandler(profileBlueprintController.show));

export default router;
