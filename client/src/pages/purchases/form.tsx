import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { ArrowLeft, Save, Plus, Minus, Trash2, Search, X } from 'lucide-react';
import api from '../../api/axios';
import { toast } from 'sonner';

interface Product { 
  id: string; 
  name: string; 
  sku: string; 
  purchasePrice: number; 
  quantity: number;
  categoryId: string;
  productType?: 'Universal' | 'VehicleSpecific' | 'Service';
  vehicleBrand?: string | null;
  vehicleModel?: string | null;
  compatibleCars?: string | null;
  brand?: { name: string } | null;
  category?: { name: string } | null;
}
interface Supplier { id: string; name: string }
interface Category { id: string; name: string }

export default function PurchaseFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;
  
  const [isSaving, setIsSaving] = useState(false);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  
  // Catalog Modal state
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const [catalogSearch, setCatalogSearch] = useState('');
  const [selectedCategoryTab, setSelectedCategoryTab] = useState('all');

  // Form State
  const [supplierId, setSupplierId] = useState('');
  const [status, setStatus] = useState('Pending');
  const [items, setItems] = useState<{ productId: string; quantity: number; unitPrice: number }[]>([]);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [supRes, prodRes, catRes] = await Promise.all([
          api.get('/suppliers'),
          api.get('/products'),
          api.get('/categories')
        ]);
        setSuppliers(supRes.data.data);
        setProducts(prodRes.data.data);
        setCategories(catRes.data.data);

        if (isEditing) {
          const purRes = await api.get(`/purchases/${id}`);
          const pur = purRes.data.data;
          
          if (pur.status === 'Received') {
            toast.error('Cannot edit an already received purchase order');
            navigate('/purchases');
            return;
          }
          
          setSupplierId(pur.supplierId);
          setStatus(pur.status);
          setNotes(pur.notes || '');
          setItems(pur.items.map((item: any) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice
          })));
        }
      } catch (error) {
        toast.error('Failed to load form data');
      }
    };
    fetchData();
  }, [id, isEditing, navigate]);

  const handleAddProductFromCatalog = (product: Product) => {
    const existingIndex = items.findIndex(item => item.productId === product.id);
    if (existingIndex > -1) {
      // Increment quantity
      const newItems = [...items];
      newItems[existingIndex].quantity += 1;
      setItems(newItems);
      toast.success(`Incremented quantity of ${product.name}`);
    } else {
      // Add new item
      setItems([...items, { productId: product.id, quantity: 1, unitPrice: product.purchasePrice || 0 }]);
      toast.success(`Added ${product.name} to order`);
    }
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: string, value: string | number) => {
    const newItems = [...items];
    if (field === 'productId') {
      const product = products.find(p => p.id === value);
      newItems[index] = { ...newItems[index], productId: value as string, unitPrice: product?.purchasePrice || 0 };
    } else {
      newItems[index] = { ...newItems[index], [field]: Number(value) };
    }
    setItems(newItems);
  };

  const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  const total = subtotal;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierId) return toast.error('Please select a supplier');
    if (items.length === 0) return toast.error('Please add at least one product');
    if (items.some(i => !i.productId)) return toast.error('Please select a product for all items');

    try {
      setIsSaving(true);
      const payload = {
        supplierId,
        items,
        subtotal,
        discount: 0,
        tax: 0,
        total,
        paidAmount: 0,
        status,
        notes
      };

      if (isEditing) {
        await api.put(`/purchases/${id}`, payload);
        toast.success('Purchase order updated successfully');
      } else {
        await api.post('/purchases', payload);
        toast.success('Purchase order created successfully');
      }
      navigate('/purchases');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save purchase order');
    } finally {
      setIsSaving(false);
    }
  };

  // Filter products inside the catalog modal
  const filteredCatalogProducts = products.filter(p => {
    const query = catalogSearch.toLowerCase().trim();
    const matchesSearch = !query || 
      p.name.toLowerCase().includes(query) || 
      p.sku.toLowerCase().includes(query) ||
      (p.compatibleCars && p.compatibleCars.toLowerCase().includes(query)) ||
      (p.brand && p.brand.name.toLowerCase().includes(query)) ||
      (p.vehicleBrand && p.vehicleBrand.toLowerCase().includes(query)) ||
      (p.vehicleModel && p.vehicleModel.toLowerCase().includes(query));
      
    const matchesCategory = selectedCategoryTab === 'all' || p.categoryId === selectedCategoryTab;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm ring-1 ring-slate-200 dark:ring-slate-800">
        <div className="flex items-center gap-4">
          <button 
            type="button"
            onClick={() => navigate('/purchases')}
            className="p-2 text-slate-500 hover:text-slate-900 dark:hover:text-white bg-slate-50 dark:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              {isEditing ? 'Edit Purchase Order' : 'Create Purchase Order'}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">Plan stock refills and coordinate deliveries</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setIsCatalogOpen(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-bold text-xs transition-colors cursor-pointer shadow-sm animate-pulse"
        >
          <Plus className="w-4 h-4" /> Add Products
        </button>
      </div>

      <form onSubmit={onSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column: Purchase Items List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm ring-1 ring-slate-200 dark:ring-slate-800 min-h-[400px] flex flex-col">
            <h2 className="text-base font-bold text-slate-950 dark:text-white mb-4 border-b border-slate-100 dark:border-slate-800/80 pb-3">
              Order Items Refills
            </h2>

            <div className="flex-1 space-y-3 overflow-y-auto max-h-[600px] pr-2">
              {items.map((item, index) => {
                const product = products.find(p => p.id === item.productId);
                return (
                  <div key={index} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-3 bg-slate-50 dark:bg-slate-800/30 border border-slate-150 dark:border-slate-800/60 rounded-xl">
                    {/* Item Details */}
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-slate-900 dark:text-white text-xs truncate">
                        {product?.name || 'Loading details...'}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-1 flex flex-wrap gap-2 items-center">
                        <span>SKU: {product?.sku || 'N/A'}</span>
                        {product?.brand?.name && (
                          <span className="bg-amber-500/10 text-amber-400 px-1.5 py-0.2 rounded font-medium text-[9px]">
                            {product.brand.name}
                          </span>
                        )}
                        {product?.productType === 'VehicleSpecific' && (product.vehicleBrand || product.vehicleModel) && (
                          <span className="text-indigo-400 font-medium">
                            🚗 Fits: {product.vehicleBrand} {product.vehicleModel}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Controls Row */}
                    <div className="flex items-center gap-4 w-full sm:w-auto shrink-0 justify-between sm:justify-end">
                      {/* Quantity Modifier */}
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleItemChange(index, 'quantity', Math.max(1, item.quantity - 1))}
                          className="p-1 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={e => handleItemChange(index, 'quantity', e.target.value)}
                          className="w-14 text-center px-1 py-0.5 bg-white dark:bg-slate-800 border border-slate-250 dark:border-slate-705 rounded text-xs font-bold text-slate-900 dark:text-white outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => handleItemChange(index, 'quantity', item.quantity + 1)}
                          className="p-1 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Unit Cost input */}
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-slate-500 font-semibold">Cost:</span>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.unitPrice}
                          onChange={e => handleItemChange(index, 'unitPrice', e.target.value)}
                          className="w-20 px-2 py-0.5 bg-white dark:bg-slate-800 border border-slate-250 dark:border-slate-705 rounded text-xs text-slate-900 dark:text-white outline-none"
                        />
                      </div>

                      {/* Total cost */}
                      <div className="w-24 text-right text-xs font-bold text-slate-900 dark:text-white shrink-0">
                        Rs. {(item.quantity * item.unitPrice).toLocaleString()}
                      </div>

                      {/* Delete */}
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(index)}
                        className="p-1.5 text-slate-400 hover:text-red-500 rounded hover:bg-red-500/10 transition-all cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}

              {items.length === 0 && (
                <div className="flex-1 flex flex-col items-center justify-center py-16 text-center">
                  <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-500 rounded-2xl mb-3">
                    <Save className="w-6 h-6" />
                  </div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white">No Items refilling</h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 max-w-xs leading-normal">
                    Click the "Add Products" button on the top right to select inventory items from your catalog.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Order Summary Sidebar */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm ring-1 ring-slate-200 dark:ring-slate-800 space-y-6">
            <h2 className="text-base font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800/80 pb-3">
              Order Summary
            </h2>

            <div className="space-y-4">
              {/* Supplier Select */}
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">Supplier *</label>
                <select
                  value={supplierId}
                  onChange={e => setSupplierId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-205 dark:border-slate-700 rounded-xl outline-none text-xs text-slate-800 dark:text-white focus:border-indigo-500 font-medium cursor-pointer"
                  required
                >
                  <option value="">Select Supplier...</option>
                  {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>

              {/* Status Select */}
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">Receive Status</label>
                <select
                  value={status}
                  onChange={e => setStatus(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-205 dark:border-slate-700 rounded-xl outline-none text-xs text-slate-800 dark:text-white focus:border-indigo-500 font-medium cursor-pointer"
                >
                  <option value="Pending">Pending (Draft order)</option>
                  <option value="Received">Received (Instantly updates inventory)</option>
                </select>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">Internal Memo / Notes</label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Enter comments, shipment references..."
                  rows={3}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-205 dark:border-slate-700 rounded-xl outline-none text-xs text-slate-850 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
                />
              </div>
            </div>

            <div className="border-t border-slate-100 dark:border-slate-800/80 pt-4 space-y-2">
              <div className="flex justify-between text-xs text-slate-555 dark:text-slate-400 font-medium">
                <span>Total Items:</span>
                <span>{items.reduce((sum, i) => sum + i.quantity, 0)} items</span>
              </div>
              <div className="flex justify-between text-xs text-slate-555 dark:text-slate-400 font-medium">
                <span>Tax Rate:</span>
                <span>0.0%</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-slate-900 dark:text-white pt-2">
                <span>Total Refill Cost:</span>
                <span className="text-indigo-650 dark:text-indigo-400 font-black">Rs. {total.toLocaleString()}</span>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <button
                type="submit"
                disabled={isSaving}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl font-bold text-xs shadow-sm transition-colors cursor-pointer"
              >
                {isSaving ? 'Saving order...' : isEditing ? 'Save Changes' : 'Create Purchase Order'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/purchases')}
                className="w-full py-2.5 text-center text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl font-bold text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>

        {/* Modal: Shop Inventory Refill Menu */}
        {isCatalogOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-955/70 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-4xl h-[600px] bg-[#0B1120] border border-slate-800 rounded-2xl overflow-hidden flex flex-col shadow-2xl relative">
              {/* Modal Header */}
              <div className="flex justify-between items-center px-6 py-4 border-b border-slate-800 bg-[#0F172A]">
                <div>
                  <h3 className="text-sm font-bold text-white">Add Products to Purchase Order</h3>
                  <p className="text-[10px] text-slate-400">Select items from catalog list to add restocking quantities</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCatalogOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Search Bar */}
              <div className="px-6 py-3 border-b border-slate-800 flex items-center gap-3">
                <div className="flex-1 flex items-center gap-2 bg-[#0F172A] border border-slate-800 px-3 py-1.5 rounded-lg">
                  <Search className="w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search catalog by name, SKU, brand, or vehicle compatibility..."
                    value={catalogSearch}
                    onChange={e => setCatalogSearch(e.target.value)}
                    className="w-full bg-transparent text-xs text-white outline-none placeholder-slate-505"
                  />
                  {catalogSearch && (
                    <button type="button" onClick={() => setCatalogSearch('')} className="text-slate-400 hover:text-white">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Main Content Area */}
              <div className="flex-1 flex min-h-0">
                {/* Left Sidebar tabs */}
                <div className="w-48 bg-[#0F172A] border-r border-slate-800 overflow-y-auto">
                  <button
                    type="button"
                    onClick={() => setSelectedCategoryTab('all')}
                    className={`w-full text-left px-4 py-3 text-xs font-bold transition-all border-l-2 ${
                      selectedCategoryTab === 'all'
                        ? 'border-indigo-500 bg-indigo-500/10 text-white'
                        : 'border-transparent text-slate-400 hover:bg-slate-800/40 hover:text-white'
                    }`}
                  >
                    All Products
                  </button>
                  {categories.map(cat => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedCategoryTab(cat.id)}
                      className={`w-full text-left px-4 py-3 text-xs font-bold transition-all border-l-2 ${
                        selectedCategoryTab === cat.id
                          ? 'border-indigo-500 bg-indigo-500/10 text-white'
                          : 'border-transparent text-slate-400 hover:bg-slate-800/40 hover:text-white'
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>

                {/* Right grid: Products list */}
                <div className="flex-1 bg-[#090D1A] overflow-y-auto p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {filteredCatalogProducts.map(product => {
                      const countAdded = items.find(i => i.productId === product.id)?.quantity || 0;
                      return (
                        <div
                          key={product.id}
                          onClick={() => handleAddProductFromCatalog(product)}
                          className="p-4 border border-slate-800 bg-[#0F172A] hover:bg-[#1E293B]/70 rounded-xl cursor-pointer transition-all flex flex-col justify-between group relative overflow-hidden"
                        >
                          {/* Selected Count Indicator badge */}
                          {countAdded > 0 && (
                            <span className="absolute top-2 right-2 bg-indigo-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full ring-2 ring-[#0F172A]">
                              {countAdded} in PO
                            </span>
                          )}

                          <div className="space-y-1">
                            <h4 className="font-bold text-white text-xs group-hover:text-indigo-400 transition-colors">
                              {product.name}
                            </h4>
                            <p className="text-[10px] text-slate-500">{product.sku}</p>
                            
                            <div className="flex flex-wrap gap-1.5 pt-1">
                              {product.brand?.name && (
                                <span className="bg-amber-500/10 text-amber-400 text-[9px] font-bold px-1.5 py-0.2 rounded">
                                  {product.brand.name}
                                </span>
                              )}
                              {product.productType === 'VehicleSpecific' && (product.vehicleBrand || product.vehicleModel) ? (
                                <span className="text-indigo-400 text-[9px] font-medium">
                                  🚗 Fits: {product.vehicleBrand} {product.vehicleModel}
                                </span>
                              ) : product.compatibleCars ? (
                                <span className="text-slate-400 text-[9px] font-medium truncate max-w-[150px]">
                                  🚗 Fits: {product.compatibleCars}
                                </span>
                              ) : null}
                            </div>
                          </div>

                          <div className="flex justify-between items-center mt-3 pt-2 border-t border-slate-800/60">
                            <span className="text-[10px] font-medium text-slate-400">Stock: {product.quantity}</span>
                            <span className="text-xs font-black text-indigo-400">Rs. {product.purchasePrice?.toLocaleString()}</span>
                          </div>
                        </div>
                      );
                    })}

                    {filteredCatalogProducts.length === 0 && (
                      <div className="col-span-full py-12 text-center text-xs text-slate-500">
                        No products match your search.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-3 border-t border-slate-800 bg-[#0F172A] flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsCatalogOpen(false)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-xs transition-colors cursor-pointer"
                >
                  Done Selecting
                </button>
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
