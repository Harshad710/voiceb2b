'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getRetailerData, logoutRetailer, retailerAuthHeaders } from '@/lib/shopApi';
import { Order } from '@/lib/types';

export default function ProfilePage() {
  const router = useRouter();
  const [retailer, setRetailer] = useState<{ _id: string; name: string; phone: string } | null>(null);
  
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalSpent: 0,
    lastOrderDate: null as string | null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const data = getRetailerData();
    if (!data) {
      router.push('/shop/login');
      return;
    }
    setRetailer(data);

    const fetchStats = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/orders/retailer/${data._id}`, {
          headers: retailerAuthHeaders(),
        });
        
        if (!res.ok) {
          if (res.status === 401) {
            router.push('/shop/login');
            return;
          }
          throw new Error('Failed to fetch order history for stats');
        }
        
        const json = await res.json();
        const orders: Order[] = json.data || [];
        
        let totalSpent = 0;
        let lastOrderDate = null;
        
        if (orders.length > 0) {
          totalSpent = orders.reduce((sum, order) => sum + order.totalAmount, 0);
          
          const sortedOrders = [...orders].sort((a, b) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          lastOrderDate = sortedOrders[0].createdAt;
        }
        
        setStats({
          totalOrders: orders.length,
          totalSpent,
          lastOrderDate,
        });
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [router]);

  const handleLogout = () => {
    logoutRetailer(() => {
      router.push('/shop/login');
    });
  };

  if (!retailer) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="pb-24 bg-slate-50 min-h-screen">
      <div className="bg-[#185FA5] px-4 pt-10 pb-16 text-white text-center">
        <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-white/30">
          <span className="text-3xl font-bold">
            {retailer.name.charAt(0).toUpperCase()}
          </span>
        </div>
        <h1 className="text-2xl font-bold">{retailer.name}</h1>
        <p className="text-[#E6F1FB] opacity-90 mt-1">{retailer.phone}</p>
      </div>
      
      <div className="p-4 -mt-10 space-y-4 max-w-2xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 relative">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Account Statistics</h2>
          
          {loading ? (
            <div className="flex justify-center items-center py-6">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#185FA5]"></div>
            </div>
          ) : error ? (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg text-center">
              {error}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-slate-50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#E6F1FB] text-[#185FA5] rounded-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007z" />
                    </svg>
                  </div>
                  <span className="text-slate-600 font-medium">Total Orders Placed</span>
                </div>
                <span className="font-bold text-slate-900">{stats.totalOrders}</span>
              </div>
              
              <div className="flex justify-between items-center py-3 border-b border-slate-50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <span className="text-slate-600 font-medium">Lifetime Spent</span>
                </div>
                <span className="font-bold text-[#185FA5]">${stats.totalSpent.toFixed(2)}</span>
              </div>
              
              <div className="flex justify-between items-center py-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                    </svg>
                  </div>
                  <span className="text-slate-600 font-medium">Most Recent Order</span>
                </div>
                <span className="font-medium text-slate-900">
                  {stats.lastOrderDate 
                    ? new Date(stats.lastOrderDate).toLocaleDateString(undefined, { 
                        month: 'short', day: 'numeric', year: 'numeric' 
                      }) 
                    : 'N/A'}
                </span>
              </div>
            </div>
          )}
        </div>

        <button 
          onClick={handleLogout}
          className="w-full mt-6 flex items-center justify-center gap-2 py-3.5 px-4 bg-white text-red-600 rounded-xl font-medium shadow-sm border border-red-100 hover:bg-red-50 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
          </svg>
          Log Out
        </button>
      </div>
    </div>
  );
}
