'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Package,
  Plus,
  Minus,
  X,
  ShoppingCart,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { fetchProducts } from '@/lib/shopApi';
import { createOrder, OrderError } from '@/lib/shopApi';
import { useCartStore } from '@/lib/cartStore';
import { Product } from '@/lib/types';

export default function CartPage() {
  const router = useRouter();

  const cartItems = useCartStore((s) => s.items);
  const addItem = useCartStore((s) => s.addItem);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const clearCart = useCartStore((s) => s.clearCart);

  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Fetch live product data so prices are always current
  useEffect(() => {
    fetchProducts()
      .then(setProducts)
      .finally(() => setLoadingProducts(false));
  }, []);

  // Build enriched line items — productId + quantity + live product data
  // Items whose productId resolves to a known product get `product: Product`;
  // items whose product was deleted server-side get `product: null`.
  // We keep both so the user can see and remove stale entries.
  const lineItems = useMemo(() => {
    return cartItems.map((ci) => ({
      ...ci,
      product: products.find((p) => p._id === ci.productId) ?? null,
    }));
  }, [cartItems, products]);

  // Running display total — excludes items with no matching product
  // (estimate only; server total is authoritative on confirmation)
  const displayTotal = useMemo(() => {
    return lineItems.reduce(
      (sum, li) => (li.product ? sum + li.product.price * li.quantity : sum),
      0
    );
  }, [lineItems]);

  // ── Order submission ────────────────────────────────────────────────────────
  async function handlePlaceOrder() {
    if (cartItems.length === 0 || isSubmitting) return;
    setIsSubmitting(true);
    setSubmitError('');

    try {
      const order = await createOrder(
        cartItems.map(({ productId, quantity }) => ({ productId, quantity }))
      );
      // Stash the server response in sessionStorage so the confirmation
      // page can display the authoritative total without a second fetch.
      sessionStorage.setItem('voiceb2b_last_order', JSON.stringify(order));
      clearCart();
      router.push('/shop/checkout/confirmation');
    } catch (err) {
      if (err instanceof OrderError && err.code === 'AUTH') {
        router.push('/shop/login');
        return;
      }
      setSubmitError(
        err instanceof Error ? err.message : 'Something went wrong. Please try again.'
      );
      setIsSubmitting(false);
    }
  }

  // ── Empty state ─────────────────────────────────────────────────────────────
  if (!loadingProducts && cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        {/* Header */}
        <div className="bg-[#185FA5] px-4 pt-6 pb-5 rounded-b-2xl shadow-sm flex items-center gap-3">
          <button
            onClick={() => router.push('/shop')}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors"
            aria-label="Back to catalog"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <h1 className="text-white text-xl font-bold">My Cart</h1>
        </div>

        {/* Empty state */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-5">
          <div className="w-24 h-24 rounded-full bg-[#E6F1FB] flex items-center justify-center">
            <ShoppingCart className="w-12 h-12 text-[#185FA5]" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900 mb-1">Your cart is empty</h2>
            <p className="text-slate-500 text-sm">
              Add items from the catalog to get started.
            </p>
          </div>
          <button
            onClick={() => router.push('/shop')}
            className="bg-[#185FA5] text-white font-semibold px-8 py-3 rounded-xl hover:bg-[#1451891] transition-colors min-h-[44px]"
          >
            Browse Products
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <div className="bg-[#185FA5] px-4 pt-6 pb-5 rounded-b-2xl shadow-sm flex items-center gap-3 sticky top-0 z-10">
        <button
          onClick={() => router.push('/shop')}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors"
          aria-label="Back to catalog"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <div>
          <h1 className="text-white text-xl font-bold">My Cart</h1>
          {cartItems.length > 0 && (
            <p className="text-blue-100 text-sm">
              {cartItems.length} product{cartItems.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>
      </div>

      {/* Line items list */}
      <div className="flex-1 px-4 py-4 space-y-3 overflow-y-auto pb-[160px]">
        {loadingProducts ? (
          // Skeleton placeholders while products load
          Array.from({ length: Math.max(cartItems.length, 2) }).map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl p-3 shadow-sm border border-slate-100 flex gap-3 animate-pulse"
            >
              <div className="w-14 h-14 rounded-xl bg-slate-200 flex-shrink-0" />
              <div className="flex-1 space-y-2 py-1">
                <div className="h-3 bg-slate-200 rounded w-2/3" />
                <div className="h-3 bg-slate-200 rounded w-1/3" />
              </div>
            </div>
          ))
        ) : (
          lineItems.map(({ productId, quantity, product }) =>
            product ? (
              // ── Normal row: product still exists in the catalog ──────────
              <div
                key={productId}
                className="bg-white rounded-2xl p-3 shadow-sm border border-slate-100 flex gap-3 items-center"
              >
                {/* Product image */}
                <div className="w-14 h-14 rounded-xl bg-slate-50 flex items-center justify-center p-1 flex-shrink-0">
                  {product.imageUrl ? (
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <Package className="w-8 h-8 text-slate-300" />
                  )}
                </div>

                {/* Name + brand */}
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider truncate">
                    {product.brand}
                  </p>
                  <p className="text-sm font-semibold text-slate-900 leading-tight line-clamp-2">
                    {product.name}
                  </p>
                  {/* Per-line subtotal */}
                  <p className="text-sm font-bold text-[#185FA5] mt-0.5">
                    ₹{(product.price * quantity).toFixed(2)}
                    <span className="text-[10px] text-slate-400 font-normal ml-1">
                      (₹{product.price} × {quantity})
                    </span>
                  </p>
                </div>

                {/* Stepper + remove */}
                <div className="flex flex-col items-center gap-2 flex-shrink-0">
                  {/* Quantity stepper */}
                  <div className="flex items-center gap-1">
                    <button
                      id={`cart-dec-${productId}`}
                      onClick={() => updateQuantity(productId, quantity - 1)}
                      className="w-8 h-8 rounded-full bg-[#E6F1FB] text-[#185FA5] hover:bg-[#185FA5] hover:text-white transition-colors flex items-center justify-center"
                      aria-label={`Decrease quantity of ${product.name}`}
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="text-sm font-bold text-slate-900 min-w-[20px] text-center tabular-nums">
                      {quantity}
                    </span>
                    <button
                      id={`cart-inc-${productId}`}
                      onClick={() => addItem(productId)}
                      className="w-8 h-8 rounded-full bg-[#E6F1FB] text-[#185FA5] hover:bg-[#185FA5] hover:text-white transition-colors flex items-center justify-center"
                      aria-label={`Increase quantity of ${product.name}`}
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Remove button */}
                  <button
                    id={`cart-remove-${productId}`}
                    onClick={() => removeItem(productId)}
                    className="w-8 h-8 rounded-full bg-red-50 text-red-400 hover:bg-red-100 hover:text-red-600 transition-colors flex items-center justify-center"
                    aria-label={`Remove ${product.name} from cart`}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              // ── Fallback row: product no longer in catalog ───────────────
              <div
                key={productId}
                className="bg-amber-50 border border-amber-200 rounded-2xl p-3 flex gap-3 items-center"
              >
                {/* Placeholder image slot */}
                <div className="w-14 h-14 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                  <Package className="w-8 h-8 text-amber-400" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-amber-700 mb-0.5">
                    Product no longer available
                  </p>
                  <p className="text-[10px] text-amber-600 font-mono truncate">
                    ID: {productId.slice(-8)}
                  </p>
                  <p className="text-[10px] text-amber-500 mt-0.5">
                    Remove this item to continue.
                  </p>
                </div>

                {/* Remove-only control — no stepper for unavailable items */}
                <button
                  id={`cart-remove-${productId}`}
                  onClick={() => removeItem(productId)}
                  className="w-9 h-9 rounded-full bg-amber-100 text-amber-600 hover:bg-red-100 hover:text-red-600 transition-colors flex items-center justify-center flex-shrink-0"
                  aria-label="Remove unavailable item from cart"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )
          )
        )}
      </div>

      {/* Sticky bottom — total + Place Order */}
      <div className="fixed bottom-[68px] left-0 right-0 bg-white border-t border-slate-200 z-20">
        <div className="max-w-md mx-auto px-4 py-4 space-y-3">
          {/* Error banner */}
          {submitError && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
              <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-700">{submitError}</p>
            </div>
          )}

          {/* Running total */}
          <div className="flex items-center justify-between">
            <span className="text-slate-500 text-sm">Estimated Total</span>
            <span className="text-slate-900 text-lg font-bold">
              ₹{displayTotal.toFixed(2)}
            </span>
          </div>

          {/* Place Order button */}
          <button
            id="place-order-btn"
            onClick={handlePlaceOrder}
            disabled={cartItems.length === 0 || isSubmitting}
            className="w-full bg-[#185FA5] text-white font-semibold py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-[#145290] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 min-h-[52px]"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Placing Order…</span>
              </>
            ) : (
              'Place Order'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
