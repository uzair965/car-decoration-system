import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Save } from 'lucide-react';
import api from '../../api/axios';
import { toast } from 'sonner';

const customerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().min(10, 'Phone must be at least 10 characters'),
  address: z.string().optional().or(z.literal('')),
});

type CustomerForm = z.infer<typeof customerSchema>;

export default function CustomerFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(isEditing);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CustomerForm>({
    resolver: zodResolver(customerSchema),
  });

  useEffect(() => {
    const fetchCustomer = async () => {
      if (!id) return;
      try {
        const response = await api.get(`/customers/${id}`);
        const customer = response.data.data;
        reset({
          name: customer.name,
          email: customer.email || '',
          phone: customer.phone,
          address: customer.address || '',
        });
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'Failed to fetch customer');
        navigate('/customers');
      } finally {
        setIsLoading(false);
      }
    };
    fetchCustomer();
  }, [id, reset, navigate]);

  const onSubmit = async (data: CustomerForm) => {
    try {
      setIsSaving(true);
      if (isEditing) {
        await api.put(`/customers/${id}`, data);
        toast.success('Customer updated successfully');
      } else {
        await api.post('/customers', data);
        toast.success('Customer created successfully');
      }
      navigate('/customers');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'An error occurred');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="animate-pulse h-96 bg-slate-100 dark:bg-slate-800 rounded-2xl"></div>;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate('/customers')}
          className="p-2 text-slate-500 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-slate-900 rounded-lg shadow-sm ring-1 ring-slate-200 dark:ring-slate-800 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            {isEditing ? 'Edit Customer' : 'Add New Customer'}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {isEditing ? 'Update customer details' : 'Register a new customer'}
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm ring-1 ring-slate-200 dark:ring-slate-800 p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              {...register('name')}
              className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white"
              placeholder="e.g. John Doe"
            />
            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <input
                {...register('phone')}
                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white"
                placeholder="0300 1234567"
              />
              {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Email Address
              </label>
              <input
                {...register('email')}
                type="email"
                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white"
                placeholder="john@example.com"
              />
              {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Home/Work Address
            </label>
            <textarea
              {...register('address')}
              rows={3}
              className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white resize-none"
              placeholder="Full address details"
            />
            {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address.message}</p>}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => navigate('/customers')}
              className="px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Saving...' : 'Save Customer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
