// ==================================================
// Custom type definitions for the server
// ==================================================

import { Request } from 'express';

// Extended request with user information from JWT
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    permissions: string[];
  };
  uploadSubDir?: string;
}

// Standard API response shape
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Inventory adjustment reasons
export type AdjustmentReason = 'Damaged' | 'Lost' | 'Returned' | 'Expired' | 'Other';

// Payment methods
export type PaymentMethod = 'Cash' | 'Card' | 'BankTransfer';

// Sale status
export type SaleStatus = 'Completed' | 'Pending' | 'Cancelled' | 'Refunded';

// Purchase status
export type PurchaseStatus = 'Received' | 'Pending' | 'Cancelled' | 'Partial';
