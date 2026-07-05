import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useForm as useReactHookForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Save, Loader2, Info } from 'lucide-react';
import api from '../../api/axios';
import { toast } from 'sonner';

const productSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  sku: z.string().min(2, 'SKU is required'),
  barcode: z.string().optional().nullable().or(z.literal('')),
  description: z.string().optional().nullable().or(z.literal('')),
  purchasePrice: z.coerce.number().min(0),
  sellingPrice: z.coerce.number().min(0),
  quantity: z.coerce.number().min(0).optional().default(0),
  minQuantity: z.coerce.number().min(0).optional().default(5),
  categoryId: z.string().min(1, 'Category is required'),
  subcategoryId: z.string().optional().nullable().or(z.literal('')),
  productType: z.enum(['Universal', 'VehicleSpecific', 'Service']).default('Universal'),
  vehicleBrand: z.string().optional().nullable().or(z.literal('')),
  vehicleModel: z.string().optional().nullable().or(z.literal('')),
  yearFrom: z.coerce.number().optional().nullable().or(z.literal('')),
  yearTo: z.coerce.number().optional().nullable().or(z.literal('')),
  brandId: z.string().optional().nullable().or(z.literal('')),
  supplierId: z.string().optional().nullable().or(z.literal('')),
  isActive: z.boolean().default(true),
});

type ProductFormValues = z.infer<typeof productSchema>;

interface Attribute {
  id: string;
  name: string;
  type: 'Text' | 'Number' | 'Dropdown' | 'YesNo' | 'Date';
  dropdownOptions?: string | null;
  displayOrder: number;
}

export default function ProductFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = Boolean(id);
  
  const [isSaving, setIsSaving] = useState(false);
  const [categories, setCategories] = useState<{id: string, name: string}[]>([]);
  const [subcategories, setSubcategories] = useState<{id: string, name: string, attributes: Attribute[]}[]>([]);
  const [brands, setBrands] = useState<{id: string, name: string}[]>([]);
  const [suppliers, setSuppliers] = useState<{id: string, name: string, company: string | null}[]>([]);
  
  const [activeAttributes, setActiveAttributes] = useState<Attribute[]>([]);
  const [customAttributes, setCustomAttributes] = useState<{ [key: string]: string }>({});

  const { register, handleSubmit, setValue, formState: { errors }, watch } = useReactHookForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      isActive: true,
      productType: 'Universal',
      quantity: 0,
      minQuantity: 5,
      purchasePrice: 0,
      sellingPrice: 0,
    }
  });

  const selectedCategoryId = watch('categoryId');
  const selectedSubcategoryId = watch('subcategoryId');
  const selectedProductType = watch('productType');

  // Fetch dropdown data on load
  useEffect(() => {
    const fetchDropdowns = async () => {
      try {
        const [catRes, brandRes, supRes] = await Promise.all([
          api.get('/categories'),
          api.get('/brands'),
          api.get('/suppliers')
        ]);
        setCategories(catRes.data.data.filter((c: any) => c.isActive));
        setBrands(brandRes.data.data.filter((b: any) => b.isActive));
        setSuppliers(supRes.data.data.filter((s: any) => s.isActive));
      } catch (error) {
        toast.error('Failed to load dropdown data');
      }
    };
    fetchDropdowns();
  }, []);

  // Fetch subcategories when Category changes
  useEffect(() => {
    if (selectedCategoryId) {
      const fetchSubcategories = async () => {
        try {
          const response = await api.get(`/categories/${selectedCategoryId}/subcategories`);
          setSubcategories(response.data.data);
        } catch (error) {
          toast.error('Failed to load subcategories for selected category');
        }
      };
      fetchSubcategories();
    } else {
      setSubcategories([]);
    }
  }, [selectedCategoryId]);

  // Load attribute template when Subcategory changes
  useEffect(() => {
    if (selectedSubcategoryId && subcategories.length > 0) {
      const sub = subcategories.find(s => s.id === selectedSubcategoryId);
      if (sub) {
        setActiveAttributes(sub.attributes || []);
        // Reset customAttributes to only keep values for active attributes
        setCustomAttributes(prev => {
          const next: { [key: string]: string } = {};
          sub.attributes.forEach(attr => {
            if (prev[attr.id]) {
              next[attr.id] = prev[attr.id];
            }
          });
          return next;
        });
      } else {
        setActiveAttributes([]);
        setCustomAttributes({});
      }
    } else {
      setActiveAttributes([]);
      setCustomAttributes({});
    }
  }, [selectedSubcategoryId, subcategories]);

  // Load product details if editing
  useEffect(() => {
    if (isEditing && categories.length > 0) {
      const fetchProduct = async () => {
        try {
          const response = await api.get(`/products/${id}`);
          const p = response.data.data;
          
          // First set basic fields
          Object.keys(p).forEach(key => {
            if (
              key !== 'category' && 
              key !== 'subcategory' && 
              key !== 'brand' && 
              key !== 'supplier' && 
              key !== 'attributeValues' &&
              key !== 'createdAt' && 
              key !== 'updatedAt'
            ) {
              setValue(key as keyof ProductFormValues, p[key] ?? '');
            }
          });

          // Fetch matching subcategories for the product's category to populate the dropdown
          if (p.categoryId) {
            const subRes = await api.get(`/categories/${p.categoryId}/subcategories`);
            setSubcategories(subRes.data.data);
            
            // Set subcategory ID
            if (p.subcategoryId) {
              setValue('subcategoryId', p.subcategoryId);
              
              // Load active attributes from fetched subcategories list
              const sub = subRes.data.data.find((s: any) => s.id === p.subcategoryId);
              if (sub) {
                setActiveAttributes(sub.attributes || []);
              }
            }
          }

          // Populate custom attribute values
          if (p.attributeValues) {
            const valuesMap: { [key: string]: string } = {};
            p.attributeValues.forEach((val: any) => {
              valuesMap[val.attributeId] = val.value;
            });
            setCustomAttributes(valuesMap);
          }

        } catch (error) {
          toast.error('Failed to load product details');
          navigate('/products');
        }
      };
      fetchProduct();
    }
  }, [id, isEditing, setValue, navigate, categories]);

  const handleCustomAttributeChange = (attrId: string, value: string) => {
    setCustomAttributes(prev => ({
      ...prev,
      [attrId]: value,
    }));
  };

  const onSubmit = async (data: ProductFormValues) => {
    try {
      setIsSaving(true);

      // Map dynamic specifications
      const attributeValuesPayload = Object.entries(customAttributes)
        .filter(([_, val]) => val !== undefined && val !== '')
        .map(([attrId, val]) => ({
          attributeId: attrId,
          value: String(val),
        }));

      // Adjust payload based on Product Type
      let finalData = {
        ...data,
        brandId: data.brandId || null,
        supplierId: data.supplierId || null,
        subcategoryId: data.subcategoryId || null,
        yearFrom: data.yearFrom ? Number(data.yearFrom) : null,
        yearTo: data.yearTo ? Number(data.yearTo) : null,
        attributeValues: attributeValuesPayload,
      };

      if (data.productType === 'Universal') {
        finalData.vehicleBrand = null;
        finalData.vehicleModel = null;
        finalData.yearFrom = null;
        finalData.yearTo = null;
      } else if (data.productType === 'Service') {
        finalData.quantity = 0;
        finalData.minQuantity = 0;
        finalData.barcode = null;
        finalData.vehicleBrand = null;
        finalData.vehicleModel = null;
        finalData.yearFrom = null;
        finalData.yearTo = null;
      }

      if (isEditing) {
        await api.put(`/products/${id}`, finalData);
        toast.success('Product updated successfully');
      } else {
        await api.post('/products', finalData);
        toast.success('Product created successfully');
      }
      navigate('/products');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save product');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate('/products')}
          className="p-2 bg-white dark:bg-slate-900 rounded-xl shadow-sm ring-1 ring-slate-200 dark:ring-slate-800 text-slate-500 hover:text-indigo-600 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            {isEditing ? 'Edit Product' : 'New Product'}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {isEditing ? 'Update product details below' : 'Add a new item to your inventory'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        
        {/* 1. Basic Info */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm ring-1 ring-slate-200 dark:ring-slate-800 p-6">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4 border-b pb-2 dark:border-slate-800">
            Basic Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-350 mb-1.5">Product Name *</label>
              <input {...register('name')} type="text" className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-705 text-slate-900 dark:text-white rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition-all" placeholder="e.g. 9D Floor Mats" />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-350 mb-1.5">SKU *</label>
              <input {...register('sku')} type="text" className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-705 text-slate-900 dark:text-white rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition-all" placeholder="e.g. MAT-TOY-001" />
              {errors.sku && <p className="text-red-500 text-xs mt-1">{errors.sku.message}</p>}
            </div>

            {selectedProductType !== 'Service' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-350 mb-1.5">Barcode (Optional)</label>
                <input {...register('barcode')} type="text" className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-705 text-slate-900 dark:text-white rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition-all" />
              </div>
            )}

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-350 mb-1.5">Description</label>
              <textarea {...register('description')} rows={3} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-705 text-slate-900 dark:text-white rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition-all resize-none" />
            </div>
          </div>
        </div>

        {/* 2. Product Classification & Vehicle Specific (Universal / VehicleSpecific / Service) */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm ring-1 ring-slate-200 dark:ring-slate-800 p-6">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4 border-b pb-2 dark:border-slate-800">
            Product Type & Compatibility
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-350 mb-1.5">Product Type *</label>
              <select 
                {...register('productType')} 
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-705 text-slate-900 dark:text-white rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500 text-sm cursor-pointer"
              >
                <option value="Universal">Universal</option>
                <option value="VehicleSpecific">Vehicle Specific</option>
                <option value="Service">Service</option>
              </select>
            </div>

            {/* Vehicle Compatibility Fields */}
            {selectedProductType === 'VehicleSpecific' && (
              <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 animate-scale-in">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-350 mb-1.5">Vehicle Brand *</label>
                  <input {...register('vehicleBrand')} type="text" className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-indigo-500 outline-none" placeholder="e.g. Toyota" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-350 mb-1.5">Vehicle Model *</label>
                  <input {...register('vehicleModel')} type="text" className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-indigo-500 outline-none" placeholder="e.g. Corolla" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-350 mb-1.5">Year From *</label>
                  <input {...register('yearFrom')} type="number" className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-indigo-500 outline-none" placeholder="2018" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-350 mb-1.5">Year To *</label>
                  <input {...register('yearTo')} type="number" className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-indigo-500 outline-none" placeholder="2023" />
                </div>
              </div>
            )}
            
            {selectedProductType === 'Service' && (
              <div className="flex gap-2 p-3 bg-indigo-500/5 rounded-xl border border-indigo-550/15 text-indigo-400 text-xs items-center leading-normal">
                <Info className="w-4.5 h-4.5 flex-shrink-0" />
                <span>Services do not require trackable vehicle metrics, barcodes, or inventory stock.</span>
              </div>
            )}
          </div>
        </div>

        {/* 3. Pricing & Stock */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm ring-1 ring-slate-200 dark:ring-slate-800 p-6">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4 border-b pb-2 dark:border-slate-800">
            Pricing & Inventory
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-350 mb-1.5">Purchase Price (Rs. ) *</label>
              <input {...register('purchasePrice')} type="number" step="0.01" className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-705 text-slate-900 dark:text-white rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition-all" />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-350 mb-1.5">Selling Price (Rs. ) *</label>
              <input {...register('sellingPrice')} type="number" step="0.01" className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-705 text-slate-900 dark:text-white rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition-all" />
            </div>

            {selectedProductType !== 'Service' && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-350 mb-1.5">Current Stock *</label>
                  <input {...register('quantity')} type="number" className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-705 text-slate-900 dark:text-white rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition-all" />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-350 mb-1.5">Low Stock Alert Quantity *</label>
                  <input {...register('minQuantity')} type="number" className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-705 text-slate-900 dark:text-white rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition-all" />
                </div>
              </>
            )}
          </div>
        </div>

        {/* 4. Organization */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm ring-1 ring-slate-200 dark:ring-slate-800 p-6">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4 border-b pb-2 dark:border-slate-800">
            Organization
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-350 mb-1.5">Category *</label>
              <select {...register('categoryId')} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-705 text-slate-900 dark:text-white rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500 text-sm cursor-pointer transition-all">
                <option value="">Select Category</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              {errors.categoryId && <p className="text-red-500 text-xs mt-1">{errors.categoryId.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-350 mb-1.5">Subcategory</label>
              <select {...register('subcategoryId')} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-705 text-slate-900 dark:text-white rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500 text-sm cursor-pointer transition-all">
                <option value="">Select Subcategory</option>
                {subcategories.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-350 mb-1.5">Brand</label>
              <select {...register('brandId')} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-705 text-slate-900 dark:text-white rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500 text-sm cursor-pointer transition-all">
                <option value="">Select Brand</option>
                {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-350 mb-1.5">Preferred Supplier</label>
              <select {...register('supplierId')} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-705 text-slate-900 dark:text-white rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500 text-sm cursor-pointer transition-all">
                <option value="">Select Supplier</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name} {s.company ? `(${s.company})` : ''}</option>)}
              </select>
            </div>

            <div className="md:col-span-2 flex items-center gap-3 mt-4">
              <input {...register('isActive')} type="checkbox" id="isActive" className="w-4 h-4 text-indigo-650 rounded focus:ring-indigo-550 cursor-pointer" />
              <label htmlFor="isActive" className="text-xs font-semibold text-slate-700 dark:text-slate-350 cursor-pointer">Active (available for sale)</label>
            </div>
          </div>
        </div>

        {/* 5. Dynamic Specifications Template Fields */}
        {activeAttributes.length > 0 && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm ring-1 ring-slate-200 dark:ring-slate-800 p-6 animate-scale-in">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4 border-b pb-2 dark:border-slate-800">
              Specifications
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeAttributes.map((attr) => {
                const val = customAttributes[attr.id] || '';
                
                return (
                  <div key={attr.id}>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-350 mb-1.5">
                      {attr.name}
                    </label>

                    {/* Text Attribute Type */}
                    {attr.type === 'Text' && (
                      <input
                        type="text"
                        value={val}
                        onChange={(e) => handleCustomAttributeChange(attr.id, e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-705 text-slate-900 dark:text-white rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none text-sm transition-all"
                        placeholder={`Enter ${attr.name.toLowerCase()}`}
                      />
                    )}

                    {/* Number Attribute Type */}
                    {attr.type === 'Number' && (
                      <input
                        type="number"
                        value={val}
                        onChange={(e) => handleCustomAttributeChange(attr.id, e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-705 text-slate-900 dark:text-white rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none text-sm transition-all"
                        placeholder={`Enter number`}
                      />
                    )}

                    {/* Dropdown Attribute Type */}
                    {attr.type === 'Dropdown' && (
                      <select
                        value={val}
                        onChange={(e) => handleCustomAttributeChange(attr.id, e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-705 text-slate-900 dark:text-white rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none text-sm cursor-pointer transition-all"
                      >
                        <option value="">Select Option</option>
                        {attr.dropdownOptions?.split(',').map((opt) => {
                          const optionText = opt.trim();
                          return (
                            <option key={optionText} value={optionText}>
                              {optionText}
                            </option>
                          );
                        })}
                      </select>
                    )}

                    {/* YesNo Attribute Type */}
                    {attr.type === 'YesNo' && (
                      <select
                        value={val}
                        onChange={(e) => handleCustomAttributeChange(attr.id, e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-705 text-slate-900 dark:text-white rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none text-sm cursor-pointer transition-all"
                      >
                        <option value="">Select Option</option>
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                      </select>
                    )}

                    {/* Date Attribute Type */}
                    {attr.type === 'Date' && (
                      <input
                        type="date"
                        value={val}
                        onChange={(e) => handleCustomAttributeChange(attr.id, e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-705 text-slate-900 dark:text-white rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none text-sm transition-all"
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl font-bold transition-all disabled:opacity-70 shadow-sm cursor-pointer"
          >
            {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            {isSaving ? 'Saving...' : 'Save Product'}
          </button>
        </div>
      </form>
    </div>
  );
}
