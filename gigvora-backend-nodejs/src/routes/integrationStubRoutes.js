import { Router } from 'express';
import { listStubEnvironments } from '../controllers/stubEnvironmentController.js';

const router = Router();

router.get('/stub-environments', listStubEnvironments);

export default router;
