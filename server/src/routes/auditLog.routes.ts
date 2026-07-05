import { Router } from 'express';
import * as auditLogController from '../controllers/auditLog.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/', authorize('Admin'), auditLogController.getAll);

export default router;
