import { Router } from 'express';
import {
  createEscrowAccount,
  initiateEscrow,
  releaseEscrow,
  refundEscrow,
  createDispute,
  appendDisputeEvent,
  getTrustOverview,
  listDisputes,
  getDispute,
  updateDispute,
  getDisputeSettings,
  updateDisputeSettings,
  listDisputeTemplates,
  createDisputeTemplate,
  updateDisputeTemplate,
  deleteDisputeTemplate,
} from '../controllers/trustController.js';

const router = Router();

router.get('/overview', getTrustOverview);
router.post('/escrow/accounts', createEscrowAccount);
router.post('/escrow/transactions', initiateEscrow);
router.post('/escrow/transactions/:transactionId/release', releaseEscrow);
router.post('/escrow/transactions/:transactionId/refund', refundEscrow);
router.get('/disputes', listDisputes);
router.get('/disputes/settings', getDisputeSettings);
router.put('/disputes/settings', updateDisputeSettings);
router.get('/disputes/templates', listDisputeTemplates);
router.post('/disputes/templates', createDisputeTemplate);
router.patch('/disputes/templates/:templateId', updateDisputeTemplate);
router.delete('/disputes/templates/:templateId', deleteDisputeTemplate);
router.post('/disputes', createDispute);
router.get('/disputes/:disputeId', getDispute);
router.patch('/disputes/:disputeId', updateDispute);
router.post('/disputes/:disputeId/events', appendDisputeEvent);

export default router;
