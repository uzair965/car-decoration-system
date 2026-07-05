// ==================================================
// Frontend Zod validation schemas
// Mirrors server-side validation for client-side form validation
// ==================================================

import { z } from 'zod';

// Auth schemas
export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  phone: z.string().optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'Must be at least 6 characters'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

// Category schema
export const categorySchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  description: z.string().optional(),
});

// Brand schema
export const brandSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  description: z.string().optional(),
});

// Supplier schema
export const supplierSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().min(5, 'Phone is required'),
  address: z.string().optional(),
  company: z.string().optional(),
});

// Product schema
export const productSchema = z.object({
  name: z.string().min(2, 'Product name is required'),
  sku: z.string().min(1, 'SKU is required'),
  barcode: z.string().optional(),
  description: z.string().optional(),
  purchasePrice: z.coerce.number().min(0, 'Must be 0 or more'),
  sellingPrice: z.coerce.number().min(0, 'Must be 0 or more'),
  quantity: z.coerce.number().int().min(0, 'Must be 0 or more'),
  minQuantity: z.coerce.number().int().min(0, 'Must be 0 or more'),
  shelfNumber: z.string().optional(),
  compatibleCars: z.string().optional(),
  warranty: z.string().optional(),
  categoryId: z.string().uuid('Select a category'),
  brandId: z.string().uuid('Select a brand').optional().or(z.literal('')),
  supplierId: z.string().uuid('Select a supplier').optional().or(z.literal('')),
});

// Customer schema
export const customerSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().min(5, 'Phone is required'),
  address: z.string().optional(),
});

// Vehicle schema
export const vehicleSchema = z.object({
  make: z.string().min(1, 'Make is required'),
  model: z.string().min(1, 'Model is required'),
  year: z.coerce.number().int().min(1900).max(2100).optional(),
  plateNumber: z.string().optional(),
  color: z.string().optional(),
});

// Expense schema
export const expenseSchema = z.object({
  description: z.string().min(2, 'Description is required'),
  amount: z.coerce.number().min(0.01, 'Amount must be greater than 0'),
  date: z.string().min(1, 'Date is required'),
  categoryId: z.string().uuid('Select a category'),
  notes: z.string().optional(),
});

// Expense Category schema
export const expenseCategorySchema = z.object({
  name: z.string().min(2, 'Name is required').max(100),
  description: z.string().optional(),
});

// Inventory Adjustment schema
export const inventoryAdjustmentSchema = z.object({
  productId: z.string().uuid('Select a product'),
  quantityChange: z.coerce.number().int().refine(val => val !== 0, 'Quantity change cannot be 0'),
  reason: z.enum(['Damaged', 'Lost', 'Returned', 'Expired', 'Other']),
  notes: z.string().optional(),
});

// Settings schema
export const settingsSchema = z.object({
  businessName: z.string().min(1, 'Business name is required'),
  phone: z.string().optional(),
  address: z.string().optional(),
  currency: z.string().min(1, 'Currency is required'),
  invoiceFooter: z.string().optional(),
  taxPercentage: z.coerce.number().min(0).max(100),
});

// Export types inferred from schemas
export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;
export type CategoryFormData = z.infer<typeof categorySchema>;
export type BrandFormData = z.infer<typeof brandSchema>;
export type SupplierFormData = z.infer<typeof supplierSchema>;
export type ProductFormData = z.infer<typeof productSchema>;
export type CustomerFormData = z.infer<typeof customerSchema>;
export type VehicleFormData = z.infer<typeof vehicleSchema>;
export type ExpenseFormData = z.infer<typeof expenseSchema>;
export type ExpenseCategoryFormData = z.infer<typeof expenseCategorySchema>;
export type InventoryAdjustmentFormData = z.infer<typeof inventoryAdjustmentSchema>;
export type SettingsFormData = z.infer<typeof settingsSchema>;
