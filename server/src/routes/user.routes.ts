import { Router } from 'express';

const router = Router();

router.get('/', (_req, res) => {
  res.json({ message: 'User routes - coming in Phase 3' });
});

export default router;
