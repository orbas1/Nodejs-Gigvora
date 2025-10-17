import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import companyController from '../controllers/companyController.js';
import authenticate from '../middleware/authenticate.js';

const router = Router();

router.get('/dashboard', asyncHandler(companyController.dashboard));

router.get(
  '/ai/auto-reply/overview',
  authenticate({ roles: ['company', 'admin'] }),
  asyncHandler(companyController.byokAutoReplyOverview),
);
router.put(
  '/ai/auto-reply/settings',
  authenticate({ roles: ['company', 'admin'] }),
  asyncHandler(companyController.updateByokAutoReplySettings),
);
router.get(
  '/ai/auto-reply/templates',
  authenticate({ roles: ['company', 'admin'] }),
  asyncHandler(companyController.listByokAutoReplyTemplates),
);
router.post(
  '/ai/auto-reply/templates',
  authenticate({ roles: ['company', 'admin'] }),
  asyncHandler(companyController.createByokAutoReplyTemplate),
);
router.put(
  '/ai/auto-reply/templates/:templateId',
  authenticate({ roles: ['company', 'admin'] }),
  asyncHandler(companyController.updateByokAutoReplyTemplate),
);
router.delete(
  '/ai/auto-reply/templates/:templateId',
  authenticate({ roles: ['company', 'admin'] }),
  asyncHandler(companyController.deleteByokAutoReplyTemplate),
);
router.post(
  '/ai/auto-reply/test',
  authenticate({ roles: ['company', 'admin'] }),
  asyncHandler(companyController.previewByokAutoReply),
);

export default router;

