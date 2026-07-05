import { Router } from 'express';
import * as expenseCategoryController from '../controllers/expenseCategory.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { z } from 'zod';

const router = Router();

const categorySchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().optional().or(z.literal('')),
});

router.use(authenticate);

router.get('/', expenseCategoryController.getAll);

router.post(
  '/',
  authorize('Admin', 'Manager'),
  validate(categorySchema),
  expenseCategoryController.create
);

router.put(
  '/:id',
  authorize('Admin', 'Manager'),
  validate(categorySchema),
  expenseCategoryController.update
);

router.delete(
  '/:id',
  authorize('Admin', 'Manager'),
  expenseCategoryController.deleteCategory
);

export default router;
