import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { Plus, Edit2, Trash2, Search, Info } from 'lucide-react';
import { DataTable } from '../../components/ui/DataTable';
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
  sellingPrice: number;
  quantity: number;
  minQuantity: number;
  category: { name: string };
  subcategory?: { name: string } | null;
  brand: { name: string } | null;
  productType: 'Universal' | 'VehicleSpecific' | 'Service';
  vehicleBrand?: string | null;
  vehicleModel?: string | null;
  yearFrom?: number | null;
  yearTo?: number | null;
  attributeValues?: AttributeValue[];
  isActive: boolean;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/products');
      setProducts(response.data.data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to fetch products');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    
    try {
      await api.delete(`/products/${id}`);
      toast.success('Product deleted successfully');
      fetchProducts();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete product');
    }
  };

  // Live filter products
  const filteredProducts = products.filter((p) => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return true;

    const nameMatch = p.name.toLowerCase().includes(term);
    const skuMatch = p.sku.toLowerCase().includes(term);
    const categoryMatch = p.category?.name.toLowerCase().includes(term);
    const subcategoryMatch = p.subcategory?.name?.toLowerCase().includes(term);
    const brandMatch = p.brand?.name?.toLowerCase().includes(term);
    
    const vehicleBrandMatch = p.vehicleBrand?.toLowerCase().includes(term);
    const vehicleModelMatch = p.vehicleModel?.toLowerCase().includes(term);
    const vehicleYearMatch = 
      p.yearFrom?.toString().includes(term) || 
      p.yearTo?.toString().includes(term);

    const attributeMatch = p.attributeValues?.some((av) => 
      av.attribute.name.toLowerCase().includes(term) || 
      av.value.toLowerCase().includes(term)
    );

    return (
      nameMatch || 
      skuMatch || 
      categoryMatch || 
      subcategoryMatch || 
      brandMatch || 
      vehicleBrandMatch || 
      vehicleModelMatch || 
      vehicleYearMatch || 
      attributeMatch
    );
  });

  const columns = [
    { header: 'SKU', accessor: 'sku' as keyof Product },
    { 
      header: 'Product Details', 
      accessor: (row: Product) => (
        <div className="space-y-1.5 py-1">
          <div className="font-semibold text-slate-900 dark:text-white">{row.name}</div>
          
          {/* Vehicle Compatibility information if applicable */}
          {row.productType === 'VehicleSpecific' && (row.vehicleBrand || row.vehicleModel) && (
            <div className="text-[11px] text-indigo-650 dark:text-indigo-400 font-bold flex items-center gap-1">
              <span>🚗 {row.vehicleBrand} {row.vehicleModel}</span>
              {(row.yearFrom || row.yearTo) && (
                <span className="text-slate-450 dark:text-slate-500 font-medium">
                  ({row.yearFrom || ''}{row.yearTo ? ` - ${row.yearTo}` : ''})
                </span>
              )}
            </div>
          )}

          {/* Render specs attribute values */}
          {row.attributeValues && row.attributeValues.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-1">
              {row.attributeValues.map((av) => (
                <span 
                  key={av.id} 
                  className="px-2 py-0.5 rounded bg-slate-105 dark:bg-slate-800 text-slate-650 dark:text-slate-400 text-[10px] font-medium border border-slate-200 dark:border-slate-700/60"
                >
                  <span className="font-bold text-slate-800 dark:text-slate-350">{av.attribute.name}:</span> {av.value}
                </span>
              ))}
            </div>
          )}
        </div>
      )
    },
    { header: 'Category', accessor: (row: Product) => row.category?.name || 'N/A' },
    { header: 'Subcategory', accessor: (row: Product) => row.subcategory?.name || 'N/A' },
    { header: 'Brand', accessor: (row: Product) => row.brand?.name || 'N/A' },
    { 
      header: 'Price', 
      accessor: (row: Product) => `Rs. ${row.sellingPrice.toLocaleString()}` 
    },
    { 
      header: 'Stock', 
      accessor: (row: Product) => (
        row.productType === 'Service' ? (
          <span className="text-slate-400 dark:text-slate-500 text-xs italic">Service</span>
        ) : (
          <span className={row.quantity <= row.minQuantity ? 'text-red-600 font-bold' : 'font-semibold text-slate-700 dark:text-slate-300'}>
            {row.quantity}
          </span>
        )
      )
    },
    { 
      header: 'Status', 
      accessor: (row: Product) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${row.isActive ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'}`}>
          {row.isActive ? 'Active' : 'Inactive'}
        </span>
      )
    },
    { 
      header: 'Actions', 
      accessor: (row: Product) => (
        <div className="flex gap-2">
          <button 
            onClick={() => navigate(`/products/${row.id}/edit`)}
            className="p-1 text-slate-500 hover:text-indigo-600 transition-colors cursor-pointer"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button 
            onClick={() => handleDelete(row.id)}
            className="p-1 text-slate-500 hover:text-red-600 transition-colors cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Products Catalog</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage, search, and verify dynamic stock attributes</p>
        </div>
        <button
          onClick={() => navigate('/products/new')}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg font-bold text-sm transition-colors shadow-sm cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Add Product
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm ring-1 ring-slate-200 dark:ring-slate-800 p-6 space-y-4">
        
        {/* Live Search and filters */}
        <div className="flex items-center gap-2.5 bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 max-w-md w-full">
          <Search className="w-4.5 h-4.5 text-slate-450 dark:text-slate-500 shrink-0" />
          <input
            type="text"
            placeholder="Search by name, SKU, vehicle model (e.g. Mehran), or specs (e.g. 5D)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-transparent text-slate-900 dark:text-white outline-none text-xs placeholder-slate-400 dark:placeholder-slate-500"
          />
        </div>

        {isLoading ? (
          <div className="animate-pulse space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-12 bg-slate-100 dark:bg-slate-800 rounded-lg"></div>
            ))}
          </div>
        ) : (
          <DataTable data={filteredProducts} columns={columns} />
        )}
      </div>
    </div>
  );
}
