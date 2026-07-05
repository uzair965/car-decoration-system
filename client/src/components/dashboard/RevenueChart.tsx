import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  Legend,
} from 'recharts';
import { useThemeStore } from '../../store/themeStore';
import { TrendingUp, BarChart3 } from 'lucide-react';

interface ChartData {
  name: string;
  revenue: number;
  expenses: number;
  profit: number;
}

// ==================================================
// 1. Revenue Trend Chart (Area Chart)
// ==================================================
export function RevenueTrendChart({ data, period }: { data: ChartData[]; period: string }) {
  const { theme } = useThemeStore();
  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  const colors = {
    stroke: '#818cf8', // Indigo-400
    fill: 'url(#colorRevenueTrend)',
    text: isDark ? '#94a3b8' : '#64748b',
    grid: isDark ? '#1e293b' : '#f1f5f9',
  };

  const isDaily = period === 'thisMonth';

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm ring-1 ring-slate-200 dark:ring-slate-800">
      <div className="flex items-start gap-3 mb-6">
        <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-500 mt-0.5">
          <TrendingUp className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Revenue Trend</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {isDaily ? 'Daily revenue over the current month' : 'Revenue overview across selected months'}
          </p>
        </div>
      </div>
      
      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="colorRevenueTrend" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={colors.stroke} stopOpacity={isDark ? 0.35 : 0.15} />
                <stop offset="95%" stopColor={colors.stroke} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={colors.grid} />
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: colors.text, fontSize: 10 }} 
              dy={10} 
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: colors.text, fontSize: 10 }}
              tickFormatter={(value) => `Rs. ${value}`}
            />
            <Tooltip 
              formatter={(value) => [`Rs. ${Number(value).toLocaleString()}`, 'Revenue']}
              contentStyle={{ 
                backgroundColor: isDark ? '#0f172a' : '#ffffff',
                borderColor: isDark ? '#1e293b' : '#e2e8f0',
                borderRadius: '0.75rem',
                color: isDark ? '#f8fafc' : '#0f172a',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
              }}
              labelStyle={{ color: colors.text, marginBottom: '4px', fontSize: '11px' }}
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke={colors.stroke}
              strokeWidth={2.5}
              fillOpacity={1}
              fill={colors.fill}
              activeDot={{ r: 5, strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ==================================================
// 2. Monthly Performance Chart (Bar/Line Combo)
// ==================================================
export function MonthlyPerformanceChart({ data }: { data: ChartData[] }) {
  const { theme } = useThemeStore();
  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  const colors = {
    salesBar: '#818cf8', // Indigo-400
    purchasesBar: isDark ? '#1e293b' : '#e2e8f0', // Muted column background
    profitLine: '#60a5fa', // Sky-400
    text: isDark ? '#94a3b8' : '#64748b',
    grid: isDark ? '#1e293b' : '#f1f5f9',
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm ring-1 ring-slate-200 dark:ring-slate-800">
      <div className="flex items-start gap-3 mb-6">
        <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-500 mt-0.5">
          <BarChart3 className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Monthly Performance</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Sales vs purchases & net profit</p>
        </div>
      </div>

      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={colors.grid} />
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: colors.text, fontSize: 10 }}
              dy={10}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: colors.text, fontSize: 10 }}
              tickFormatter={(value) => `Rs. ${value}`}
            />
            <Tooltip 
              formatter={(value, name) => [
                `Rs. ${Number(value).toLocaleString()}`, 
                name === 'revenue' ? 'Sales' : name === 'expenses' ? 'Purchases' : 'Profit'
              ]}
              contentStyle={{ 
                backgroundColor: isDark ? '#0f172a' : '#ffffff',
                borderColor: isDark ? '#1e293b' : '#e2e8f0',
                borderRadius: '0.75rem',
                color: isDark ? '#f8fafc' : '#0f172a',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
              }}
              labelStyle={{ color: colors.text, marginBottom: '4px', fontSize: '11px' }}
            />
            <Legend 
              verticalAlign="bottom" 
              height={36} 
              iconSize={10}
              iconType="circle"
              wrapperStyle={{ fontSize: '11px', paddingTop: '15px' }}
            />
            
            {/* Purchases columns in background */}
            <Bar 
              dataKey="expenses" 
              name="Purchases" 
              fill={colors.purchasesBar} 
              radius={[4, 4, 0, 0]} 
              barSize={20}
            />
            
            {/* Sales columns in foreground */}
            <Bar 
              dataKey="revenue" 
              name="Sales" 
              fill={colors.salesBar} 
              radius={[4, 4, 0, 0]} 
              barSize={20}
            />
            
            {/* Profit Line overlay */}
            <Line 
              type="monotone" 
              dataKey="profit" 
              name="Profit" 
              stroke={colors.profitLine} 
              strokeWidth={2}
              dot={{ r: 3, strokeWidth: 0, fill: colors.profitLine }}
              activeDot={{ r: 5 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
