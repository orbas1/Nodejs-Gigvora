import { Router } from 'express';
import {
  orderPipeline,
  createOrder,
  updateOrder,
  createOrderRequirement,
  updateOrderRequirement,
  createOrderRevision,
  updateOrderRevision,
  createOrderEscrowCheckpoint,
  updateOrderEscrowCheckpoint,
} from '../controllers/freelancerController.js';

const router = Router();

router.get('/order-pipeline', orderPipeline);
router.post('/order-pipeline/orders', createOrder);
router.patch('/order-pipeline/orders/:orderId', updateOrder);
router.post('/order-pipeline/orders/:orderId/requirement-forms', createOrderRequirement);
router.patch('/order-pipeline/orders/:orderId/requirement-forms/:formId', updateOrderRequirement);
router.post('/order-pipeline/orders/:orderId/revisions', createOrderRevision);
router.patch('/order-pipeline/orders/:orderId/revisions/:revisionId', updateOrderRevision);
router.post('/order-pipeline/orders/:orderId/escrow-checkpoints', createOrderEscrowCheckpoint);
router.patch(
  '/order-pipeline/orders/:orderId/escrow-checkpoints/:checkpointId',
  updateOrderEscrowCheckpoint,
);

export default router;
