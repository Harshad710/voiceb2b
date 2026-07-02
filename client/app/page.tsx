import { redirect } from 'next/navigation';

/**
 * The root "/" route has no content in Phase 2.
 * Redirect immediately to the first working page: /admin/orders.
 * This saves the admin from having to type the full URL every time.
 */
export default function HomePage() {
  redirect('/admin/orders');
}
