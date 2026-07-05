import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useForm as useReactHookForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import api from '../../api/axios';
import { toast } from 'sonner';

const brandSchema = z.object({
  name: z.string().min(2, 'Name is required (min 2 chars)'),
  slug: z.string().min(2, 'Slug is required'),
  description: z.string().optional(),
  logo: z.string().optional(),
  isActive: z.boolean().default(true),
});

type BrandFormValues = z.infer<typeof brandSchema>;

export default function BrandFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = Boolean(id);
  const [isSaving, setIsSaving] = useState(false);

  const { register, handleSubmit, setValue, formState: { errors }, watch } = useReactHookForm<BrandFormValues>({
    resolver: zodResolver(brandSchema),
    defaultValues: {
      isActive: true,
    }
  });

  const nameValue = watch('name');

  useEffect(() => {
    if (!isEditing && nameValue) {
      setValue('slug', nameValue.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''));
    }
  }, [nameValue, isEditing, setValue]);

  useEffect(() => {
    if (isEditing) {
      const fetchBrand = async () => {
        try {
          const response = await api.get(`/brands/${id}`);
          const b = response.data.data;
          setValue('name', b.name);
          setValue('slug', b.slug);
          setValue('description', b.description || '');
          setValue('isActive', b.isActive);
        } catch (error) {
          toast.error('Failed to load brand details');
          navigate('/brands');
        }
      };
      fetchBrand();
    }
  }, [id, isEditing, setValue, navigate]);

  const onSubmit = async (data: BrandFormValues) => {
    try {
      setIsSaving(true);
      if (isEditing) {
        await api.put(`/brands/${id}`, data);
        toast.success('Brand updated successfully');
      } else {
        await api.post('/brands', data);
        toast.success('Brand created successfully');
      }
      navigate('/brands');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save brand');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate('/brands')}
          className="p-2 bg-white dark:bg-slate-900 rounded-xl shadow-sm ring-1 ring-slate-200 dark:ring-slate-800 text-slate-500 hover:text-indigo-600 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            {isEditing ? 'Edit Brand' : 'New Brand'}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {isEditing ? 'Update brand details below' : 'Add a new product brand'}
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm ring-1 ring-slate-200 dark:ring-slate-800 p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Brand Name *
              </label>
              <input
                {...register('name')}
                type="text"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                placeholder="e.g., Pioneer"
              />
              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                URL Slug *
              </label>
              <input
                {...register('slug')}
                type="text"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                placeholder="e.g., pioneer"
              />
              {errors.slug && <p className="text-red-500 text-sm mt-1">{errors.slug.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Description
              </label>
              <textarea
                {...register('description')}
                rows={3}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                placeholder="Optional description"
              />
            </div>

            <div className="flex items-center gap-3">
              <input
                {...register('isActive')}
                type="checkbox"
                id="isActive"
                className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 cursor-pointer"
              />
              <label htmlFor="isActive" className="text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                Active (visible in store)
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
              {isSaving ? 'Saving...' : 'Save Brand'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
