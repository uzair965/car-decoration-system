import { Router } from 'express';
import { cleanAndSeedSystem } from '../controllers/cleanup.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

// Endpoint to clean all transaction and catalog data, and seed defaults
router.post(
  '/cleanup',
  authenticate,
  authorize(['Admin']),
  cleanAndSeedSystem
);

export default router;
