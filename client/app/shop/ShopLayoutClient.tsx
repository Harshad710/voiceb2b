'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, ShoppingBag, User } from 'lucide-react';

export default function ShopLayoutClient({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  // Don't show bottom nav on login page
  if (pathname === '/shop/login') {
    return <>{children}</>;
  }

  const navItems = [
    {
      name: 'Home',
      href: '/shop',
      icon: Home,
    },
    {
      name: 'Orders',
      href: '/shop/orders',
      icon: ShoppingBag,
    },
    {
      name: 'Profile',
      href: '/shop/profile',
      icon: User,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 pb-[76px]">
      <main className="max-w-md mx-auto w-full bg-white min-h-screen relative shadow-sm">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-50">
        <div className="max-w-md mx-auto flex justify-around items-center h-[68px] px-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex flex-col items-center justify-center w-full h-full space-y-1 min-h-[44px] min-w-[44px] ${
                  isActive ? 'text-[#185FA5]' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <Icon 
                  className={`w-6 h-6 ${isActive ? 'fill-current' : 'fill-none'}`} 
                  strokeWidth={isActive ? 2 : 1.5}
                />
                <span className="text-[10px] font-medium">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
