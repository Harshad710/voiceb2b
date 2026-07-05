// ─────────────────────────────────────────────────────────────────────────────
// Thin API layer — all fetch() calls live here, NOT in components.
// Components import these functions and only deal with the data they receive.
//
// Auth:
//   Admin calls attach a Bearer token from localStorage.
//   getAdminToken() is the single place that reads the token — if we ever
//   switch to httpOnly cookies or a different store, only this file changes.
// ─────────────────────────────────────────────────────────────────────────────

import { Order, OrderStatus } from './types';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

if (!BASE_URL) {
  throw new Error(
    'NEXT_PUBLIC_API_URL is not set. Add it to client/.env.local'
  );
}

/**
 * Returns the stored admin JWT or null if not logged in.
 * Only available in the browser (localStorage is not available on the server).
 */
function getAdminToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('admin_token');
}

/**
 * Builds the Authorization header for admin API calls.
 * Returns an empty object if no token is present so the spread still works.
 */
function adminAuthHeaders(): Record<string, string> {
  const token = getAdminToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * Fetches all orders (admin view — all retailers).
 * The server populates retailerId and items.productId automatically.
 * Requires a valid admin JWT — the backend will return 401/403 without one.
 */
export async function fetchOrders(): Promise<Order[]> {
  const res = await fetch(`${BASE_URL}/api/orders`, {
    // No-store so the admin always sees the latest state, not a cached snapshot
    cache: 'no-store',
    headers: {
      ...adminAuthHeaders(),
    },
  });

  if (!res.ok) {
    throw new Error(
      `Failed to fetch orders (${res.status} ${res.statusText}). Is the server running?`
    );
  }

  const json = await res.json();
  return json.data as Order[];
}

/**
 * Updates the status of a single order.
 * Called by StatusSelect after the admin picks a new status value.
 * Requires a valid admin JWT.
 */
export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus
): Promise<Order> {
  const res = await fetch(`${BASE_URL}/api/orders/${orderId}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...adminAuthHeaders(),
    },
    body: JSON.stringify({ status }),
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(
      errorBody.message ?? `Failed to update status (${res.status})`
    );
  }

  const json = await res.json();
  return json.data as Order;
}
