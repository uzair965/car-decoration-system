import { useEffect, useState } from 'react';
import { DollarSign, Package, TrendingUp, AlertCircle, ShoppingCart, Users } from 'lucide-react';
import { StatCard } from '../../components/dashboard/StatCard';
import { RevenueTrendChart, MonthlyPerformanceChart } from '../../components/dashboard/RevenueChart';
import { RecentActivity } from '../../components/dashboard/RecentActivity';
import api from '../../api/axios';
import { toast } from 'sonner';

interface DashboardData {
  stats: {
    totalRevenue: number;
    totalPurchases: number;
    profit: number;
    totalProducts: number;
    lowStockCount: number;
    todaySales: number;
    todayOrders: number;
    todayCustomers: number;
    revenueTrend: {
      value: number;
      label: string;
      trendUp: boolean;
    } | null;
    purchaseTrend: {
      value: number;
      label: string;
      trendUp: boolean;
    } | null;
    profitTrend: {
      value: number;
      label: string;
      trendUp: boolean;
    } | null;
  };
  chartData: {
    name: string;
    revenue: number;
    expenses: number;
    profit: number;
  }[];
  recentActivity: {
    id: string;
    invoiceNumber: string;
    customerName: string;
    amount: number;
    status: string;
    date: string;
  }[];
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState('thisMonth');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        const response = await api.get(`/dashboard/summary?period=${period}`);
        setData(response.data.data);
      } catch (error) {
        toast.error('Failed to load dashboard data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [period]);

  if (isLoading || !data) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="flex justify-between items-center mb-6">
          <div className="h-8 w-48 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
          <div className="h-10 w-32 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
        </div>
        <div className="h-44 bg-slate-200 dark:bg-slate-800 rounded-2xl mb-6"></div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-slate-200 dark:bg-slate-800 rounded-2xl"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-96 bg-slate-200 dark:bg-slate-800 rounded-2xl"></div>
          <div className="h-96 bg-slate-200 dark:bg-slate-800 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Dashboard Overview</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Welcome back to business.</p>
        </div>
        
        <select 
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer font-medium text-sm shadow-sm"
        >
          <option value="thisMonth">This Month</option>
          <option value="1month">Last 1 Month</option>
          <option value="2months">Last 2 Months</option>
          <option value="3months">Last 3 Months</option>
          <option value="4months">Last 4 Months</option>
          <option value="6months">Last 6 Months</option>
          <option value="12months">Last 12 Months (1 Year)</option>
          <option value="thisYear">This Year</option>
          <option value="allTime">All Time</option>
        </select>
      </div>

      {/* Today's Calendar Highlights Panel */}
      <div className="bg-slate-50/60 dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-450 dark:text-slate-500">Today's Footprint (Calendar Today)</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="bg-white dark:bg-slate-950 p-4 rounded-xl border border-slate-200/50 dark:border-slate-850 flex items-center justify-between shadow-sm">
            <div>
              <span className="text-xs font-semibold text-slate-450 dark:text-slate-400 block">Today's Sales</span>
              <span className="text-xl font-extrabold text-slate-900 dark:text-white mt-1 block">
                Rs. {data.stats.todaySales?.toLocaleString() || '0'}
              </span>
            </div>
            <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-950 p-4 rounded-xl border border-slate-200/50 dark:border-slate-850 flex items-center justify-between shadow-sm">
            <div>
              <span className="text-xs font-semibold text-slate-450 dark:text-slate-400 block">Today's Orders</span>
              <span className="text-xl font-extrabold text-slate-900 dark:text-white mt-1 block">
                {data.stats.todayOrders || '0'}
              </span>
            </div>
            <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-500">
              <ShoppingCart className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-950 p-4 rounded-xl border border-slate-200/50 dark:border-slate-850 flex items-center justify-between shadow-sm">
            <div>
              <span className="text-xs font-semibold text-slate-450 dark:text-slate-400 block">Today's Customers</span>
              <span className="text-xl font-extrabold text-slate-900 dark:text-white mt-1 block">
                {data.stats.todayCustomers || '0'}
              </span>
            </div>
            <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-amber-500/10 text-amber-500">
              <Users className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <StatCard
          title="Total Revenue"
          value={`Rs. ${data.stats.totalRevenue.toLocaleString()}`}
          icon={<DollarSign className="h-6 w-6" />}
          trend={data.stats.revenueTrend ? { value: data.stats.revenueTrend.value, label: data.stats.revenueTrend.label } : undefined}
          trendUp={data.stats.revenueTrend ? data.stats.revenueTrend.trendUp : true}
        />
        <StatCard
          title="Total Purchases"
          value={`Rs. ${data.stats.totalPurchases.toLocaleString()}`}
          icon={<ShoppingCart className="h-6 w-6 text-indigo-500" />}
          trend={data.stats.purchaseTrend ? { value: data.stats.purchaseTrend.value, label: data.stats.purchaseTrend.label } : undefined}
          trendUp={data.stats.purchaseTrend ? data.stats.purchaseTrend.trendUp : false}
        />
        <StatCard
          title="Net Profit"
          value={`Rs. ${data.stats.profit.toLocaleString()}`}
          icon={<TrendingUp className="h-6 w-6" />}
          trend={data.stats.profitTrend ? { value: data.stats.profitTrend.value, label: data.stats.profitTrend.label } : undefined}
          trendUp={data.stats.profitTrend ? data.stats.profitTrend.trendUp : true}
        />
        <StatCard
          title="Active Products"
          value={data.stats.totalProducts}
          icon={<Package className="h-6 w-6" />}
        />
        <StatCard
          title="Low Stock Alerts"
          value={data.stats.lowStockCount}
          icon={<AlertCircle className={`h-6 w-6 ${data.stats.lowStockCount > 0 ? 'text-red-500' : 'text-slate-400'}`} />}
          trend={data.stats.lowStockCount > 0 ? { value: data.stats.lowStockCount, label: 'items need restock' } : undefined}
          trendUp={false}
        />
      </div>

      {/* Charts (Revenue Trend & Monthly Performance side-by-side) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RevenueTrendChart data={data.chartData} period={period} />
        <MonthlyPerformanceChart data={data.chartData} />
      </div>

      {/* Recent Activity Table (Full width below) */}
      <div className="grid grid-cols-1 gap-6">
        <RecentActivity activities={data.recentActivity} />
      </div>
    </div>
  );
}
