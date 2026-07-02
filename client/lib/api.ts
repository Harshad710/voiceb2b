// ─────────────────────────────────────────────────────────────────────────────
// Thin API layer — all fetch() calls live here, NOT in components.
// Components import these functions and only deal with the data they receive.
//
// Key principle: NEXT_PUBLIC_API_URL is read once here. If we ever need to add
// auth headers (Phase 3+), we update this file only — not every component.
// ─────────────────────────────────────────────────────────────────────────────

import { Order, OrderStatus } from './types';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

if (!BASE_URL) {
  throw new Error(
    'NEXT_PUBLIC_API_URL is not set. Add it to client/.env.local'
  );
}

/**
 * Fetches all orders (admin view — all retailers).
 * The server populates retailerId and items.productId automatically.
 */
export async function fetchOrders(): Promise<Order[]> {
  const res = await fetch(`${BASE_URL}/api/orders`, {
    // No-store so the admin always sees the latest state, not a cached snapshot
    cache: 'no-store',
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
 */
export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus
): Promise<Order> {
  const res = await fetch(`${BASE_URL}/api/orders/${orderId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
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
