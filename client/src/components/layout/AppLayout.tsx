import { useState } from 'react';
import { Outlet } from 'react-router';
import { Sidebar } from './Sidebar';
import { TopNav } from './TopNav';

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Sidebar isOpen={sidebarOpen} setOpen={setSidebarOpen} />

      <div className="lg:pl-64 flex flex-col min-h-screen">
        <TopNav setSidebarOpen={setSidebarOpen} />
        
        <main className="flex-1 py-8 px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* The nested protected routes will render here */}
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
