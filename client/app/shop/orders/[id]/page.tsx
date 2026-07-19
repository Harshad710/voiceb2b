'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { retailerAuthHeaders } from '@/lib/shopApi';
import { Order, OrderItem, Product } from '@/lib/types';

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

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/orders/${id}`, {
          headers: retailerAuthHeaders(),
        });
        
        if (!res.ok) {
          if (res.status === 401) {
            router.push('/shop/login');
            return;
          }
          throw new Error('Failed to fetch order details');
        }
        
        const json = await res.json();
        setOrder(json.data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [id, router]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-144px)]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#185FA5]"></div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="p-4 flex flex-col items-center justify-center min-h-[calc(100vh-144px)]">
        <div className="text-center text-red-600 bg-red-50 p-4 rounded-lg mb-4 w-full max-w-md">
          {error || 'Order not found'}
        </div>
        <Link href="/shop/orders" className="text-[#185FA5] font-medium hover:underline">
          &larr; Back to Orders
        </Link>
      </div>
    );
  }

  // Type guard or cast since we know it's populated from backend
  const items = order.items as OrderItem[];

  return (
    <div className="pb-24 bg-slate-50 min-h-screen">
      <div className="bg-white border-b border-slate-200 px-4 py-4 sticky top-0 z-10 flex items-center gap-3">
        <Link href="/shop/orders" className="p-2 -ml-2 text-slate-500 hover:text-slate-900 rounded-full active:bg-slate-100 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
        </Link>
        <h1 className="text-xl font-bold text-slate-900 truncate">
          Order #{order._id.slice(-6).toUpperCase()}
        </h1>
      </div>

      <div className="p-4 space-y-4 max-w-2xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
          <div className="flex justify-between items-center mb-4">
            <OrderStatusBadge status={order.status} />
            <span className="text-sm font-bold text-[#185FA5]">${order.totalAmount.toFixed(2)}</span>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Date Placed</span>
              <span className="text-slate-900 font-medium">
                {new Date(order.createdAt).toLocaleDateString(undefined, { 
                  month: 'long', 
                  day: 'numeric', 
                  year: 'numeric' 
                })}
              </span>
            </div>
            {/* The schema defines expectedDeliveryDate, assuming it exists on the object */}
            {/* @ts-ignore - Assuming expectedDeliveryDate is on the type but maybe missing in types.ts */}
            {order.expectedDeliveryDate && (
              <div className="flex justify-between">
                <span className="text-slate-500">Expected Delivery</span>
                <span className="text-slate-900 font-medium">
                  {/* @ts-ignore */}
                  {new Date(order.expectedDeliveryDate).toLocaleDateString(undefined, { 
                    month: 'long', 
                    day: 'numeric', 
                    year: 'numeric' 
                  })}
                </span>
              </div>
            )}
          </div>
        </div>

        <h2 className="text-lg font-bold text-slate-900 mt-6 mb-2">Items</h2>
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <ul className="divide-y divide-slate-100">
            {items.map((item, index) => {
              const product = item.productId as unknown as Product;

              if (!product) {
                return (
                  <li key={`deleted-${index}`} className="p-4 flex gap-4">
                    <div className="w-16 h-16 bg-slate-50 rounded-lg flex-shrink-0 relative overflow-hidden border border-slate-100 flex items-center justify-center text-slate-300">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-slate-500 italic">Product no longer available</p>
                      <div className="flex justify-between items-center mt-2">
                        <p className="text-sm font-medium text-slate-900">
                          ${item.priceAtPurchase.toFixed(2)} <span className="text-slate-500 font-normal">x {item.quantity}</span>
                        </p>
                        <p className="text-sm font-bold text-[#185FA5]">
                          ${(item.priceAtPurchase * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </li>
                );
              }

              return (
                <li key={`${typeof product === 'string' ? product : product._id}-${index}`} className="p-4 flex gap-4">
                  <div className="w-16 h-16 bg-slate-50 rounded-lg flex-shrink-0 relative overflow-hidden border border-slate-100 flex items-center justify-center p-1.5">
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-slate-300">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900 line-clamp-2">{product.name}</p>
                    {product.brand && (
                      <p className="text-xs text-slate-500 mt-0.5">{product.brand}</p>
                    )}
                    <div className="flex justify-between items-center mt-2">
                      <p className="text-sm font-medium text-slate-900">
                        ${item.priceAtPurchase.toFixed(2)} <span className="text-slate-500 font-normal">x {item.quantity}</span>
                      </p>
                      <p className="text-sm font-bold text-[#185FA5]">
                        ${(item.priceAtPurchase * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}
