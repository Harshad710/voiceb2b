'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, Package, ShoppingBag, Home } from 'lucide-react';
import { Order, OrderItem } from '@/lib/types';

export default function OrderConfirmationPage() {
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem('voiceb2b_last_order');
    if (!raw) {
      setMissing(true);
      return;
    }
    try {
      setOrder(JSON.parse(raw));
      // Keep the entry in sessionStorage so the user can refresh once; a
      // second navigation to /shop will let it expire naturally.
    } catch {
      setMissing(true);
    }
  }, []);

  // ── Fallback: arrived here without order data ────────────────────────────
  if (missing) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-6 text-center gap-5">
        <div className="w-20 h-20 rounded-full bg-[#E6F1FB] flex items-center justify-center">
          <CheckCircle className="w-10 h-10 text-[#185FA5]" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900 mb-1">Order Confirmed!</h1>
          <p className="text-slate-500 text-sm">
            Your order was placed successfully. View your order history for details.
          </p>
        </div>
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <button
            onClick={() => router.push('/shop/orders')}
            className="bg-[#185FA5] text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 min-h-[44px] hover:bg-[#145290] transition-colors"
          >
            <ShoppingBag className="w-5 h-5" />
            View Orders
          </button>
          <button
            onClick={() => router.push('/shop')}
            className="bg-[#E6F1FB] text-[#185FA5] font-semibold py-3 rounded-xl flex items-center justify-center gap-2 min-h-[44px] hover:bg-[#d0e4f7] transition-colors"
          >
            <Home className="w-5 h-5" />
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  // ── Loading state (order from sessionStorage not yet parsed) ─────────────
  if (!order) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#185FA5]" />
      </div>
    );
  }

  // ── Success: display authoritative server data ────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50 pb-8">
      {/* Hero success section */}
      <div className="bg-[#185FA5] px-4 pt-10 pb-10 rounded-b-3xl text-center">
        <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-white text-2xl font-bold mb-1">Order Placed!</h1>
        <p className="text-blue-100 text-sm">
          Your order is being processed and will be delivered soon.
        </p>
      </div>

      <div className="px-4 -mt-4 space-y-4">
        {/* Order reference card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
          <p className="text-xs text-slate-500 mb-1 uppercase tracking-wider">Order ID</p>
          <p className="font-mono text-sm text-slate-800 break-all">{order._id}</p>

          <div className="flex items-center gap-2 mt-3">
            <span
              className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                order.status === 'PENDING'
                  ? 'bg-amber-100 text-amber-700'
                  : order.status === 'PROCESSING'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-emerald-100 text-emerald-700'
              }`}
            >
              {order.status}
            </span>
            <span className="text-xs text-slate-400">
              {new Date(order.createdAt).toLocaleString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
        </div>

        {/* Line items */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
          <h2 className="text-sm font-semibold text-slate-900 mb-3">Items Ordered</h2>
          <div className="space-y-3">
            {order.items.map((item: OrderItem, idx: number) => {
              // After POST /api/orders, productId is NOT populated — it's a raw ID string.
              // The server returns items with quantity and priceAtPurchase.
              const productName =
                typeof item.productId === 'object'
                  ? (item.productId as any).name
                  : `Product #${String(item.productId).slice(-6)}`;

              return (
                <div
                  key={idx}
                  className="flex items-center gap-3 py-2 border-b border-slate-50 last:border-0"
                >
                  <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center flex-shrink-0">
                    <Package className="w-5 h-5 text-slate-300" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{productName}</p>
                    <p className="text-xs text-slate-500">
                      Qty {item.quantity} × ₹{item.priceAtPurchase.toFixed(2)}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-slate-900 flex-shrink-0">
                    ₹{(item.quantity * item.priceAtPurchase).toFixed(2)}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Server-authoritative total */}
        <div className="bg-[#185FA5] rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="text-blue-100 text-xs uppercase tracking-wider">Order Total</p>
            <p className="text-white text-xs mt-0.5">Verified by server</p>
          </div>
          <p className="text-white text-2xl font-bold">
            ₹{order.totalAmount.toFixed(2)}
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3 pt-2">
          <button
            onClick={() => router.push('/shop/orders')}
            className="bg-white border border-slate-200 text-slate-900 font-semibold py-3 rounded-xl flex items-center justify-center gap-2 min-h-[44px] hover:bg-slate-50 transition-colors"
          >
            <ShoppingBag className="w-5 h-5 text-[#185FA5]" />
            View My Orders
          </button>
          <button
            id="continue-shopping-btn"
            onClick={() => router.push('/shop')}
            className="bg-[#185FA5] text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 min-h-[44px] hover:bg-[#145290] transition-colors"
          >
            <Home className="w-5 h-5" />
            Continue Shopping
          </button>
        </div>
      </div>
    </div>
  );
}
