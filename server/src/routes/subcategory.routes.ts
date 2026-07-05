import { Router } from 'express';
import {
  getSubcategoriesByCategory,
  getSubcategoryById,
  createSubcategory,
  updateSubcategory,
  deleteSubcategory,
} from '../controllers/subcategory.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { subcategorySchema } from '../validators/subcategory.validator';

const router = Router({ mergeParams: true });

// Write routes (require authenticate and Admin/Manager authorization)
router.post(
  '/',
  authenticate,
  authorize(['Admin', 'Manager']),
  validate(subcategorySchema),
  createSubcategory
);

router.put(
  '/:id',
  authenticate,
  authorize(['Admin', 'Manager']),
  validate(subcategorySchema),
  updateSubcategory
);

router.delete(
  '/:id',
  authenticate,
  authorize(['Admin', 'Manager']),
  deleteSubcategory
);

// Read routes
router.get('/', authenticate, getSubcategoriesByCategory);
router.get('/:id', authenticate, getSubcategoryById);

export default router;
