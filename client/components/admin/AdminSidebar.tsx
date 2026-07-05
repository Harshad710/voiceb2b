'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { ClipboardList, Package2, LogOut } from 'lucide-react';

const navItems = [
  {
    label: 'Orders',
    href: '/admin/orders',
    icon: ClipboardList,
    description: 'Manage incoming orders',
  },
  // Catalog management will be added in a future phase
  // { label: 'Catalog', href: '/admin/catalog', icon: Package, description: 'Products & stock' },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router   = useRouter();

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    router.push('/admin/login');
  };

  return (
    <aside className="w-64 min-h-screen flex flex-col bg-[#0d1426] border-r border-slate-800/60">
      {/* ── Brand Logo ─────────────────────────────────────────────────── */}
      <div className="p-6 border-b border-slate-800/60">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 via-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
            <Package2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-bold text-white text-sm leading-tight">VoiceB2B</p>
            <p className="text-[11px] text-slate-500 font-medium tracking-wide uppercase">
              Admin Portal
            </p>
          </div>
        </div>
      </div>

      {/* ── Navigation ─────────────────────────────────────────────────── */}
      <nav className="flex-1 p-4 space-y-1">
        <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest px-3 mb-3">
          Management
        </p>
        {navItems.map(({ label, href, icon: Icon }) => {
          const isActive = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
              }`}
            >
              <Icon
                className={`w-4 h-4 flex-shrink-0 transition-colors ${
                  isActive ? 'text-indigo-400' : 'text-slate-500 group-hover:text-slate-300'
                }`}
              />
              {label}
              {isActive && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-400" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* ── Footer — Logout ─────────────────────────────────────────────── */}
      <div className="p-4 border-t border-slate-800/60 space-y-3">
        {/* Logout button */}
        <button
          id="admin-logout-btn"
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all duration-150 group"
        >
          <LogOut className="w-4 h-4 text-slate-500 group-hover:text-red-400 transition-colors" />
          Log out
        </button>

        {/* Build info */}
        <div className="px-3 py-2 rounded-lg bg-slate-800/40">
          <p className="text-[11px] text-slate-500 font-medium">Phase 2.5b — MVP</p>
          <p className="text-[10px] text-slate-700 mt-0.5">Admin Dashboard</p>
        </div>
      </div>
    </aside>
  );
}
