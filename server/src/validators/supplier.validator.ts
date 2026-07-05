import { z } from 'zod';

export const supplierSchema = z.object({
  name: z.string({ required_error: 'Name is required' }).min(1, 'Name cannot be empty'),
  email: z.string().email('Invalid email format').optional(),
  phone: z.string({ required_error: 'Phone is required' }).min(1, 'Phone cannot be empty'),
  address: z.string().optional(),
  company: z.string().optional(),
  isActive: z.boolean().optional(),
});
