import { useEffect, useState } from 'react';
import { ShieldAlert, Clock, User, FileText } from 'lucide-react';
import { DataTable } from '../../components/ui/DataTable';
import api from '../../api/axios';
import { toast } from 'sonner';

interface AuditLog {
  id: string;
  action: string;
  entity: string;
  entityId: string;
  details: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  user: {
    name: string;
    email: string;
  };
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchLogs = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/audit-logs');
      setLogs(response.data.data);
    } catch (error) {
      toast.error('Failed to load audit logs');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const columns = [
    { 
      header: 'Timestamp', 
      accessor: (row: AuditLog) => new Date(row.createdAt).toLocaleString() 
    },
    { header: 'Performed By', accessor: (row: AuditLog) => `${row.user.name} (${row.user.email})` },
    { 
      header: 'Action', 
      accessor: (row: AuditLog) => (
        <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase ${
          row.action === 'CREATE' ? 'bg-green-100 text-green-800' :
          row.action === 'UPDATE' ? 'bg-amber-100 text-amber-800' :
          row.action === 'DELETE' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
        }`}>
          {row.action}
        </span>
      ) 
    },
    { header: 'Resource Type', accessor: 'entity' as keyof AuditLog },
    { header: 'Resource ID', accessor: 'entityId' as keyof AuditLog },
    { 
      header: 'Details', 
      accessor: (row: AuditLog) => (
        <span className="font-mono text-xs max-w-[200px] truncate block" title={row.details || ''}>
          {row.details || '-'}
        </span>
      ) 
    },
    { header: 'IP Address', accessor: (row: AuditLog) => row.ipAddress || '-' }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <ShieldAlert className="w-6 h-6 text-indigo-500" /> Security Audit Logs
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Monitor system actions and modifications (Admin only)
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm ring-1 ring-slate-200 dark:ring-slate-800 p-6">
        {isLoading ? (
          <div className="animate-pulse space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-12 bg-slate-100 dark:bg-slate-800 rounded-lg"></div>
            ))}
          </div>
        ) : (
          <DataTable data={logs} columns={columns} />
        )}
      </div>
    </div>
  );
}
