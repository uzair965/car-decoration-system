import { Navigate, Outlet, useLocation } from 'react-router';
import { useAuthStore } from '../store/authStore';
import { AppLayout } from '../components/layout/AppLayout';

// ==================================================
// Protected Route Wrapper
// Redirects to /login if user is not authenticated
// ==================================================
export function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuthStore();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
          <p className="text-sm font-medium text-slate-500">Loading application...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to login but save the attempted url
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Render the AppLayout which contains the Sidebar, TopNav, and child routes
  return <AppLayout />;
}

// ==================================================
// Role Based Route Wrapper
// ==================================================
export function RoleRoute({ roles }: { roles: string[] }) {
  const { hasRole, isLoading } = useAuthStore();

  if (isLoading) return null;

  if (!hasRole('Admin', ...roles)) {
    return (
      <div className="flex h-full min-h-[400px] flex-col items-center justify-center text-center">
        <div className="rounded-full bg-red-100 p-3 text-red-600 dark:bg-red-900/30 dark:text-red-400">
          <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="mt-4 text-xl font-bold text-slate-900 dark:text-white">Access Denied</h2>
        <p className="mt-2 text-slate-500">You do not have permission to view this page.</p>
      </div>
    );
  }

  return <Outlet />;
}
