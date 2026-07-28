'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Package, Plus, Minus, ShoppingCart, AlertCircle } from 'lucide-react';
import { fetchProducts, searchProducts } from '@/lib/shopApi';
import { useCartStore } from '@/lib/cartStore';
import { Product } from '@/lib/types';

export default function ShopHome() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  // Search state
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [searchMatchType, setSearchMatchType] = useState<'exact' | 'fuzzy' | 'none' | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  
  const router = useRouter();

  // Cart store
  const cartItems = useCartStore((s) => s.items);
  const addItem = useCartStore((s) => s.addItem);
  const updateQuantity = useCartStore((s) => s.updateQuantity);

  // Total item count for the badge
  const totalCartQty = cartItems.reduce((sum, i) => sum + i.quantity, 0);

  useEffect(() => {
    async function loadProducts() {
      try {
        const data = await fetchProducts();
        setProducts(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadProducts();
  }, []);

  const categories = useMemo(() => {
    const cats = new Set<string>();
    products.forEach((p) => {
      if (p.category) cats.add(p.category);
    });
    return Array.from(cats).sort();
  }, [products]);

  // Debounced search effect
  useEffect(() => {
    const query = searchQuery.trim();
    if (!query) {
      setSearchResults([]);
      setSearchMatchType(null);
      setSearchError('');
      setIsSearching(false);
      return;
    }

    const controller = new AbortController();
    
    const timeoutId = setTimeout(async () => {
      setIsSearching(true);
      setSearchError('');
      
      try {
        const res = await searchProducts(query, controller.signal);
        setSearchResults(res.data);
        setSearchMatchType(res.matchType);
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          setSearchError(err.message || 'Search failed. Please try again.');
          setSearchResults([]);
          setSearchMatchType(null);
        }
      } finally {
        // Only turn off loading if this request wasn't aborted by a newer one
        if (!controller.signal.aborted) {
          setIsSearching(false);
        }
      }
    }, 350);

    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [searchQuery]);

  const filteredProducts = useMemo(() => {
    // If we have an active search, filter the search results. Otherwise, filter the full catalog.
    const baseProducts = searchQuery.trim() ? searchResults : products;
    
    return baseProducts.filter((p) => {
      return selectedCategory ? p.category === selectedCategory : true;
    });
  }, [products, searchResults, searchQuery, selectedCategory]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#185FA5]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center text-red-500 mt-20">
        <p>Error: {error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-[#185FA5] text-white rounded-lg text-sm"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pt-[env(safe-area-inset-top)]">
      {/* Header / Search */}
      <div className="bg-[#185FA5] px-4 pt-6 pb-6 rounded-b-2xl shadow-sm sticky top-0 z-10">
        {/* Title row with cart icon */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-white text-xl font-bold">VoiceB2B Shop</h1>
            <p className="text-blue-100 text-sm">Order fresh stock today</p>
          </div>

          {/* Cart icon + badge */}
          <button
            id="cart-header-btn"
            onClick={() => router.push('/shop/cart')}
            className="relative flex items-center justify-center w-11 h-11 rounded-full bg-white/20 hover:bg-white/30 active:bg-white/40 transition-colors"
            aria-label={`View cart${totalCartQty > 0 ? ` — ${totalCartQty} item${totalCartQty !== 1 ? 's' : ''}` : ''}`}
          >
            <ShoppingCart className="w-6 h-6 text-white" />
            {totalCartQty > 0 && (
              <span className="absolute -top-1 -right-1 bg-orange-400 text-white text-[10px] font-bold min-w-[18px] h-[18px] rounded-full flex items-center justify-center px-1 leading-none">
                {totalCartQty > 99 ? '99+' : totalCartQty}
              </span>
            )}
          </button>
        </div>

        {/* Search input */}
        <div className="relative">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-400" />
          </div>
          <input
            type="text"
            className="w-full pl-10 pr-4 py-3 rounded-xl border-none focus:ring-2 focus:ring-white bg-white text-slate-900 placeholder:text-slate-500 shadow-inner"
            placeholder="Search products or brands..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Categories */}
      {categories.length > 0 && (
        <div className="px-4 py-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Categories</h2>
          <div className="flex space-x-4 overflow-x-auto pb-2 scrollbar-hide">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`flex flex-col items-center min-w-[72px] space-y-2 p-2 rounded-xl transition-colors ${
                selectedCategory === null ? 'bg-[#E6F1FB]' : 'hover:bg-slate-100'
              }`}
            >
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  selectedCategory === null
                    ? 'bg-[#185FA5] text-white'
                    : 'bg-white shadow-sm text-[#185FA5]'
                }`}
              >
                <Package className="w-6 h-6" />
              </div>
              <span
                className={`text-[11px] font-medium ${
                  selectedCategory === null ? 'text-[#185FA5]' : 'text-slate-600'
                }`}
              >
                All
              </span>
            </button>

            {categories.map((category) => {
              const isSelected = selectedCategory === category;
              return (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`flex flex-col items-center min-w-[72px] space-y-2 p-2 rounded-xl transition-colors ${
                    isSelected ? 'bg-[#E6F1FB]' : 'hover:bg-slate-100'
                  }`}
                >
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      isSelected
                        ? 'bg-[#185FA5] text-white'
                        : 'bg-white shadow-sm text-[#185FA5]'
                    }`}
                  >
                    <Package className="w-5 h-5" />
                  </div>
                  <span
                    className={`text-[11px] font-medium whitespace-nowrap truncate w-full px-1 ${
                      isSelected ? 'text-[#185FA5]' : 'text-slate-600'
                    }`}
                  >
                    {category}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Products Grid */}
      <div className="px-4 pb-8">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">
          {selectedCategory ? `${selectedCategory} Products` : 'All Products'}
        </h2>

        {searchMatchType === 'fuzzy' && (
          <p className="text-sm text-slate-500 mb-4 -mt-2">
            Showing similar matches
          </p>
        )}

        {isSearching ? (
          <div className="flex justify-center items-center py-12 bg-white rounded-xl shadow-sm border border-slate-100">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#185FA5]"></div>
          </div>
        ) : searchError ? (
          <div className="flex flex-col items-center justify-center py-10 bg-white rounded-xl shadow-sm border border-red-100 text-center px-4">
            <AlertCircle className="w-10 h-10 text-red-400 mb-3" />
            <p className="text-sm text-red-600 font-medium">{searchError}</p>
          </div>
        ) : searchQuery.trim() && searchMatchType === 'none' ? (
          <div className="text-center py-10 bg-white rounded-xl shadow-sm border border-slate-100">
            <Search className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-600 font-medium mb-1">No results found</p>
            <p className="text-sm text-slate-500">
              We couldn't find anything matching &quot;{searchQuery}&quot;
            </p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-10 bg-white rounded-xl shadow-sm border border-slate-100">
            <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">No products found in this category.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {filteredProducts.map((product) => {
              const cartItem = cartItems.find((i) => i.productId === product._id);
              const qty = cartItem?.quantity ?? 0;

              return (
                <div
                  key={product._id}
                  className="bg-white rounded-2xl p-3 shadow-sm border border-slate-100 flex flex-col h-full relative"
                >
                  {/* Product Image area */}
                  <div className="aspect-square bg-slate-50 rounded-xl mb-3 flex items-center justify-center p-4 overflow-hidden relative">
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <Package className="w-12 h-12 text-slate-300" />
                    )}
                    {/* Out of stock badge */}
                    {!product.inStock && (
                      <div className="absolute top-2 left-2 bg-red-100 text-red-600 text-[10px] font-bold px-2 py-1 rounded-full">
                        Out of Stock
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="flex-1 flex flex-col">
                    <span className="text-[10px] text-slate-500 font-medium mb-1 line-clamp-1 uppercase tracking-wider">
                      {product.brand}
                    </span>
                    <h3 className="text-sm font-semibold text-slate-900 leading-tight mb-1 line-clamp-2">
                      {product.name}
                    </h3>
                    <span className="text-xs text-slate-500 mb-2">
                      {product.weight || '1 unit'}
                    </span>

                    <div className="mt-auto pt-2 flex items-center justify-between">
                      <span className="text-base font-bold text-slate-900">
                        ₹{product.price}
                      </span>

                      {/* Add button ↔ Quantity stepper — same bounding box, no layout shift */}
                      {qty === 0 ? (
                        <button
                          id={`add-${product._id}`}
                          onClick={() => addItem(product._id)}
                          disabled={!product.inStock}
                          className="bg-[#E6F1FB] text-[#185FA5] hover:bg-[#185FA5] hover:text-white transition-colors w-11 h-11 rounded-full flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                          aria-label={`Add ${product.name} to order`}
                        >
                          <Plus className="w-5 h-5" />
                        </button>
                      ) : (
                        <div
                          className="flex items-center gap-1 h-11"
                          style={{ width: 'fit-content' }}
                        >
                          <button
                            id={`dec-${product._id}`}
                            onClick={() => updateQuantity(product._id, qty - 1)}
                            className="w-8 h-8 rounded-full bg-[#E6F1FB] text-[#185FA5] hover:bg-[#185FA5] hover:text-white transition-colors flex items-center justify-center"
                            aria-label={`Decrease quantity of ${product.name}`}
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="text-sm font-bold text-slate-900 min-w-[20px] text-center tabular-nums">
                            {qty}
                          </span>
                          <button
                            id={`inc-${product._id}`}
                            onClick={() => addItem(product._id)}
                            className="w-8 h-8 rounded-full bg-[#E6F1FB] text-[#185FA5] hover:bg-[#185FA5] hover:text-white transition-colors flex items-center justify-center"
                            aria-label={`Increase quantity of ${product.name}`}
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
