import { Clock, CheckCircle2, XCircle } from 'lucide-react';
import { format } from 'date-fns';

interface Activity {
  id: string;
  invoiceNumber: string;
  customerName: string;
  amount: number;
  status: string;
  date: string;
}

export function RecentActivity({ activities }: { activities: Activity[] }) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-500/10';
      case 'Pending': return 'text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-500/10';
      case 'Cancelled': return 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-500/10';
      default: return 'text-slate-600 bg-slate-50 dark:text-slate-400 dark:bg-slate-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Completed': return <CheckCircle2 className="w-4 h-4 mr-1" />;
      case 'Cancelled': return <XCircle className="w-4 h-4 mr-1" />;
      default: return <Clock className="w-4 h-4 mr-1" />;
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm ring-1 ring-slate-200 dark:ring-slate-800 overflow-hidden">
      <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Recent Sales</h3>
      </div>
      
      <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
        {activities.length === 0 ? (
          <div className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
            No recent activity found.
          </div>
        ) : (
          activities.map((activity) => (
            <div key={activity.id} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
              <div className="flex flex-col gap-1">
                <span className="font-medium text-slate-900 dark:text-white">{activity.customerName}</span>
                <span className="text-sm text-slate-500 flex items-center">
                  Invoice: {activity.invoiceNumber}
                </span>
              </div>
              
              <div className="flex flex-col items-end gap-2">
                <span className="font-semibold text-slate-900 dark:text-white">
                  ${activity.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
                <div className={`flex items-center px-2 py-1 rounded-md text-xs font-medium ${getStatusColor(activity.status)}`}>
                  {getStatusIcon(activity.status)}
                  {activity.status}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
