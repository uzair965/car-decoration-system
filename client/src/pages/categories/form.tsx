import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useForm as useReactHookForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  ArrowLeft, 
  Save, 
  Loader2, 
  Plus, 
  Trash2, 
  Edit2, 
  ArrowUp, 
  ArrowDown, 
  X, 
  ListPlus,
  Settings
} from 'lucide-react';
import api from '../../api/axios';
import { toast } from 'sonner';

const categorySchema = z.object({
  name: z.string().min(2, 'Name is required (min 2 chars)'),
  slug: z.string().min(2, 'Slug is required'),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
});

type CategoryFormValues = z.infer<typeof categorySchema>;

interface Attribute {
  id?: string;
  name: string;
  type: 'Text' | 'Number' | 'Dropdown' | 'YesNo' | 'Date';
  dropdownOptions?: string | null;
  displayOrder: number;
}

interface Subcategory {
  id: string;
  name: string;
  attributes: Attribute[];
}

export default function CategoryFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = Boolean(id);
  const [isSaving, setIsSaving] = useState(false);

  // Subcategories management state
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [isFetchingSubcategories, setIsFetchingSubcategories] = useState(false);
  const [editingSubcategory, setEditingSubcategory] = useState<Partial<Subcategory> | null>(null);
  const [subName, setSubName] = useState('');
  const [subAttributes, setSubAttributes] = useState<Attribute[]>([]);
  const [isSavingSubcategory, setIsSavingSubcategory] = useState(false);

  const { register, handleSubmit, setValue, formState: { errors }, watch } = useReactHookForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      isActive: true,
    }
  });

  const nameValue = watch('name');

  // Auto-generate slug from name if not editing
  useEffect(() => {
    if (!isEditing && nameValue) {
      setValue('slug', nameValue.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''));
    }
  }, [nameValue, isEditing, setValue]);

  // Fetch Category
  useEffect(() => {
    if (isEditing) {
      const fetchCategory = async () => {
        try {
          const response = await api.get(`/categories/${id}`);
          const cat = response.data.data;
          setValue('name', cat.name);
          setValue('slug', cat.slug);
          setValue('description', cat.description || '');
          setValue('isActive', cat.isActive);
        } catch (error) {
          toast.error('Failed to load category details');
          navigate('/categories');
        }
      };
      fetchCategory();
      fetchSubcategories();
    }
  }, [id, isEditing, setValue, navigate]);

  // Fetch Subcategories
  const fetchSubcategories = async () => {
    if (!id) return;
    try {
      setIsFetchingSubcategories(true);
      const response = await api.get(`/categories/${id}/subcategories`);
      setSubcategories(response.data.data);
    } catch (error) {
      toast.error('Failed to load subcategories');
    } finally {
      setIsFetchingSubcategories(false);
    }
  };

  const onSubmit = async (data: CategoryFormValues) => {
    try {
      setIsSaving(true);
      if (isEditing) {
        await api.put(`/categories/${id}`, data);
        toast.success('Category updated successfully');
      } else {
        const response = await api.post('/categories', data);
        toast.success('Category created successfully');
        // If creating new, redirect to edit page to allow adding subcategories
        navigate(`/categories/${response.data.data.id}/edit`);
        return;
      }
      navigate('/categories');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save category');
    } finally {
      setIsSaving(false);
    }
  };

  // ==================================================
  // Subcategory Operations
  // ==================================================
  const handleOpenAddSubcategory = () => {
    setEditingSubcategory({});
    setSubName('');
    setSubAttributes([]);
  };

  const handleOpenEditSubcategory = (sub: Subcategory) => {
    setEditingSubcategory(sub);
    setSubName(sub.name);
    setSubAttributes([...sub.attributes]);
  };

  const handleAddAttributeField = () => {
    const nextOrder = subAttributes.length + 1;
    setSubAttributes([
      ...subAttributes,
      {
        name: '',
        type: 'Text',
        dropdownOptions: '',
        displayOrder: nextOrder,
      }
    ]);
  };

  const handleAttributeChange = (index: number, field: keyof Attribute, value: any) => {
    const updated = [...subAttributes];
    updated[index] = { ...updated[index], [field]: value };
    setSubAttributes(updated);
  };

  const handleRemoveAttributeField = (index: number) => {
    const updated = subAttributes.filter((_, i) => i !== index).map((attr, i) => ({
      ...attr,
      displayOrder: i + 1,
    }));
    setSubAttributes(updated);
  };

  const handleMoveAttribute = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === subAttributes.length - 1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const updated = [...subAttributes];
    
    // Swap items
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;

    // Fix display orders
    const final = updated.map((attr, i) => ({
      ...attr,
      displayOrder: i + 1,
    }));

    setSubAttributes(final);
  };

  const handleSaveSubcategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subName.trim()) {
      toast.error('Subcategory name is required');
      return;
    }

    // Verify attributes
    for (const attr of subAttributes) {
      if (!attr.name.trim()) {
        toast.error('All attribute names are required');
        return;
      }
      if (attr.type === 'Dropdown' && (!attr.dropdownOptions || !attr.dropdownOptions.trim())) {
        toast.error(`Please provide options for dropdown attribute "${attr.name}"`);
        return;
      }
    }

    try {
      setIsSavingSubcategory(true);
      const payload = {
        name: subName,
        attributes: subAttributes.map(attr => ({
          id: attr.id,
          name: attr.name.trim(),
          type: attr.type,
          dropdownOptions: attr.type === 'Dropdown' ? attr.dropdownOptions : null,
          displayOrder: attr.displayOrder,
        })),
      };

      if (editingSubcategory?.id) {
        // Update
        await api.put(`/categories/${id}/subcategories/${editingSubcategory.id}`, payload);
        toast.success('Subcategory template updated successfully');
      } else {
        // Create
        await api.post(`/categories/${id}/subcategories`, payload);
        toast.success('Subcategory template created successfully');
      }

      setEditingSubcategory(null);
      fetchSubcategories();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save subcategory');
    } finally {
      setIsSavingSubcategory(false);
    }
  };

  const handleDeleteSubcategory = async (subId: string) => {
    if (!window.confirm('Are you sure you want to delete this subcategory? This will delete all attributes templates.')) return;
    try {
      await api.delete(`/categories/${id}/subcategories/${subId}`);
      toast.success('Subcategory deleted successfully');
      fetchSubcategories();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete subcategory');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate('/categories')}
          className="p-2 bg-white dark:bg-slate-900 rounded-xl shadow-sm ring-1 ring-slate-200 dark:ring-slate-800 text-slate-500 hover:text-indigo-600 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            {isEditing ? 'Edit Category' : 'New Category'}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {isEditing ? 'Update category details and manage subcategory specifications templates' : 'Add a new product category'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Category Main Details Form */}
        <div className="lg:col-span-1 bg-white dark:bg-slate-900 rounded-2xl shadow-sm ring-1 ring-slate-200 dark:ring-slate-800 p-6 self-start">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4 border-b pb-2 dark:border-slate-800">
            Category Details
          </h3>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-350 mb-1.5">
                  Category Name *
                </label>
                <input
                  {...register('name')}
                  type="text"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-705 text-slate-900 dark:text-white rounded-lg px-3.5 py-2 focus:ring-2 focus:ring-indigo-500 outline-none text-sm transition-all"
                  placeholder="e.g., Lighting"
                />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-350 mb-1.5">
                  URL Slug *
                </label>
                <input
                  {...register('slug')}
                  type="text"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-705 text-slate-900 dark:text-white rounded-lg px-3.5 py-2 focus:ring-2 focus:ring-indigo-500 outline-none text-sm transition-all"
                  placeholder="e.g., lighting"
                />
                {errors.slug && <p className="text-red-500 text-xs mt-1">{errors.slug.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-350 mb-1.5">
                  Description
                </label>
                <textarea
                  {...register('description')}
                  rows={3}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-705 text-slate-900 dark:text-white rounded-lg px-3.5 py-2 focus:ring-2 focus:ring-indigo-500 outline-none text-sm transition-all resize-none"
                  placeholder="Optional description..."
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  {...register('isActive')}
                  type="checkbox"
                  id="isActive"
                  className="w-4 h-4 text-indigo-650 rounded focus:ring-indigo-550 cursor-pointer"
                />
                <label htmlFor="isActive" className="text-xs font-semibold text-slate-750 dark:text-slate-300 cursor-pointer">
                  Active
                </label>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                type="submit"
                disabled={isSaving}
                className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-bold text-sm transition-colors disabled:opacity-70 cursor-pointer"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {isSaving ? 'Saving...' : 'Save Category'}
              </button>
            </div>
          </form>
        </div>

        {/* Subcategories & Attribute Templates Section */}
        <div className="lg:col-span-2 space-y-6">
          {!isEditing ? (
            <div className="bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-8 text-center">
              <Settings className="w-8 h-8 text-slate-400 mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                Please save the category first before adding subcategory attribute templates.
              </p>
            </div>
          ) : (
            <>
              {/* List of subcategories */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm ring-1 ring-slate-200 dark:ring-slate-800 p-6">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                      Subcategories & Attribute Templates
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">Define customized specifications templates for subcategories</p>
                  </div>
                  {!editingSubcategory && (
                    <button
                      type="button"
                      onClick={handleOpenAddSubcategory}
                      className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer"
                    >
                      <Plus className="w-4 h-4" /> Add Subcategory
                    </button>
                  )}
                </div>

                {isFetchingSubcategories ? (
                  <div className="animate-pulse space-y-3">
                    {[1, 2].map((i) => (
                      <div key={i} className="h-14 bg-slate-100 dark:bg-slate-800 rounded-xl"></div>
                    ))}
                  </div>
                ) : subcategories.length === 0 ? (
                  <div className="text-center py-6 text-xs text-slate-500">
                    No subcategories created yet. Add one to define its specifications template.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {subcategories.map((sub) => (
                      <div 
                        key={sub.id} 
                        className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200/50 dark:border-slate-850"
                      >
                        <div>
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white">{sub.name}</h4>
                          <div className="flex flex-wrap gap-1.5 mt-1.5">
                            {sub.attributes.length === 0 ? (
                              <span className="text-[10px] text-slate-400">No specifications defined</span>
                            ) : (
                              sub.attributes.map((attr) => (
                                <span 
                                  key={attr.id || attr.name} 
                                  className="px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-500/10 text-indigo-650 dark:text-indigo-400 text-[10px] font-semibold border border-indigo-100/50 dark:border-indigo-500/20"
                                >
                                  {attr.name} ({attr.type})
                                </span>
                              ))
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenEditSubcategory(sub)}
                            className="p-1.5 bg-white hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-850 border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-indigo-600 rounded-lg transition-colors cursor-pointer"
                            title="Edit Subcategory attributes"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteSubcategory(sub.id)}
                            className="p-1.5 bg-white hover:bg-red-50 dark:bg-slate-900 dark:hover:bg-red-950/20 border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-red-600 rounded-lg transition-colors cursor-pointer"
                            title="Delete Subcategory"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Add / Edit Subcategory Form Drawer (renders inside card) */}
              {editingSubcategory && (
                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm ring-1 ring-slate-200 dark:ring-slate-800 p-6 animate-scale-in">
                  <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800 mb-6">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                      <ListPlus className="w-4.5 h-4.5 text-indigo-500" />
                      {editingSubcategory.id ? 'Edit Subcategory Template' : 'Add Subcategory Template'}
                    </h3>
                    <button
                      type="button"
                      onClick={() => setEditingSubcategory(null)}
                      className="text-slate-400 hover:text-slate-655 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
                    >
                      <X className="w-4.5 h-4.5" />
                    </button>
                  </div>

                  <form onSubmit={handleSaveSubcategory} className="space-y-6">
                    {/* Subcategory Name */}
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                        Subcategory Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={subName}
                        onChange={(e) => setSubName(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-705 text-slate-900 dark:text-white rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none text-sm transition-all"
                        placeholder="e.g., Floor Mats"
                      />
                    </div>

                    {/* Specifications Attributes Creator */}
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                          Specifications / Attributes
                        </label>
                        <button
                          type="button"
                          onClick={handleAddAttributeField}
                          className="flex items-center gap-1 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 px-2 py-1 rounded text-xs font-bold transition-all cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" /> Add Attribute
                        </button>
                      </div>

                      {subAttributes.length === 0 ? (
                        <div className="text-center py-6 text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                          No custom specifications attributes added yet. Click "Add Attribute" to build your template.
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                          {subAttributes.map((attr, index) => (
                            <div 
                              key={index}
                              className="flex items-start gap-2.5 p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800/80 animate-fade-in"
                            >
                              {/* Reorder arrows */}
                              <div className="flex flex-col gap-1 mt-1">
                                <button
                                  type="button"
                                  disabled={index === 0}
                                  onClick={() => handleMoveAttribute(index, 'up')}
                                  className="p-0.5 text-slate-450 hover:text-indigo-500 disabled:opacity-30 cursor-pointer"
                                >
                                  <ArrowUp className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  disabled={index === subAttributes.length - 1}
                                  onClick={() => handleMoveAttribute(index, 'down')}
                                  className="p-0.5 text-slate-450 hover:text-indigo-500 disabled:opacity-30 cursor-pointer"
                                >
                                  <ArrowDown className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-3">
                                {/* Attribute Name */}
                                <div className="md:col-span-5">
                                  <input
                                    type="text"
                                    required
                                    value={attr.name}
                                    onChange={(e) => handleAttributeChange(index, 'name', e.target.value)}
                                    placeholder="Attribute Name (e.g. Color)"
                                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-indigo-500 outline-none"
                                  />
                                </div>

                                {/* Attribute Type */}
                                <div className="md:col-span-3">
                                  <select
                                    value={attr.type}
                                    onChange={(e) => handleAttributeChange(index, 'type', e.target.value)}
                                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-lg px-2 py-2 text-xs focus:ring-1 focus:ring-indigo-500 outline-none cursor-pointer"
                                  >
                                    <option value="Text">Text</option>
                                    <option value="Number">Number</option>
                                    <option value="Dropdown">Dropdown</option>
                                    <option value="YesNo">Yes/No</option>
                                    <option value="Date">Date</option>
                                  </select>
                                </div>

                                {/* Dropdown options (rendered if type is Dropdown) */}
                                <div className="md:col-span-4">
                                  {attr.type === 'Dropdown' ? (
                                    <input
                                      type="text"
                                      required
                                      value={attr.dropdownOptions || ''}
                                      onChange={(e) => handleAttributeChange(index, 'dropdownOptions', e.target.value)}
                                      placeholder="Options (comma separated, e.g. PVC,5D,7D)"
                                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-indigo-500 outline-none"
                                    />
                                  ) : (
                                    <div className="h-8 flex items-center text-[10px] text-slate-450 italic pl-1">
                                      Single input value field
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Delete attribute button */}
                              <button
                                type="button"
                                onClick={() => handleRemoveAttributeField(index)}
                                className="p-2 text-slate-450 hover:text-red-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-850 mt-0.5 transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => setEditingSubcategory(null)}
                        className="px-4 py-2 bg-slate-100 dark:bg-slate-850 text-slate-655 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg text-xs font-bold cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSavingSubcategory}
                        className="flex items-center gap-1.5 bg-indigo-650 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg text-xs font-bold transition-all disabled:opacity-75 cursor-pointer"
                      >
                        {isSavingSubcategory ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                        {isSavingSubcategory ? 'Saving Template...' : 'Save Subcategory Template'}
                      </button>
                    </div>

                  </form>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
