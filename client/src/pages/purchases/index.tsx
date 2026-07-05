import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { Plus, Eye, CheckCircle, Edit, Trash2 } from 'lucide-react';
import { DataTable } from '../../components/ui/DataTable';
import api from '../../api/axios';
import { toast } from 'sonner';

interface Purchase {
  id: string;
  invoiceNumber: string;
  supplier: { name: string };
  total: number;
  status: string;
  createdAt: string;
  createdBy: { name: string };
}

export default function PurchasesPage() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const navigate = useNavigate();

  const fetchPurchases = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/purchases');
      setPurchases(response.data.data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to fetch purchases');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPurchases();
  }, []);

  const handleMarkReceived = async (id: string) => {
    if (!window.confirm('Mark this purchase order as Received? This will INCREASE product inventory.')) return;
    try {
      await api.patch(`/purchases/${id}/status`, { status: 'Received' });
      toast.success('Purchase marked as Received! Inventory updated.');
      fetchPurchases();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update status');
    }
  };

  const handleDeletePurchase = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this pending purchase order?')) return;
    try {
      await api.delete(`/purchases/${id}`);
      toast.success('Purchase order deleted successfully');
      fetchPurchases();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete purchase order');
    }
  };

  const getMonthOptions = () => {
    const options = [];
    const date = new Date();
    for (let i = 0; i < 12; i++) {
      const month = date.toLocaleString('default', { month: 'long' });
      const year = date.getFullYear();
      const value = `${year}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      options.push({ label: `${month} ${year}`, value });
      date.setMonth(date.getMonth() - 1);
    }
    return options;
  };

  const filteredPurchases = purchases.filter(p => {
    if (selectedMonth === 'all') return true;
    const purDate = new Date(p.createdAt);
    const purYear = purDate.getFullYear();
    const purMonth = String(purDate.getMonth() + 1).padStart(2, '0');
    return `${purYear}-${purMonth}` === selectedMonth;
  });

  const columns = [
    { header: 'Invoice #', accessor: 'invoiceNumber' as keyof Purchase },
    { header: 'Supplier', accessor: (row: Purchase) => row.supplier.name },
    { header: 'Total Amount', accessor: (row: Purchase) => `Rs. ${row.total.toLocaleString()}` },
    { 
      header: 'Date', 
      accessor: (row: Purchase) => new Date(row.createdAt).toLocaleDateString()
    },
    { 
      header: 'Status', 
      accessor: (row: Purchase) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          row.status === 'Received' ? 'bg-green-150 text-green-800' : 
          row.status === 'Pending' ? 'bg-yellow-150 text-yellow-800' : 'bg-red-150 text-red-800'
        }`}>
          {row.status}
        </span>
      )
    },
    { header: 'Created By', accessor: (row: Purchase) => row.createdBy.name },
    { 
      header: 'Actions', 
      accessor: (row: Purchase) => (
        <div className="flex gap-3 items-center">
          {row.status === 'Pending' && (
            <>
              <button 
                onClick={() => handleMarkReceived(row.id)}
                className="p-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-500/10 rounded-lg transition-all"
                title="Mark as Received"
              >
                <CheckCircle className="w-4 h-4" />
              </button>
              <button 
                onClick={() => navigate(`/purchases/${row.id}/edit`)}
                className="p-1.5 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-500/10 rounded-lg transition-all"
                title="Edit Order"
              >
                <Edit className="w-4 h-4" />
              </button>
              <button 
                onClick={() => handleDeletePurchase(row.id)}
                className="p-1.5 text-rose-600 hover:text-rose-700 hover:bg-rose-500/10 rounded-lg transition-all"
                title="Delete Order"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      )
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Purchase Orders</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage inventory restocking</p>
        </div>
        <button
          onClick={() => navigate('/purchases/new')}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create P.O.
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm ring-1 ring-slate-200 dark:ring-slate-800 p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Filter Month:</span>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-800 dark:text-white outline-none cursor-pointer focus:border-indigo-500"
            >
              <option value="all">All Months</option>
              {getMonthOptions().map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="animate-pulse space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-12 bg-slate-100 dark:bg-slate-800 rounded-lg"></div>
            ))}
          </div>
        ) : (
          <DataTable data={filteredPurchases} columns={columns} />
        )}
      </div>
    </div>
  );
}
