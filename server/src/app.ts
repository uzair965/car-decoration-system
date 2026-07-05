import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config();

// Import routes
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import categoryRoutes from './routes/category.routes';
import brandRoutes from './routes/brand.routes';
import supplierRoutes from './routes/supplier.routes';
import productRoutes from './routes/product.routes';
import customerRoutes from './routes/customer.routes';
import purchaseRoutes from './routes/purchase.routes';
import saleRoutes from './routes/sale.routes';
import expenseRoutes from './routes/expense.routes';
import expenseCategoryRoutes from './routes/expenseCategory.routes';
import dashboardRoutes from './routes/dashboard.routes';
import reportRoutes from './routes/report.routes';
import notificationRoutes from './routes/notification.routes';
import settingRoutes from './routes/setting.routes';
import auditLogRoutes from './routes/auditLog.routes';
import inventoryAdjustmentRoutes from './routes/inventoryAdjustment.routes';
import backupRoutes from './routes/backup.routes';
import profileRoutes from './routes/profile.routes';
import cleanupRoutes from './routes/cleanup.routes';

// Import middleware
import { errorHandler } from './middleware/error.middleware';

const app = express();
const PORT = process.env.PORT || 5000;

// ==================================================
// Middleware
// ==================================================

// Security headers
app.use(helmet());

// CORS - allow frontend to call API
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true, // Allow cookies (refresh token)
}));

// Rate limiting - prevent brute force attacks
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 100 : 1000, // lenient in dev
  message: { message: 'Too many requests, please try again later.' },
});
app.use('/api/auth', limiter);

// Parse JSON request bodies
app.use(express.json({ limit: '10mb' }));

// Parse URL-encoded bodies
app.use(express.urlencoded({ extended: true }));

// Parse cookies
app.use(cookieParser());

// Serve uploaded files as static assets
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// ==================================================
// API Routes
// ==================================================

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/brands', brandRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/products', productRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/purchases', purchaseRoutes);
app.use('/api/sales', saleRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/expense-categories', expenseCategoryRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/settings', settingRoutes);
app.use('/api/audit-logs', auditLogRoutes);
app.use('/api/inventory-adjustments', inventoryAdjustmentRoutes);
app.use('/api/backup', backupRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/system', cleanupRoutes);

// Root endpoint
app.get('/', (_req, res) => {
  res.json({ message: '🚗 Car Decoration API Server is running!' });
});

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ==================================================
// Error Handling
// ==================================================

// Global error handler (must be last middleware)
app.use(errorHandler);

// ==================================================
// Start Server
// ==================================================

app.listen(PORT, () => {
  console.log(`\n🚗 Car Decoration API Server`);
  console.log(`📍 Running on: http://localhost:${PORT}`);
  console.log(`📦 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🕐 Started at: ${new Date().toLocaleString()}\n`);
});

export default app;
