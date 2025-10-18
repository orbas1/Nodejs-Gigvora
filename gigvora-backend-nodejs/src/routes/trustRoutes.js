import { Router } from 'express';
import {
  createEscrowAccount,
  initiateEscrow,
  releaseEscrow,
  refundEscrow,
  createDispute,
  appendDisputeEvent,
  listDisputes,
  getDispute,
  updateDispute,
  getTrustOverview,
} from '../controllers/trustController.js';

const router = Router();

router.get('/overview', getTrustOverview);
router.post('/escrow/accounts', createEscrowAccount);
router.post('/escrow/transactions', initiateEscrow);
router.post('/escrow/transactions/:transactionId/release', releaseEscrow);
router.post('/escrow/transactions/:transactionId/refund', refundEscrow);
router.post('/disputes', createDispute);
router.get('/disputes', listDisputes);
router.get('/disputes/:disputeId', getDispute);
router.patch('/disputes/:disputeId', updateDispute);
router.post('/disputes/:disputeId/events', appendDisputeEvent);

export default router;
