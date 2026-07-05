import { z } from 'zod';

export const brandSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters long'),
  slug: z.string().min(1, 'Slug is required'),
  description: z.string().optional(),
  logo: z.string().optional(),
  isActive: z.boolean().default(true),
});
