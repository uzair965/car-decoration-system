import { NavLink } from 'react-router';
import { 
  LayoutDashboard, 
  Package, 
  Tags, 
  Briefcase, 
  Users, 
  ShoppingCart, 
  Receipt, 
  WalletCards,
  FileText,
  Settings,
  ShieldAlert,
  Car,
  Box,
  Truck,
  BarChart3
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Products', href: '/products', icon: Package },
  { name: 'Categories', href: '/categories', icon: Tags },
  { name: 'Brands', href: '/brands', icon: Box },
  { name: 'Suppliers', href: '/suppliers', icon: Truck },
  { name: 'Point of Sale', href: '/pos', icon: ShoppingCart },
  { name: 'Purchases', href: '/purchases', icon: Package },
  { name: 'Sales History', href: '/sales', icon: Receipt },
  { name: 'Customers', href: '/customers', icon: Users },
  { name: 'Expenses', href: '/expenses', icon: WalletCards },
  { name: 'Reports', href: '/reports', icon: BarChart3 },
];

const adminNavigation = [
  { name: 'Settings', href: '/settings', icon: Settings },
  { name: 'Audit Logs', href: '/audit-logs', icon: ShieldAlert },
];

export function Sidebar({ isOpen, setOpen }: { isOpen: boolean; setOpen: (v: boolean) => void }) {
  const { hasRole } = useAuthStore();
  const isAdmin = hasRole('Admin');

  const NavItem = ({ item }: { item: any }) => (
    <NavLink
      to={item.href}
      onClick={() => setOpen(false)} // Close on mobile click
      className={({ isActive }) =>
        `group flex items-center px-3 py-2.5 text-sm transition-all duration-200 ${
          isActive
            ? 'bg-indigo-600/20 text-white font-bold'
            : 'text-slate-400 font-medium hover:bg-slate-800/50 hover:text-slate-200'
        }`
      }
    >
      <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
      <span className="truncate">{item.name}</span>
    </NavLink>
  );

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar Desktop & Mobile */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-950 border-r border-slate-900 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        
        {/* Logo */}
        <div className="flex h-16 shrink-0 items-center px-6 border-b border-slate-900">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white">
              <Car className="h-5 w-5" />
            </div>
            <span className="text-lg font-bold text-white tracking-tight">
              AutoERP
            </span>
          </div>
        </div>

        {/* Nav Links */}
        <div className="flex flex-1 flex-col overflow-y-auto px-4 py-6">
          <nav className="flex-1 space-y-1">
            {navigation.map((item) => (
              <NavItem key={item.name} item={item} />
            ))}
          </nav>

          {/* Admin Section */}
          {isAdmin && (
            <div className="mt-8">
              <h3 className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                System
              </h3>
              <nav className="space-y-1">
                {adminNavigation.map((item) => (
                  <NavItem key={item.name} item={item} />
                ))}
              </nav>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
