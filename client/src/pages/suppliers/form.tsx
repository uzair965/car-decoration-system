import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useForm as useReactHookForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import api from '../../api/axios';
import { toast } from 'sonner';

const supplierSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().min(5, 'Phone is required'),
  company: z.string().optional(),
  address: z.string().optional(),
  isActive: z.boolean().default(true),
});

type SupplierFormValues = z.infer<typeof supplierSchema>;

export default function SupplierFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = Boolean(id);
  const [isSaving, setIsSaving] = useState(false);

  const { register, handleSubmit, setValue, formState: { errors } } = useReactHookForm<SupplierFormValues>({
    resolver: zodResolver(supplierSchema),
    defaultValues: {
      isActive: true,
    }
  });

  useEffect(() => {
    if (isEditing) {
      const fetchSupplier = async () => {
        try {
          const response = await api.get(`/suppliers/${id}`);
          const s = response.data.data;
          setValue('name', s.name);
          setValue('email', s.email || '');
          setValue('phone', s.phone);
          setValue('company', s.company || '');
          setValue('address', s.address || '');
          setValue('isActive', s.isActive);
        } catch (error) {
          toast.error('Failed to load supplier details');
          navigate('/suppliers');
        }
      };
      fetchSupplier();
    }
  }, [id, isEditing, setValue, navigate]);

  const onSubmit = async (data: SupplierFormValues) => {
    try {
      setIsSaving(true);
      if (isEditing) {
        await api.put(`/suppliers/${id}`, data);
        toast.success('Supplier updated successfully');
      } else {
        await api.post('/suppliers', data);
        toast.success('Supplier created successfully');
      }
      navigate('/suppliers');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save supplier');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate('/suppliers')}
          className="p-2 bg-white dark:bg-slate-900 rounded-xl shadow-sm ring-1 ring-slate-200 dark:ring-slate-800 text-slate-500 hover:text-indigo-600 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            {isEditing ? 'Edit Supplier' : 'New Supplier'}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {isEditing ? 'Update supplier details below' : 'Add a new vendor or supplier'}
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm ring-1 ring-slate-200 dark:ring-slate-800 p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Contact Name *
              </label>
              <input
                {...register('name')}
                type="text"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                placeholder="e.g., John Doe"
              />
              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Company Name
              </label>
              <input
                {...register('company')}
                type="text"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                placeholder="e.g., Auto Parts Inc."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Phone Number *
              </label>
              <input
                {...register('phone')}
                type="text"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                placeholder="+1 234 567 8900"
              />
              {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Email Address
              </label>
              <input
                {...register('email')}
                type="email"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                placeholder="john@example.com"
              />
              {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Address
              </label>
              <textarea
                {...register('address')}
                rows={3}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                placeholder="Physical address"
              />
            </div>

            <div className="md:col-span-2 flex items-center gap-3">
              <input
                {...register('isActive')}
                type="checkbox"
                id="isActive"
                className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 cursor-pointer"
              />
              <label htmlFor="isActive" className="text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                Active Vendor
              </label>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-70"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {isSaving ? 'Saving...' : 'Save Supplier'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
