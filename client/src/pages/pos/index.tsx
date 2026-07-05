import { useEffect, useState } from 'react';
import { Search, Trash2, Plus, X, Maximize, LogOut, Receipt, Folder, PlusCircle, Barcode } from 'lucide-react';
import { useNavigate } from 'react-router';
import api from '../../api/axios';
import { toast } from 'sonner';

interface AttributeValue {
  id: string;
  value: string;
  attribute: {
    name: string;
    type: string;
  };
}

interface Product { 
  id: string; 
  name: string; 
  sku: string; 
  barcode?: string | null;
  sellingPrice: number; 
  quantity: number; 
  categoryId: string;
  compatibleCars?: string | null;
  productType?: 'Universal' | 'VehicleSpecific' | 'Service';
  vehicleBrand?: string | null;
  vehicleModel?: string | null;
  yearFrom?: number | null;
  yearTo?: number | null;
  brand?: {
    id: string;
    name: string;
  } | null;
  category?: {
    id: string;
    name: string;
  } | null;
  subcategory?: {
    id: string;
    name: string;
  } | null;
  attributeValues?: AttributeValue[];
}
interface Category {
  id: string;
  name: string;
}
interface Customer { id: string; name: string; phone: string; address: string | null }
interface CartItem extends Product { cartQuantity: number; itemDiscount: number }

export default function POSPage() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  
  // Modals
  const [showItemModal, setShowItemModal] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedCategoryTab, setSelectedCategoryTab] = useState<string>('all'); // 'all' or specific category ID, or 'quick-add'

  // Barcode / SKU Direct manual input
  const [manualInput, setManualInput] = useState('');

  // Cart State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerId, setCustomerId] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [globalDiscount, setGlobalDiscount] = useState(0);
  const [receivedAmount, setReceivedAmount] = useState<number | ''>('');
  const [notes, setNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Quick Add Product Form State
  const [quickName, setQuickName] = useState('');
  const [quickPrice, setQuickPrice] = useState('');
  const [quickCost, setQuickCost] = useState('');
  const [quickStock, setQuickStock] = useState('1');
  const [quickCategory, setQuickCategory] = useState('');
  const [isCreatingProduct, setIsCreatingProduct] = useState(false);

  const fetchPOSData = async () => {
    try {
      const [prodRes, custRes, catRes] = await Promise.all([
        api.get('/products'),
        api.get('/customers'),
        api.get('/categories')
      ]);
      setProducts(prodRes.data.data.filter((p: any) => p.isActive));
      setCustomers(custRes.data.data);
      
      const cats = catRes.data.data || [];
      setCategories(cats);
      if (cats.length > 0 && !quickCategory) {
        setQuickCategory(cats[0].id);
      }
    } catch (error) {
      toast.error('Failed to load POS data');
    }
  };

  useEffect(() => {
    fetchPOSData();
  }, []);

  const handleCustomerSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setCustomerId(id);
    if (id) {
      const c = customers.find(x => x.id === id);
      setCustomerPhone(c?.phone || '');
      setCustomerAddress(c?.address || '');
    } else {
      setCustomerPhone('');
      setCustomerAddress('');
    }
  };

  // Filter products by search query (checks name, SKU, compatible cars, category name, subcategory name, brand name, vehicle compatibility, and custom specs attributes) and selected category tab
  const filteredProducts = products.filter(p => {
    const query = search.toLowerCase().trim();
    const matchesSearch = !query || 
      p.name.toLowerCase().includes(query) || 
      p.sku.toLowerCase().includes(query) ||
      (p.compatibleCars && p.compatibleCars.toLowerCase().includes(query)) ||
      (p.category && p.category.name.toLowerCase().includes(query)) ||
      (p.subcategory && p.subcategory.name.toLowerCase().includes(query)) ||
      (p.brand && p.brand.name.toLowerCase().includes(query)) ||
      (p.vehicleBrand && p.vehicleBrand.toLowerCase().includes(query)) ||
      (p.vehicleModel && p.vehicleModel.toLowerCase().includes(query)) ||
      p.yearFrom?.toString().includes(query) ||
      p.yearTo?.toString().includes(query) ||
      p.attributeValues?.some(av => 
        av.attribute.name.toLowerCase().includes(query) || 
        av.value.toLowerCase().includes(query)
      );
      
    const matchesCategory = selectedCategoryTab === 'all' || p.categoryId === selectedCategoryTab;
    return matchesSearch && matchesCategory;
  });

  const addToCart = (product: Product) => {
    if (product.quantity <= 0) return toast.error('Out of stock!');
    
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        if (existing.cartQuantity >= product.quantity) {
          toast.error('Exceeds available stock!');
          return prev;
        }
        return prev.map(item => item.id === product.id 
          ? { ...item, cartQuantity: item.cartQuantity + 1 }
          : item
        );
      }
      return [...prev, { ...product, cartQuantity: 1, itemDiscount: 0 }];
    });
  };

  // Direct manual SKU/Barcode entry handling
  const handleManualInputSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualInput.trim()) return;

    const query = manualInput.trim().toLowerCase();
    const matchedProduct = products.find(p => 
      p.sku.toLowerCase() === query || 
      (p.barcode && p.barcode.toLowerCase() === query) ||
      p.name.toLowerCase() === query
    );

    if (matchedProduct) {
      addToCart(matchedProduct);
      toast.success(`Added "${matchedProduct.name}" to sale!`);
      setManualInput('');
    } else {
      toast.error('This product is not in the system!');
    }
  };

  const updateCartItem = (id: string, field: 'cartQuantity' | 'itemDiscount', value: number) => {
    if (field === 'cartQuantity' && value <= 0) return removeFromCart(id);
    
    const product = products.find(p => p.id === id);
    if (field === 'cartQuantity' && product && value > product.quantity) {
      toast.error('Exceeds available stock!');
      return;
    }

    setCart(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const clearTransaction = () => {
    if (cart.length > 0 && !window.confirm('Clear all items from transaction?')) return;
    setCart([]);
    setCustomerId('');
    setCustomerPhone('');
    setCustomerAddress('');
    setGlobalDiscount(0);
    setReceivedAmount('');
    setNotes('');
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.sellingPrice * item.cartQuantity), 0);
  const itemDiscountsTotal = cart.reduce((sum, item) => sum + (item.itemDiscount || 0), 0);
  const total = Math.max(0, subtotal - itemDiscountsTotal - globalDiscount);

  const handleCheckout = async () => {
    if (cart.length === 0) return toast.error('Transaction is empty');
    
    try {
      setIsProcessing(true);
      const items = cart.map(item => ({
        productId: item.id,
        quantity: item.cartQuantity,
        unitPrice: item.sellingPrice,
        discount: item.itemDiscount,
      }));

      await api.post('/sales', {
        customerId: customerId || null,
        items,
        subtotal,
        discount: globalDiscount + itemDiscountsTotal,
        tax: 0,
        total,
        paidAmount: Number(receivedAmount) || total,
        paymentMethod,
        status: 'Completed',
        notes
      });

      toast.success('Sale completed successfully! Product stocks decremented.');
      clearTransaction();
      fetchPOSData(); // Refresh product list and stock counts
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Checkout failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleQuickAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickName || !quickPrice || !quickCategory) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setIsCreatingProduct(true);
      const randomSku = 'SKU-' + Date.now().toString().slice(-6);
      
      const newProductData = {
        name: quickName,
        sku: randomSku,
        purchasePrice: Number(quickCost) || 0,
        sellingPrice: Number(quickPrice),
        quantity: Number(quickStock) || 0,
        minQuantity: 1,
        categoryId: quickCategory,
        barcode: '',
        description: 'Quick added from POS'
      };

      const response = await api.post('/products', newProductData);
      const createdProduct = response.data.data;
      
      toast.success(`Product "${createdProduct.name}" created and added to POS!`);
      
      // Update local product list and instantly add to cart
      setProducts(prev => [createdProduct, ...prev]);
      addToCart(createdProduct);
      
      // Reset form
      setQuickName('');
      setQuickPrice('');
      setQuickCost('');
      setQuickStock('1');
      setSelectedCategoryTab('all');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to quickly create product');
    } finally {
      setIsCreatingProduct(false);
    }
  };

  // Find existing products matching typed quick name
  const existingMatches = quickName.trim().length >= 2
    ? products.filter(p => p.name.toLowerCase().includes(quickName.toLowerCase()))
    : [];

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      if (document.exitFullscreen) document.exitFullscreen();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-[#0B1120] text-slate-300 flex flex-col font-sans overflow-hidden">
      
      {/* Header */}
      <div className="h-14 bg-[#0F172A] border-b border-slate-800 flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-white tracking-wide flex items-center gap-2">
            <Receipt className="w-5 h-5 text-indigo-500" /> POS Terminal
          </h1>
          <span className="text-slate-500 text-sm">Point of Sale System</span>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={toggleFullScreen} className="text-slate-400 hover:text-white transition-colors" title="Fullscreen">
            <Maximize className="w-4 h-4" />
          </button>
          <div className="h-4 w-px bg-slate-700"></div>
          <button onClick={() => navigate('/')} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm">
            <LogOut className="w-4 h-4" /> Exit POS
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        
        {/* Left Area - Main POS Table */}
        <div className="flex-1 flex flex-col overflow-hidden">
          
          {/* Controls Bar */}
          <div className="p-4 bg-[#0B1120] border-b border-slate-800 flex flex-wrap items-center gap-3 shrink-0">
            <select className="bg-[#1E293B] border border-slate-700 rounded text-sm px-3 py-1.5 outline-none text-white focus:border-indigo-500">
              <option>Sale</option>
              <option>Return</option>
            </select>
            
            <div className="h-6 w-px bg-slate-800"></div>

            <select 
              value={customerId}
              onChange={handleCustomerSelect}
              className="bg-[#1E293B] border border-slate-700 rounded text-sm px-3 py-1.5 outline-none text-white focus:border-indigo-500 w-48"
            >
              <option value="">Walk-in Customer</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>

            <input 
              type="text" 
              placeholder="Phone (optional)"
              value={customerPhone}
              onChange={e => setCustomerPhone(e.target.value)}
              className="bg-[#1E293B] border border-slate-700 rounded text-sm px-3 py-1.5 outline-none text-white focus:border-indigo-500 w-36"
            />
            
            <input 
              type="text" 
              placeholder="Address"
              value={customerAddress}
              onChange={e => setCustomerAddress(e.target.value)}
              className="bg-[#1E293B] border border-slate-700 rounded text-sm px-3 py-1.5 outline-none text-white focus:border-indigo-500 w-48"
            />

            <div className="h-6 w-px bg-slate-800"></div>

            {/* Direct manual Scan input */}
            <form onSubmit={handleManualInputSubmit} className="flex-1 min-w-[200px] flex items-center relative">
              <input 
                type="text"
                value={manualInput}
                onChange={e => setManualInput(e.target.value)}
                placeholder="Scan Barcode or Enter SKU directly..."
                className="w-full bg-[#1E293B] border border-slate-750 rounded text-sm pl-9 pr-3 py-1.5 outline-none text-white focus:border-indigo-500 transition-colors"
              />
              <Barcode className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            </form>

            <button 
              onClick={() => {
                setSelectedCategoryTab('all');
                setShowItemModal(true);
              }}
              className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-1.5 rounded text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4" /> Add Items
            </button>
          </div>

          {/* Table Area */}
          <div className="flex-1 overflow-y-auto bg-[#0B1120] p-4">
            <div className="w-full border border-slate-800 rounded-lg overflow-hidden flex flex-col h-full bg-[#0F172A]">
              
              {/* Table Header */}
              <div className="grid grid-cols-[1fr_80px_100px_100px_120px_80px_50px] gap-4 p-3 border-b border-slate-800 bg-[#1E293B] text-xs font-bold text-slate-400 tracking-wider">
                <div>ITEM</div>
                <div className="text-center">STOCK</div>
                <div className="text-center">QTY</div>
                <div className="text-right">PRICE</div>
                <div className="text-right">DISC (Rs)</div>
                <div className="text-right">TOTAL</div>
                <div></div>
              </div>

              {/* Table Body */}
              <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {cart.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-slate-600 text-sm">
                    No items added. Type SKU above or click 'Add Items' to start.
                  </div>
                ) : (
                  cart.map((item) => (
                    <div key={item.id} className="grid grid-cols-[1fr_80px_100px_100px_120px_80px_50px] gap-4 p-2 items-center hover:bg-[#1E293B] rounded-md group">
                      <div className="truncate text-white font-medium pl-1 flex items-center gap-1.5">
                        <span>{item.name}</span>
                        {item.brand && (
                          <span className="text-[10px] text-amber-400 font-bold px-1.5 py-0.5 bg-amber-500/10 rounded">
                            {item.brand.name}
                          </span>
                        )}
                      </div>
                      <div className="text-center text-slate-500 text-sm">{item.quantity}</div>
                      
                      {/* QTY Input */}
                      <div className="flex items-center justify-center">
                        <input 
                          type="number"
                          min="1"
                          max={item.quantity}
                          value={item.cartQuantity}
                          onChange={e => updateCartItem(item.id, 'cartQuantity', Number(e.target.value))}
                          className="w-16 bg-[#0B1120] border border-slate-700 rounded px-2 py-1 text-center text-white outline-none focus:border-indigo-500 text-sm"
                        />
                      </div>
                      
                      <div className="text-right text-slate-300 text-sm">{item.sellingPrice.toLocaleString()}</div>
                      
                      {/* Item Discount */}
                      <div className="flex items-center justify-end">
                        <input 
                          type="number"
                          min="0"
                          value={item.itemDiscount || ''}
                          onChange={e => updateCartItem(item.id, 'itemDiscount', Number(e.target.value))}
                          className="w-20 bg-[#0B1120] border border-slate-700 rounded px-2 py-1 text-right text-white outline-none focus:border-indigo-500 text-sm"
                          placeholder="0"
                        />
                      </div>

                      <div className="text-right text-indigo-400 font-bold text-sm">
                        {((item.sellingPrice * item.cartQuantity) - (item.itemDiscount || 0)).toLocaleString()}
                      </div>
                      
                      <div className="flex justify-center">
                        <button 
                          onClick={() => removeFromCart(item.id)}
                          className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar - Summary */}
        <div className="w-80 bg-[#0F172A] border-l border-slate-800 flex flex-col shrink-0">
          <div className="p-4 border-b border-slate-800 flex items-center gap-2">
            <Receipt className="w-5 h-5 text-slate-400" />
            <h2 className="text-white font-bold tracking-wide">Transaction Summary</h2>
          </div>

          <div className="flex-1 p-5 flex flex-col gap-6 overflow-y-auto">
            
            <div className="flex justify-between items-center bg-[#1E293B] p-3 rounded-lg border border-slate-800">
              <span className="text-slate-400 text-sm">Payment Status</span>
              <span className="text-indigo-400 text-sm font-medium px-2 py-0.5 bg-indigo-500/10 rounded">Pending</span>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Subtotal</span>
                <span className="text-white">{subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-400">Global Discount</span>
                <input 
                  type="number"
                  min="0"
                  value={globalDiscount || ''}
                  onChange={e => setGlobalDiscount(Number(e.target.value))}
                  className="w-24 bg-[#0B1120] border border-slate-700 rounded px-2 py-1 text-right text-white outline-none focus:border-indigo-500"
                  placeholder="0.00"
                />
              </div>
              <div className="pt-4 border-t border-slate-800 flex justify-between items-center">
                <span className="text-slate-300 font-bold text-lg">Total</span>
                <span className="text-indigo-400 font-bold text-2xl">{total.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-400">Received Amount</span>
                <input 
                  type="number"
                  min="0"
                  value={receivedAmount}
                  onChange={e => setReceivedAmount(Number(e.target.value))}
                  className="w-24 bg-[#0B1120] border border-slate-700 rounded px-2 py-1 text-right text-white outline-none focus:border-indigo-500"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <span className="text-slate-400 text-xs uppercase tracking-wider">Payment Method</span>
              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={() => setPaymentMethod('Cash')}
                  className={`py-2 rounded text-sm font-medium transition-colors border ${paymentMethod === 'Cash' ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/50' : 'bg-[#1E293B] text-slate-400 border-transparent hover:bg-slate-800'}`}
                >
                  Cash
                </button>
                <button 
                  onClick={() => setPaymentMethod('Card')}
                  className={`py-2 rounded text-sm font-medium transition-colors border ${paymentMethod === 'Card' ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/50' : 'bg-[#1E293B] text-slate-400 border-transparent hover:bg-slate-800'}`}
                >
                  Card
                </button>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <span className="text-slate-400 text-xs uppercase tracking-wider">Comments/Notes (Optional)</span>
              <textarea 
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={3}
                className="w-full bg-[#1E293B] border border-slate-800 rounded p-2 text-sm text-white outline-none focus:border-indigo-500 resize-none"
                placeholder="Add any comments or notes for this transaction..."
              ></textarea>
            </div>

          </div>

          <div className="p-4 bg-[#0F172A] border-t border-slate-800 space-y-3 shrink-0">
            <button 
              onClick={handleCheckout}
              disabled={cart.length === 0 || isProcessing}
              className="w-full py-3.5 bg-indigo-500 hover:bg-indigo-600 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded font-bold transition-colors"
            >
              {isProcessing ? 'Processing...' : 'Complete Sale'}
            </button>
            <button 
              onClick={clearTransaction}
              className="w-full py-3 bg-[#1E293B] hover:bg-slate-800 text-slate-300 rounded font-medium transition-colors"
            >
              Clear Transaction
            </button>
          </div>
        </div>

      </div>

      {/* Product Selection Modal (Shop Menu) */}
      {showItemModal && (
        <div className="fixed inset-0 z-[200] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0F172A] border border-slate-855 rounded-xl w-full max-w-5xl flex flex-col h-[85vh] shadow-2xl overflow-hidden">
            
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-[#1E293B]">
              <div className="flex items-center gap-3">
                <Receipt className="w-5 h-5 text-indigo-400" />
                <h2 className="text-lg font-bold text-white">Shop Inventory Menu</h2>
              </div>
              <button onClick={() => setShowItemModal(false)} className="text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-slate-800">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body Layout */}
            <div className="flex flex-1 overflow-hidden">
              
              {/* Modal Left Column: Category Navigation Tabs */}
              <div className="w-64 bg-[#0B1120] border-r border-slate-800 flex flex-col justify-between p-3 overflow-y-auto">
                <div className="space-y-1.5">
                  <div className="px-3 pb-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    Categories
                  </div>
                  
                  {/* All Category option */}
                  <button
                    onClick={() => setSelectedCategoryTab('all')}
                    className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      selectedCategoryTab === 'all'
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                        : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                    }`}
                  >
                    <Folder className="w-4 h-4 shrink-0" />
                    <span>All Products</span>
                  </button>

                  {/* Dynamic Category List */}
                  {categories.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategoryTab(cat.id)}
                      className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                        selectedCategoryTab === cat.id
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                          : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                      }`}
                    >
                      <Folder className="w-4 h-4 shrink-0 text-slate-500" />
                      <span className="truncate text-left">{cat.name}</span>
                    </button>
                  ))}
                </div>

                {/* Quick Add Product Tab option */}
                <div className="pt-4 border-t border-slate-850">
                  <button
                    onClick={() => setSelectedCategoryTab('quick-add')}
                    className={`w-full flex items-center gap-2 px-3 py-3 rounded-lg text-sm font-semibold border transition-all ${
                      selectedCategoryTab === 'quick-add'
                        ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-600/20'
                        : 'text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10 hover:border-emerald-500/50'
                    }`}
                  >
                    <PlusCircle className="w-5 h-5 shrink-0" />
                    <span>Quick Add (Manual)</span>
                  </button>
                </div>
              </div>

              {/* Modal Right Column: Products or Quick Add Form */}
              <div className="flex-1 flex flex-col bg-[#0F172A] overflow-hidden">
                
                {selectedCategoryTab !== 'quick-add' ? (
                  <>
                    {/* Search bar for Products */}
                    <div className="p-4 border-b border-slate-800 shrink-0">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input 
                          type="text" 
                          autoFocus
                          placeholder="Search items by Name, SKU, Category, Brand (e.g. Pioneer), or Car Model (e.g. Mehran)..."
                          value={search}
                          onChange={e => setSearch(e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 bg-[#0B1120] border border-slate-700 rounded-lg text-white outline-none focus:border-indigo-500 placeholder-slate-500 text-sm"
                        />
                      </div>
                    </div>

                    {/* Products Grid */}
                    <div className="flex-1 overflow-y-auto p-4">
                      {filteredProducts.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-500 text-sm">
                          No products found matching your search.
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {filteredProducts.map(product => {
                            const isAdded = cart.some(x => x.id === product.id);
                            return (
                              <button
                                key={product.id}
                                onClick={() => addToCart(product)}
                                disabled={product.quantity <= 0}
                                className={`flex flex-col p-4 rounded-lg border text-left transition-all ${
                                  product.quantity > 0 
                                    ? 'border-slate-800 hover:border-indigo-500 bg-[#1E293B] hover:bg-[#1E293B]/80' 
                                    : 'border-slate-900 bg-[#0B1120] opacity-50 cursor-not-allowed'
                                } ${isAdded ? 'ring-2 ring-indigo-500' : ''}`}
                              >
                                <div className="flex justify-between items-start gap-2 mb-1 w-full">
                                  <span className="font-bold text-white line-clamp-2 text-sm">{product.name}</span>
                                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                                    {product.category && (
                                      <span className="text-[10px] bg-[#0B1120] text-indigo-400 px-1.5 py-0.5 rounded font-medium">
                                        {product.category.name}
                                      </span>
                                    )}
                                    {product.brand && (
                                      <span className="text-[10px] bg-amber-500/10 text-amber-400 px-1.5 py-0.5 rounded font-semibold">
                                        {product.brand.name}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="text-xs text-slate-400 mb-2">{product.sku}</div>
                                
                                {product.productType === 'VehicleSpecific' && (product.vehicleBrand || product.vehicleModel) ? (
                                  <div className="text-[10px] text-indigo-400 mb-2 flex items-center gap-1.5 bg-[#0B1120]/40 px-2 py-1 rounded w-full">
                                    <span>🚗</span>
                                    <span className="truncate">
                                      Fits: {product.vehicleBrand} {product.vehicleModel} {(product.yearFrom || product.yearTo) && `(${product.yearFrom || ''}${product.yearTo ? `-${product.yearTo}` : ''})`}
                                    </span>
                                  </div>
                                ) : product.compatibleCars ? (
                                  <div className="text-[10px] text-slate-400 mb-2 flex items-center gap-1.5 bg-[#0B1120]/40 px-2 py-1 rounded w-full">
                                    <span>🚗</span>
                                    <span className="truncate" title={product.compatibleCars}>
                                      Fits: {product.compatibleCars}
                                    </span>
                                  </div>
                                ) : null}

                                {product.attributeValues && product.attributeValues.length > 0 && (
                                  <div className="flex flex-wrap gap-1.5 mb-3">
                                    {product.attributeValues.map(av => (
                                      <span key={av.id} className="text-[9px] px-1.5 py-0.5 bg-[#0D1525] border border-slate-800 text-slate-400 rounded">
                                        {av.attribute.name}: {av.value}
                                      </span>
                                    ))}
                                  </div>
                                )}
                                
                                <div className="mt-auto flex justify-between items-end w-full border-t border-slate-800/60 pt-2">
                                  <div>
                                    <div className="text-[10px] text-slate-500 uppercase tracking-wider">Price</div>
                                    <span className="font-bold text-indigo-400 text-sm">Rs. {product.sellingPrice.toLocaleString()}</span>
                                  </div>
                                  <div className="text-right">
                                    <div className="text-[10px] text-slate-500 uppercase tracking-wider">Stock</div>
                                    <span className={`text-xs font-semibold ${product.quantity < 5 ? 'text-amber-400' : 'text-slate-400'}`}>
                                      {product.quantity} units
                                    </span>
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  /* Quick Add (Manual Entry) Form */
                  <div className="flex-1 overflow-y-auto p-8 max-w-2xl mx-auto w-full">
                    <div className="mb-6">
                      <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <PlusCircle className="w-5 h-5 text-emerald-400" /> Quick Add Custom Product
                      </h3>
                      <p className="text-xs text-slate-400 mt-1">
                        Register a custom decoration or accessory directly. It will be added to this sale and saved in the shop inventory.
                      </p>
                    </div>

                    <form onSubmit={handleQuickAddProduct} className="space-y-5">
                      <div>
                        <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">
                          Product Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={quickName}
                          onChange={e => setQuickName(e.target.value)}
                          placeholder="e.g. Steering Cover Stitching"
                          className="w-full px-3 py-2.5 bg-[#0B1120] border border-slate-700 rounded-lg text-white outline-none focus:border-emerald-500 text-sm"
                        />
                        
                        {/* Instant duplication / existing stock lookup */}
                        {existingMatches.length > 0 && (
                          <div className="mt-2.5 p-3 bg-[#1A2333] rounded-lg border border-amber-500/20 space-y-2">
                            <div className="text-[11px] text-amber-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                              <span>⚠️</span> Existing stock item found:
                            </div>
                            <div className="space-y-1">
                              {existingMatches.slice(0, 3).map(m => (
                                <div key={m.id} className="flex justify-between items-center text-xs">
                                  <span className="text-white font-medium">{m.name} ({m.sku})</span>
                                  <div className="flex items-center gap-3">
                                    <span className="text-slate-400">Stock: <strong className="text-white">{m.quantity}</strong> units</span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        addToCart(m);
                                        toast.success(`Added existing ${m.name} directly to sale!`);
                                        setQuickName('');
                                        setShowItemModal(false);
                                      }}
                                      className="px-2 py-0.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-[10px] font-semibold transition-colors"
                                    >
                                      Add Directly
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">
                            Category *
                          </label>
                          <select
                            required
                            value={quickCategory}
                            onChange={e => setQuickCategory(e.target.value)}
                            className="w-full px-3 py-2.5 bg-[#0B1120] border border-slate-700 rounded-lg text-white outline-none focus:border-emerald-500 text-sm"
                          >
                            {categories.map(c => (
                              <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">
                            Initial Stock *
                          </label>
                          <input
                            type="number"
                            required
                            min="1"
                            value={quickStock}
                            onChange={e => setQuickStock(e.target.value)}
                            placeholder="1"
                            className="w-full px-3 py-2.5 bg-[#0B1120] border border-slate-700 rounded-lg text-white outline-none focus:border-emerald-500 text-sm"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">
                            Cost Price (Rs. optional)
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={quickCost}
                            onChange={e => setQuickCost(e.target.value)}
                            placeholder="0"
                            className="w-full px-3 py-2.5 bg-[#0B1120] border border-slate-700 rounded-lg text-white outline-none focus:border-emerald-500 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">
                            Selling Price (Rs. *)
                          </label>
                          <input
                            type="number"
                            required
                            min="0"
                            value={quickPrice}
                            onChange={e => setQuickPrice(e.target.value)}
                            placeholder="0"
                            className="w-full px-3 py-2.5 bg-[#0B1120] border border-slate-700 rounded-lg text-white outline-none focus:border-emerald-500 text-sm"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                        <button
                          type="button"
                          onClick={() => setSelectedCategoryTab('all')}
                          className="px-4 py-2.5 text-sm text-slate-400 hover:text-white rounded bg-slate-800 hover:bg-slate-700 font-medium transition-colors"
                        >
                          Back to Menu
                        </button>
                        <button
                          type="submit"
                          disabled={isCreatingProduct}
                          className="px-6 py-2.5 text-sm text-white bg-emerald-600 hover:bg-emerald-700 rounded font-semibold transition-colors flex items-center gap-2"
                        >
                          {isCreatingProduct ? 'Creating...' : (
                            <>
                              <Plus className="w-4 h-4" /> Create & Add to Cart
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  </div>
                )}

              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}
