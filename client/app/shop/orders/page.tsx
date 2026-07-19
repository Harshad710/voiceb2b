'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getRetailerData, retailerAuthHeaders } from '@/lib/shopApi';
import { Order } from '@/lib/types';

function OrderStatusBadge({ status }: { status: string }) {
  let bg = '';
  let text = '';
  
  switch (status) {
    case 'PENDING':
      bg = 'bg-orange-100';
      text = 'text-orange-800';
      break;
    case 'PROCESSING':
      bg = 'bg-amber-100';
      text = 'text-amber-800';
      break;
    case 'DELIVERED':
      bg = 'bg-emerald-100';
      text = 'text-emerald-800';
      break;
    default:
      bg = 'bg-slate-100';
      text = 'text-slate-700';
  }

  return (
    <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${bg} ${text}`}>
      {status}
    </span>
  );
}

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const retailerData = getRetailerData();
    if (!retailerData) {
      router.push('/shop/login');
      return;
    }

    const fetchOrders = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/orders/retailer/${retailerData._id}`, {
          headers: retailerAuthHeaders(),
        });
        
        if (!res.ok) {
          if (res.status === 401) {
            router.push('/shop/login');
            return;
          }
          throw new Error('Failed to fetch orders');
        }
        
        const json = await res.json();
        // Assuming data is an array of orders, sort newest first just in case
        const sortedOrders = (json.data || []).sort((a: Order, b: Order) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setOrders(sortedOrders);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [router]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-144px)]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#185FA5]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center text-red-600 bg-red-50 m-4 rounded-lg">
        {error}
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-144px)] p-4">
        <div className="text-center p-8 bg-white rounded-2xl shadow-sm border border-slate-100 w-full max-w-sm">
          <div className="w-16 h-16 bg-[#E6F1FB] text-[#185FA5] rounded-full flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">No orders yet</h2>
          <p className="text-slate-500 mb-6">Looks like you haven't placed any orders.</p>
          <Link href="/shop" className="inline-flex items-center justify-center w-full py-3 px-4 bg-[#185FA5] text-white rounded-lg font-medium hover:bg-[#134B82] transition-colors">
            Start Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-24">
      <div className="bg-white border-b border-slate-200 px-4 py-4 sticky top-0 z-10">
        <h1 className="text-xl font-bold text-slate-900">Order History</h1>
      </div>
      
      <div className="p-4 space-y-4">
        {orders.map((order) => {
          const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
          
          return (
            <Link 
              href={`/shop/orders/${order._id}`} 
              key={order._id}
              className="block bg-white p-4 rounded-xl shadow-sm border border-slate-100 active:scale-[0.99] transition-transform"
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="text-xs text-slate-500 mb-1">
                    {new Date(order.createdAt).toLocaleDateString(undefined, { 
                      month: 'short', 
                      day: 'numeric', 
                      year: 'numeric' 
                    })}
                  </p>
                  <p className="text-sm font-bold text-slate-900">
                    Order #{order._id.slice(-6).toUpperCase()}
                  </p>
                </div>
                <OrderStatusBadge status={order.status} />
              </div>
              
              <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-50">
                <p className="text-sm text-slate-600">
                  {itemCount} {itemCount === 1 ? 'item' : 'items'}
                </p>
                <p className="font-bold text-[#185FA5]">
                  ${order.totalAmount.toFixed(2)}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
