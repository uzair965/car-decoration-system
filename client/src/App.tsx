import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router';
import { ProtectedRoute } from './routes/ProtectedRoute';
import LoginPage from './pages/auth';
import DashboardPage from './pages/dashboard';
import CategoriesPage from './pages/categories';
import CategoryFormPage from './pages/categories/form';
import BrandsPage from './pages/brands';
import BrandFormPage from './pages/brands/form';
import SuppliersPage from './pages/suppliers';
import SupplierFormPage from './pages/suppliers/form';
import ProductsPage from './pages/products';
import ProductFormPage from './pages/products/form';
import CustomersPage from './pages/customers';
import CustomerFormPage from './pages/customers/form';
import PurchasesPage from './pages/purchases';
import PurchaseFormPage from './pages/purchases/form';
import SalesPage from './pages/sales';
import POSPage from './pages/pos';
import ExpensesPage from './pages/expenses';
import ReportsPage from './pages/reports';
import SettingsPage from './pages/settings';
import AuditLogsPage from './pages/audit-logs';
import ProfilePage from './pages/profile';
import { useAuthStore } from './store/authStore';
import api from './api/axios';

// ==================================================
// App Component — Route Definitions
// ==================================================
function App() {
  const { setUser, clearUser, setLoading } = useAuthStore();

  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        clearUser();
        setLoading(false);
        return;
      }

      try {
        const response = await api.get('/auth/me');
        setUser(response.data.data);
      } catch (error) {
        clearUser();
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, [setUser, clearUser, setLoading]);

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<LoginPage />} />

      {/* Protected Routes - wrapped in layout */}
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<DashboardPage />} />
        
        {/* Phase 6: Inventory */}
        <Route path="/categories" element={<CategoriesPage />} />
        <Route path="/categories/new" element={<CategoryFormPage />} />
        <Route path="/categories/:id/edit" element={<CategoryFormPage />} />
        
        <Route path="/brands" element={<BrandsPage />} />
        <Route path="/brands/new" element={<BrandFormPage />} />
        <Route path="/brands/:id/edit" element={<BrandFormPage />} />
        
        <Route path="/suppliers" element={<SuppliersPage />} />
        <Route path="/suppliers/new" element={<SupplierFormPage />} />
        <Route path="/suppliers/:id/edit" element={<SupplierFormPage />} />
        
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/products/new" element={<ProductFormPage />} />
        <Route path="/products/:id/edit" element={<ProductFormPage />} />
        
        {/* Phase 7: Customers, Purchases, POS */}
        <Route path="/customers" element={<CustomersPage />} />
        <Route path="/customers/new" element={<CustomerFormPage />} />
        <Route path="/customers/:id/edit" element={<CustomerFormPage />} />
        
        <Route path="/purchases" element={<PurchasesPage />} />
        <Route path="/purchases/new" element={<PurchaseFormPage />} />
        <Route path="/purchases/:id/edit" element={<PurchaseFormPage />} />
        
        <Route path="/sales" element={<SalesPage />} />
        <Route path="/pos" element={<POSPage />} />
        
        {/* Phase 8-10: Accounting, Security, Audit Logs, Settings */}
        <Route path="/expenses" element={<ExpensesPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/audit-logs" element={<AuditLogsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Route>

      {/* Catch all - redirect to dashboard */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
