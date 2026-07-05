'use client';

/**
 * Admin shell layout — wraps every /admin/* page with the sidebar.
 *
 * Auth guard:
 *   On mount, this layout checks localStorage for an admin_token.
 *   If absent, it redirects to /admin/login immediately.
 *
 * ⚠️  MVP simplification note:
 *   This is a CLIENT-SIDE convenience check only. It prevents an
 *   unauthenticated user from seeing the admin UI at all, but it is
 *   NOT the real security boundary. The real enforcement is:
 *     authMiddleware + isAdmin on every protected backend route.
 *   Even if someone bypasses this redirect (e.g. DevTools), every API
 *   call they make will return 401/403 from the server.
 */

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import AdminSidebar from '@/components/admin/AdminSidebar';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router   = useRouter();
  const pathname = usePathname();

  // 'checking' prevents a flash of the admin UI before the redirect fires
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    // The login page itself must not be guarded — it IS the auth entry point
    if (pathname === '/admin/login') {
      setAuthChecked(true);
      return;
    }

    const token = localStorage.getItem('admin_token');
    if (!token) {
      router.replace('/admin/login');
    } else {
      setAuthChecked(true);
    }
  }, [pathname, router]);

  // Render nothing until the auth check completes to avoid UI flash
  if (!authChecked) return null;

  // The login page renders without the sidebar shell
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
