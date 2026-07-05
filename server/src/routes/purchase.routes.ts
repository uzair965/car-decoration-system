import { Router } from 'express';
import * as purchaseController from '../controllers/purchase.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { z } from 'zod';

const router = Router();

// Validation Schemas
const purchaseItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().positive(),
  unitPrice: z.number().nonnegative(),
});

const purchaseSchema = z.object({
  supplierId: z.string().uuid(),
  items: z.array(purchaseItemSchema).min(1, 'At least one item is required'),
  subtotal: z.number().nonnegative(),
  discount: z.number().nonnegative().default(0),
  tax: z.number().nonnegative().default(0),
  total: z.number().nonnegative(),
  paidAmount: z.number().nonnegative().default(0),
  status: z.enum(['Pending', 'Received', 'Cancelled', 'Partial']).default('Pending'),
  notes: z.string().optional().or(z.literal('')),
});

const updateStatusSchema = z.object({
  status: z.enum(['Pending', 'Received', 'Cancelled', 'Partial']),
});

// Routes
router.use(authenticate);

router.get('/', authorize('Admin', 'Manager'), purchaseController.getAll);
router.get('/:id', authorize('Admin', 'Manager'), purchaseController.getById);

router.post(
  '/',
  authorize('Admin', 'Manager'),
  validate(purchaseSchema),
  purchaseController.create
);

router.put(
  '/:id',
  authorize('Admin', 'Manager'),
  validate(purchaseSchema),
  purchaseController.update
);

router.delete(
  '/:id',
  authorize('Admin', 'Manager'),
  purchaseController.remove
);

router.patch(
  '/:id/status',
  authorize('Admin', 'Manager'),
  validate(updateStatusSchema),
  purchaseController.updateStatus
);

export default router;
