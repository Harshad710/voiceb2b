import { redirect } from 'next/navigation';

/**
 * /admin has no own content — redirect to the first section.
 * As more admin pages are added in later phases, this can become
 * a real overview/dashboard page instead.
 */
export default function AdminPage() {
  redirect('/admin/orders');
}
