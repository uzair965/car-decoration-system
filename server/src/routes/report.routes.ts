import { Router } from 'express';
import * as reportController from '../controllers/report.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/profit-loss', authorize('Admin', 'Manager'), reportController.getProfitLoss);

export default router;
