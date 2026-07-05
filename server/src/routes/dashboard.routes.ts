import { Router } from 'express';
import { DashboardController } from '../controllers/dashboard.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Apply auth middleware to all dashboard routes
router.use(authenticate);

router.get('/summary', DashboardController.getSummary);

export default router;
