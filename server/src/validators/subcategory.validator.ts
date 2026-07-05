import { z } from 'zod';

export const subcategorySchema = z.object({
  name: z.string().min(2, { message: 'Subcategory name must be at least 2 characters' }),
  attributes: z.array(
    z.object({
      id: z.string().optional(), // Nullable or optional for editing
      name: z.string().min(1, { message: 'Attribute name is required' }),
      type: z.enum(['Text', 'Number', 'Dropdown', 'YesNo', 'Date']),
      dropdownOptions: z.string().optional().nullable(),
      displayOrder: z.number().int().optional().default(0),
    })
  ).optional(),
});
