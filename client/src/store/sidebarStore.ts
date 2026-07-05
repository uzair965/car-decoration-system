import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ==================================================
// Sidebar Store — manages sidebar collapse state
// ==================================================
interface SidebarState {
  isCollapsed: boolean;
  isMobileOpen: boolean;
  toggleCollapsed: () => void;
  setCollapsed: (collapsed: boolean) => void;
  toggleMobile: () => void;
  closeMobile: () => void;
}

export const useSidebarStore = create<SidebarState>()(
  persist(
    (set) => ({
      isCollapsed: false,
      isMobileOpen: false,

      toggleCollapsed: () =>
        set((state) => ({ isCollapsed: !state.isCollapsed })),

      setCollapsed: (collapsed) =>
        set({ isCollapsed: collapsed }),

      toggleMobile: () =>
        set((state) => ({ isMobileOpen: !state.isMobileOpen })),

      closeMobile: () =>
        set({ isMobileOpen: false }),
    }),
    {
      name: 'sidebar-storage',
      partialize: (state) => ({
        isCollapsed: state.isCollapsed,
      }),
    }
  )
);
