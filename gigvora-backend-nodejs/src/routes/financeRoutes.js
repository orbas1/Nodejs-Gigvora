import { Router } from 'express';
import { controlTowerOverview } from '../controllers/financeController.js';

const router = Router();

router.get('/control-tower/overview', controlTowerOverview);

export default router;
