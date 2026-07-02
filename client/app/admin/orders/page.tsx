'use client';

import { useEffect, useState, useCallback } from 'react';
import { fetchOrders } from '@/lib/api';
import { Order, OrderStatus } from '@/lib/types';
import OrdersTable from '@/components/admin/OrdersTable';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchOrders();
      setOrders(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'An unexpected error occurred. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  /**
   * Called by StatusSelect on a successful PATCH.
   * Surgically updates only the affected order's status in local state —
   * no refetch, no full page reload.
   */
  const handleStatusUpdate = useCallback(
    (orderId: string, newStatus: OrderStatus) => {
      setOrders((prev) =>
        prev.map((order) =>
          order._id === orderId ? { ...order, status: newStatus } : order
        )
      );
    },
    []
  );

  return (
    <div className="p-8">
      {/* ── Page Header ────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Order Management
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            View and update incoming distributor orders in real time
          </p>
        </div>
        {/* Refresh button — useful once the table has data loaded */}
        {!loading && !error && (
          <button
            onClick={loadOrders}
            className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 transition-colors px-3 py-2 rounded-lg hover:bg-slate-800"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        )}
      </div>

      {/* ── Loading State ──────────────────────────────────────────────── */}
      {loading && (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton
              key={i}
              className="h-16 w-full rounded-lg bg-slate-800/60"
            />
          ))}
        </div>
      )}

      {/* ── Error State ────────────────────────────────────────────────── */}
      {!loading && error && (
        <Alert className="border-red-500/30 bg-red-500/10 text-red-400">
          <AlertCircle className="h-4 w-4 text-red-400" />
          <AlertTitle className="text-red-300 font-semibold">
            Could not load orders
          </AlertTitle>
          <AlertDescription className="text-red-400/80 mt-1">
            {error}
            <button
              onClick={loadOrders}
              className="block mt-3 underline underline-offset-2 hover:text-red-300 transition-colors"
            >
              Try again
            </button>
          </AlertDescription>
        </Alert>
      )}

      {/* ── Empty State ────────────────────────────────────────────────── */}
      {!loading && !error && orders.length === 0 && (
        <div className="text-center py-20 text-slate-500">
          <p className="text-lg font-medium">No orders yet</p>
          <p className="text-sm mt-1">
            Orders submitted by retailers will appear here.
          </p>
        </div>
      )}

      {/* ── Orders Table ───────────────────────────────────────────────── */}
      {!loading && !error && orders.length > 0 && (
        <OrdersTable orders={orders} onStatusUpdate={handleStatusUpdate} />
      )}
    </div>
  );
}
