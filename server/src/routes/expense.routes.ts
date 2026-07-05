import { Router } from 'express';
import * as expenseController from '../controllers/expense.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { z } from 'zod';

const router = Router();

const expenseSchema = z.object({
  description: z.string().min(2, 'Description must be at least 2 characters'),
  amount: z.number().positive('Amount must be positive'),
  date: z.string().min(1, 'Date is required'),
  categoryId: z.string().uuid('Invalid Category ID'),
  notes: z.string().optional().or(z.literal('')),
});

router.use(authenticate);

router.get('/', authorize('Admin', 'Manager', 'Employee'), expenseController.getAll);

router.post(
  '/',
  authorize('Admin', 'Manager'),
  validate(expenseSchema),
  expenseController.create
);

router.put(
  '/:id',
  authorize('Admin', 'Manager'),
  validate(expenseSchema),
  expenseController.update
);

router.delete(
  '/:id',
  authorize('Admin', 'Manager'),
  expenseController.deleteExpense
);

export default router;
