import { Router } from 'express';
import * as productController from '../controllers/product.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { productSchema } from '../validators/product.validator';

const router = Router();

// Read routes
router.get('/', authenticate, authorize(['Admin', 'Manager', 'Employee']), productController.getAll);
router.get('/:id', authenticate, authorize(['Admin', 'Manager', 'Employee']), productController.getById);

// Write routes
router.post('/', authenticate, authorize(['Admin', 'Manager']), validate(productSchema), productController.create);
router.put('/:id', authenticate, authorize(['Admin', 'Manager']), validate(productSchema), productController.update);
router.delete('/:id', authenticate, authorize(['Admin', 'Manager']), productController.deleteProduct);

export default router;
