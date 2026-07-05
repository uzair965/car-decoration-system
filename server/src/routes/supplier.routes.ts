import { Router } from 'express';
import { create, getAll, getById, update, delete as deleteSupplier } from '../controllers/supplier.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { supplierSchema } from '../validators/supplier.validator';

const router = Router();

// Read routes
router.get('/', authenticate, getAll);
router.get('/:id', authenticate, getById);

// Write routes
router.post('/', authenticate, authorize(['Admin', 'Manager']), validate(supplierSchema), create);
router.put('/:id', authenticate, authorize(['Admin', 'Manager']), validate(supplierSchema), update);
router.delete('/:id', authenticate, authorize(['Admin', 'Manager']), deleteSupplier);

export default router;
