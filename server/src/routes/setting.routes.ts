import { Router } from 'express';
import * as settingController from '../controllers/setting.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/', settingController.getAll);
router.put('/', authorize('Admin'), settingController.update);

export default router;
