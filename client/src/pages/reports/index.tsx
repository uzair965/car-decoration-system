import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, DollarSign, Printer, Filter } from 'lucide-react';
import api from '../../api/axios';
import { toast } from 'sonner';

interface PLSummary {
  totalRevenue: number;
  costOfGoodsSold: number;
  grossProfit: number;
  totalExpenses: number;
  netProfit: number;
  grossProfitMargin: number;
  netProfitMargin: number;
}

interface ExpenseBreakdownItem {
  name: string;
  amount: number;
}

interface PLReportData {
  summary: PLSummary;
  expenseBreakdown: ExpenseBreakdownItem[];
  salesCount: number;
  expensesCount: number;
}

export default function ReportsPage() {
  const [data, setData] = useState<PLReportData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Date Filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchPLData = async () => {
    try {
      setIsLoading(true);
      const params: any = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      
      const response = await api.get('/reports/profit-loss', { params });
      setData(response.data.data);
    } catch (error) {
      toast.error('Failed to load Profit & Loss report');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPLData();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return <div className="animate-pulse h-96 bg-slate-100 dark:bg-slate-800 rounded-2xl"></div>;
  }

  const summary = data?.summary;
  const expenses = data?.expenseBreakdown || [];

  return (
    <div className="space-y-6">
      
      {/* Header controls (hidden on Print) */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Financial Reports</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Generate and print Profit & Loss Statements</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm outline-none text-slate-900 dark:text-white"
            />
            <span className="text-slate-400 text-sm">to</span>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm outline-none text-slate-900 dark:text-white"
            />
          </div>
          <button
            onClick={fetchPLData}
            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors"
          >
            <Filter className="w-4 h-4" /> Filter
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 px-4 py-2 rounded-lg font-medium text-sm transition-all"
          >
            <Printer className="w-4 h-4" /> Print PDF
          </button>
        </div>
      </div>

      {/* Main Report Document (Formatted for print sheet size) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm ring-1 ring-slate-200 dark:ring-slate-800 p-8 space-y-8 print:ring-0 print:shadow-none print:p-0">
        
        {/* Document Header */}
        <div className="flex justify-between items-start border-b border-slate-100 dark:border-slate-800 pb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-950 dark:text-white tracking-tight">PROFIT & LOSS STATEMENT</h2>
            <p className="text-slate-500 text-sm mt-1">Car Decoration & Accessories Management</p>
            {startDate || endDate ? (
              <p className="text-indigo-600 dark:text-indigo-400 text-xs font-semibold mt-2">
                Period: {startDate || 'Beginning'} to {endDate || 'Today'}
              </p>
            ) : (
              <p className="text-slate-400 text-xs mt-2">Period: All-Time Statement</p>
            )}
          </div>
          <div className="text-right">
            <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400 block">AutoERP</span>
            <span className="text-xs text-slate-400">Statement Generated: {new Date().toLocaleDateString()}</span>
          </div>
        </div>

        {/* Financial Highlights */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-emerald-50/50 dark:bg-emerald-950/10 p-5 rounded-2xl border border-emerald-500/10">
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block mb-1">Gross Revenue</span>
              <span className="text-3xl font-extrabold text-slate-900 dark:text-white">Rs. {summary.totalRevenue.toLocaleString()}</span>
              <span className="text-[10px] text-slate-400 block mt-2">{data?.salesCount} checkout transactions</span>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/40 p-5 rounded-2xl border border-slate-250 dark:border-slate-800">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Total Operating Expenses</span>
              <span className="text-3xl font-extrabold text-slate-900 dark:text-white">Rs. {summary.totalExpenses.toLocaleString()}</span>
              <span className="text-[10px] text-slate-400 block mt-2">{data?.expensesCount} recorded log items</span>
            </div>

            <div className={`p-5 rounded-2xl border ${
              summary.netProfit >= 0 
                ? 'bg-indigo-50/50 dark:bg-indigo-950/10 border-indigo-500/10' 
                : 'bg-red-50/50 dark:bg-red-950/10 border-red-500/10'
            }`}>
              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block mb-1">Net Income / Profit</span>
              <span className={`text-3xl font-extrabold ${summary.netProfit >= 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-red-500'}`}>
                Rs. {summary.netProfit.toLocaleString()}
              </span>
              <span className="text-[10px] text-slate-400 block mt-2">Margin rate: {summary.netProfitMargin.toFixed(1)}%</span>
            </div>
          </div>
        )}

        {/* Detailed Breakdown Ledger */}
        {summary && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Detailed Financial Summary</h3>
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
              <table className="w-full text-sm text-left">
                <tbody>
                  <tr className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850/40">
                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">Gross Revenue (Total Sales)</td>
                    <td className="px-6 py-4 text-right font-semibold text-emerald-600 dark:text-emerald-400">Rs. {summary.totalRevenue.toLocaleString()}</td>
                  </tr>
                  <tr className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850/40">
                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">Cost of Goods Sold (COGS)</td>
                    <td className="px-6 py-4 text-right text-red-500">- Rs. {summary.costOfGoodsSold.toLocaleString()}</td>
                  </tr>
                  <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 hover:bg-slate-50 dark:hover:bg-slate-850/40">
                    <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">Gross Profit</td>
                    <td className="px-6 py-4 text-right font-bold text-slate-900 dark:text-white">Rs. {summary.grossProfit.toLocaleString()}</td>
                  </tr>
                  <tr className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850/40">
                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">Operating Expenses</td>
                    <td className="px-6 py-4 text-right text-red-500">- Rs. {summary.totalExpenses.toLocaleString()}</td>
                  </tr>
                  <tr className="bg-indigo-50/10 dark:bg-indigo-500/5">
                    <td className="px-6 py-4 font-black text-slate-900 dark:text-white text-base">Net profit</td>
                    <td className="px-6 py-4 text-right font-black text-indigo-600 dark:text-indigo-400 text-base">Rs. {summary.netProfit.toLocaleString()}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Expenses Category Breakdown visual */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Operating Expenses Breakdown</h3>
          {expenses.length === 0 ? (
            <div className="p-6 text-center text-slate-500 border border-slate-200 dark:border-slate-800 rounded-xl">
              No expenses logged during this period.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Progress bars list */}
              <div className="space-y-4">
                {expenses.map((exp, index) => {
                  const maxAmt = Math.max(...expenses.map(x => x.amount));
                  const percentage = maxAmt > 0 ? (exp.amount / maxAmt) * 100 : 0;
                  return (
                    <div key={index} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-350">
                        <span>{exp.name}</span>
                        <span>Rs. {exp.amount.toLocaleString()}</span>
                      </div>
                      <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-indigo-500 rounded-full"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Ledger breakdown table */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 dark:bg-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-3">Expense Category</th>
                      <th className="px-4 py-3 text-right">Total Expense</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenses.map((exp, idx) => (
                      <tr key={idx} className="border-b border-slate-150 dark:border-slate-850 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-850/40">
                        <td className="px-4 py-3 text-slate-900 dark:text-white font-medium">{exp.name}</td>
                        <td className="px-4 py-3 text-right text-slate-900 dark:text-white font-semibold">Rs. {exp.amount.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
