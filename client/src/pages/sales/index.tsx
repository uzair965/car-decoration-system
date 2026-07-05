import { useEffect, useState } from 'react';
import { DataTable } from '../../components/ui/DataTable';
import api from '../../api/axios';
import { toast } from 'sonner';

interface SaleItem {
  id: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  total: number;
  product: {
    name: string;
    sku: string;
  };
}

interface Sale {
  id: string;
  invoiceNumber: string;
  customer: { name: string } | null;
  total: number;
  paymentMethod: string;
  status: string;
  createdAt: string;
  createdBy: { name: string };
  items?: SaleItem[];
}

export default function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState<string>('all');

  const fetchSales = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/sales');
      setSales(response.data.data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to fetch sales');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
  }, []);

  const handleRefund = async (id: string) => {
    if (!window.confirm('Are you sure you want to refund this sale? Inventory will be returned to stock.')) return;
    try {
      await api.patch(`/sales/${id}/status`, { status: 'Refunded' });
      toast.success('Sale refunded successfully');
      fetchSales();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to refund sale');
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

  const filteredSales = sales.filter(s => {
    if (selectedMonth === 'all') return true;
    const saleDate = new Date(s.createdAt);
    const saleYear = saleDate.getFullYear();
    const saleMonth = String(saleDate.getMonth() + 1).padStart(2, '0');
    return `${saleYear}-${saleMonth}` === selectedMonth;
  });

  const columns = [
    { header: 'Invoice #', accessor: 'invoiceNumber' as keyof Sale },
    { header: 'Customer', accessor: (row: Sale) => row.customer?.name || 'Walk-in Customer' },
    { 
      header: 'Items Purchased', 
      accessor: (row: Sale) => (
        <div className="space-y-1.5 py-1.5 max-w-sm">
          {row.items?.map((item) => (
            <div key={item.id} className="text-[11px] flex items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60 px-2 py-0.5 rounded">
              <span className="font-medium text-slate-850 dark:text-slate-200 truncate" title={item.product?.name}>
                {item.product?.name}
              </span>
              <span className="text-[10px] text-indigo-400 font-bold shrink-0">
                {item.quantity} x Rs.{item.unitPrice.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      )
    },
    { header: 'Total', accessor: (row: Sale) => `Rs. ${row.total.toLocaleString()}` },
    { header: 'Payment', accessor: 'paymentMethod' as keyof Sale },
    { 
      header: 'Date', 
      accessor: (row: Sale) => new Date(row.createdAt).toLocaleString()
    },
    { 
      header: 'Status', 
      accessor: (row: Sale) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          row.status === 'Completed' ? 'bg-green-150 text-green-800' : 
          row.status === 'Refunded' ? 'bg-red-150 text-red-800' : 'bg-yellow-150 text-yellow-800'
        }`}>
          {row.status}
        </span>
      )
    },
    { header: 'Cashier', accessor: (row: Sale) => row.createdBy.name },
    { 
      header: 'Actions', 
      accessor: (row: Sale) => (
        <div className="flex gap-2">
          {row.status === 'Completed' && (
            <button 
              onClick={() => handleRefund(row.id)}
              className="text-xs bg-red-500/10 hover:bg-red-500/20 text-red-650 hover:text-red-750 px-2.5 py-1 rounded font-bold transition-all"
            >
              Refund
            </button>
          )}
        </div>
      )
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Sales History</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">View all transactions and process refunds</p>
        </div>
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
          <DataTable data={filteredSales} columns={columns} />
        )}
      </div>
    </div>
  );
}
