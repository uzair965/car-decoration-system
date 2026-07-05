import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, Calendar, DollarSign } from 'lucide-react';
import { DataTable } from '../../components/ui/DataTable';
import api from '../../api/axios';
import { toast } from 'sonner';

interface Expense {
  id: string;
  description: string;
  amount: number;
  date: string;
  categoryId: string;
  category: { name: string };
  notes: string | null;
  createdBy: { name: string };
}

interface ExpenseCategory {
  id: string;
  name: string;
}

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form State
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [categoryId, setCategoryId] = useState('');
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [expRes, catRes] = await Promise.all([
        api.get('/expenses'),
        api.get('/expense-categories')
      ]);
      setExpenses(expRes.data.data);
      setCategories(catRes.data.data);
      if (catRes.data.data.length > 0) {
        setCategoryId(catRes.data.data[0].id);
      }
    } catch (error: any) {
      toast.error('Failed to load expense data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openAddModal = () => {
    setEditingId(null);
    setDescription('');
    setAmount('');
    setDate(new Date().toISOString().split('T')[0]);
    if (categories.length > 0) setCategoryId(categories[0].id);
    setNotes('');
    setShowModal(true);
  };

  const openEditModal = (exp: Expense) => {
    setEditingId(exp.id);
    setDescription(exp.description);
    setAmount(String(exp.amount));
    setDate(new Date(exp.date).toISOString().split('T')[0]);
    setCategoryId(exp.categoryId);
    setNotes(exp.notes || '');
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this expense?')) return;
    try {
      await api.delete(`/expenses/${id}`);
      toast.success('Expense deleted successfully');
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete expense');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount || !categoryId) return toast.error('Please fill required fields');

    try {
      setIsSaving(true);
      const payload = {
        description,
        amount: Number(amount),
        date: new Date(date).toISOString(),
        categoryId,
        notes
      };

      if (editingId) {
        await api.put(`/expenses/${editingId}`, payload);
        toast.success('Expense updated successfully');
      } else {
        await api.post('/expenses', payload);
        toast.success('Expense recorded successfully');
      }
      setShowModal(false);
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save expense');
    } finally {
      setIsSaving(false);
    }
  };

  const columns = [
    { header: 'Description', accessor: 'description' as keyof Expense },
    { header: 'Category', accessor: (row: Expense) => row.category.name },
    { 
      header: 'Amount', 
      accessor: (row: Expense) => `Rs. ${row.amount.toLocaleString()}` 
    },
    { 
      header: 'Date', 
      accessor: (row: Expense) => new Date(row.date).toLocaleDateString()
    },
    { header: 'Notes', accessor: (row: Expense) => row.notes || '-' },
    { header: 'Logged By', accessor: (row: Expense) => row.createdBy.name },
    { 
      header: 'Actions', 
      accessor: (row: Expense) => (
        <div className="flex gap-2">
          <button 
            onClick={() => openEditModal(row)}
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
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Shop Expenses</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Log and track daily shop expenditures</p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Record Expense
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm ring-1 ring-slate-200 dark:ring-slate-800 p-6">
        {isLoading ? (
          <div className="animate-pulse space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-12 bg-slate-100 dark:bg-slate-800 rounded-lg"></div>
            ))}
          </div>
        ) : (
          <DataTable data={expenses} columns={columns} />
        )}
      </div>

      {/* Expense Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full shadow-xl overflow-hidden border border-slate-200 dark:border-slate-800">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30 flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {editingId ? 'Edit Expense' : 'Record New Expense'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <XIcon className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Description *</label>
                <input
                  type="text"
                  required
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="e.g. Utility Bills, Tea & Refreshments"
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-750 rounded-lg outline-none text-slate-900 dark:text-white text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Amount (Rs) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    placeholder="0"
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-750 rounded-lg outline-none text-slate-900 dark:text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Date *</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-750 rounded-lg outline-none text-slate-900 dark:text-white text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Category *</label>
                <select
                  required
                  value={categoryId}
                  onChange={e => setCategoryId(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-750 rounded-lg outline-none text-slate-900 dark:text-white text-sm"
                >
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Notes (Optional)</label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={2}
                  placeholder="Additional expense details..."
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-750 rounded-lg outline-none text-slate-900 dark:text-white text-sm resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2 text-sm text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg font-medium transition-colors"
                >
                  {isSaving ? 'Saving...' : 'Save Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Simple Helper Icon component inside the page
function XIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}
