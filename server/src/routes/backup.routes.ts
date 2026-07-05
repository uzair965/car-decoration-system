import { Router } from 'express';
import * as backupController from '../controllers/backup.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

// Backup/Restore is strictly Admin-only
router.get('/export', authorize('Admin'), backupController.exportBackup);
router.post('/restore', authorize('Admin'), backupController.importRestore);

export default router;
