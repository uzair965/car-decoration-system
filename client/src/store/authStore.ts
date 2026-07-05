import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ==================================================
// User/Auth types
// ==================================================
export interface User {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  avatar: string | null;
  role: {
    id: string;
    name: string;
  };
  permissions: string[];
  isActive: boolean;
}

// ==================================================
// Auth Store — manages authentication state
// ==================================================
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Actions
  setUser: (user: User) => void;
  clearUser: () => void;
  setLoading: (loading: boolean) => void;
  hasPermission: (permission: string) => boolean;
  hasRole: (...roles: string[]) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: true,

      setUser: (user) =>
        set({
          user,
          isAuthenticated: true,
          isLoading: false,
        }),

      clearUser: () => {
        localStorage.removeItem('accessToken');
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        });
      },

      setLoading: (loading) => set({ isLoading: loading }),

      hasPermission: (permission) => {
        const { user } = get();
        if (!user) return false;
        if (user.role.name === 'Admin') return true; // Admin has all permissions
        return user.permissions.includes(permission);
      },

      hasRole: (...roles) => {
        const { user } = get();
        if (!user) return false;
        return roles.includes(user.role.name);
      },
    }),
    {
      name: 'auth-storage', // localStorage key
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
