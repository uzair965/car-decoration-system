import { Router } from 'express';
import * as saleController from '../controllers/sale.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { z } from 'zod';

const router = Router();

// Validation Schemas
const saleItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().positive(),
  unitPrice: z.number().nonnegative(),
  discount: z.number().nonnegative().optional().default(0),
});

const saleSchema = z.object({
  customerId: z.string().uuid().optional().nullable(),
  items: z.array(saleItemSchema).min(1, 'At least one item is required'),
  subtotal: z.number().nonnegative(),
  discount: z.number().nonnegative().default(0),
  tax: z.number().nonnegative().default(0),
  total: z.number().nonnegative(),
  paidAmount: z.number().nonnegative().default(0),
  paymentMethod: z.enum(['Cash', 'Card', 'BankTransfer']),
  status: z.enum(['Completed', 'Pending', 'Cancelled', 'Refunded']).default('Completed'),
  notes: z.string().optional().or(z.literal('')),
});

const updateStatusSchema = z.object({
  status: z.enum(['Completed', 'Pending', 'Cancelled', 'Refunded']),
});

// Routes
router.use(authenticate);

router.get('/', authorize('Admin', 'Manager', 'Cashier', 'Employee'), saleController.getAll);
router.get('/:id', authorize('Admin', 'Manager', 'Cashier', 'Employee'), saleController.getById);

router.post(
  '/',
  authorize('Admin', 'Manager', 'Cashier', 'Employee'),
  validate(saleSchema),
  saleController.create
);

router.patch(
  '/:id/status',
  authorize('Admin', 'Manager'), // Only admins/managers can refund
  validate(updateStatusSchema),
  saleController.updateStatus
);

export default router;
