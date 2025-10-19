import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import authenticate from '../middleware/authenticate.js';
import * as chatwootController from '../controllers/chatwootController.js';

const router = Router();

router.get('/chatwoot/session', authenticate(), asyncHandler(chatwootController.session));
router.post('/chatwoot/webhook', asyncHandler(chatwootController.webhook));

export default router;
