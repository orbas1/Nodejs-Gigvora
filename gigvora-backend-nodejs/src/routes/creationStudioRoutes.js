import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import { index, show, create, update, publish } from '../controllers/creationStudioController.js';

const router = Router();

router.get('/items', asyncHandler(index));
router.get('/items/:itemId', asyncHandler(show));
router.post('/items', asyncHandler(create));
router.put('/items/:itemId', asyncHandler(update));
router.post('/items/:itemId/publish', asyncHandler(publish));

export default router;
