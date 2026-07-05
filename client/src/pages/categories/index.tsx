import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { DataTable } from '../../components/ui/DataTable';
import api from '../../api/axios';
import { toast } from 'sonner';

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const fetchCategories = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/categories');
      setCategories(response.data.data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to fetch categories');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this category?')) return;
    
    try {
      await api.delete(`/categories/${id}`);
      toast.success('Category deleted successfully');
      fetchCategories();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete category');
    }
  };

  const columns = [
    { header: 'Name', accessor: 'name' as keyof Category },
    { header: 'Slug', accessor: 'slug' as keyof Category },
    { header: 'Description', accessor: 'description' as keyof Category },
    { 
      header: 'Status', 
      accessor: (row: Category) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${row.isActive ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'}`}>
          {row.isActive ? 'Active' : 'Inactive'}
        </span>
      )
    },
    { 
      header: 'Actions', 
      accessor: (row: Category) => (
        <div className="flex gap-2">
          <button 
            onClick={() => navigate(`/categories/${row.id}/edit`)}
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
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Categories</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage product categories</p>
        </div>
        <button
          onClick={() => navigate('/categories/new')}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Category
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
          <DataTable data={categories} columns={columns} />
        )}
      </div>
    </div>
  );
}
