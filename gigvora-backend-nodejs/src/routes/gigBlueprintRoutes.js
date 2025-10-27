import express from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import gigBlueprintController from '../controllers/gigBlueprintController.js';

const router = express.Router();

router.get('/', asyncHandler(gigBlueprintController.index));
router.get('/:blueprintId', asyncHandler(gigBlueprintController.show));

export default router;
