export function LoadingSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="w-full space-y-4 animate-pulse">
      {/* Header skeleton */}
      <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded-xl w-1/4 mb-8"></div>
      
      {/* Table rows skeleton */}
      <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-sm">
        <div className="h-12 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800"></div>
        {Array.from({ length: rows }).map((_, i) => (
          <div 
            key={i} 
            className="h-16 border-b border-slate-100 dark:border-slate-800/50 flex items-center px-4 gap-4"
          >
            <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/6"></div>
            <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-2/6"></div>
            <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/6"></div>
            <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/6"></div>
            <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded w-1/12 ml-auto"></div>
          </div>
        ))}
      </div>
    </div>
  );
}
