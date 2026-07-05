import { Menu, Bell, LogOut, User as UserIcon, ChevronDown, Check } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { ThemeToggle } from '../ui/ThemeToggle';
import { useAuthStore } from '../../store/authStore';
import api from '../../api/axios';
import { toast } from 'sonner';

export function TopNav({ setSidebarOpen }: { setSidebarOpen: (v: boolean) => void }) {
  const { user, clearUser } = useAuthStore();
  const navigate = useNavigate();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const [notifications, setNotifications] = useState<any[]>([]);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  const fetchNotifications = async () => {
    try {
      const response = await api.get('/notifications');
      setNotifications(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch notifications', error);
    }
  };

  useEffect(() => {
    fetchNotifications();

    const handleUpdate = () => {
      fetchNotifications();
    };

    window.addEventListener('inventory-updated', handleUpdate);
    const interval = setInterval(fetchNotifications, 60000); // fallback refresh every 60s
    
    return () => {
      window.removeEventListener('inventory-updated', handleUpdate);
      clearInterval(interval);
    };
  }, []);

  const handleMarkAsRead = async (id: string) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch (error) {
      console.error('Failed to mark read', error);
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error', error);
    } finally {
      clearUser();
      toast.info('Logged out successfully');
      navigate('/login');
    }
  };

  return (
    <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
      {/* Mobile Menu Button */}
      <button
        type="button"
        className="-m-2.5 p-2.5 text-slate-700 dark:text-slate-300 lg:hidden"
        onClick={() => setSidebarOpen(true)}
      >
        <span className="sr-only">Open sidebar</span>
        <Menu className="h-6 w-6" aria-hidden="true" />
      </button>

      {/* Separator for mobile */}
      <div className="h-6 w-px bg-slate-205 dark:bg-slate-800 lg:hidden" aria-hidden="true" />

      {/* Live Clock & Date */}
      <div className="flex flex-col justify-center text-left select-none leading-none">
        <span className="text-sm font-black text-slate-900 dark:text-white tracking-wide">
          {currentTime.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: true }).toUpperCase()}
        </span>
        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mt-1.5">
          {currentTime.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
        </span>
      </div>

      <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6 justify-end items-center">
        
        {/* Actions Right */}
        <div className="flex items-center gap-x-4 lg:gap-x-6">
          <ThemeToggle />
          
          {/* Notifications Dropdown */}
          <div className="relative">
            <button 
              type="button" 
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              className="-m-2.5 p-2.5 text-slate-400 hover:text-slate-500 dark:hover:text-slate-300 relative"
            >
              <span className="sr-only">View notifications</span>
              <Bell className="h-6 w-6" aria-hidden="true" />
              {unreadCount > 0 && (
                <span className="absolute top-2 right-2 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white dark:ring-slate-950 animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {isNotificationsOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setIsNotificationsOpen(false)} />
                <div className="absolute right-0 z-20 mt-2.5 w-80 origin-top-right rounded-xl bg-white dark:bg-slate-900 py-2 shadow-lg ring-1 ring-slate-900/5 dark:ring-white/10 overflow-hidden animate-in fade-in slide-in-from-top-2">
                  <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
                    <span className="text-sm font-bold text-slate-900 dark:text-white">Shop Alerts</span>
                    <span className="text-xs text-indigo-500 font-semibold">{unreadCount} unread</span>
                  </div>
                  <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
                    {notifications.length === 0 ? (
                      <div className="px-4 py-6 text-center text-xs text-slate-400">
                        No notifications. System all clear!
                      </div>
                    ) : (
                      notifications.map(n => (
                        <div 
                          key={n.id} 
                          className={`p-3 text-xs transition-colors flex gap-2 justify-between items-start ${
                            n.isRead ? 'bg-transparent opacity-60' : 'bg-indigo-50/20 dark:bg-indigo-500/5'
                          }`}
                        >
                          <div className="flex-1 space-y-0.5">
                            <p className="font-bold text-slate-900 dark:text-white">{n.title}</p>
                            <p className="text-slate-500 dark:text-slate-400 leading-normal">{n.message}</p>
                          </div>
                          {!n.isRead && (
                            <button
                              onClick={() => handleMarkAsRead(n.id)}
                              className="p-1 text-slate-400 hover:text-indigo-600 rounded bg-slate-100 dark:bg-slate-800"
                              title="Mark read"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Separator */}
          <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-slate-200 dark:lg:bg-slate-800" aria-hidden="true" />

          {/* Profile Dropdown */}
          <div className="relative">
            <button
              type="button"
              className="-m-1.5 flex items-center p-1.5"
              onClick={() => setIsProfileOpen(!isProfileOpen)}
            >
              <span className="sr-only">Open user menu</span>
              <div className="h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-450">
                <span className="text-sm font-bold uppercase">
                  {user?.name ? user.name.charAt(0) : 'U'}
                </span>
              </div>
              <span className="hidden lg:flex lg:items-center">
                <span className="ml-3 text-sm font-semibold leading-6 text-slate-900 dark:text-white" aria-hidden="true">
                  {user?.name || 'User'}
                </span>
                <ChevronDown className="ml-2 h-4 w-4 text-slate-400" aria-hidden="true" />
              </span>
            </button>

            {/* Dropdown Menu */}
            {isProfileOpen && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setIsProfileOpen(false)}
                />
                <div className="absolute right-0 z-20 mt-2.5 w-48 origin-top-right rounded-xl bg-white dark:bg-slate-900 py-2 shadow-lg ring-1 ring-slate-900/5 dark:ring-white/10 focus:outline-none animate-in fade-in slide-in-from-top-2">
                  <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800 mb-1">
                    <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{user?.name}</p>
                    <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                  </div>
                  <button
                    onClick={() => {
                      setIsProfileOpen(false);
                      navigate('/profile');
                    }}
                    className="flex w-full items-center px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  >
                    <UserIcon className="mr-3 h-4 w-4 text-slate-400" />
                    Your Profile
                  </button>
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                  >
                    <LogOut className="mr-3 h-4 w-4 text-red-500" />
                    Sign out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
