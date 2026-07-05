import { ReactNode } from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  trend?: {
    value: number;
    label: string;
  };
  trendUp?: boolean;
}

export function StatCard({ title, value, icon, trend, trendUp }: StatCardProps) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm ring-1 ring-slate-200 dark:ring-slate-800 hover:shadow-md transition-shadow duration-250">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
          {title}
        </p>
        <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
          {icon}
        </div>
      </div>
      <div className="mt-4 flex items-baseline gap-4">
        <h3 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          {value}
        </h3>
        {trend && (
          <p className={`text-sm font-medium ${trendUp ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
            {trendUp ? '↑' : '↓'} {trend.value}%
            <span className="text-slate-500 dark:text-slate-500 ml-1 font-normal">
              {trend.label}
            </span>
          </p>
        )}
      </div>
    </div>
  );
}
