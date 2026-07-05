import { ReactNode } from 'react';

interface DataTableProps {
  title: string;
  action?: ReactNode;
  columns: string[];
  children: ReactNode;
  emptyState?: string;
  isEmpty?: boolean;
}

export function DataTable({ title, action, columns, children, emptyState = "No data available", isEmpty = false }: DataTableProps) {
  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex sm:items-center justify-between flex-col sm:flex-row gap-4 mb-6">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{title}</h2>
        {action && <div>{action}</div>}
      </div>

      {/* Table Container */}
      <div className="bg-white dark:bg-slate-900 shadow-sm ring-1 ring-slate-200 dark:ring-slate-800 rounded-2xl overflow-hidden transition-colors">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
            <thead className="bg-slate-50 dark:bg-slate-950/50">
              <tr>
                {columns.map((col, idx) => (
                  <th 
                    key={idx} 
                    scope="col" 
                    className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900">
              {isEmpty ? (
                <tr>
                  <td colSpan={columns.length} className="px-6 py-12 text-center text-sm text-slate-500 dark:text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <svg className="w-8 h-8 text-slate-400 dark:text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                      </svg>
                      {emptyState}
                    </div>
                  </td>
                </tr>
              ) : (
                children
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination placeholder */}
        <div className="border-t border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between bg-slate-50 dark:bg-slate-950/50">
           <div className="text-sm text-slate-500 dark:text-slate-400">
             Showing page 1 of 1
           </div>
           <div className="flex gap-2">
             <button disabled className="px-3 py-1 text-sm border border-slate-200 dark:border-slate-700 rounded-lg opacity-50 bg-white dark:bg-slate-800 text-slate-500">Previous</button>
             <button disabled className="px-3 py-1 text-sm border border-slate-200 dark:border-slate-700 rounded-lg opacity-50 bg-white dark:bg-slate-800 text-slate-500">Next</button>
           </div>
        </div>
      </div>
    </div>
  );
}
