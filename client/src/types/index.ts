// ==================================================
// Shared TypeScript types for the frontend
// ==================================================

// Pagination meta from API response
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Standard API response
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
  meta?: PaginationMeta;
}

// User
export interface User {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  avatar: string | null;
  isActive: boolean;
  role: Role;
  permissions: string[];
  createdAt: string;
  updatedAt: string;
}

// Role
export interface Role {
  id: string;
  name: string;
  description: string | null;
}

// Category
export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  isActive: boolean;
  _count?: { products: number };
  createdAt: string;
}

// Brand
export interface Brand {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo: string | null;
  isActive: boolean;
  _count?: { products: number };
  createdAt: string;
}

// Supplier
export interface Supplier {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  address: string | null;
  company: string | null;
  isActive: boolean;
  _count?: { products: number; purchases: number };
  createdAt: string;
}

// Product
export interface Product {
  id: string;
  name: string;
  sku: string;
  barcode: string | null;
  description: string | null;
  purchasePrice: number;
  sellingPrice: number;
  quantity: number;
  minQuantity: number;
  shelfNumber: string | null;
  compatibleCars: string | null;
  warranty: string | null;
  images: string[];
  isActive: boolean;
  category: Category;
  categoryId: string;
  brand: Brand | null;
  brandId: string | null;
  supplier: Supplier | null;
  supplierId: string | null;
  createdAt: string;
  updatedAt: string;
}

// Customer
export interface Customer {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  address: string | null;
  vehicles: Vehicle[];
  _count?: { sales: number };
  createdAt: string;
}

// Vehicle
export interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number | null;
  plateNumber: string | null;
  color: string | null;
  customerId: string;
}

// Purchase
export interface Purchase {
  id: string;
  invoiceNumber: string;
  supplier: Supplier;
  supplierId: string;
  items: PurchaseItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paidAmount: number;
  status: 'Received' | 'Pending' | 'Cancelled' | 'Partial';
  notes: string | null;
  createdBy: User;
  createdAt: string;
}

// Purchase Item
export interface PurchaseItem {
  id: string;
  product: Product;
  productId: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

// Sale
export interface Sale {
  id: string;
  invoiceNumber: string;
  customer: Customer | null;
  customerId: string | null;
  items: SaleItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paidAmount: number;
  paymentMethod: 'Cash' | 'Card' | 'BankTransfer';
  status: 'Completed' | 'Pending' | 'Cancelled' | 'Refunded';
  notes: string | null;
  createdBy: User;
  createdAt: string;
}

// Sale Item
export interface SaleItem {
  id: string;
  product: Product;
  productId: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  total: number;
}

// Expense Category
export interface ExpenseCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  _count?: { expenses: number };
  createdAt: string;
}

// Expense
export interface Expense {
  id: string;
  description: string;
  amount: number;
  date: string;
  category: ExpenseCategory;
  categoryId: string;
  receipt: string | null;
  notes: string | null;
  createdBy: User;
  createdAt: string;
}

// Inventory Adjustment
export interface InventoryAdjustment {
  id: string;
  product: Product;
  productId: string;
  quantityBefore: number;
  quantityAfter: number;
  quantityChange: number;
  reason: 'Damaged' | 'Lost' | 'Returned' | 'Expired' | 'Other';
  notes: string | null;
  adjustedBy: User;
  createdAt: string;
}

// Notification
export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'LowStock' | 'OutOfStock' | 'PendingPayment' | 'System';
  isRead: boolean;
  createdAt: string;
}

// Audit Log
export interface AuditLog {
  id: string;
  user: User;
  userId: string;
  action: string;
  entity: string;
  entityId: string;
  details: string | null;
  ipAddress: string;
  createdAt: string;
}

// Settings
export interface Settings {
  id: string;
  key: string;
  value: string;
}

// Dashboard Stats
export interface DashboardStats {
  todaySales: number;
  todayProfit: number;
  monthlySales: number;
  monthlyProfit: number;
  yearlySales: number;
  todayExpenses: number;
  lowStockCount: number;
  outOfStockCount: number;
  totalProducts: number;
  totalCustomers: number;
}

// Chart data point
export interface ChartDataPoint {
  name: string;
  value: number;
  secondaryValue?: number;
}
