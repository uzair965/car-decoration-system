import { Router } from 'express';

const router = Router();

router.get('/', (_req, res) => {
  res.json({ message: 'InventoryAdjustment routes - coming in Phase 6' });
});

export default router;
