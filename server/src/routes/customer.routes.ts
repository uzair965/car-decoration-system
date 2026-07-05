import { Router } from 'express';
import * as customerController from '../controllers/customer.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { z } from 'zod';

const router = Router();

// Validation Schemas
const customerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().min(10, 'Phone must be at least 10 characters'),
  address: z.string().optional().or(z.literal('')),
});

// Routes
router.use(authenticate);

router.get('/', customerController.getAll);
router.get('/:id', customerController.getById);

router.post(
  '/',
  authorize('Admin', 'Manager', 'Cashier', 'Employee'),
  validate(customerSchema),
  customerController.create
);

router.put(
  '/:id',
  authorize('Admin', 'Manager', 'Cashier', 'Employee'),
  validate(customerSchema),
  customerController.update
);

router.delete(
  '/:id',
  authorize('Admin', 'Manager'),

  customerController.delete
);

export default router;
