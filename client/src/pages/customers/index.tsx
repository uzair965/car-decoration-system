import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { DataTable } from '../../components/ui/DataTable';
import api from '../../api/axios';
import { toast } from 'sonner';

interface Customer {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  address: string | null;
  createdAt: string;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const fetchCustomers = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/customers');
      setCustomers(response.data.data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to fetch customers');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this customer?')) return;
    
    try {
      await api.delete(`/customers/${id}`);
      toast.success('Customer deleted successfully');
      fetchCustomers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete customer');
    }
  };

  const columns = [
    { header: 'Name', accessor: 'name' as keyof Customer },
    { header: 'Phone', accessor: 'phone' as keyof Customer },
    { header: 'Email', accessor: (row: Customer) => row.email || '-' },
    { header: 'Address', accessor: (row: Customer) => row.address || '-' },
    { 
      header: 'Actions', 
      accessor: (row: Customer) => (
        <div className="flex gap-2">
          <button 
            onClick={() => navigate(`/customers/${row.id}/edit`)}
            className="p-1 text-slate-500 hover:text-indigo-600 transition-colors"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button 
            onClick={() => handleDelete(row.id)}
            className="p-1 text-slate-500 hover:text-red-600 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Customers</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage your customer database</p>
        </div>
        <button
          onClick={() => navigate('/customers/new')}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Customer
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm ring-1 ring-slate-200 dark:ring-slate-800 p-6">
        {isLoading ? (
          <div className="animate-pulse space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-12 bg-slate-100 dark:bg-slate-800 rounded-lg"></div>
            ))}
          </div>
        ) : (
          <DataTable data={customers} columns={columns} />
        )}
      </div>
    </div>
  );
}
