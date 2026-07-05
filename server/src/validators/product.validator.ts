import { z } from 'zod';

const emptyStringToNull = (val: any) => (val === '' ? null : val);

export const productSchema = z.object({
  name: z.string().min(1, "Name is required"),
  sku: z.string().min(1, "SKU is required"),
  barcode: z.preprocess(emptyStringToNull, z.string().optional().nullable()),
  description: z.string().optional().nullable(),
  purchasePrice: z.number().min(0, "Purchase price must be a positive number"),
  sellingPrice: z.number().min(0, "Selling price must be a positive number"),
  quantity: z.number().min(0, "Quantity must be a positive number").optional().default(0),
  minQuantity: z.number().min(0, "Minimum quantity must be a positive number").optional().default(5),
  categoryId: z.string().min(1, "Category ID is required"),
  subcategoryId: z.preprocess(emptyStringToNull, z.string().optional().nullable()),
  productType: z.enum(['Universal', 'VehicleSpecific', 'Service']).optional().default('Universal'),
  vehicleBrand: z.preprocess(emptyStringToNull, z.string().optional().nullable()),
  vehicleModel: z.preprocess(emptyStringToNull, z.string().optional().nullable()),
  yearFrom: z.preprocess((val) => (val === '' || val === undefined ? null : Number(val)), z.number().int().optional().nullable()),
  yearTo: z.preprocess((val) => (val === '' || val === undefined ? null : Number(val)), z.number().int().optional().nullable()),
  brandId: z.preprocess(emptyStringToNull, z.string().optional().nullable()),
  supplierId: z.preprocess(emptyStringToNull, z.string().optional().nullable()),
  attributeValues: z.array(
    z.object({
      attributeId: z.string(),
      value: z.string(),
    })
  ).optional(),
});
