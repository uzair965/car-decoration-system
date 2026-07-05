import { z } from 'zod';

export const categorySchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters' }),
  slug: z.string(),
  description: z.string().optional(),
  isActive: z.boolean().optional()
});
