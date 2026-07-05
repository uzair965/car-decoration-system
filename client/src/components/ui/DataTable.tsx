import { ReactNode } from 'react';

interface Column<T> {
  header: string;
  accessor: keyof T | ((row: T) => ReactNode);
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor?: (row: T) => string;
}

export function DataTable<T>({ columns, data, keyExtractor }: DataTableProps<T>) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left text-slate-500 dark:text-slate-400">
        <thead className="text-xs text-slate-700 uppercase bg-slate-50 dark:bg-slate-800/50 dark:text-slate-300">
          <tr>
            {columns.map((col, index) => (
              <th key={index} className={`px-6 py-4 font-medium tracking-wider ${col.className || ''}`}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                No records found.
              </td>
            </tr>
          ) : (
            data.map((row, rowIndex) => {
              const rowKey = keyExtractor ? keyExtractor(row) : (row as any).id || rowIndex;
              return (
                <tr 
                  key={rowKey} 
                  className="bg-white border-b dark:bg-slate-900 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  {columns.map((col, colIndex) => (
                    <td key={colIndex} className={`px-6 py-4 whitespace-nowrap ${col.className || ''}`}>
                      {typeof col.accessor === 'function' 
                        ? col.accessor(row) 
                        : (row[col.accessor] as ReactNode)}
                    </td>
                  ))}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
