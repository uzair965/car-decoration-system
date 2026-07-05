import { Router } from 'express';
import {
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
} from '../controllers/category.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { categorySchema } from '../validators/category.validator';

import subcategoryRoutes from './subcategory.routes';

const router = Router();

// Mount subcategory routes
router.use('/:categoryId/subcategories', subcategoryRoutes);

// Write routes: require authentication and Admin/Manager authorization
router.post(
  '/',
  authenticate,
  authorize(['Admin', 'Manager']),
  validate(categorySchema),
  createCategory
);

router.put(
  '/:id',
  authenticate,
  authorize(['Admin', 'Manager']),
  validate(categorySchema),
  updateCategory
);

router.delete(
  '/:id',
  authenticate,
  authorize(['Admin', 'Manager']),
  deleteCategory
);

// Read routes: require authentication only
router.get('/', authenticate, getAllCategories);
router.get('/:id', authenticate, getCategoryById);

export default router;
