import AdminSidebar from '@/components/admin/AdminSidebar';

/**
 * Admin shell layout — wraps every /admin/* page with the sidebar.
 * The sidebar is rendered once here; child pages are rendered in <main>.
 * This means navigating between admin pages doesn't re-mount the sidebar.
 */
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
