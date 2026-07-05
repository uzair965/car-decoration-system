import { Router } from 'express';
import {
  createBrand,
  getAllBrands,
  getBrandById,
  updateBrand,
  deleteBrand,
} from '../controllers/brand.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { brandSchema } from '../validators/brand.validator';

const router = Router();

router.post(
  '/',
  authenticate,
  authorize(['Admin', 'Manager']),
  validate(brandSchema),
  createBrand
);

router.get('/', authenticate, getAllBrands);

router.get('/:id', authenticate, getBrandById);

router.put(
  '/:id',
  authenticate,
  authorize(['Admin', 'Manager']),
  validate(brandSchema),
  updateBrand
);

router.delete(
  '/:id',
  authenticate,
  authorize(['Admin', 'Manager']),
  deleteBrand
);

export default router;
