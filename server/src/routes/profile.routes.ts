import { Router } from 'express';
import * as profileController from '../controllers/profile.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/', profileController.getProfile);
router.put('/', profileController.updateProfile);

export default router;
