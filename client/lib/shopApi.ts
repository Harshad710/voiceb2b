import { Product } from './types';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

if (!BASE_URL) {
  throw new Error(
    'NEXT_PUBLIC_API_URL is not set. Add it to client/.env.local'
  );
}

/**
 * Returns the stored retailer JWT or null if not logged in.
 * Only available in the browser (localStorage is not available on the server).
 */
export function getRetailerToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('retailer_token');
}

/**
 * Returns the stored retailer identity data or null if not logged in.
 */
export function getRetailerData(): { _id: string; name: string; phone: string } | null {
  if (typeof window === 'undefined') return null;
  const data = localStorage.getItem('retailer_data');
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

/**
 * Logs out the retailer by clearing local storage and optionally redirecting.
 */
export function logoutRetailer(redirectFn?: () => void) {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('retailer_token');
    localStorage.removeItem('retailer_data');
  }
  if (redirectFn) {
    redirectFn();
  }
}

/**
 * Builds the Authorization header for retailer API calls.
 * Returns an empty object if no token is present so the spread still works.
 */
export function retailerAuthHeaders(): Record<string, string> {
  const token = getRetailerToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * Fetches all products (public).
 */
export async function fetchProducts(): Promise<Product[]> {
  const res = await fetch(`${BASE_URL}/api/products`, {
    cache: 'no-store', // ensures fresh product list
  });

  if (!res.ok) {
    throw new Error(
      `Failed to fetch products (${res.status} ${res.statusText}). Is the server running?`
    );
  }

  const json = await res.json();
  return json.data as Product[];
}

/**
 * Submits a new order on behalf of the authenticated retailer.
 *
 * Security contract (mirrors Phase 3a backend):
 *  - Sends ONLY { items: [{ productId, quantity }] }.
 *  - Never sends price, priceAtPurchase, or retailerId — the server
 *    derives all of that from the JWT and live product data.
 *
 * Throws a typed error with a `code` field for distinct failure modes:
 *  'AUTH'    → 401: token missing/expired; caller should redirect to /shop/login
 *  'FORBID'  → 403
 *  'BAD_REQ' → 400 (e.g. a product went out of stock between add and checkout)
 *  'NETWORK' → fetch threw (no connection)
 *  'SERVER'  → 5xx
 */
export class OrderError extends Error {
  code: 'AUTH' | 'FORBID' | 'BAD_REQ' | 'NETWORK' | 'SERVER';
  constructor(message: string, code: OrderError['code']) {
    super(message);
    this.name = 'OrderError';
    this.code = code;
  }
}

export async function createOrder(
  items: { productId: string; quantity: number }[]
): Promise<import('./types').Order> {
  let res: Response;
  try {
    res = await fetch(`${BASE_URL}/api/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...retailerAuthHeaders(),
      },
      body: JSON.stringify({ items }),
    });
  } catch {
    throw new OrderError('Network error — check your connection.', 'NETWORK');
  }

  if (res.status === 401) {
    throw new OrderError('Session expired. Please log in again.', 'AUTH');
  }
  if (res.status === 403) {
    throw new OrderError("You don't have permission to place orders.", 'FORBID');
  }
  if (res.status === 400) {
    const body = await res.json().catch(() => ({}));
    throw new OrderError(
      body?.message ?? 'Invalid order — one or more items may be unavailable.',
      'BAD_REQ'
    );
  }
  if (!res.ok) {
    throw new OrderError('Server error — please try again in a moment.', 'SERVER');
  }

  const json = await res.json();
  return json.data as import('./types').Order;
}
